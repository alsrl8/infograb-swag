import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:4399/api/receipts';
const device = crypto.randomUUID();
async function save(name, products, received = false, key = device) {
 return fetch(base, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, products, device:key, received})});
}
async function own() { return (await (await fetch(base)).json()).filter(row => row.name === 'Miles'); }
try {
 assert.equal((await save('Miles', ['hoodie-l'])).status, 200);
 assert.equal((await own())[0].received, 0);
 assert.equal((await save('John', ['hoodie-l'])).status, 409, 'pending selections reserve stock');
 assert.equal((await save('Miles', ['hoodie-l'], true, crypto.randomUUID())).status, 200);
 assert.equal((await own())[0].received, 1, 'another browser can mark received');
 assert.equal((await save('Miles', ['hoodie-l'], false, crypto.randomUUID())).status, 200);
 assert.equal((await own())[0].received, 0, 'another browser can mark pending');
 assert.equal((await save('Miles', ['hoodie-l'], true)).status, 200);
 assert.equal((await own())[0].received, 1);
 assert.equal((await save('Miles', ['hoodie-l'], false)).status, 200);
 assert.equal((await own())[0].received, 0);
 console.log('PASS: pending persistence, reserved stock, cross-browser status changes, collected persistence, revert to pending');
} finally { await save('Miles', []); await save('John', []); }
