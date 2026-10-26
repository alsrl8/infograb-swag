import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:4399/api';
const device = crypto.randomUUID();
const name = 'Miles';
async function save(products, pass = false, key = device) {
  return fetch(base + '/receipts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, device: key, products, pass }) });
}
async function passed() { return (await fetch(base + '/passes')).json(); }
async function receipts() { return (await (await fetch(base + '/receipts')).json()).filter(row => row.name === name); }
try {
  assert.equal((await save([], true)).status, 200);
  assert.ok((await passed()).includes(name), 'pass must persist independently of products');
  assert.equal((await receipts()).length, 0, 'pass must not consume stock');
  assert.equal((await save([], true)).status, 200, 'repeat pass is safe');
  assert.equal((await save(['duck-n8n'], true)).status, 400);
  assert.equal((await save([], false, crypto.randomUUID())).status, 403);
  assert.equal((await save(['duck-n8n'])).status, 200);
  assert.ok(!(await passed()).includes(name));
  assert.equal((await receipts()).length, 1);
  assert.equal((await save([], true)).status, 200);
  assert.equal((await receipts()).length, 0, 'passing replaces previous selection');
  assert.ok((await passed()).includes(name));
  console.log('PASS: persisted pass, no stock consumption, repeated pass, validation, ownership, pass/receipt transitions');
} finally { await save([]); }
