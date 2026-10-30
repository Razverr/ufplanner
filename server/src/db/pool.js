import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Construct connection config supporting both DATABASE_URL or discrete fields
const connectionString = process.env.DATABASE_URL;
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
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'ufplanner',
      }
);

let isConnected = false;

export async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time');
    client.release();
    isConnected = true;
    return { ok: true, timestamp: res.rows[0].current_time };
  } catch (err) {
    isConnected = false;
    return { ok: false, error: err.message };
  }
}

export function isDbConnected() {
  return isConnected;
}
