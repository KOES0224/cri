import {test} from 'node:test';
import assert from 'node:assert/strict';
import {confirmTossPayment,findConfirmedTossPayment,tossOrderState} from '../src/lib/toss';

test('provider confirms only the expected order, USD amount and completed status', async t => {
 const previous=process.env.TOSS_SECRET_KEY; process.env.TOSS_SECRET_KEY='local-test-key';
 const realFetch=globalThis.fetch;
 try {
  for (const patch of [{}, {totalAmount:1},{currency:'KRW'},{orderId:'someone-else'},{status:'READY'}]) {
   globalThis.fetch=async (_url,options)=>{
     // One key per payment attempt (the payment key), so a second attempt on the same order is not answered with the first one's result.
     assert.equal(new Headers(options?.headers).get('Idempotency-Key'),'synthetic-key');
     return Response.json({status:'DONE',totalAmount:50,currency:'USD',orderId:'CRI_test-order',...patch});
   };
   const result=await confirmTossPayment('synthetic-key','CRI_test-order',50);
   assert.equal(result.success,Object.keys(patch).length===0);
  }
  globalThis.fetch=async (url,options)=> {
   assert.match(String(url),/\/v1\/payments\/orders\/CRI_test-order$/); assert.equal(options?.method,undefined);
   return Response.json({status:'DONE',totalAmount:50,currency:'USD',orderId:'CRI_test-order'});
  };
  assert.equal((await findConfirmedTossPayment('CRI_test-order',50)).success,true);
  globalThis.fetch=async()=>{throw new Error('private provider diagnostic');};
  assert.doesNotMatch((await confirmTossPayment('x','CRI_test-order',50)).error!,/private provider/);
  // A confirm that times out is followed by one lookup of the order: an approval that completed anyway is not reported as a failure.
  let calls=0;
  globalThis.fetch=async (url,options)=>{
   calls++;
   if (options?.method==='POST') throw new Error('timeout');
   assert.match(String(url),/\/v1\/payments\/orders\/CRI_test-order$/);
   return Response.json({status:'DONE',totalAmount:50,currency:'USD',orderId:'CRI_test-order'});
  };
  assert.equal((await confirmTossPayment('k','CRI_test-order',50)).success,true); assert.equal(calls,2);
  // A rejected confirmation carries Toss's code for logs and the review account, never in the public error text.
  globalThis.fetch=async()=>Response.json({code:'NOT_AVAILABLE_PAYMENT_BY_MERCHANT',message:'private provider text'},{status:400});
  const rejected=await confirmTossPayment('k2','CRI_test-order',50);
  assert.equal(rejected.success,false); assert.equal(rejected.providerCode,'NOT_AVAILABLE_PAYMENT_BY_MERCHANT'); assert.doesNotMatch(rejected.error!,/private provider/);
 } finally {globalThis.fetch=realFetch; if(previous) process.env.TOSS_SECRET_KEY=previous; else delete process.env.TOSS_SECRET_KEY;}
});

test('order state decides whether an expired checkout may be restarted', async () => {
 const previous=process.env.TOSS_SECRET_KEY; const realFetch=globalThis.fetch;
 try {
  delete process.env.TOSS_SECRET_KEY;
  assert.equal(await tossOrderState('CRI_x'),'unknown');
  process.env.TOSS_SECRET_KEY='local-test-key';
  const answer=(status:number,body:unknown)=>{globalThis.fetch=async(url,options)=>{assert.match(String(url),/\/v1\/payments\/orders\/CRI_x$/); assert.equal(options?.method,undefined); return Response.json(body,{status});};};
  answer(404,{code:'NOT_FOUND_PAYMENT'}); assert.equal(await tossOrderState('CRI_x'),'none');
  for (const status of ['EXPIRED','ABORTED','CANCELED']) { answer(200,{status}); assert.equal(await tossOrderState('CRI_x'),'none'); }
  for (const status of ['DONE','PARTIAL_CANCELED','WAITING_FOR_DEPOSIT']) { answer(200,{status}); assert.equal(await tossOrderState('CRI_x'),'paid'); }
  for (const status of ['READY','IN_PROGRESS']) { answer(200,{status}); assert.equal(await tossOrderState('CRI_x'),'unknown'); }
  answer(500,{code:'FAILED_INTERNAL_SYSTEM_PROCESSING'}); assert.equal(await tossOrderState('CRI_x'),'unknown');
  answer(401,{code:'UNAUTHORIZED_KEY'}); assert.equal(await tossOrderState('CRI_x'),'unknown');
  globalThis.fetch=async()=>{throw new Error('network');}; assert.equal(await tossOrderState('CRI_x'),'unknown');
 } finally {globalThis.fetch=realFetch; if(previous) process.env.TOSS_SECRET_KEY=previous; else delete process.env.TOSS_SECRET_KEY;}
});
