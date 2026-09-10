/** Run only against a disposable local PostgreSQL database with the current schema. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
const url = new URL(process.env.DATABASE_URL || 'http://missing');
if (!['127.0.0.1','localhost'].includes(url.hostname)) throw new Error('Integration tests require a disposable LOCAL database.');
let session: any = null;
// Replace only request context and external exports; exercise real database operations.
require.cache[require.resolve('next-auth')] = {exports:{getServerSession:async()=>session}} as any;
require.cache[require.resolve('next/cache')] = {exports:{revalidatePath:()=>{}}} as any;
require.cache[require.resolve('../src/lib/googleSheets')] = {exports:{syncApplicationToGoogleSheet:async()=>{}}} as any;
const {prisma:db}=require('../src/lib/prisma') as {prisma:PrismaClient};
const {allowRequest}=require('../src/lib/request-limit');
const {POST:upload}=require('../src/app/api/upload/route');
const {GET:readDocument}=require('../src/app/api/documents/[id]/route');
const {POST:recover}=require('../src/app/api/auth/recovery/route');
const {beginApplicationCheckout,finalizePaidApplication}=require('../src/app/actions/payment');
const {createProgram}=require('../src/app/actions/programs');
const {authOptions}=require('../src/lib/auth');
const key=randomUUID().replaceAll('-','');
const userId=`test-${key}`, otherId=`other-${key}`, openId=`open-${key}`, closedId=`closed-${key}`;
const realFetch=globalThis.fetch;
test('real database: access control, private upload, checkout idempotency and password recovery', async()=>{
 await db.user.createMany({data:[{id:userId,email:`${key}@example.test`,role:'STUDENT'},{id:otherId,email:`other-${key}@example.test`,role:'STUDENT'}]});
 await db.program.createMany({data:[{id:openId,title:'QA Winter',description:'Local only',category:'Winter',status:'OPEN'},{id:closedId,title:'QA Summer',description:'Local only',category:'Summer Camp',status:'OPEN',endDate:new Date('2020-07-31')} ]});
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
  const input={studentFirstName:'A',studentLastName:'B',studentEmail:'a@example.test',studentPhone:'123',parentFirstName:'C',parentLastName:'D',parentEmail:'d@example.test',parentPhone:'456',school:'School',gradYear:'2028',gender:'Prefer not to say',tShirtSize:'M',photoConsent:'No',resumeUrl:documentUrl,initialTopicIdeas:'My topic',areaOfInterest:'Biology',essay:'My interests',shortAnswer:'My question',firstChoiceProfessor:'Professor',secondChoiceProfessor:'',thirdChoiceProfessor:'',previousResearch:'',howLearned:''};
  process.env.TOSS_SECRET_KEY='synthetic-test';process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY='synthetic-test';
  assert.match((await beginApplicationCheckout(closedId,input)).error,/no longer accepting/);
  const order=await beginApplicationCheckout(openId,input); assert.ok(order.orderId); assert.equal(order.amount,68000);
  assert.equal((await beginApplicationCheckout(openId,input)).orderId,order.orderId);
  assert.match((await beginApplicationCheckout(openId,{...input,essay:'Changed'})).error,/earlier checkout/);
  let confirms=0, paid=false;
  globalThis.fetch=async(_url,init)=> {
    if(init?.method==='POST'){confirms++;paid=true;}
    if(!paid)return Response.json({code:'NOT_FOUND_PAYMENT'},{status:404});
    return Response.json({status:'DONE',orderId:order.orderId,totalAmount:68000,currency:'KRW',paymentKey:'synthetic-key'});
  };
  const callback={orderId:order.orderId,paymentKey:'synthetic-key',amount:68000};
  assert.ok((await finalizePaidApplication({...callback,amount:1})).error);assert.equal(confirms,0);
  session.user.id=otherId; assert.ok((await finalizePaidApplication(callback)).error); session.user.id=userId;
  const completed=await finalizePaidApplication(callback);assert.equal(completed.success,true);
  const repeated=await finalizePaidApplication(callback);assert.equal(repeated.applicationId,completed.applicationId);assert.equal(confirms,1);
  assert.equal(await db.application.count({where:{userId,programId:openId}}),1);
  const elevated=await authOptions.callbacks.jwt({token:{id:userId,role:'STUDENT',sessionVersion:0},trigger:'update',session:{role:'ADMIN'}});assert.equal(elevated.role,'STUDENT');
  const raw='a'.repeat(64), token='reset:'+createHash('sha256').update(raw).digest('hex');
  await db.verificationToken.create({data:{identifier:userId,token,expires:new Date(Date.now()+60000)}});
  const reset=()=>recover(new Request('http://localhost/api/auth/recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:raw,password:'New-local-test-password'})}));
  assert.equal((await reset()).status,200);assert.equal((await reset()).status,400);
  const revoked=await authOptions.callbacks.jwt({token:{id:userId,role:'STUDENT',sessionVersion:0}});assert.equal(revoked.role,'REVOKED');assert.equal(revoked.id,'');
 } finally {
  globalThis.fetch=realFetch;
  await db.application.deleteMany({where:{userId}});
  await db.verificationToken.deleteMany({where:{identifier:userId}});
  await db.user.deleteMany({where:{id:{in:[userId,otherId]}}});
  await db.program.deleteMany({where:{id:{in:[openId,closedId]}}});
  await db.$disconnect();
 }
});
