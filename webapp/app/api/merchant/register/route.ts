import { NextRequest, NextResponse } from 'next/server';

// POST /api/merchant/register
// Merchant self-registration — creates account in 'pending' status
// Admin must approve before the merchant can submit promos

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface RegisterBody {
  name:          string;
  country:       string;
  city?:         string;
  website_url?:  string;
  contact_email: string;
  contact_name?: string;
  phone?:        string;
}

export async function POST(req: NextRequest) {
  let body: Partial<RegisterBody>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 }); }

  const { name, country, city, website_url, contact_email, contact_name, phone } = body;

  if (!name?.trim())
    return NextResponse.json({ error: 'Le nom du magasin est requis.' }, { status: 422 });
  if (!contact_email || !EMAIL_RE.test(contact_email))
    return NextResponse.json({ error: 'Adresse courriel invalide.' }, { status: 422 });
  if (!country || country.length !== 2)
    return NextResponse.json({ error: 'Code pays invalide (ex: CA, FR, US).' }, { status: 422 });

  const key = SUPABASE_SERVICE || SUPABASE_ANON;
  if (!SUPABASE_URL || !key) {
    return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/merchant_accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      name: name.trim(),
      country: country.toUpperCase(),
      city: city?.trim() ?? null,
      website_url: website_url?.trim() ?? null,
      contact_email: contact_email.trim().toLowerCase(),
      contact_name: contact_name?.trim() ?? null,
      phone: phone?.trim() ?? null,
      status: 'pending',
    }),
  });

  if (res.status === 409) {
    return NextResponse.json(
      { error: 'Un compte existe déjà avec cet email.' },
      { status: 409 }
    );
  }

  if (!res.ok) {
    const err = await res.text();
    console.error('Merchant register error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'inscription.' }, { status: 500 });
  }

  const [account] = await res.json() as Array<{ id: number; api_key: string }>;

  return NextResponse.json({
    ok: true,
    message: 'Demande reçue ! Nous examinerons votre dossier dans les 48h.',
    merchant_id: account.id,
    api_key: account.api_key,
  }, { status: 201 });
}
