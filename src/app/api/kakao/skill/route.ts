import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/request-limit";
import { notifyKakaoHandoff } from "@/lib/notify";
import { claudeConfigured, draftReply, type BotReply, type BotTurn } from "@/lib/kakao/reply";
import {
  FALLBACK_REPLY, HANDOFF_REPLY, KAKAO_NO_NAME, RATE_LIMIT_REPLY, SIGNUP_DESPITE_HANDOFF, callbackAck, handoffReply, kakaoHasName, kakaoSignupComplete, parseContactOnly, parseNameOnly,
  parseSkillRequest, phoneWithoutSignupReply, parseWebinarSignup, ruleHandoff, secretMatches, withoutOwnContact, textResponse, webinarChannelCard, webinarKakaoReply, type TextCard,
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

  // The seminar sign-up runs on fixed rules, no model: "세미나 신청" registers the sender, then the bot collects a name
  // and a Korean mobile number and checks the channel add; the Zoom link goes out only when all three are there.
  // A message that is only a number (maybe with a name): the answer to "send your name and number".
  const contactOnly = webinarKakaoOpen() ? parseContactOnly(req.utterance) : null;
  // The sender's own number and its label ("학부모 연락처") are not a request for other people's data.
  const phoneTopic = contactOnly ? ruleHandoff(withoutOwnContact(req.utterance)) : null;
  if (contactOnly && (!phoneTopic || SIGNUP_DESPITE_HANDOFF.has(phoneTopic))) {
    const turn = await webinarSignupTurn(req.userKey, req.friend, contactOnly, false);
    // No KakaoTalk sign-up yet: say how to send both at once instead of letting the model guess.
    const reply = turn?.reply ?? phoneWithoutSignupReply();
    const card = turn?.card ?? null;
    const reason = turn ? `webinar contact saved, ${turn.stage}` : "phone without a sign-up";
    after(() => finish(req.userKey, { reply, handoff: Boolean(phoneTopic) || Boolean(turn?.linkMissing), reason: withCardNote(reason, card) }));
    return NextResponse.json(textResponse(reply, [], card ? [card] : []));
  }

  // Just a name, right after the bot asked for one from a sign-up that has none yet.
  const nameOnly = webinarKakaoOpen() && askedForName(history) ? parseNameOnly(req.utterance) : null;
  if (nameOnly && (await kakaoSignupNeedsName(req.userKey))) {
    const turn = await webinarSignupTurn(req.userKey, req.friend, { name: nameOnly }, false);
    if (turn) {
      after(() => finish(req.userKey, { reply: turn.reply, handoff: turn.linkMissing, reason: withCardNote(`webinar name saved, ${turn.stage}`, turn.card) }));
      return NextResponse.json(textResponse(turn.reply, [], turn.card ? [turn.card] : []));
    }
  }

  const signup = parseWebinarSignup(req.utterance);
  // A sign-up that carries the parent's own number ("학부모 연락처 010-…") is not a request for other people's data.
  const topicReason = ruleHandoff(signup.signup && (signup.phone || signup.email) ? withoutOwnContact(req.utterance) : req.utterance);
  if (signup.signup && (!topicReason || SIGNUP_DESPITE_HANDOFF.has(topicReason))) {
    const turn = await webinarSignupTurn(req.userKey, req.friend, signup, true);
    const reply = turn?.reply ?? FALLBACK_REPLY;
    const card = turn?.card ?? null;
    // Admissions gets an email when the message also asked for a person, or when there is no link to give (WEBINAR_JOIN_URL unset).
    const base = turn ? `webinar signup, ${turn.stage}` : "webinar signup failed";
    const reason = topicReason ? `${base} + ${topicReason}` : turn?.linkMissing ? `${base}, WEBINAR_JOIN_URL not set` : base;
    after(() => finish(req.userKey, { reply, handoff: Boolean(topicReason) || Boolean(turn?.linkMissing) || !turn, reason: withCardNote(reason, card) }));
    return NextResponse.json(textResponse(reply, [], card ? [card] : []));
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
 * The log (/dashboard/kakao) notes when the add-channel button went out, i.e. when Kakao did not say the sender had
 * added the channel: that is how many KakaoTalk sign-ups were not channel friends yet.
 */
function withCardNote(reason: string, card: TextCard | null): string {
  return card ? `${reason}, add-channel button shown` : reason;
}

/** The bot's last message asked for a name (see webinarKakaoReply). */
function askedForName(history: BotTurn[]): boolean {
  const last = [...history].reverse().find(t => t.role === "assistant");
  return Boolean(last && /이름/.test(last.text) && /보내 주세요/.test(last.text));
}

function kakaoDedupeKey(userKey: string): string {
  return `${KAKAO_BOT_DEDUPE_PREFIX}${userKey}`;
}

async function kakaoSignupNeedsName(userKey: string): Promise<boolean> {
  try {
    const row = await prisma.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey: kakaoDedupeKey(userKey) } }, select: { name: true } });
    return Boolean(row) && !kakaoHasName(row?.name);
  } catch {
    return false;
  }
}

