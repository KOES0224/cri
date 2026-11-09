/** Run only against a disposable local PostgreSQL database with the current schema. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
const url = new URL(process.env.DATABASE_URL || 'http://missing');
if (!['127.0.0.1','localhost'].includes(url.hostname)) throw new Error('Integration tests require a disposable LOCAL database.');
// These cases exercise the paid checkout; the site default is free applications (NEXT_PUBLIC_APPLICATION_FEE_ENABLED unset).
process.env.NEXT_PUBLIC_APPLICATION_FEE_ENABLED = 'true';
let session: any = null;
// Replace only request context and external exports; exercise real database operations.
require.cache[require.resolve('next-auth')] = {exports:{getServerSession:async()=>session}} as any;
require.cache[require.resolve('next/cache')] = {exports:{revalidatePath:()=>{},revalidateTag:()=>{},unstable_cache:(fn:any)=>fn}} as any;
const {prisma:db}=require('../src/lib/prisma') as {prisma:PrismaClient};
const {allowRequest}=require('../src/lib/request-limit');
const {POST:upload}=require('../src/app/api/upload/route');
const {GET:readDocument}=require('../src/app/api/documents/[id]/route');
const {POST:recover}=require('../src/app/api/auth/recovery/route');
const {saveApplicationDraft}=require('../src/app/actions/applicationDrafts');
const {beginApplicationCheckout,finalizePaidApplication}=require('../src/app/actions/payment');
const {createProgram}=require('../src/app/actions/programs');
const {authOptions}=require('../src/lib/auth');
const key=randomUUID().replaceAll('-','');
const userId=`test-${key}`, otherId=`other-${key}`, openId=`open-${key}`, open2Id=`open2-${key}`, closedId=`closed-${key}`;
const realFetch=globalThis.fetch;
test('real database: access control, private upload, checkout idempotency and password recovery', async()=>{
 await db.user.createMany({data:[{id:userId,email:`${key}@example.test`,role:'STUDENT'},{id:otherId,email:`other-${key}@example.test`,role:'STUDENT'}]});
 await db.program.createMany({data:[{id:openId,title:'QA Winter',description:'Local only',category:'Winter',status:'OPEN',endDate:new Date(Date.now()+86400000)},{id:open2Id,title:'QA Winter 2',description:'Local only',category:'Winter',status:'OPEN',endDate:new Date(Date.now()+86400000)},{id:closedId,title:'QA Summer',description:'Local only',category:'Summer Camp',status:'OPEN',endDate:new Date('2020-07-31')} ]});
 try {
  assert.equal(await allowRequest('integration',key,2,60),true);
  assert.equal(await allowRequest('integration',key,2,60),true);
  assert.equal(await allowRequest('integration',key,2,60),false);
  assert.equal((await upload(new Request('http://localhost/api/upload',{method:'POST'}))).status,401);
  session={user:{id:userId,role:'STUDENT',email:`${key}@example.test`}};
  await assert.rejects(()=>createProgram({title:'No',category:'Winter'}));
  const form=new FormData(); form.set('file',new File(['%PDF-1.4\nsynthetic test only'], 'cv.pdf',{type:'application/pdf'}));
  const response=await upload(new Request('http://localhost/api/upload',{method:'POST',body:form}));
  assert.equal(response.status,200); const {url:documentUrl}=await response.json(); const documentId=documentUrl.split('/').pop();
  const read=()=>readDocument(new Request('http://localhost'),{params:Promise.resolve({id:documentId})});
  assert.equal((await read()).status,200); assert.equal((await read()).headers.get('Cache-Control'),'private, no-store');
  session.user.id=otherId; assert.equal((await read()).status,404); session.user.id=userId;
  const input={studentFirstName:'A',studentLastName:'B',studentEmail:'a@example.test',studentPhone:'123',residenceCountry:'KR',parentFirstName:'C',parentLastName:'D',parentEmail:'d@example.test',parentPhone:'456',school:'School',gradYear:'2028',gender:'Prefer not to say',tShirtSize:'M',photoConsent:'No',resumeUrl:documentUrl,initialTopicIdeas:'My topic',areaOfInterest:'Biology',essay:'My interests',shortAnswer:'My question',firstChoiceProfessor:'Professor',secondChoiceProfessor:'',thirdChoiceProfessor:'',previousResearch:'',howLearned:''};
  const draft = await saveApplicationDraft(openId, {studentFirstName:'Draft only'}, 1, 0);
  assert.equal(draft.success,true); assert.equal(draft.version,1);
  assert.equal((await saveApplicationDraft(openId,{studentFirstName:'Stale'},1,0)).conflict,true);
  assert.equal((await saveApplicationDraft(openId,{studentFirstName:'Saved revision'},2,1)).version,2);
  assert.equal((await saveApplicationDraft(openId,{studentFirstName:'Stale revision'},1,1)).conflict,true);
  session.user.id=otherId;
  assert.equal((await saveApplicationDraft(openId,{resumeUrl:documentUrl},1,0)).success,false);
  session.user.id=userId;
  assert.equal((await saveApplicationDraft(closedId,{studentFirstName:'Closed'},1,0)).success,false);
  process.env.TOSS_SECRET_KEY='synthetic-test';process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY='synthetic-test';
  assert.match((await beginApplicationCheckout(closedId,input)).error,/no longer accepting/);
  const order=await beginApplicationCheckout(openId,input); assert.ok(order.orderId); assert.equal(order.amount,50);
  // No payment has reached the provider for these orders, so pressing Pay again, an edited form or an expired checkout
  // each get a fresh order id; only one row ever exists.
  const again=await beginApplicationCheckout(openId,input); assert.ok(again.orderId); assert.notEqual(again.orderId,order.orderId);
  const edited=await beginApplicationCheckout(openId,{...input,essay:'Changed'}); assert.ok(edited.orderId); assert.notEqual(edited.orderId,order.orderId);
  await db.applicationCheckout.update({where:{id:edited.orderId},data:{expiresAt:new Date(Date.now()-1000)}});
  const fresh=await beginApplicationCheckout(openId,input); assert.ok(fresh.orderId); assert.notEqual(fresh.orderId,edited.orderId);
  assert.equal(await db.applicationCheckout.count({where:{userId,programId:openId}}),1);
  // A refusal that the provider's record confirms (no charge stands) releases the order; the form survives as a draft.
  globalThis.fetch=async(_url,init)=> init?.method==='POST' ? Response.json({code:'REJECT_CARD_COMPANY',message:'declined'},{status:403}) : Response.json({status:'ABORTED',orderId:fresh.orderId,totalAmount:50,currency:'USD'});
  const declined=await finalizePaidApplication({orderId:fresh.orderId,paymentKey:'declined-key',amount:50});
  assert.equal(declined.code,'paymentDeclined');
  assert.equal(await db.applicationCheckout.count({where:{userId,programId:openId}}),0);
  assert.equal(await db.applicationDraft.count({where:{userId,programId:openId}}),1);
  const retry=await beginApplicationCheckout(openId,input); assert.ok(retry.orderId); assert.notEqual(retry.orderId,fresh.orderId);
  let confirms=0, paid=false;
  globalThis.fetch=async(_url,init)=> {
    if(init?.method==='POST'){confirms++;paid=true;}
    if(!paid)return Response.json({code:'NOT_FOUND_PAYMENT'},{status:404});
    return Response.json({status:'DONE',orderId:retry.orderId,totalAmount:50,currency:'USD',paymentKey:'synthetic-key'});
  };
  const callback={orderId:retry.orderId,paymentKey:'synthetic-key',amount:50};
  assert.ok((await finalizePaidApplication({...callback,amount:1})).error);assert.equal(confirms,0);
  session.user.id=otherId; assert.ok((await finalizePaidApplication(callback)).error); session.user.id=userId;
  const completed=await finalizePaidApplication(callback);assert.equal(completed.success,true);
  assert.equal(await db.applicationDraft.count({where:{userId,programId:openId}}),0);
  const repeated=await finalizePaidApplication(callback);assert.equal(repeated.applicationId,completed.applicationId);assert.equal(confirms,1);
  assert.equal(await db.application.count({where:{userId,programId:openId}}),1);
  // Second program: a confirm whose outcome is unclear keeps the order locked; once the provider reports the payment
  // as approved, the next Pay records it instead of charging again.
  const second=await beginApplicationCheckout(open2Id,input); assert.ok(second.orderId);
  let state='IN_PROGRESS', posts=0;
  globalThis.fetch=async(_url,init)=> {
    if(init?.method==='POST'){posts++;return Response.json({code:'PROVIDER_ERROR'},{status:500});}
    return Response.json({status:state,orderId:second.orderId,totalAmount:50,currency:'USD',paymentKey:'unclear-key'});
  };
  const unclear=await finalizePaidApplication({orderId:second.orderId,paymentKey:'unclear-key',amount:50});
  assert.equal(unclear.code,'paymentUnconfirmed'); assert.equal(posts,1);
  assert.equal((await db.applicationCheckout.findUnique({where:{id:second.orderId}}))?.paymentKey,'unclear-key');
  assert.match((await beginApplicationCheckout(open2Id,input)).error,/earlier checkout/);
  assert.equal((await saveApplicationDraft(open2Id,{studentFirstName:'Locked'},1,0)).success,false);
  // A second return with another payment key cannot claim the order while the first is unsettled.
  assert.equal((await finalizePaidApplication({orderId:second.orderId,paymentKey:'other-key',amount:50})).code,'checkoutReview'); assert.equal(posts,1);
  state='DONE';
  const recovered=await beginApplicationCheckout(open2Id,input);
  assert.equal(recovered.alreadyPaid,true); assert.ok(recovered.applicationId); assert.equal(posts,1);
  assert.equal(await db.application.count({where:{userId,programId:open2Id}}),1);
  const elevated=await authOptions.callbacks.jwt({token:{id:userId,role:'STUDENT',sessionVersion:0},trigger:'update',session:{role:'ADMIN'}});assert.equal(elevated.role,'STUDENT');
  const raw='a'.repeat(64), token='reset:'+createHash('sha256').update(raw).digest('hex');
  await db.verificationToken.create({data:{identifier:userId,token,expires:new Date(Date.now()+60000)}});
  const reset=()=>recover(new Request('http://localhost/api/auth/recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:raw,password:'New-local-test-password'})}));
  assert.equal((await reset()).status,200);assert.equal((await reset()).status,400);
  const revoked=await authOptions.callbacks.jwt({token:{id:userId,role:'STUDENT',sessionVersion:0}});assert.equal(revoked.role,'REVOKED');assert.equal(revoked.id,'');
 } catch (error) { console.error(error); throw error; } finally {
  globalThis.fetch=realFetch;
  await db.application.deleteMany({where:{userId}});
  await db.verificationToken.deleteMany({where:{identifier:userId}});
  await db.user.deleteMany({where:{id:{in:[userId,otherId]}}});
  await db.program.deleteMany({where:{id:{in:[openId,open2Id,closedId]}}});
  await db.$disconnect();
 }
});
