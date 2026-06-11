import { NextRequest, NextResponse } from 'next/server';

// Phase 6 — Product image lookup via Open Food Facts + fallback
// Usage: GET /api/images?q=<product name or barcode>
// Returns: { imageUrl: string | null, source: 'off' | 'none' }

export const revalidate = 86400; // Cache 24h per product

interface OFFProduct {
  image_url?: string;
  image_front_url?: string;
  image_front_thumb_url?: string;
}

interface OFFSearchResult {
  products?: OFFProduct[];
  count?: number;
}

async function lookupOpenFoodFacts(query: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encoded}&search_simple=1&action=process&json=1&page_size=1&fields=image_url,image_front_url,image_front_thumb_url`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'PrixloBot/1.0 (prixlo.ca; hello@prixlo.ca)' },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = await res.json() as OFFSearchResult;
    const product = data.products?.[0];
    if (!product) return null;

    return (
      product.image_front_url ??
      product.image_url ??
      product.image_front_thumb_url ??
      null
    );
  } catch {
    return null;
  }
}

async function lookupByBarcode(barcode: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=image_url,image_front_url`,
      {
        headers: { 'User-Agent': 'PrixloBot/1.0 (prixlo.ca; hello@prixlo.ca)' },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { product?: OFFProduct; status?: number };
    if (data.status === 0) return null;
    return data.product?.image_front_url ?? data.product?.image_url ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ imageUrl: null, source: 'none' }, { status: 400 });
  }

  let imageUrl: string | null = null;
  let source: 'off' | 'none' = 'none';

  // Try barcode first if query looks like one (8-13 digits)
  if (/^\d{8,13}$/.test(q)) {
    imageUrl = await lookupByBarcode(q);
  }

  // Fall back to name search
  if (!imageUrl) {
    imageUrl = await lookupOpenFoodFacts(q);
  }

  if (imageUrl) source = 'off';

  return NextResponse.json(
    { imageUrl, source },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    }
  );
}
