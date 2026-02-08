import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running database migration...');

  const sql = readFileSync(
    join(__dirname, '../supabase/migrations/001_initial_schema.sql'),
    'utf-8'
  );

  // Split by semicolon and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec', { sql: statement + ';' });
      if (error) {
        console.error('Error executing statement:', error);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }

  console.log('Migration complete!');
}

runMigration();
