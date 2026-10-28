import assert from 'node:assert/strict';

// Run against an empty local development DB, never the shared production data.
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:5173');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Local server required');
const deviceA = 'regression-browser-a-000000';
const deviceB = 'regression-browser-b-000000';
async function call(path, method = 'GET', body) {
  const response = await fetch(new URL(path, base), { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
async function save(name, products, extra = {}, device = deviceB) {
  return call('/api/receipts', 'PUT', { name, products, device, receivedProducts: [], ...extra });
}
for (const endpoint of ['receipts', 'absences', 'passes']) {
  assert.deepEqual((await call(`/api/${endpoint}`)).data, [], 'Use an empty local DB');
}
try {
  assert.equal((await save('Eva', ['cap-n8n'], { notes: { 'cap-n8n': 'keep note' } }, deviceA)).status, 200);
  const original = (await call('/api/receipts')).data[0];
  assert.equal((await save('Eva', ['cap-n8n'], { receivedProducts: ['cap-n8n'] })).status, 200);
  const retained = (await call('/api/receipts')).data[0];
  assert.equal(retained.id, original.id);
  assert.equal(retained.created_at, original.created_at);
  assert.equal(retained.note, 'keep note');
  assert.equal(retained.received, 1);

  assert.equal((await call('/api/absences', 'PUT', { name: 'Eva', device: deviceA })).status, 200);
  assert.equal((await call('/api/absences', 'PUT', { name: 'Eva', device: deviceB })).status, 200);
  assert.equal((await save('Eva', ['cap-sendit'])).status, 200);
  assert.deepEqual((await call('/api/absences')).data, []);
  assert.deepEqual((await call('/api/receipts')).data.map(row => row.product), ['cap-sendit']);

  assert.equal((await save('Eva', [], { pass: true }, deviceA)).status, 200);
  assert.equal((await save('Eva', ['choco-box'])).status, 200);
  assert.deepEqual((await call('/api/passes')).data, ['Eva']);
  assert.equal((await save('Eva', ['duck-ionos'])).status, 200);
  assert.deepEqual((await call('/api/passes')).data, []);
  const receipt = (await call('/api/receipts')).data[0];
  assert.equal((await call('/api/receipts', 'DELETE', { id: receipt.id, device: deviceA })).status, 200);

  assert.equal((await save('John', ['hoodie-l'], {}, deviceA)).status, 200);
  assert.equal((await save('Eva', ['cap-sendit'], {}, deviceA)).status, 200);
  assert.equal((await save('Eva', ['hoodie-l'])).status, 409);
  const afterFailure = (await call('/api/receipts')).data;
  assert.equal(afterFailure.find(row => row.name === 'Eva').product, 'cap-sendit');
  assert.equal(afterFailure.find(row => row.name === 'John').product, 'hoodie-l');
  assert.equal((await save('Eva', [])).status, 200);
  console.log('PASS: cross-device selection, cancellation, receipt status, absence, pass, metadata preservation and stock rollback');
} finally {
  for (const name of ['Eva', 'John']) assert.equal((await save(name, [])).status, 200);
}
