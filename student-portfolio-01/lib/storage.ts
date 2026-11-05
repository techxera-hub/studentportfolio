import { sample } from './sample';
import type { Profile } from './portfolio';
import portfolioJson from '../portfolio-data.json';

let cachedWorkersEnv: Record<string, any> | null = null;

export async function getWorkersEnv(): Promise<Record<string, any> | null> {
  if (cachedWorkersEnv) return cachedWorkersEnv;
  // Vercel / Node environment check
  if (typeof process !== 'undefined' && process.env?.VERCEL) {
    return null;
  }
  try {
    const cfMod = 'cloudflare:' + 'workers';
    const mod = await import(/* webpackIgnore: true */ cfMod);
    cachedWorkersEnv = (mod.env as Record<string, any>) || null;
    return cachedWorkersEnv;
  } catch {
    return null;
  }
}

export function database() {
  if (cachedWorkersEnv && cachedWorkersEnv.DB) return cachedWorkersEnv.DB;
  throw new Error('Cloudflare D1 is unavailable (using portfolio-data.json mode).');
}

export async function readProfile(): Promise<{ profile: Profile; revision: number; updatedAt: string | null }> {
  try {
    const env = await getWorkersEnv();
    if (env && env.DB) {
      const row = (await env.DB.prepare('SELECT data, revision, updated_at FROM portfolios WHERE id = ?').bind(1).first()) as { data: string; revision: number; updated_at: string } | null;
      if (row && row.data) {
        return { profile: JSON.parse(row.data) as Profile, revision: row.revision, updatedAt: row.updated_at };
      }
    }
  } catch {
    // Fallback to portfolio-data.json
  }

  // Dynamic file read fallback (for Node.js / Vercel runtime)
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const p = path.resolve(process.cwd(), 'portfolio-data.json');
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (data && data.name) {
        return { profile: data as Profile, revision: 1, updatedAt: new Date().toISOString() };
      }
    }
  } catch {
    // Static fallback
  }

  return { profile: (portfolioJson as unknown as Profile) || sample, revision: 0, updatedAt: null };
}

export async function studentEmail(): Promise<string> {
  try {
    const env = await getWorkersEnv();
    if (env && env.DB) {
      const row = (await env.DB.prepare('SELECT student_email FROM settings WHERE id = ?').bind(1).first()) as { student_email: string } | null;
      return row?.student_email ?? '';
    }
  } catch { }
  return '';
}

export function ownerEmail(): string {
  try {
    const email = (cachedWorkersEnv?.OWNER_EMAIL || process.env.OWNER_EMAIL || '') as string;
    return email.toLowerCase();
  } catch {
    return '';
  }
}

export async function permission(email: string): Promise<'none' | 'owner' | 'student'> {
  if (!email) return 'none';
  if (ownerEmail() && email.toLowerCase() === ownerEmail()) return 'owner';
  const student = await studentEmail();
  return student && email.toLowerCase() === student.toLowerCase() ? 'student' : 'none';
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  return !origin || origin === new URL(req.url).origin;
}
