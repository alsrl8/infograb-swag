import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeProduct } from './summary.ts';

test('pending selections reserve stock but remain uncollected', () => {
  const rows = [{ name: 'John', received: 1 }, { name: 'Miles', received: 0 }];
  const result = summarizeProduct(3, rows);
  assert.equal(result.available, 1);
  assert.equal(result.uncollected, 2);
  assert.deepEqual(result.collected.map(row => row.name), ['John']);
  assert.deepEqual(result.pending.map(row => row.name), ['Miles']);
});

test('unknown stock stays unknown and sold-out reservations leave no available stock', () => {
  assert.equal(summarizeProduct(null, []).available, null);
  assert.equal(summarizeProduct(null, []).uncollected, null);
  assert.equal(summarizeProduct(1, [{ received: 0 }]).available, 0);
  assert.equal(summarizeProduct(2, []).available, 2);
});
