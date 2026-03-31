const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  try {
    const { data: list, error: err1 } = await supabase.from('national_exams').select('*').limit(1);
    if (err1) {
      if (err1.code === '42P01') {
        console.error("Table national_exams DOES NOT EXIST");
      } else {
        console.error("Query Error:", err1);
      }
      return;
    }
    console.log("Found rows:", list.length);
    if (list.length > 0) {
      console.log("Columns:", Object.keys(list[0]));
    } else {
      console.log("Table is empty. Checking schema via RPC if possible...");
      // Try to insert a dummy and see error for columns
      const { error: err2 } = await supabase.from('national_exams').insert([{ subject: 'test_dummy' }]);
      console.log("Insert Test Result:", err2?.message || "Success (Wait, it should fail if columns missing)");
    }
  } catch (e) {
    console.error("Fatal:", e);
  }
}

check();
