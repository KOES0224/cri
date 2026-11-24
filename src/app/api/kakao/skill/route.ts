import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/request-limit";
import { notifyKakaoHandoff } from "@/lib/notify";
import { claudeConfigured, draftReply, type BotReply, type BotTurn } from "@/lib/kakao/reply";
import {
  FALLBACK_REPLY, PHONE_WITHOUT_SIGNUP_REPLY, HANDOFF_REPLY, RATE_LIMIT_REPLY, SIGNUP_DESPITE_HANDOFF, callbackAck, handoffReply, parsePhoneOnly, parseSkillRequest, parseWebinarSignup, ruleHandoff, secretMatches, withoutOwnContact,
  textResponse, webinarKakaoReply, webinarPhoneSavedReply, type WebinarSignupParse,
} from "@/lib/kakao/skill";
import { KAKAO_BOT_DEDUPE_PREFIX, WEBINAR, koreanMobile, webinarDayOf, webinarJoinInfo, webinarKakaoNoticesOpen, webinarKakaoOpen, webinarRegistrationOpen } from "@/lib/webinar";

/**
 * KakaoTalk channel chatbot: Kakao i Open Builder calls this skill for every free-text message (fallback block).
 * Setup and env (KAKAO_SKILL_SECRET, ANTHROPIC_API_KEY, KAKAO_BOT_ID, KAKAO_HANDOFF_EMAIL): docs/kakao-chatbot.md.
 *
 * With the block's callback switched on, Kakao sends a callbackUrl: we acknowledge at once and post the real answer
 * within the minute. Without it Kakao waits only 5 s, so the model gets ~3.5 s and a fixed reply covers a timeout.
 *
 * The channel's 1:1 chat is off, so no person can write in the chat room. A "handoff" turn therefore points the
 * customer to the office phone (CONTACT_PHONE) and emails admissions; the bot keeps answering the next message.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HISTORY_TURNS = 12;
const HISTORY_HOURS = 24;
const SYNC_BUDGET_MS = 3500;
const CALLBACK_BUDGET_MS = 45_000;

export async function POST(request: Request) {
  if (!secretMatches(process.env.KAKAO_SKILL_SECRET, request.headers.get("x-cri-kakao-secret"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const req = parseSkillRequest(body);
  if (!req) return NextResponse.json(textResponse("메시지를 다시 한번 보내 주시겠어요?"));
  if (process.env.KAKAO_BOT_ID && req.botId !== process.env.KAKAO_BOT_ID) return NextResponse.json({ error: "unknown bot" }, { status: 403 });

  if (!(await allowRequest("kakao-skill", req.userKey, 30, 60 * 60))) {
    return NextResponse.json(textResponse(RATE_LIMIT_REPLY));
  }

  const since = new Date(Date.now() - HISTORY_HOURS * 3600_000);
  const recent = await prisma.kakaoChatMessage.findMany({ where: { userKey: req.userKey, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: HISTORY_TURNS });
  const history: BotTurn[] = recent.reverse().map(m => ({ role: m.role === "assistant" ? "assistant" : "user", text: m.text }));
  await prisma.kakaoChatMessage.create({ data: { userKey: req.userKey, role: "user", text: req.utterance } });

  // "세미나 신청" (a message that is only a sign-up, see parseWebinarSignup): answered by a fixed rule with the join
  // link, unless the message also touches a person-only topic.
  // Just a phone number, from someone who signed up here: the answer to "send your number" — saved for the notices.
  const phoneOnly = webinarKakaoOpen() ? parsePhoneOnly(req.utterance) : null;
  const phoneTopic = phoneOnly ? ruleHandoff(req.utterance) : null;
  if (phoneOnly && (!phoneTopic || SIGNUP_DESPITE_HANDOFF.has(phoneTopic))) {
    const saved = await saveKakaoSignupPhone(req.userKey, phoneOnly);
    // No KakaoTalk sign-up yet: say how to send both at once instead of letting the model guess.
    const reply = saved ? webinarPhoneSavedReply(WEBINAR.label.ko, webinarKakaoNoticesOpen()) : PHONE_WITHOUT_SIGNUP_REPLY;
    after(() => finish(req.userKey, { reply, handoff: Boolean(phoneTopic), reason: saved ? "webinar phone saved" : "phone without a sign-up" }));
    return NextResponse.json(textResponse(reply));
  }

  const signup = parseWebinarSignup(req.utterance);
  // A sign-up that carries the parent's own number ("학부모 연락처 010-…") is not a request for other people's data.
  const topicReason = ruleHandoff(signup.signup && (signup.phone || signup.email) ? withoutOwnContact(req.utterance) : req.utterance);
  if (signup.signup && (!topicReason || SIGNUP_DESPITE_HANDOFF.has(topicReason))) {
    const { reply, linkMissing } = await webinarSignupReply(req.userKey, signup);
    // Admissions gets an email when the message also asked for a person, or when there is no link to give (WEBINAR_JOIN_URL unset).
    const reason = topicReason ? `webinar signup + ${topicReason}` : linkMissing ? "webinar signup, WEBINAR_JOIN_URL not set" : "webinar signup";
    after(() => finish(req.userKey, { reply, handoff: Boolean(topicReason) || linkMissing, reason }));
    return NextResponse.json(textResponse(reply));
  }

  // Decide without the model first: a topic the bot never answers gets the phone number (a seminar decline or change
  // is only passed on). Only this turn: the next message is answered normally again, because nobody takes the thread
  // over in the chat room.
  if (topicReason) {
    const reply = handoffReply(topicReason, req.utterance) + seminarHint(req.utterance);
    after(() => finish(req.userKey, { reply, handoff: true, reason: topicReason }));
    return NextResponse.json(textResponse(reply));
  }

  if (!claudeConfigured()) {
    const reply = FALLBACK_REPLY + seminarHint(req.utterance);
    after(() => finish(req.userKey, { reply, handoff: true, reason: "ANTHROPIC_API_KEY not set" }));
    return NextResponse.json(textResponse(reply));
  }

  if (req.callbackUrl) {
    const callbackUrl = req.callbackUrl;
    after(async () => {
      const result = await answer(history, req.utterance, CALLBACK_BUDGET_MS);
      try {
        const res = await fetch(callbackUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(textResponse(result.reply)) });
        if (!res.ok) console.error("[kakao] callback rejected:", res.status, await res.text().catch(() => ""));
      } catch (error) {
        console.error("[kakao] callback failed:", error instanceof Error ? error.message : error);
      }
      await finish(req.userKey, result);
    });
    return NextResponse.json(callbackAck());
  }

  const result = await answer(history, req.utterance, SYNC_BUDGET_MS);
  after(() => finish(req.userKey, result));
  return NextResponse.json(textResponse(result.reply));
}

/**
 * On the seminar day, replies that send someone to the phone (or fail) still tell them how to get the link right away
 * when the message is about the seminar or a link.
 */
