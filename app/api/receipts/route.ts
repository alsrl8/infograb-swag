import {env} from 'cloudflare:workers';
import {products} from '../../../lib/products';
export async function GET(){
 const {results}=await env.DB!.prepare('SELECT id, product, name, created_at FROM receipts ORDER BY created_at').all();
 return Response.json(results,{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:Request){
 let body: Record<string, unknown>;try{body=await request.json() as Record<string, unknown>;}catch{return Response.json({error:'입력 내용을 확인해주세요.'},{status:400});}
 const {product,device}=body;const name=typeof body.name==='string'?body.name.trim():'';
 const item=products.find(p=>p.id===product);
 if(!item||!name||name.length>30||typeof device!=='string'||device.length<20||device.length>100) return Response.json({error:'이름과 상품을 확인해주세요.'},{status:400});
 try{
 const result=await env.DB!.prepare('INSERT INTO receipts (id, product, name, device, created_at) SELECT ?,?,?,?,? WHERE (? IS NULL OR (SELECT COUNT(*) FROM receipts WHERE product=?) < ?) ON CONFLICT(product,name) DO NOTHING').bind(crypto.randomUUID(),product,name,device,new Date().toISOString(),item.stock,product,item.stock).run();
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
