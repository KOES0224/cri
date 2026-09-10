import {test} from 'node:test';
import assert from 'node:assert/strict';
import {admissionState, programFacts, inventoryFacts, seoulDay} from '../src/lib/program-policy';
import {safeCallbackUrl} from '../src/lib/auth-input';
import {validNewPassword} from '../src/lib/password-policy';
import {applicationSchema} from '../src/lib/application-validation';

test('summer dates close at the end of the Seoul calendar day', () => {
  const p = {category:'Summer Camp',status:'OPEN',isPublished:true,endDate:'2026-07-31T00:00:00+09:00'};
  assert.equal(admissionState(p,new Date('2026-07-31T14:59:59Z')),'OPEN');
  assert.equal(admissionState(p,new Date('2026-07-31T15:00:00Z')),'ENDED');
  assert.equal(seoulDay('2026-07-30T15:00:00Z'),'2026-07-31');
});
test('manual closure and unpublished inventory cannot reopen automatically', () => {
  for (const p of [{status:'CLOSED'},{status:'OPEN',isPublished:false},{status:'DRAFT'}]) assert.equal(admissionState({category:'Winter',...p}),'CLOSED');
  assert.equal(admissionState({category:'Winter',status:'COMPLETED'}),'ENDED');
});
test('program standards override contradictory legacy inventory', () => {
  for(const category of ['Summer Camp','Global Research Program']) {
    const f=programFacts({category,capacity:5,locationFormat:'Online'});
    assert.equal(f.capacity,10); assert.equal(f.format,'In person (Onsite)'); assert.equal(f.professorHours,'30 hours'); assert.equal(f.taHours,'20 hours');
  }
  const winter=programFacts({category:'Winter Online'});
  assert.equal(winter.capacity,5); assert.equal(winter.professorHours,'10 hours'); assert.equal(winter.taHours,'30 hours');
  const individual=programFacts({category:'Research',capacity:10});
  assert.equal(individual.capacity,null); assert.match(individual.duration,/2–4 months/);
  assert.equal(inventoryFacts('Research').category,'1-on-1 Advanced Research Program');
});
test('auth redirects stay on the same origin', () => {
  for(const bad of ['//evil.test','/\\evil.test','https://evil.test','javascript:alert(1)','/\n/evil.test']) assert.equal(safeCallbackUrl(bad),'/dashboard');
  assert.equal(safeCallbackUrl('/apply?programId=abc'),'/apply?programId=abc');
});
test('password policy respects bcrypt byte limit, including non-ASCII input', () => {
  assert.equal(validNewPassword('short'),false);
  assert.equal(validNewPassword('A-good-long-password'),true);
  assert.equal(validNewPassword('가'.repeat(25)),false);
});
const application={studentFirstName:'A',studentLastName:'B',studentEmail:'a@example.test',studentPhone:'123',parentFirstName:'C',parentLastName:'D',parentEmail:'d@example.test',parentPhone:'456',school:'School',gradYear:'2028',gender:'Prefer not to say',tShirtSize:'M',photoConsent:'No',resumeUrl:'/api/documents/abc123',initialTopicIdeas:'My topic',areaOfInterest:'Biology',essay:'My interests',shortAnswer:'My question',firstChoiceProfessor:'Professor',secondChoiceProfessor:'',thirdChoiceProfessor:'',previousResearch:'',howLearned:''};
test('server validates required application fields, essay limits and private file references', () => {
 assert.equal(applicationSchema.safeParse(application).success,true);
 for(const patch of [{resumeUrl:'https://public.test/cv.pdf'},{essay:'word '.repeat(501)},{shortAnswer:'word '.repeat(151)},{studentFirstName:'  '}]) assert.equal(applicationSchema.safeParse({...application,...patch}).success,false);
});
