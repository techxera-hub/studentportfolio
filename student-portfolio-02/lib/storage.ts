import { sample } from './sample';
import type { Profile } from './portfolio';
import { readJsonProfile } from './json-storage';

let cachedWorkersEnv: any = null;

export async function getWorkersEnv(): Promise<any> {
  if (cachedWorkersEnv) return cachedWorkersEnv;
  if (typeof process !== 'undefined' && process.env?.VERCEL) {
    return null;
  }
  try {
    const cfMod = 'cloudflare:' + 'workers';
    const mod = await import(/* webpackIgnore: true */ cfMod);
    cachedWorkersEnv = mod.env || null;
    return cachedWorkersEnv;
  } catch {
    return null;
  }
}

export function database() {
  if (cachedWorkersEnv?.DB) return cachedWorkersEnv.DB;
  throw new Error('Portfolio storage is unavailable. Please try again.');
}

export async function readProfile() {
  try {
    const env = await getWorkersEnv();
    if (env?.DB) {
      const row = (await env.DB.prepare('SELECT data, revision, updated_at FROM portfolios WHERE id = ?').bind(1).first()) as { data: string; revision: number; updated_at: string } | null;
      if (row && row.data) {
        return { profile: JSON.parse(row.data) as Profile, revision: row.revision, updatedAt: row.updated_at };
      }
    }
  } catch (err) {
    console.warn('Falling back to JSON read:', err);
  }

  try {
    const jsonResult = readJsonProfile();
    if (jsonResult && jsonResult.profile) {
      return jsonResult;
    }
  } catch (err) {
    console.warn('JSON read fallback failed:', err);
  }

  return { profile: sample, revision: 0, updatedAt: null };
}

export async function studentEmail() {
  try {
    const env = await getWorkersEnv();
    if (env?.DB) {
      const row = (await env.DB.prepare('SELECT student_email FROM settings WHERE id = ?').bind(1).first()) as { student_email: string } | null;
      return row?.student_email ?? '';
    }
  } catch {
    return '';
  }
  return '';
}

export function ownerEmail() {
  return ((cachedWorkersEnv as unknown as { OWNER_EMAIL?: string })?.OWNER_EMAIL ?? '').toLowerCase();
}

export async function permission(email: string) {
  if (!email) return 'none';
  if (ownerEmail() && email.toLowerCase() === ownerEmail()) return 'owner';
  const student = await studentEmail();
  return student && email.toLowerCase() === student.toLowerCase() ? 'student' : 'none';
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  return origin === new URL(req.url).origin;
}
