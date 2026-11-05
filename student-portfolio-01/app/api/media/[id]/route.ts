import { getWorkersEnv } from '../../../../lib/storage';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
    const env = await getWorkersEnv();
    if (!env?.BUCKET) throw new Error('Media unavailable');
    const object = await env.BUCKET.get(id);
    if (!object) return new Response('Not found', { status: 404 });
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Options': 'nosniff',
        'Content-Disposition': object.httpMetadata?.contentType === 'application/pdf' ? 'inline; filename="resume.pdf"' : 'inline'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response('Media temporarily unavailable', { status: 503 });
  }
}
