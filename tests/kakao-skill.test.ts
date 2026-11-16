import test from 'node:test';
import assert from 'node:assert/strict';
import { SIMPLE_TEXT_MAX, callbackAck, isKakaoCallbackUrl, parseSkillRequest, ruleHandoff, secretMatches, splitForKakao, stripForeignLinks, textResponse } from '../src/lib/kakao/skill';

const sample = {
  intent: { name: '폴백 블록' },
  userRequest: { utterance: '  CRI 프로그램 알고싶어요 ', callbackUrl: 'https://bot-api.kakao.com/v1/callback/abc', user: { id: 'u-1', type: 'botUserKey', properties: { botUserKey: 'bk-123' } } },
  bot: { id: 'bot-9', name: 'CRI' },
  action: { params: {} },
};

test('parses an Open Builder request', () => {
  assert.deepEqual(parseSkillRequest(sample), { utterance: 'CRI 프로그램 알고싶어요', userKey: 'bk-123', callbackUrl: 'https://bot-api.kakao.com/v1/callback/abc', botId: 'bot-9' });
  assert.equal(parseSkillRequest({ userRequest: { utterance: '', user: { id: 'x' } } }), null);
  assert.equal(parseSkillRequest({ userRequest: { utterance: 'hi' } }), null);
  assert.equal(parseSkillRequest(null), null);
  // Falls back to user.id when there is no botUserKey.
  assert.equal(parseSkillRequest({ userRequest: { utterance: 'hi', user: { id: 'u-2' } } })?.userKey, 'u-2');
});

test('only Kakao hosts are accepted as callback URLs', () => {
  assert.equal(isKakaoCallbackUrl('https://bot-api.kakao.com/callback/1'), true);
  assert.equal(isKakaoCallbackUrl('https://evil.example/kakao.com'), false);
  assert.equal(isKakaoCallbackUrl('http://bot-api.kakao.com/callback/1'), false);
  assert.equal(isKakaoCallbackUrl('https://kakao.com.evil.example/'), false);
  assert.equal(parseSkillRequest({ ...sample, userRequest: { ...sample.userRequest, callbackUrl: 'https://evil.example/' } })?.callbackUrl, null);
});

test('long replies split into at most three simpleText bubbles', () => {
  assert.deepEqual(splitForKakao('짧은 답'), ['짧은 답']);
  const long = Array.from({ length: 60 }, (_, i) => `문단 ${i} 입니다. 내용이 조금 길게 이어집니다.`).join('\n\n');
  const parts = splitForKakao(long);
  assert.ok(parts.length <= 3);
  for (const p of parts) assert.ok(p.length <= SIMPLE_TEXT_MAX);
  const res = textResponse('안녕하세요');
  assert.equal(res.version, '2.0');
  assert.deepEqual(res.template.outputs, [{ simpleText: { text: '안녕하세요' } }]);
  assert.equal(callbackAck().useCallback, true);
});

test('sensitive topics go to a person before the model is called', () => {
  assert.equal(ruleHandoff('환불 받을 수 있나요?'), 'refund or cancellation');
  assert.equal(ruleHandoff('계약서 다시 보내주세요'), 'contract');
  assert.equal(ruleHandoff('상담원 연결해주세요'), 'asked for a person');
  assert.equal(ruleHandoff('담당자랑 통화하고 싶어요'), 'asked for a person');
  assert.equal(ruleHandoff('결제가 안 돼요'), 'payment problem');
  assert.equal(ruleHandoff('CRI 프로그램 알고싶어요'), null);
  assert.equal(ruleHandoff('겨울 프로그램 대상 학년이 어떻게 되나요?'), null);
});

test('links outside our site are removed and the secret check is exact', () => {
  assert.equal(stripForeignLinks('보기 https://criglobal.org/ko/research 그리고 https://evil.example/x'), '보기 https://criglobal.org/ko/research 그리고 ');
  assert.equal(secretMatches('abc123', 'abc123'), true);
  assert.equal(secretMatches('abc123', 'abc124'), false);
  assert.equal(secretMatches(undefined, 'x'), false);
  assert.equal(secretMatches('abc', null), false);
});
