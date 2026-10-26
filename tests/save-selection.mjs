import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:4399/api/receipts';
const device = crypto.randomUUID();
const other = crypto.randomUUID();
async function save(name, products, key = device) {
  return fetch(base, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, products, device: key }) });
}
async function list() { return (await fetch(base)).json(); }
try {
  assert.equal((await save('Unknown', [])).status, 400);
  assert.equal((await save('Miles', ['bag-ionos', 'choco-box'])).status, 200);
  assert.equal((await list()).filter(row => row.name === 'Miles').length, 2);
  assert.equal((await save('John', ['duck-n8n', 'bag-ionos'])).status, 409);
  assert.equal((await list()).filter(row => row.name === 'John').length, 0, 'failed multi-item save must roll back');
  assert.equal((await save('Miles', [], other)).status, 403);
  assert.equal((await save('Miles', ['choco-ritter'])).status, 200);
  assert.deepEqual((await list()).filter(row => row.name === 'Miles').map(row => row.product), ['choco-ritter']);
  const results = await Promise.all([save('John', ['bag-ionos']), save('Grace', ['bag-ionos'])]);
  assert.deepEqual(results.map(response => response.status).sort(), [200, 409]);
  console.log('PASS: known participant, multi-card save, transaction rollback, ownership, full replacement, concurrent stock limit');
} finally {
  for (const name of ['Miles', 'John', 'Grace']) await save(name, []);
}
