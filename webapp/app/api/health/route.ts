import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Cache health check for 1 hour
export const revalidate = 3600;

export interface HealthResponse {
  status: 'fresh' | 'stale' | 'empty' | 'error';
  days_since_update: number;
  latest_date: string | null;
  total_prices: number;
}

export async function GET() {
  try {
    const result = await pool.query<{ latest: string | null; total: string }>(
      `SELECT MAX(valid_to)::text AS latest, COUNT(*)::text AS total
       FROM v_active_prices`
    );

    const row = result.rows[0];

    if (!row?.latest) {
      return NextResponse.json<HealthResponse>({
        status: 'empty',
        days_since_update: 999,
        latest_date: null,
        total_prices: 0,
      });
    }

    const latestDate = new Date(row.latest);
    const today = new Date();
    const daysDiff = Math.floor(
      (today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json<HealthResponse>({
      status: daysDiff > 7 ? 'stale' : 'fresh',
      days_since_update: Math.max(0, daysDiff),
      latest_date: row.latest,
      total_prices: parseInt(row.total, 10),
    });
  } catch (err) {
    console.error('Health check error:', err);
    return NextResponse.json<HealthResponse>(
      { status: 'error', days_since_update: 0, latest_date: null, total_prices: 0 },
      { status: 500 }
    );
  }
}
