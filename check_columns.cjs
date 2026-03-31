const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('school_info').select('*').limit(1);
  if (error) console.error(error);
  else console.log(JSON.stringify(Object.keys(data[0] || {}), null, 2));
}
check();
