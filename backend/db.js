import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ WARNING: SUPABASE_URL or SUPABASE_KEY is missing from environment variables.');
  console.warn('Please add SUPABASE_URL and SUPABASE_KEY to your Render environment variables or backend/.env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

export const initDb = async () => {
  if (!supabaseUrl || !supabaseKey) {
    console.log('Skipping Supabase initialization check (missing credentials).');
    return;
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'bloom@shared.app')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase initial query notice:', error.message);
    }

    if (!user) {
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('bloom123', salt);

      const { error: insertErr } = await supabase.from('users').insert([{
        email: 'bloom@shared.app',
        password_hash: hash,
        partner_name: 'My Girlfriend',
        user_name: 'Partner'
      }]);

      if (insertErr) {
        console.warn('Could not seed default user account in Supabase:', insertErr.message);
      } else {
        console.log('🌸 Seeded default shared user account (bloom@shared.app) in Supabase.');
      }
    }
  } catch (err) {
    console.error('Failed to initialize Supabase connection:', err.message);
  }
};

export default supabase;
