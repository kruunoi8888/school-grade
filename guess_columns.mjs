import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://fahhbmpzxbxqjuydujuu.supabase.co', 'sb_publishable_NJcufx1glgZQP00xAMIqKw_r5XA4yna');

async function check() {
  try {
    const { data, error } = await supabase.from('national_exams').insert([{ exam_type: 'RT' }]).select();
    if (error) {
      console.error("Column Check Error:", error.message);
      // Try to find ANY column by specifying a likely candidate
      const { data: d2, error: e2 } = await supabase.from('national_exams').insert([{ exam_name: 'RT' }]).select();
      if (e2) console.error("Exam name also missing:", e2.message);
      
      const { data: d3, error: e3 } = await supabase.from('national_exams').insert([{ subject_name: 'RT' }]).select();
      if (e3) console.error("Subject name also missing:", e3.message);

      return;
    }
    console.log("Success with exam_type! Row:", data[0]);
    console.log("Available Columns:", Object.keys(data[0]));
    await supabase.from('national_exams').delete().eq('id', data[0].id);
  } catch (e) {
    console.error("Fatal:", e);
  }
}

check();
