import assert from 'node:assert/strict';
const base='http://127.0.0.1:4399/api';
const device=crypto.randomUUID();
async function save(payload){return fetch(base+'/receipts',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Miles',device,...payload})});}
try{
 assert.equal((await save({products:['bag-ionos','choco-box'],receivedProducts:['bag-ionos'],notes:{'choco-box':'알코올 없는 것'}})).status,200);
 let rows=(await(await fetch(base+'/receipts')).json()).filter(r=>r.name==='Miles');
 assert.equal(rows.find(r=>r.product==='bag-ionos').received,1);
 assert.equal(rows.find(r=>r.product==='choco-box').received,0);
 assert.equal(rows.find(r=>r.product==='choco-box').note,'알코올 없는 것');
 assert.equal((await save({products:[],pass:true})).status,200);
 assert.equal((await save({products:['choco-box','choco-ritter'],receivedProducts:[]})).status,200);
 assert.ok((await(await fetch(base+'/passes')).json()).includes('Miles'),'chocolate choices preserve swag pass');
 assert.equal((await save({products:['choco-box'],receivedProducts:['bag-ionos']})).status,400);
 console.log('PASS: item-level received status, notes, chocolate pending alongside swag pass, validation');
}finally{await save({products:[]});}
