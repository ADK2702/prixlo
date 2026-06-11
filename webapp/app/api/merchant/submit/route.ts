import { NextRequest, NextResponse } from 'next/server';

// POST /api/merchant/submit
// Authenticated via X-API-Key header (the api_key from merchant_accounts)
// Accepts array of promos — batch submission

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

interface PromoItem {
  product_name:   string;
  sale_price:     number;
  valid_to:       string;       // ISO date YYYY-MM-DD
  category?:      string;
  brand?:         string;
  barcode?:       string;
  regular_price?: number;
  unit?:          string;
  unit_price?:    number;
  valid_from?:    string;
  image_url?:     string;
  description?:   string;
}

async function getMerchantByApiKey(apiKey: string) {
  const key = SUPABASE_SERVICE || SUPABASE_ANON;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/merchant_accounts?api_key=eq.${apiKey}&select=id,name,country,status,plan`,
    {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
    }
  );
  if (!res.ok) return null;
  const rows = await res.json() as Array<{ id: number; name: string; country: string; status: string; plan: string }>;
  return rows[0] ?? null;
}

export async function POST(req: NextRequest) {
  // Auth
  const apiKey = req.headers.get('x-api-key')?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'X-API-Key header requis.' }, { status: 401 });
  }

  const merchant = await getMerchantByApiKey(apiKey);
  if (!merchant) {
    return NextResponse.json({ error: 'Clé API invalide.' }, { status: 401 });
  }
  if (merchant.status !== 'approved') {
    return NextResponse.json(
      { error: `Compte non approuvé (statut: ${merchant.status}). Attendez la confirmation de Prixlo.` },
      { status: 403 }
    );
  }

  // Parse body
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 }); }

  const items: PromoItem[] = Array.isArray(body) ? body : [body as PromoItem];

  if (items.length === 0)
    return NextResponse.json({ error: 'Aucun produit fourni.' }, { status: 422 });

  // Free plan: max 50 promos per submission
  const LIMIT = merchant.plan === 'premium' ? 500 : merchant.plan === 'partner' ? 200 : 50;
  if (items.length > LIMIT) {
    return NextResponse.json(
      { error: `Limite dépassée. Plan ${merchant.plan}: max ${LIMIT} produits par soumission.` },
      { status: 422 }
    );
  }

  // Validate + build rows
  const today = new Date().toISOString().split('T')[0];
  const rows = [];
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const p = items[i];
    if (!p.product_name?.trim()) { errors.push(`Item ${i+1}: product_name requis`); continue; }
    if (!p.sale_price || p.sale_price <= 0) { errors.push(`Item ${i+1}: sale_price invalide`); continue; }
    if (!p.valid_to || !/^\d{4}-\d{2}-\d{2}$/.test(p.valid_to)) { errors.push(`Item ${i+1}: valid_to requis (YYYY-MM-DD)`); continue; }
    if (p.valid_to < today) { errors.push(`Item ${i+1}: valid_to est dans le passé`); continue; }

    rows.push({
      merchant_id:   merchant.id,
      product_name:  p.product_name.trim(),
      category:      p.category?.trim() ?? null,
      brand:         p.brand?.trim() ?? null,
      barcode:       p.barcode?.trim() ?? null,
      regular_price: p.regular_price ?? null,
      sale_price:    p.sale_price,
      unit:          p.unit?.trim() ?? null,
      unit_price:    p.unit_price ?? null,
      valid_from:    p.valid_from ?? today,
      valid_to:      p.valid_to,
      image_url:     p.image_url?.trim() ?? null,
      description:   p.description?.trim() ?? null,
      country:       merchant.country,
      status:        'pending',
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Aucun produit valide.', errors }, { status: 422 });
  }

  // Insert
  const key = SUPABASE_SERVICE || SUPABASE_ANON;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/merchant_submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    console.error('Merchant submit error:', await res.text());
    return NextResponse.json({ error: 'Erreur lors de la soumission.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    submitted: rows.length,
    skipped: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    message: `${rows.length} produit(s) soumis pour révision. Délai d'approbation: 24h.`,
  }, { status: 201 });
}
