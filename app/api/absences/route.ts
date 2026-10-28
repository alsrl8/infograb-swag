import { env } from 'cloudflare:workers';
import { participants } from '../../../lib/participants';

export async function GET() {
  const { results } = await env.DB!.prepare('SELECT name FROM absences').all<{ name: string }>();
  return Response.json(results.map(row => row.name), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return Response.json({ error: '입력 내용을 확인해주세요.' }, { status: 400 }); }
  const { name, device } = body;
  if (typeof name !== 'string' || !participants.includes(name) || typeof device !== 'string' || device.length < 20 || device.length > 100) {
    return Response.json({ error: '이름을 확인해주세요.' }, { status: 400 });
  }
  await env.DB!.prepare(
    'INSERT INTO absences (name, device, created_at) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET device = excluded.device, created_at = excluded.created_at'
  ).bind(name, device, new Date().toISOString()).run();
  return Response.json({ ok: true });
}
