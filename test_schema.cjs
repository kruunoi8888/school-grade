const { createClient } = require('@supabase/supabase-js');
async function check() {
  const s = createClient('https://fahhbmpzxbxqjuydujuu.supabase.co', 'sb_publishable_NJcufx1glgZQP00xAMIqKw_r5XA4yna');
  const { data, error } = await s.from('school_info').select('*').limit(1).single();
  if (error) console.log('ERROR:', error);
  else console.log('DATA:', JSON.stringify(data));
  process.exit(0);
}
check();
