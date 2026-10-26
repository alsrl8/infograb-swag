import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4399';
const device=crypto.randomUUID();const prefix='TEST-'+crypto.randomUUID().slice(0,6);
async function list(){const r=await fetch(base+'/api/receipts');assert.equal(r.status,200);return r.json();}
async function claim(name,product='bag-ionos'){return fetch(base+'/api/receipts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,product,device})});}
try{
 assert.equal((await fetch(base)).status,200);
 assert.equal((await claim('')).status,400);
 const results=await Promise.all([claim(prefix+'a'),claim(prefix+'b')]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 let rows=(await list()).filter(r=>r.name.startsWith(prefix));assert.equal(rows.length,1);
 const row=rows[0];assert.equal((await claim(row.name)).status,409);
 let r=await fetch(base+'/api/receipts',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:row.id,device:crypto.randomUUID()})});assert.equal(r.status,403);
 assert.ok((await list()).some(r=>r.id===row.id));
 r=await fetch(base+'/api/receipts',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:row.id,device})});assert.equal(r.status,200);
 assert.ok(!(await list()).some(r=>r.id===row.id));
 console.log('PASS: page, validation, concurrent stock limit, duplicate, shared read, cancel ownership, cancellation');
}finally{for(const r of (await list()).filter(r=>r.name.startsWith(prefix)))await fetch(base+'/api/receipts',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r.id,device})});}
