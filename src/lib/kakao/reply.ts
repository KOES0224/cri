import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { botInstructions, openProgramsContext } from './knowledge';
import { stripForeignLinks } from './skill';

export const KAKAO_MODEL = 'claude-opus-5-5';

const ReplySchema = z.object({
  reply: z.string(),
  handoff: z.boolean(),
  handoff_reason: z.string(),
});

export type BotTurn = { role: 'user' | 'assistant'; text: string };
export type BotReply = { reply: string; handoff: boolean; reason: string | null };

export function claudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * One chat reply. `history` is the earlier conversation with this user (oldest first) and ends before `utterance`.
 * Throws on API errors and timeouts; the caller falls back to a fixed message and alerts a person.
 */
export async function draftReply(history: BotTurn[], utterance: string, timeoutMs: number): Promise<BotReply> {
  const client = new Anthropic({ timeout: timeoutMs, maxRetries: timeoutMs > 10_000 ? 1 : 0 });
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.map(t => ({ role: t.role, content: t.text })),
    { role: 'user', content: utterance },
  ];
  // The API wants the conversation to start with the user.
  while (messages.length && messages[0].role !== 'user') messages.shift();

  const response = await client.beta.messages.parse({
    model: KAKAO_MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(ReplySchema) },
    system: [
      { type: 'text', text: botInstructions(), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: await openProgramsContext() },
    ],
    messages,
  });

  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens' || !response.parsed_output) {
    return { reply: '', handoff: true, reason: `model stopped: ${response.stop_reason ?? 'no output'}` };
  }
  const out = response.parsed_output;
  const reply = stripForeignLinks(out.reply).trim();
  if (!reply) return { reply: '', handoff: true, reason: 'empty reply' };
  return { reply, handoff: out.handoff, reason: out.handoff ? out.handoff_reason || 'model handoff' : null };
}
