const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://twgjcqivoyyjoricuueo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Z2pjcWl2b3l5am9yaWN1dWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU2NTUxNSwiZXhwIjoyMDg2MTQxNTE1fQ.jrEIYaO5pNM85-96-PsR1lzQ24hLNfFNYP_G_Pl5SiE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Reading migration file...');
  const sql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/001_initial_schema.sql'),
    'utf-8'
  );

  console.log('Executing migration via Supabase...');

  // We need to use postgres connection, not REST API
  // Let's try with pg library
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: 'postgresql://postgres:LaunchLog%232026!Secure@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
