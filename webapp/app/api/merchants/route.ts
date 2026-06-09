import { NextResponse } from 'next/server';

// Cache merchant list for 1 hour
export const revalidate = 3600;
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query<{ name: string; count: string }>(
      `SELECT m.name, COUNT(DISTINCT p.id) AS count
       FROM merchants m
       JOIN flyers f ON f.merchant_id = m.id
       JOIN prices p ON p.flyer_id = f.id
       WHERE (f.valid_to IS NULL OR f.valid_to >= CURRENT_DATE)
         AND (f.valid_from IS NULL OR f.valid_from <= CURRENT_DATE)
       GROUP BY m.name
       ORDER BY count DESC`
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Merchants error:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
