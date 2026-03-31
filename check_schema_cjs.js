const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('grades').select('*').limit(1);
  if (error) {
    console.error("ERROR:", error.message);
  } else {
    console.log("COLUMNS:", Object.keys(data[0] || {}));
  }
}
check();
