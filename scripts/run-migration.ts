import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function runMigration(migrationFile: string) {
  console.log(`Running migration: ${migrationFile}`);

  const sql = readFileSync(join(__dirname, `../supabase/migrations/${migrationFile}`), 'utf-8');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const migrationFile = process.argv[2] || '001_initial_schema.sql';
runMigration(migrationFile);
