import { isSupabaseConfigured, supabase } from '../utils/supabase';

const TABLE_NAME = 'cases';

const getCurrentUserId = async () => {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
};

const toAppCase = (row) => ({
  id: row.id,
  clientName: row.client_name,
  dni: row.dni,
  type: row.type,
  status: row.status,
  summary: row.summary || '',
  lastUpdate: row.last_update,
  documents: Array.isArray(row.documents) ? row.documents : [],
  notes: Array.isArray(row.notes) ? row.notes : [],
  importantDates: Array.isArray(row.important_dates) ? row.important_dates : [],
});

const toDbCase = (caseData) => ({
  id: caseData.id,
  client_name: caseData.clientName,
  dni: caseData.dni,
  type: caseData.type,
  status: caseData.status,
  summary: caseData.summary || '',
  last_update: caseData.lastUpdate || new Date().toISOString().split('T')[0],
  documents: caseData.documents || [],
  notes: caseData.notes || [],
  important_dates: caseData.importantDates || [],
  updated_at: new Date().toISOString(),
});

export const canUseSupabaseCases = () => isSupabaseConfigured && Boolean(supabase);

export const fetchSupabaseCases = async () => {
  if (!canUseSupabaseCases()) return { cases: [], error: null, skipped: true };

  const userId = await getCurrentUserId();
  if (!userId) return { cases: [], error: null, skipped: true };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .order('last_update', { ascending: false });

  if (error) return { cases: [], error, skipped: false };
  return { cases: data.map(toAppCase), error: null, skipped: false };
};

export const upsertSupabaseCase = async (caseData) => {
  if (!canUseSupabaseCases()) return { error: null, skipped: true };

  const userId = await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({ ...toDbCase(caseData), user_id: userId }, { onConflict: 'id' });

  return { error, skipped: false };
};

export const replaceSupabaseCases = async (cases) => {
  if (!canUseSupabaseCases()) return { error: null, skipped: true };

  const userId = await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const { error: deleteError } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('user_id', userId);

  if (deleteError) return { error: deleteError, skipped: false };

  const { error } = await supabase
    .from(TABLE_NAME)
    .insert(cases.map((caseData) => ({ ...toDbCase(caseData), user_id: userId })));

  return { error, skipped: false };
};
