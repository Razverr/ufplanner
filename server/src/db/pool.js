import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Construct connection config supporting both DATABASE_URL or discrete fields
const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
const isCloudOrSsl = Boolean(
  connectionString &&
  (connectionString.includes('neon.tech') ||
   connectionString.includes('sslmode=') ||
   connectionString.includes('supabase') ||
   connectionString.includes('render.com'))
);

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isCloudOrSsl ? { rejectUnauthorized: false } : undefined,
        max: Number(process.env.PGPOOL_MAX) || 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'ufplanner',
        max: Number(process.env.PGPOOL_MAX) || 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      }
);

let isConnected = false;

pool.on('error', (error) => {
  isConnected = false;
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

export async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time');
    isConnected = true;
    return { ok: true, timestamp: res.rows[0].current_time };
  } catch (err) {
    isConnected = false;
    return { ok: false, error: err.message };
  } finally {
    client?.release();
  }
}

export function isDbConnected() {
  return isConnected;
}
