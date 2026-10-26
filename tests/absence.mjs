import assert from 'node:assert/strict';
const base='http://127.0.0.1:4399/api';
const device=crypto.randomUUID();
async function put(path,body){return fetch(base+path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Miles',device,...body})});}
async function absences(){return (await fetch(base+'/absences')).json();}
async function receipts(){return (await(await fetch(base+'/receipts')).json()).filter(row=>row.name==='Miles');}
try{
 assert.equal((await put('/absences',{})).status,200);
 assert.ok((await absences()).includes('Miles'));
 assert.equal((await receipts()).length,0);
 assert.equal((await put('/absences',{device:crypto.randomUUID()})).status,403);
 assert.equal((await put('/receipts',{products:['choco-box'],receivedProducts:[]})).status,200);
 assert.ok(!(await absences()).includes('Miles'));
 const before=await receipts();
 assert.equal((await put('/absences',{})).status,200);
 assert.deepEqual(await receipts(),before,'marking absence must not change saved products or receipt status');
 assert.equal((await put('/receipts',{products:['choco-box'],device:crypto.randomUUID()})).status,403);
 assert.equal((await put('/receipts',{products:[],pass:true})).status,200);
 assert.ok(!(await absences()).includes('Miles'),'pass resolves absence');
 console.log('PASS: absence without selection, ownership, existing selections preserved, save/pass resolves hold');
}finally{await put('/receipts',{products:[]});}