function seminarHint(utterance: string): string {
  if (!webinarDayOf() || !/세미나|웨비나|설명회|줌|zoom|링크/i.test(utterance)) return "";
  return "\n\n세미나 참여 링크가 필요하시면 ‘세미나 신청’이라고 짧게 보내 주세요. 바로 보내드려요.";
}

/**
 * Records a KakaoTalk sign-up for the current webinar (one per channel user, with the phone or email the message
 * carried) and returns the reply with the link.
 */
/** Puts a phone number on this channel user's sign-up for the current webinar; false when they have none. */
async function saveKakaoSignupPhone(userKey: string, phone: string): Promise<boolean> {
  try {
    const dedupeKey = `${KAKAO_BOT_DEDUPE_PREFIX}${userKey}`;
    const row = await prisma.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey } }, select: { id: true } });
    if (!row) return false;
    await prisma.webinarRegistration.update({ where: { id: row.id }, data: { phone } });
    return true;
  } catch (error) {
    console.error("[kakao] saving the phone number failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

async function webinarSignupReply(userKey: string, contact: WebinarSignupParse): Promise<{ reply: string; linkMissing: boolean }> {
  const open = webinarKakaoOpen();
  let already = false;
  let hasPhone = Boolean(koreanMobile(contact.phone));
  if (open) {
    const dedupeKey = `${KAKAO_BOT_DEDUPE_PREFIX}${userKey}`;
    try {
      const existing = await prisma.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey } }, select: { id: true, phone: true, email: true } });
      already = Boolean(existing);
      hasPhone = Boolean(koreanMobile(contact.phone) || koreanMobile(existing?.phone));
      if (!existing) {
        await prisma.webinarRegistration.create({ data: { webinarKey: WEBINAR.key, name: "카카오톡 채널", locale: "ko", dedupeKey, phone: contact.phone, email: contact.email } });
      } else if ((contact.phone && !existing.phone) || (contact.email && !existing.email)) {
        await prisma.webinarRegistration.update({ where: { id: existing.id }, data: { phone: existing.phone ?? contact.phone, email: existing.email ?? contact.email } });
      }
    } catch (error) {
      // A double tap races on the unique key; anything else is logged and the person still gets the link.
      if ((error as { code?: string }).code === "P2002") already = true;
      else console.error("[kakao] webinar sign-up failed:", error instanceof Error ? error.message : error);
    }
  }
  const join = webinarJoinInfo();
  if (open && !join) console.error("[kakao] WEBINAR_JOIN_URL is missing or not a zoom.us https link; the seminar keyword cannot give the link");
  const formOpen = webinarRegistrationOpen();
  const pageUrl = formOpen ? "https://criglobal.org/ko/webinar" : null;
  const reply = webinarKakaoReply({ open, already, label: WEBINAR.label.ko, topic: WEBINAR.topic.ko, join, pageUrl, started: open && !formOpen, hasPhone, noticesOpen: webinarKakaoNoticesOpen() });
  return { reply, linkMissing: open && !join };
}

async function answer(history: BotTurn[], utterance: string, budgetMs: number): Promise<BotReply> {
  try {
    const result = await draftReply(history, utterance, budgetMs);
    if (!result.reply) return { reply: HANDOFF_REPLY + seminarHint(utterance), handoff: true, reason: result.reason ?? "no reply" };
    return result.handoff ? { ...result, reply: result.reply + seminarHint(utterance) } : result;
  } catch (error) {
    console.error("[kakao] reply failed:", error instanceof Error ? error.message : error);
    return { reply: FALLBACK_REPLY + seminarHint(utterance), handoff: true, reason: "bot error or timeout" };
  }
}

/** Log the bot's turn and, for a handoff (the customer was pointed to the phone), email the recent conversation to admissions. */
async function finish(userKey: string, result: BotReply) {
  try {
    await prisma.kakaoChatMessage.create({ data: { userKey, role: "assistant", text: result.reply, handoff: result.handoff, reason: result.reason } });
    if (!result.handoff) return;
    const turns = await prisma.kakaoChatMessage.findMany({ where: { userKey }, orderBy: { createdAt: "desc" }, take: 10 });
    await notifyKakaoHandoff({ userKey, reason: result.reason ?? "handoff", turns: turns.reverse().map(t => ({ role: t.role, text: t.text, at: t.createdAt })) });
  } catch (error) {
    console.error("[kakao] logging failed:", error instanceof Error ? error.message : error);
  }
}
