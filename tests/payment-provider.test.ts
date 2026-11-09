import {test} from 'node:test';
import assert from 'node:assert/strict';
import {confirmTossPayment,findConfirmedTossPayment} from '../src/lib/toss';

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
   // Looked up by payment key: the widget secret key may not use the order-id lookup.
   assert.match(String(url),/\/v1\/payments\/pay%2Fkey$/); assert.equal(options?.method,undefined);
   return Response.json({status:'DONE',totalAmount:50,currency:'USD',orderId:'CRI_test-order'});
  };
  assert.equal((await findConfirmedTossPayment('pay/key','CRI_test-order',50)).success,true);
  assert.equal((await findConfirmedTossPayment('pay/key','CRI_other-order',50)).success,false);
  assert.equal((await findConfirmedTossPayment('pay/key','CRI_test-order',51)).success,false);
  globalThis.fetch=async()=>{throw new Error('private provider diagnostic');};
  assert.doesNotMatch((await confirmTossPayment('x','CRI_test-order',50,'USD',{recoveryDelayMs:0})).error!,/private provider/);
  // A confirm that times out is followed by lookups of that payment: an approval that completes a little later is recorded, not reported as a failure.
  let calls=0;
  globalThis.fetch=async (url,options)=>{
   calls++;
   if (options?.method==='POST') throw new Error('timeout');
   assert.match(String(url),/\/v1\/payments\/k$/);
   return Response.json({status:calls<3?'IN_PROGRESS':'DONE',totalAmount:50,currency:'USD',orderId:'CRI_test-order'});
  };
  assert.equal((await confirmTossPayment('k','CRI_test-order',50,'USD',{recoveryDelayMs:0})).success,true); assert.equal(calls,3);
  // Still unfinished after three looks: reported as unavailable, never as success.
  calls=0;
  globalThis.fetch=async (_url,options)=>{ calls++; if (options?.method==='POST') throw new Error('timeout'); return Response.json({status:'IN_PROGRESS',totalAmount:50,currency:'USD',orderId:'CRI_test-order'}); };
  assert.equal((await confirmTossPayment('k','CRI_test-order',50,'USD',{recoveryDelayMs:0})).success,false); assert.equal(calls,4);
  // A rejected confirmation carries Toss's code for logs and the review account, never in the public error text.
  globalThis.fetch=async()=>Response.json({code:'NOT_AVAILABLE_PAYMENT_BY_MERCHANT',message:'private provider text'},{status:400});
  const rejected=await confirmTossPayment('k2','CRI_test-order',50);
  assert.equal(rejected.success,false); assert.equal(rejected.providerCode,'NOT_AVAILABLE_PAYMENT_BY_MERCHANT'); assert.doesNotMatch(rejected.error!,/private provider/);
 } finally {globalThis.fetch=realFetch; if(previous) process.env.TOSS_SECRET_KEY=previous; else delete process.env.TOSS_SECRET_KEY;}
});
