import { isSupabaseConfigured, supabase } from '../utils/supabase';

const TABLE_NAME = 'cases';

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

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('last_update', { ascending: false });

  if (error) return { cases: [], error, skipped: false };
  return { cases: data.map(toAppCase), error: null, skipped: false };
};

export const upsertSupabaseCase = async (caseData) => {
  if (!canUseSupabaseCases()) return { error: null, skipped: true };

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(toDbCase(caseData), { onConflict: 'id' });

  return { error, skipped: false };
};

export const replaceSupabaseCases = async (cases) => {
  if (!canUseSupabaseCases()) return { error: null, skipped: true };

  const { error: deleteError } = await supabase
    .from(TABLE_NAME)
    .delete()
    .neq('id', '');

  if (deleteError) return { error: deleteError, skipped: false };

  const { error } = await supabase
    .from(TABLE_NAME)
    .insert(cases.map(toDbCase));

  return { error, skipped: false };
};
