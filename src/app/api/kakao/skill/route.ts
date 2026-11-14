import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/request-limit";
import { notifyKakaoHandoff } from "@/lib/notify";
import { claudeConfigured, draftReply, type BotReply, type BotTurn } from "@/lib/kakao/reply";
import {
  FALLBACK_REPLY, HANDOFF_HOLD_HOURS, HANDOFF_REPLY, HOLD_REPLY, callbackAck, parseSkillRequest, ruleHandoff, secretMatches, textResponse,
} from "@/lib/kakao/skill";

/**
 * KakaoTalk channel chatbot: Kakao i Open Builder calls this skill for every free-text message (fallback block).
 * Setup and env (KAKAO_SKILL_SECRET, ANTHROPIC_API_KEY, KAKAO_BOT_ID, KAKAO_HANDOFF_EMAIL): docs/kakao-chatbot.md.
 *
 * With the block's callback switched on, Kakao sends a callbackUrl: we acknowledge at once and post the real answer
 * within the minute. Without it Kakao waits only 5 s, so the model gets ~3.5 s and a fixed reply covers a timeout.
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
    return NextResponse.json(textResponse("메시지가 많이 와서 잠시 쉬었다가 답변드릴게요. 급하신 내용은 담당자에게 전달됩니다."));
  }

  const since = new Date(Date.now() - HISTORY_HOURS * 3600_000);
  const [recent, lastHandoff] = await Promise.all([
    prisma.kakaoChatMessage.findMany({ where: { userKey: req.userKey, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: HISTORY_TURNS }),
    prisma.kakaoChatMessage.findFirst({ where: { userKey: req.userKey, handoff: true, createdAt: { gte: new Date(Date.now() - HANDOFF_HOLD_HOURS * 3600_000) } }, orderBy: { createdAt: "desc" } }),
  ]);
  const history: BotTurn[] = recent.reverse().map(m => ({ role: m.role === "assistant" ? "assistant" : "user", text: m.text }));
  await prisma.kakaoChatMessage.create({ data: { userKey: req.userKey, role: "user", text: req.utterance } });

  // Decide without the model first: a person already owns this thread, or the topic is one the bot never answers.
  const ruleReason = lastHandoff ? "follow-up while waiting for a person" : ruleHandoff(req.utterance);
  if (ruleReason) {
    const reply = lastHandoff ? HOLD_REPLY : HANDOFF_REPLY;
    after(() => finish(req.userKey, { reply, handoff: true, reason: ruleReason }));
    return NextResponse.json(textResponse(reply));
  }

  if (!claudeConfigured()) {
    after(() => finish(req.userKey, { reply: FALLBACK_REPLY, handoff: true, reason: "ANTHROPIC_API_KEY not set" }));
    return NextResponse.json(textResponse(FALLBACK_REPLY));
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

async function answer(history: BotTurn[], utterance: string, budgetMs: number): Promise<BotReply> {
  try {
    const result = await draftReply(history, utterance, budgetMs);
    if (!result.reply) return { reply: HANDOFF_REPLY, handoff: true, reason: result.reason ?? "no reply" };
    return result;
  } catch (error) {
    console.error("[kakao] reply failed:", error instanceof Error ? error.message : error);
    return { reply: FALLBACK_REPLY, handoff: true, reason: "bot error or timeout" };
  }
}

/** Log the bot's turn and, for a handoff, email the recent conversation to admissions. */
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
