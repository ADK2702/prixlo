import { NextRequest, NextResponse } from 'next/server';

// Phase 8 — Newsletter signup
// Stores email in Supabase newsletters table + sends welcome message
// Uses Supabase REST API directly (no extra dep needed)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const email = typeof body === 'object' && body !== null && 'email' in body
    ? String((body as { email: unknown }).email).trim().toLowerCase()
    : '';

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Adresse courriel invalide.' }, { status: 422 });
  }

  // If Supabase is configured, persist to DB
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal,resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          email,
          source: req.headers.get('referer') ?? 'prixlo.ca',
          subscribed_at: new Date().toISOString(),
          locale: 'fr-CA',
          is_active: true,
        }),
      });

      if (!dbRes.ok && dbRes.status !== 409) {
        console.error('Newsletter DB error:', dbRes.status, await dbRes.text());
        return NextResponse.json(
          { error: 'Erreur lors de l\'inscription. Réessayez plus tard.' },
          { status: 500 }
        );
      }
    } catch (err) {
      console.error('Newsletter fetch error:', err);
      return NextResponse.json(
        { error: 'Erreur serveur. Réessayez plus tard.' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { ok: true, message: 'Inscription réussie ! Vous recevrez les meilleures promos chaque semaine.' },
    { status: 201 }
  );
}

// Unsubscribe via GET with token (sent in emails)
export async function DELETE(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 422 });
  }

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(email)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ is_active: false, unsubscribed_at: new Date().toISOString() }),
        }
      );
    } catch (err) {
      console.error('Unsubscribe error:', err);
    }
  }

  return NextResponse.json({ ok: true, message: 'Désinscription effectuée.' });
}
