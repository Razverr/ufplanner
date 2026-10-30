import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testConnection } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('🔄 Checking database connection before migration...');
  const connTest = await testConnection();
  if (!connTest.ok) {
    console.error('❌ Database connection failed:', connTest.error);
    console.error('👉 Please ensure PostgreSQL is running and credentials in .env are correct.');
    throw new Error(`Database connection failed: ${connTest.error}`);
  }

  console.log('📦 Connected to PostgreSQL at', connTest.timestamp);
  const sqlPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('⚡ Executing schema migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
    console.log('✅ Migrations executed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Allow direct CLI execution: node src/db/migrate.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
