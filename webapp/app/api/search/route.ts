import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export interface ClusterResult {
  group_id: string;
  canonical_name: string;
  canonical_brand: string | null;
  best_price: number | null;
  best_merchant: string;
  merchant_count: number;
  image_url: string | null;
  valid_from: string | null;
  valid_to: string | null;
}

function buildTsQuery(q: string): string | null {
  const words = q
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);
  return words.length ? words.join(' & ') : null;
}

const GROUPED_SQL = (where: string, paramCount: number) => `
  SELECT
    COALESCE(p.cluster_id::text, 'p_' || MIN(p.id)::text) AS group_id,
    COALESCE(c.canonical_name,  p.name)                    AS canonical_name,
    COALESCE(c.canonical_brand, p.brand)                   AS canonical_brand,
    MIN(p.price)                                           AS best_price,
    (SELECT p2.merchant FROM v_active_prices p2
     WHERE COALESCE(p2.cluster_id, -p2.id) = COALESCE(p.cluster_id, -MIN(p.id))
     ORDER BY p2.price ASC NULLS LAST LIMIT 1)             AS best_merchant,
    COUNT(DISTINCT p.merchant)                             AS merchant_count,
    MAX(p.image_url)                                       AS image_url,
    MIN(p.valid_from::text)                                AS valid_from,
    MAX(p.valid_to::text)                                  AS valid_to
  FROM   v_active_prices p
  LEFT JOIN product_clusters c ON p.cluster_id = c.id
  WHERE  ${where}
  GROUP  BY COALESCE(p.cluster_id::text, 'p_' || p.id::text),
            COALESCE(c.canonical_name, p.name), p.name,
            COALESCE(c.canonical_brand, p.brand), p.brand
  ORDER  BY best_price ASC NULLS LAST
  LIMIT  40
`;

// Cache search results for 10 minutes (search data changes weekly)
export const revalidate = 600;

export async function GET(req: NextRequest) {
  const q         = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const merchants = req.nextUrl.searchParams.get('merchants') ?? '';

  if (q.length < 2) return NextResponse.json([]);

  const merchantList = merchants
    ? merchants.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const merchantClause = merchantList.length
    ? `AND p.merchant = ANY(ARRAY[${merchantList.map((_, i) => `$${i + 2}`).join(',')}])`
    : '';

  try {
    const tsq = buildTsQuery(q);

    if (tsq) {
      const ftsWhere = `to_tsvector('simple', public.unaccent_immutable(p.name)) @@ to_tsquery('simple', $1) ${merchantClause}`;
      const fts = await pool.query<ClusterResult>(
        GROUPED_SQL(ftsWhere, merchantList.length + 1),
        [tsq, ...merchantList]
      );
      if (fts.rows.length > 0) return NextResponse.json(fts.rows);
    }

    // Fallback ILIKE
    const likeWhere = `p.name ILIKE $1 ${merchantClause}`;
    const like = await pool.query<ClusterResult>(
      GROUPED_SQL(likeWhere, merchantList.length + 1),
      [`%${q}%`, ...merchantList]
    );
    return NextResponse.json(like.rows);

  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
