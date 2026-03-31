const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fahhbmpzxbxqjuydujuu.supabase.co';
const supabaseAnonKey = 'sb_publishable_NJcufx1glgZQP00xAMIqKw_r5XA4yna';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'teacher6');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('User data:', JSON.stringify(data, null, 2));
}

checkUser();
