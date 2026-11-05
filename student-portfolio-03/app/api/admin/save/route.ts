import { parseJwtFromHeaderOrCookie, verifyJWT } from '../../../../lib/jwt';
import { database, getCloudflareDB } from '../../../../lib/storage';
import { profileSchema } from '../../../../lib/portfolio';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const token = parseJwtFromHeaderOrCookie(req);
    if (!token) {
      return Response.json(
        { error: 'Unauthorized: missing JWT token.' },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: invalid or expired JWT token.' },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { profile: unknown };
    if (!body || !body.profile) {
      return Response.json(
        { error: 'Profile data is required.' },
        { status: 400 }
      );
    }

    const parsed = profileSchema.safeParse(body.profile);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Validation failed for profile data.',
          issues: parsed.error.issues
        },
        { status: 400 }
      );
    }

    const p = parsed.data;
    const now = new Date().toISOString();

    // 1. In Node.js / Vercel environments, write to data/portfolio-data.json directly
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const filePath = path.resolve(process.cwd(), 'data', 'portfolio-data.json');
      fs.writeFileSync(filePath, JSON.stringify(p, null, 2), 'utf-8');
    } catch {
      // Ignored if filesystem is read-only or not in Node.js
    }

    // 2. In dev mode under workerd, sync to /__api/json-store middleware
    try {
      const port = process.env.PORT || '4859';
      await fetch(`http://127.0.0.1:${port}/__api/json-store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
    } catch {
      // Ignored if middleware is not accessible
    }

    // 3. In Cloudflare Workers environment, sync to D1 database
    try {
      const db = (await getCloudflareDB()) || database();
      if (db) {
        await db
          .prepare(
            'INSERT OR REPLACE INTO portfolios (id, data, revision, updated_at) VALUES (1, ?, 1, ?)'
          )
          .bind(JSON.stringify(p), now)
          .run();
      }
    } catch (dbErr) {
      console.warn('Database sync skipped (not on Cloudflare):', dbErr);
    }

    return Response.json({
      success: true,
      message: 'Profile saved successfully.',
      updatedAt: now
    });
  } catch (error) {
    console.error('Admin save error:', error);
    return Response.json(
      { error: 'Failed to save profile: ' + String(error) },
      { status: 500 }
    );
  }
}
