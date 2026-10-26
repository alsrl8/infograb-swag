import {env} from 'cloudflare:workers';
import {products} from '../../../lib/products';
import {participants} from '../../../lib/participants';
export async function GET(){
 const {results}=await env.DB!.prepare('SELECT id, product, name, created_at, received, note FROM receipts ORDER BY created_at').all();
 return Response.json(results,{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:Request){
 let body: Record<string, unknown>;try{body=await request.json() as Record<string, unknown>;}catch{return Response.json({error:'입력 내용을 확인해주세요.'},{status:400});}
 const {product,device}=body;const name=typeof body.name==='string'?body.name.trim():'';
 const item=products.find(p=>p.id===product);
 if(!item||!name||name.length>30||typeof device!=='string'||device.length<20||device.length>100) return Response.json({error:'이름과 상품을 확인해주세요.'},{status:400});
 try{
 const result=await env.DB!.prepare('INSERT INTO receipts (id, product, name, device, created_at, received) SELECT ?,?,?,?,?,0 WHERE (? IS NULL OR (SELECT COUNT(*) FROM receipts WHERE product=?) < ?) ON CONFLICT(product,name) DO NOTHING').bind(crypto.randomUUID(),product,name,device,new Date().toISOString(),item.stock,product,item.stock).run();
 if(!result.meta.changes) return Response.json({error:'이미 체크했거나 남은 수량이 없습니다.'},{status:409});
 return Response.json({ok:true});
 }catch{ return Response.json({error:'저장하지 못했습니다. 잠시 후 다시 시도해주세요.'},{status:500});}
}
export async function DELETE(request:Request){
 const {id,device}=await request.json() as Record<string, unknown>;
 if(typeof id!=='string'||typeof device!=='string')return new Response(null,{status:400});
 const result=await env.DB!.prepare('DELETE FROM receipts WHERE id=? AND device=?').bind(id,device).run();
 return Response.json({ok:!!result.meta.changes},{status:result.meta.changes?200:403});
}

// Save the complete selection in one D1 transaction. The stock-limit trigger
// aborts and rolls back every change if any selected product is unavailable.
export async function PUT(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: '입력 내용을 확인해주세요.' }, { status: 400 });
  }
  const { name, device, products: selection, pass = false, received = false, receivedProducts, notes = {} } = payload;
  if (!notes || typeof notes !== 'object' || Array.isArray(notes) || Object.values(notes).some(note => typeof note !== 'string' || note.length > 120) || (receivedProducts !== undefined && (!Array.isArray(receivedProducts) || receivedProducts.some(id => !Array.isArray(selection) || !selection.includes(id)))) || typeof received !== 'boolean' || typeof pass !== 'boolean' || (pass && (!Array.isArray(selection) || selection.length !== 0)) ||
      typeof name !== 'string' || !participants.includes(name) ||
      typeof device !== 'string' || device.length < 20 || device.length > 100 ||
      !Array.isArray(selection) || selection.length > products.length ||
      selection.some(id => typeof id !== 'string' || !products.some(product => product.id === id)) ||
      new Set(selection).size !== selection.length) {
    return Response.json({ error: '이름과 상품을 확인해주세요.' }, { status: 400 });
  }

  const receivedIds = Array.isArray(receivedProducts) ? receivedProducts : received ? selection : [];
  const db = env.DB!;
  const { results: existing } = await db.prepare('SELECT product, device, received, note FROM receipts WHERE name = ?')
    .bind(name).all<{ product: string; device: string; received: number; note: string }>();
  if (existing.some(row => row.device !== device && (!selection.includes(row.product) || row.received !== Number(receivedIds.includes(row.product))))) {
    return Response.json({ error: '다른 기기에서 체크한 상품은 체크한 기기에서 취소해주세요.' }, { status: 403 });
  }

  const existingPass = await db.prepare('SELECT device FROM passes WHERE name = ?').bind(name).first<{ device: string }>();
  const keepPass = !!existingPass && selection.length > 0 && selection.every(id => id === 'choco-box' || id === 'choco-ritter');
  if (existingPass && existingPass.device !== device && !keepPass) {
    return Response.json({ error: '양보한 기기에서 내역을 수정해주세요.' }, { status: 403 });
  }

  const statements = [db.prepare('DELETE FROM receipts WHERE name = ? AND device = ?').bind(name, device)];
  if (!keepPass || pass) statements.push(db.prepare('DELETE FROM passes WHERE name = ? AND device = ?').bind(name, device));
  if (pass) {
    statements.push(db.prepare('INSERT INTO passes (name, device, created_at) VALUES (?, ?, ?)').bind(name, device, new Date().toISOString()));
  }
  for (const product of selection) {
    statements.push(db.prepare(
      'INSERT INTO receipts (id, product, name, device, created_at, received, note) SELECT ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM receipts WHERE name = ? AND product = ?)'
    ).bind(crypto.randomUUID(), product, name, device, new Date().toISOString(), Number(receivedIds.includes(product)), (notes as Record<string, string>)[product] ?? existing.find(row => row.product === product)?.note ?? '', name, product));
  }
  try {
    await db.batch(statements);
    return Response.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? `${error.message} ${error.cause}` : '';
    return Response.json({ error: detail.includes('stock_limit')
      ? '선택한 상품 중 수량이 소진된 상품이 있습니다. 현황을 확인하고 다시 저장해주세요.'
      : '저장하지 못했습니다. 선택은 유지되니 다시 시도해주세요.' }, { status: 409 });
  }
}
