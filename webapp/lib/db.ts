import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  // Supabase Transaction Pooler uses port 6543 — it doesn't support prepared statements.
  // Direct connections (port 5432) support everything but have lower connection limits.
  const isSupabasePooler = url.includes(':6543');

  return new Pool({
    connectionString: url,
    // Supabase pooler: disable prepared statements, keep connections low
    ...(isSupabasePooler ? {
      max: 3,
      idleTimeoutMillis: 10_000,
      statement_timeout: 8_000,
    } : {
      max: 10,
      idleTimeoutMillis: 30_000,
    }),
    ssl: url.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });
}

// Reuse pool across hot-reloads in dev
const pool = global._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') global._pgPool = pool;

export default pool;
