import { createClient } from '@supabase/supabase-js';



const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://hpxtnzcnvtqinchqarms.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_NnVFj6Yd21L1kDSgV_M_EA_2NGTpFtF";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const payload = {
    id: "EXP-TEST-005",
    client_name: "Test Client",
    dni: "12345678",
    type: "Laboral",
    status: "Activo",
    summary: "Test summary",
    last_update: new Date().toISOString().split('T')[0],
    latest_progress: "",
    hearing_link: "",
    counterparty: "",
    urgency: "Media",
    documents: [],
    notes: [],
    important_dates: [],
    official_references: [],
    judge: "",
    specialist: "",
    cuaderno: "",
    escrito_nro: "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('cases').upsert(payload);
  console.log("Response Data:", data);
  if (error) {
    console.error("Supabase Error Object:", JSON.stringify(error, null, 2));
  }
}

testInsert();
