import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export interface MerchantPrice {
  id: number;
  name: string;
  brand: string | null;
  price: number | null;
  unit: string | null;
  image_url: string | null;
  merchant: string;
  merchant_slug: string;
  region: string | null;
  valid_from: string | null;
  valid_to: string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    let rows: MerchantPrice[];

    if (id.startsWith('p_')) {
      // Unclustered: single price row
      const priceId = parseInt(id.slice(2), 10);
      if (isNaN(priceId)) return NextResponse.json([]);
      const result = await pool.query<MerchantPrice>(
        `SELECT id, name, brand, price::float, unit, image_url,
                merchant, merchant_slug, region,
                valid_from::text, valid_to::text
         FROM v_active_prices WHERE id = $1`,
        [priceId]
      );
      rows = result.rows;
    } else {
      // Clustered: all prices for this cluster
      const clusterId = parseInt(id, 10);
      if (isNaN(clusterId)) return NextResponse.json([]);
      const result = await pool.query<MerchantPrice>(
        `SELECT id, name, brand, price::float, unit, image_url,
                merchant, merchant_slug, region,
                valid_from::text, valid_to::text
         FROM v_active_prices
         WHERE cluster_id = $1
         ORDER BY price ASC NULLS LAST`,
        [clusterId]
      );
      rows = result.rows;
    }

    return NextResponse.json(rows);
  } catch (err) {
    console.error('Cluster detail error:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
