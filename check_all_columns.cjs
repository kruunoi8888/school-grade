const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function check() {
  console.log("--- GRADES COLUMNS ---");
  const { data: g, error } = await supabase.from('grades').select('*').limit(5);
  if (error) {
    console.error("ERROR:", error.message);
  } else {
    console.log(g && g[0] ? Object.keys(g[0]) : "Empty Table");
    console.log("Sample Row:", g && g[0] ? g[0] : "None");
  }
}
check();
