import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PG_REVIEW_PRODUCTS, REVIEW_ORDER_PREFIX, reviewProductForOrder} from '../src/lib/pg-review-products';

test('a sample order id names its product, so a won order is never confirmed in dollars or the other way round', () => {
  const uuid = '3f2b8c1e-0d4a-4b7e-9c55-1a2b3c4d5e6f';
  assert.equal(reviewProductForOrder(`${REVIEW_ORDER_PREFIX.krw}${uuid}`), 'krw');
  assert.equal(reviewProductForOrder(`${REVIEW_ORDER_PREFIX.usd}${uuid}`), 'usd');
  // Not ours: application orders, empty or malformed ids, and anything that is not a string.
  for (const id of [`CRI_${uuid}`, 'CRI_REVIEW_', 'CRI_REVIEWUSD_', `CRI_REVIEW_USD_${uuid}`, `CRI_REVIEWUSD_${uuid}_x`, `xCRI_REVIEW_${uuid}`, '', null, undefined, 7]) assert.equal(reviewProductForOrder(id), null);
  assert.deepEqual([PG_REVIEW_PRODUCTS.krw.currency, PG_REVIEW_PRODUCTS.krw.amount], ['KRW', 10000]);
  assert.deepEqual([PG_REVIEW_PRODUCTS.usd.currency, PG_REVIEW_PRODUCTS.usd.amount], ['USD', 1]);
});
