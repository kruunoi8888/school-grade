import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://fahhbmpzxbxqjuydujuu.supabase.co', 'sb_publishable_NJcufx1glgZQP00xAMIqKw_r5XA4yna');

async function check() {
  try {
    const { data: cols, error: err1 } = await supabase.from('national_exams').insert([{ data: { test: 1 } }]).select();
    if (err1) {
      console.error("Data Insert Error (Maybe missing key?):", err1.message);
      return;
    }
    console.log("Success with 'data' column! Full row info:", JSON.stringify(cols[0]));
    await supabase.from('national_exams').delete().eq('id', cols[0].id);
  } catch (e) {
    console.error("Fatal:", e);
  }
}

check();
