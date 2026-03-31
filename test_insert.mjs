import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://fahhbmpzxbxqjuydujuu.supabase.co', 'sb_publishable_NJcufx1glgZQP00xAMIqKw_r5XA4yna');

async function check() {
  try {
    const { data: cols, error: err1 } = await supabase.from('national_exams').insert([{ subject: 'TEST_INIT', exam_type: 'RT' }]).select();
    if (err1) {
      console.error("Simple Insert Error:", err1.message);
      return;
    }
    console.log("Simple Insert Success! Full row info:", JSON.stringify(cols[0]));
    await supabase.from('national_exams').delete().eq('subject', 'TEST_INIT');
  } catch (e) {
    console.error("Fatal:", e);
  }
}

check();
