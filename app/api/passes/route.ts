import { env } from 'cloudflare:workers';

export async function GET() {
  const { results } = await env.DB!.prepare('SELECT name FROM passes').all<{ name: string }>();
  return Response.json(results.map(row => row.name), { headers: { 'Cache-Control': 'no-store' } });
}
