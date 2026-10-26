import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:4399/api/receipts';
const device = crypto.randomUUID();
async function save(name, products) {
 return fetch(base, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, products, device})});
}
try {
 const results = await Promise.all([save('Miles', ['hoodie-l']), save('John', ['hoodie-l'])]);
 assert.deepEqual(results.map(response => response.status).sort(), [200, 409]);
 const rows = await (await fetch(base)).json();
 assert.equal(rows.filter(row => row.product === 'hoodie-l').length, 1);
 console.log('PASS: L hoodie can be saved and shared; concurrent claims stay within one unit');
} finally {
 for (const name of ['Miles', 'John']) await save(name, []);
}
