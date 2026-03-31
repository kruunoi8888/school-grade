const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'national_exams' });
  if (error) {
    // If rpc doesn't exist, try a simple query to see columns
    const { data: cols, error: err2 } = await supabase.from('national_exams').select().limit(1);
    if (err2) {
      console.error("Error checking columns:", err2);
    } else {
      console.log("Columns in national_exams:", Object.keys(cols[0] || {}));
    }
  } else {
    console.log("Schema info:", data);
  }
}

checkSchema();
