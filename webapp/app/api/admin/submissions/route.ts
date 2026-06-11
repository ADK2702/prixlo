import { NextRequest, NextResponse } from 'next/server';

// Admin endpoints — protected by ADMIN_SECRET env var
// GET  /api/admin/submissions?status=pending&page=1
// POST /api/admin/submissions  { action: 'approve'|'reject', id, reason? }

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const ADMIN_SECRET     = process.env.ADMIN_SECRET ?? '';

function authCheck(req: NextRequest): boolean {
  if (!ADMIN_SECRET) return false; // no secret configured = locked
  const header = req.headers.get('x-admin-secret') ?? '';
  return header === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!authCheck(req))
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status  = searchParams.get('status') ?? 'pending';
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit   = 25;
  const offset  = (page - 1) * limit;

  const query = `${SUPABASE_URL}/rest/v1/merchant_submissions` +
    `?status=eq.${encodeURIComponent(status)}` +
    `&order=created_at.asc` +
    `&limit=${limit}&offset=${offset}` +
    `&select=id,merchant_id,product_name,category,brand,sale_price,regular_price,valid_from,valid_to,country,status,created_at,merchant_accounts(name,contact_email)`;

  const res = await fetch(query, {
    headers: {
      'apikey': SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Erreur DB.' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ submissions: data, page, limit }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  if (!authCheck(req))
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  let body: { action?: string; id?: number; reason?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 }); }

  const { action, id, reason } = body;

  if (!id || !action)
    return NextResponse.json({ error: 'id et action requis.' }, { status: 422 });
  if (!['approve', 'reject'].includes(action))
    return NextResponse.json({ error: 'action doit être approve ou reject.' }, { status: 422 });
  if (action === 'reject' && !reason)
    return NextResponse.json({ error: 'reason requis pour reject.' }, { status: 422 });

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const patch: Record<string, unknown> = {
    status: newStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'admin',
  };
  if (action === 'reject') patch['reject_reason'] = reason;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/merchant_submissions?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE,
        'Authorization': `Bearer ${SUPABASE_SERVICE}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(patch),
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 });
  }

  // Log the action
  await fetch(`${SUPABASE_URL}/rest/v1/merchant_submission_log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      submission_id: id,
      action,
      actor: 'admin',
      detail: reason ?? null,
    }),
  });

  return NextResponse.json({ ok: true, id, status: newStatus });
}
