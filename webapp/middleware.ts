import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Phase 5 — Legal scraping protection + security headers + rate limiting
// ---------------------------------------------------------------------------

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

const WINDOW_MS  = 60_000; // 1 minute
const MAX_SEARCH = 30;     // 30 API req/min per IP
const MAX_GLOBAL = 120;    // 120 req/min general

// Legitimate crawlers + our own scraper
const ALLOWED_BOTS = [
  'PrixloBot',   // Our own scraper — must identify itself
  'Googlebot', 'Google-InspectionTool', 'Googlebot-Image',
  'bingbot', 'DuckDuckBot', 'Slurp', 'facebot', 'Twitterbot',
  'LinkedInBot', 'WhatsApp',
];

function isAllowedBot(ua: string): boolean {
  return ALLOWED_BOTS.some(b => ua.includes(b));
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkRateLimit(key: string, limit: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  let entry = buckets.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { ok: entry.count <= limit, remaining };
}

// Periodically purge stale entries
let purgeCounter = 0;
function maybePurge() {
  if (++purgeCounter < 500) return;
  purgeCounter = 0;
  const now = Date.now();
  for (const [k, entry] of buckets) {
    if (entry.resetAt < now) buckets.delete(k);
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const ua = req.headers.get('user-agent') ?? '';
  const ip = getIp(req);

  // ── Block aggressive non-whitelisted bots on API ─────────────────────────
  if (isApi && ua) {
    const looksLikeBot = /bot|crawl|spider|scrape|wget|curl|python-requests|Go-http/i.test(ua);
    if (looksLikeBot && !isAllowedBot(ua)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  maybePurge();
  const limit = pathname.startsWith('/api/search') ? MAX_SEARCH : MAX_GLOBAL;
  const { ok, remaining } = checkRateLimit(`${isApi ? 'api' : 'web'}:${ip}`, limit);

  if (!ok) {
    const body = isApi
      ? JSON.stringify({ error: 'Trop de requêtes. Veuillez patienter une minute.' })
      : 'Too Many Requests';
    return new NextResponse(body, {
      status: 429,
      headers: {
        'Content-Type': isApi ? 'application/json' : 'text/plain',
        'Retry-After': '60',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // ── Build response with security headers ─────────────────────────────────
  const res = NextResponse.next();

  // Security
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.headers.set('X-XSS-Protection', '1; mode=block');

  // Rate limit headers
  res.headers.set('X-RateLimit-Limit', String(limit));
  res.headers.set('X-RateLimit-Remaining', String(remaining));

  // CORS for API (read-only public data — open is fine)
  if (isApi) {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.headers.set('Vary', 'Accept-Encoding');
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon-.*\\.png|.*\\.png|.*\\.jpg|sw\\.js|manifest\\.json).*)',
  ],
};
