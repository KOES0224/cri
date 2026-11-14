# KakaoTalk channel chatbot

Free-text messages to the CRI KakaoTalk channel are answered by Claude through a Kakao i Open Builder skill.

```
parent sends a message → Open Builder fallback block → POST https://criglobal.org/api/kakao/skill
  → rules first: refund, contract, discount, complaint, payment problem, admission decision or "connect me to a person"
    → fixed reply + email to admissions (no model call)
  → otherwise Claude (claude-opus-5-5, low effort) answers from src/lib/kakao/knowledge.ts and the cohorts open right now
    → it can also decide to hand off (handoff: true) → fixed-style reply + email
  → every turn is stored in KakaoChatMessage and shown at /dashboard/kakao
```

After a handoff the bot holds for 12 hours for that customer (`HANDOFF_HOLD_HOURS`): each new message gets a short
"담당자가 확인하고 있어요" reply and is emailed too, so a person can answer in the channel admin chat without the bot talking over them.

## Code

| What | Where |
|---|---|
| Endpoint | `src/app/api/kakao/skill/route.ts` |
| Kakao request/response format, handoff keyword rules, fixed replies | `src/lib/kakao/skill.ts` |
| What the bot knows and may say (voice, facts, tuition policy) | `src/lib/kakao/knowledge.ts` (`BOT_POLICY.shareTuition` is `false`: no prices in chat) |
| Model call | `src/lib/kakao/reply.ts` |
| Handoff email | `notifyKakaoHandoff` in `src/lib/notify.ts` |
| Log viewer | `/dashboard/kakao` |
| Tests | `tests/kakao-skill.test.ts` |

## Environment (Vercel)

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | API key from console.anthropic.com. Without it every message gets the fixed reply and is handed off. |
| `KAKAO_SKILL_SECRET` | Any long random string. Open Builder sends it as the `x-cri-kakao-secret` header; requests without it get 401. |
| `KAKAO_BOT_ID` | Optional. The Open Builder bot id; other bots are refused. |
| `KAKAO_HANDOFF_EMAIL` | Optional. Where handoffs go; defaults to `ADMISSIONS_NOTIFY_EMAIL` / support@cri.kr. |

## Open Builder setup (owner, once)

1. chatbot.kakao.com → create a bot and connect it to the CRI KakaoTalk channel (the channel must be a 비즈니스 채널).
2. 스킬 → new skill: URL `https://criglobal.org/api/kakao/skill`, header `x-cri-kakao-secret: <KAKAO_SKILL_SECRET>`.
3. 시나리오 → 폴백 블록: 봇 응답 = 스킬데이터, skill = the one above. Leave 웰컴 블록 as a short greeting that says an AI assistant answers first, e.g. "안녕하세요, CRI입니다. AI 상담 도우미가 먼저 안내드리고, 필요하면 담당자가 이어서 답변드려요."
4. Ask Kakao for the **AI 챗봇 콜백** feature (bot settings → AI 챗봇 관리) and switch callback on for the fallback block.
   Until it is approved Kakao waits only 5 seconds; the endpoint then gives the model 3.5 s and falls back to a fixed reply
   plus a handoff email when that is not enough, so most messages would go to a person.
5. 배포 (deploy) the bot. Test from a personal KakaoTalk account by messaging the channel.

## Not verified yet

- No live model call has been made from this code (no API key locally). Send a few test messages after setup and read
  them at `/dashboard/kakao` before announcing the channel.
- How a person answers once the bot is on: the channel admin 1:1 chat should still be usable alongside the bot, but check
  whether the channel's chat mode needs "챗봇 + 1:1 채팅" or a 상담원 전환 block.
- Korean AI Basic Act notice: the welcome block above tells customers an AI answers first. Confirm the wording is enough.
