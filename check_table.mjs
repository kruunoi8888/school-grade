import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://fahhbmpzxbxqjuydujuu.supabase.co', 'sb_publishable_NJcufx1glgZQP00xAMIqKw_r5XA4yna');

async function check() {
  try {
    // 1. Try to fetch one row
    const { data: list, error: err1 } = await supabase.from('national_exams').select('*').limit(1);
    if (err1) {
      console.error("Query Error:", err1.message);
      return;
    }
    console.log("Check Successful! Rows:", list.length);
    if (list.length > 0) {
      console.log("Columns:", Object.keys(list[0]));
    } else {
      console.log("Table is empty. Attempting a test insert to discover columns...");
      const dummy = { 
        exam_type: 'RT', 
        subject: 'TEST_INIT', 
        school_avg: 0, 
        district_avg: 0, 
        national_avg: 0 
      };
      const { error: err2 } = await supabase.from('national_exams').insert([dummy]);
      if (err2) {
        console.error("Insert Error (Useful for finding column issues):", err2.message);
        console.error("Full Error Object:", JSON.stringify(err2));
      } else {
        console.log("Insert Success! Column names match.");
        await supabase.from('national_exams').delete().eq('subject', 'TEST_INIT');
      }
    }
  } catch (e) {
    console.error("Fatal Exception:", e);
  }
}

check();
