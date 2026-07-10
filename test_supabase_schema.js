import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://hpxtnzcnvtqinchqarms.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_NnVFj6Yd21L1kDSgV_M_EA_2NGTpFtF";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'cases' });
  console.log("Schema info:", data || error);
}

checkSchema();