type KakaoContact = { name?: string | null; phone?: string | null; email?: string | null };
type SignupTurn = { reply: string; card: TextCard | null; linkMissing: boolean; stage: string };

/**
 * One step of a KakaoTalk seminar sign-up: records the sign-up (one row per channel user, `create` only for the
 * keyword itself), stores the name, number or email the message carried, and replies with what is still missing or,
 * once name, Korean mobile and channel add are all there, the join link. Null: no sign-up to add to (a number sent
 * before "세미나 신청") or the database failed.
 */
async function webinarSignupTurn(userKey: string, friend: boolean, contact: KakaoContact, create: boolean): Promise<SignupTurn | null> {
  const open = webinarKakaoOpen();
  const formOpen = webinarRegistrationOpen();
  const started = open && !formOpen;
  const base = { open, label: WEBINAR.label.ko, topic: WEBINAR.topic.ko, pageUrl: formOpen ? "https://criglobal.org/ko/webinar" : null, started, noticesOpen: webinarKakaoNoticesOpen() };
  if (!open) return { reply: webinarKakaoReply({ ...base, step: "again", join: null, hasName: false, hasPhone: false, friend }), card: null, linkMissing: false, stage: "closed" };

  const dedupeKey = kakaoDedupeKey(userKey);
  const name = contact.name?.trim() || null;
  const mobile = koreanMobile(contact.phone);
  let row: { name: string; phone: string | null } | null = null;
  let step: "first" | "again" | "saved" = "again";
  try {
    const existing = await prisma.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey } }, select: { id: true, name: true, phone: true, email: true } });
    if (!existing) {
      if (!create) return null;
      try {
        row = await prisma.webinarRegistration.create({ data: { webinarKey: WEBINAR.key, name: name ?? KAKAO_NO_NAME, locale: "ko", dedupeKey, phone: mobile ?? contact.phone ?? null, email: contact.email ?? null }, select: { name: true, phone: true } });
        step = name || mobile ? "saved" : "first";
      } catch (error) {
        // A double tap races on the unique key: the other request made the row.
        if ((error as { code?: string }).code !== "P2002") throw error;
        row = await prisma.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey } }, select: { name: true, phone: true } });
      }
    } else {
      // The row belongs to this KakaoTalk user, so a new name or Korean mobile replaces the stored one (a corrected
      // typo); an email only fills a gap.
      const data: { name?: string; phone?: string; email?: string } = {};
      if (name && name !== existing.name) data.name = name;
      if (mobile && mobile !== koreanMobile(existing.phone)) data.phone = mobile;
      if (!existing.email && contact.email) data.email = contact.email;
      if (Object.keys(data).length) await prisma.webinarRegistration.update({ where: { id: existing.id }, data });
      row = { name: data.name ?? existing.name, phone: data.phone ?? existing.phone };
      step = name || mobile ? "saved" : "again";
    }
  } catch (error) {
    console.error("[kakao] webinar sign-up failed:", error instanceof Error ? error.message : error);
    return null;
  }
  if (!row) return null;

  const state = { hasName: kakaoHasName(row.name), hasPhone: Boolean(koreanMobile(row.phone)), friend };
  const complete = kakaoSignupComplete(state);
  const join = complete ? webinarJoinInfo() : null;
  if (complete && !join) console.error("[kakao] WEBINAR_JOIN_URL is missing or not a zoom.us https link; the seminar keyword cannot give the link");
  const reply = webinarKakaoReply({ ...base, ...state, step, join });
  const stage = complete ? "link sent" : !state.hasName || !state.hasPhone ? `waiting for ${[!state.hasName && "name", !state.hasPhone && "number"].filter(Boolean).join(" and ")}` : "waiting for channel add";
  return { reply, card: webinarChannelCard({ friend, open }), linkMissing: complete && !join, stage };
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
