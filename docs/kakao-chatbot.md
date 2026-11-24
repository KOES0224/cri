# KakaoTalk channel chatbot

Free-text messages to the CRI KakaoTalk channel are answered by Claude through a Kakao i Open Builder skill.

```
parent sends a message → Open Builder fallback block → POST https://criglobal.org/api/kakao/skill
  → rules first: refund, contract, discount, complaint, payment problem, admission decision or "connect me to a person"
    → fixed reply with the office phone (02-6203-8999) + email to admissions (no model call)
  → otherwise Claude (claude-opus-5-5, low effort) answers from src/lib/kakao/knowledge.ts and the cohorts open right now
    → it can also decide a person is needed (handoff: true) → it gives the office phone + email
  → every turn is stored in KakaoChatMessage and shown at /dashboard/kakao
```

## Nobody answers in the chat room: person-only topics go to the phone

The channel's 1:1 chat is switched **off** (채널 관리자센터 → 채팅 → 채팅 설정, since 2026-11-24). The owner turned it off
because of the "상담 연결" button Kakao puts next to the input box while 1:1 chat is on: a customer who taps it moves to
human mode and the bot stops getting their messages. Kakao has no setting for the button alone
([help centre](https://cs.kakao.com/helps_html/1073204066?locale=ko)); it only goes away with 1:1 chat off.

So a person cannot write in the chat room, and the bot must never say that someone will:

- A "handoff" turn (`handoff: true`) means: the customer was told to call `CONTACT_PHONE` (`COMPANY.phoneDomestic`,
  02-6203-8999) and admissions got an email with the conversation, so they know what a caller is calling about.
- No reply may promise an answer, a call back or a message in the chat ("담당자가 연락드릴게요", "전달했어요").
  `tests/kakao-skill.test.ts` checks the fixed replies and the model instructions for this.
- A seminar decline or change ("세미나 못 갈 것 같아요", "세미나 신청 취소할게요", "이메일 수정 부탁드립니다") is not
  worth a phone call: the reply says it was passed on (`SEMINAR_CHANGE_REPLY`; true, the handoff email carries it) and
  gives the number only for those who want to check. Problems getting into the seminar get the phone reply.
- The bot answers the next message normally again. There is no hold after a handoff (there was a 12-hour one while a
  person could still take the thread over in the admin chat).
- Phone hours are not stated anywhere, because none have been given. Add them to `HANDOFF_REPLY` and the instructions
  once the owner sets them.

If 1:1 chat is ever switched back on, the "상담 연결" button returns and this section has to be revisited.

## Code

| What | Where |
|---|---|
| Endpoint | `src/app/api/kakao/skill/route.ts` |
| Kakao request/response format, handoff keyword rules, fixed replies (with the office phone) | `src/lib/kakao/skill.ts` |
| What the bot knows and may say (voice, facts, tuition policy) | `src/lib/kakao/knowledge.ts` (`BOT_POLICY.shareTuition` is `false`: no prices in chat) |
| Model call | `src/lib/kakao/reply.ts` |
| Handoff email | `notifyKakaoHandoff` in `src/lib/notify.ts` |
| Log viewer | `/dashboard/kakao` |
| Tests | `tests/kakao-skill.test.ts` |

## Environment (Vercel)

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | API key from console.anthropic.com. Without it every message gets the fixed reply (try again later, or call the office) and is emailed. |
| `KAKAO_SKILL_SECRET` | Any long random string. Open Builder sends it as the `x-cri-kakao-secret` header; requests without it get 401. |
| `KAKAO_BOT_ID` | Optional. The Open Builder bot id; other bots are refused. |
| `KAKAO_HANDOFF_EMAIL` | Optional. Where handoffs go; defaults to `ADMISSIONS_NOTIFY_EMAIL` / support@cri.kr. |
| `WEBINAR_JOIN_URL` | Zoom join link (https, zoom.us) for the current webinar in `src/lib/webinar.ts`. A short "세미나 신청" message registers the channel user and gets this link back until the session ends. Unset or invalid: the bot says it could not send the link (send the keyword again later, or call the office) and admissions gets an email. Kept out of the repo because the repo is public. |
| `WEBINAR_JOIN_PASSCODE` | Optional. Shown under the link for people who type the meeting ID. |

## Open Builder setup (owner, once)

1. chatbot.kakao.com → create a bot and connect it to the CRI KakaoTalk channel (the channel must be a 비즈니스 채널).
2. 스킬 → new skill: URL `https://criglobal.org/api/kakao/skill`, header `x-cri-kakao-secret: <KAKAO_SKILL_SECRET>`.
3. 시나리오 → 폴백 블록: 봇 응답 = 스킬데이터, skill = the one above. Leave 웰컴 블록 as a short greeting that says an AI assistant answers and where a person can be reached, e.g. "안녕하세요, CRI입니다. 이 채팅방은 AI 상담 도우미가 안내해 드려요. 담당자 상담은 02-6203-8999로 전화 주세요."
4. Ask Kakao for the **AI 챗봇 콜백** feature (bot settings → AI 챗봇 관리) and switch callback on for the fallback block.
   Until it is approved Kakao waits only 5 seconds; the endpoint then gives the model 3.5 s and falls back to a fixed reply
   (try again later, or call the office) when that is not enough.
5. Keep the channel's 1:1 chat **off** (채널 관리자센터 → 채팅 → 채팅 설정), see "Nobody answers in the chat room" above.
6. 배포 (deploy) the bot. Test from a personal KakaoTalk account by messaging the channel.

## Not verified yet

- The welcome block text lives in Open Builder, not in this repo. If it still says a person will continue the answer in
  the chat, change it to the wording in step 3.
- Korean AI Basic Act notice: the welcome block tells customers an AI answers. Confirm the wording is enough.
