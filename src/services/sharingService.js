import { isSupabaseConfigured, supabase } from '../utils/supabase';

const TABLE_NAME = 'case_shares';

export const shareCase = async (caseId, email, role = 'lector') => {
  if (!isSupabaseConfigured || !supabase) return { error: new Error('Supabase no configurado') };
  
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({ case_id: caseId, shared_with_email: email.toLowerCase(), role }, { onConflict: 'case_id,shared_with_email' });
    
  return { error };
};

export const shareMultipleCases = async (caseIds, email, role = 'lector') => {
  if (!isSupabaseConfigured || !supabase) return { error: new Error('Supabase no configurado') };
  if (!caseIds || caseIds.length === 0) return { error: null };

  const payload = caseIds.map(id => ({
    case_id: id,
    shared_with_email: email.toLowerCase(),
    role
  }));

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(payload, { onConflict: 'case_id,shared_with_email' });
    
  return { error };
};

export const unshareCase = async (caseId, email) => {
  if (!isSupabaseConfigured || !supabase) return { error: new Error('Supabase no configurado') };

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('case_id', caseId)
    .eq('shared_with_email', email.toLowerCase());

  return { error };
};

export const getCaseShares = async (caseId) => {
  if (!isSupabaseConfigured || !supabase) return { shares: [], error: null };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  return { shares: data || [], error };
};
