import {test} from 'node:test';
import assert from 'node:assert/strict';
import {confirmTossPayment,findConfirmedTossPayment} from '../src/lib/toss';

test('provider confirms only the expected order, KRW amount and completed status', async t => {
 const previous=process.env.TOSS_SECRET_KEY; process.env.TOSS_SECRET_KEY='local-test-key';
 const realFetch=globalThis.fetch;
 try {
  for (const patch of [{}, {totalAmount:1},{currency:'USD'},{orderId:'someone-else'},{status:'READY'}]) {
   globalThis.fetch=async (_url,options)=>{
     assert.equal(new Headers(options?.headers).get('Idempotency-Key'),'CRI_test-order');
     return Response.json({status:'DONE',totalAmount:68000,currency:'KRW',orderId:'CRI_test-order',...patch});
   };
   const result=await confirmTossPayment('synthetic-key','CRI_test-order',68000);
   assert.equal(result.success,Object.keys(patch).length===0);
  }
  globalThis.fetch=async (url,options)=> {
   assert.match(String(url),/\/v1\/payments\/orders\/CRI_test-order$/); assert.equal(options?.method,undefined);
   return Response.json({status:'DONE',totalAmount:68000,currency:'KRW',orderId:'CRI_test-order'});
  };
  assert.equal((await findConfirmedTossPayment('CRI_test-order',68000)).success,true);
  globalThis.fetch=async()=>{throw new Error('private provider diagnostic');};
  assert.doesNotMatch((await confirmTossPayment('x','CRI_test-order',68000)).error!,/private provider/);
 } finally {globalThis.fetch=realFetch; if(previous) process.env.TOSS_SECRET_KEY=previous; else delete process.env.TOSS_SECRET_KEY;}
});
