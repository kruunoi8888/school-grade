import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fahhbmpzxbxqjuydujuu.supabase.co';
const supabaseKey = 'sb_publishable_NJcufx1glgZQP00xAMIqKw_r5XA4yna';

const supabase = createClient(supabaseUrl, supabaseKey);

const K_LEVELS = ['อนุบาล 1', 'อนุบาล 2', 'อนุบาล 3'];
const K_DOMAINS = [
  { code: 'K_PHY', name: 'ด้านร่างกาย', group: 'พัฒนาการ' },
  { code: 'K_EMO', name: 'ด้านอารมณ์-จิตใจ', group: 'พัฒนาการ' },
  { code: 'K_SOC', name: 'ด้านสังคม', group: 'พัฒนาการ' },
  { code: 'K_INT', name: 'ด้านสติปัญญา', group: 'พัฒนาการ' },
  { code: 'K_SUM', name: 'พัฒนาการ', group: 'สรุปผล' }
];

async function seed() {
  console.log('Seeding Kindergarten subjects...');
  
  for (const level of K_LEVELS) {
    for (const domain of K_DOMAINS) {
      const subject_code = `${domain.code}_${level.replace(' ', '')}`;
      console.log(`Processing ${subject_code} for ${level}...`);
      
      const { data, error } = await supabase
        .from('subjects')
        .upsert({
          subject_code,
          subject_name: domain.name,
          subject_group: domain.group,
          type: 'core',
          level_name: level,
          credit: 0,
          hours: 0
        }, { onConflict: 'subject_code' });
        
      if (error) {
        console.error(`Error seeding ${subject_code}:`, error.message);
      } else {
        console.log(`Successfully seeded ${subject_code}`);
      }
    }
  }
  console.log('Seeding complete.');
}

seed();
