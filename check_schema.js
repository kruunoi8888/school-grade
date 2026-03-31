import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('grades').select('*').limit(1);
  if (error) {
    console.error("ERROR:", error.message);
  } else {
    console.log("COLUMNS:", Object.keys(data[0] || {}));
  }
}
check();
