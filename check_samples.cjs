const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function check() {
  console.log("--- GRADES SAMPLE ---");
  const { data: g } = await supabase.from('grades').select('*').limit(1);
  console.log(g ? g[0] : "Empty");

  console.log("--- STUDENTS SAMPLE ---");
  const { data: s } = await supabase.from('students').select('*').limit(1);
  console.log(s ? s[0] : "Empty");
}
check();
