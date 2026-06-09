import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for /api/search
// Resets on cold start (Vercel serverless) — good enough for abuse prevention.
// For persistent limits across instances, replace with Vercel KV / Upstash Redis.

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

const WINDOW_MS  = 60_000; // 1 minute
const MAX_SEARCH = 30;     // 30 searches/min per IP

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkRateLimit(ip: string, limit: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  let entry = buckets.get(ip);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, entry);
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { ok: entry.count <= limit, remaining };
}

// Periodically purge stale entries (every ~500 requests)
let purgeCounter = 0;
function maybePurge() {
  if (++purgeCounter < 500) return;
  purgeCounter = 0;
  const now = Date.now();
  for (const [ip, entry] of buckets) {
    if (entry.resetAt < now) buckets.delete(ip);
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/search')) {
    const ip = getIp(req);
    maybePurge();
    const { ok, remaining } = checkRateLimit(ip, MAX_SEARCH);

    if (!ok) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter une minute.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(MAX_SEARCH),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Limit', String(MAX_SEARCH));
    res.headers.set('X-RateLimit-Remaining', String(remaining));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
