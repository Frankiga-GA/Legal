import { isSupabaseConfigured, supabase } from '../utils/supabase';

const TABLE_NAME = 'cases';

const getCurrentUserId = async () => {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.user.id;
};

const toAppCase = (row) => ({
  id: row.id,
  clientName: row.client_name,
  dni: row.dni,
  type: row.type,
  status: row.status,
  summary: row.summary || '',
  lastUpdate: row.last_update,
  latestProgress: row.latest_progress || '',
  hearingLink: row.hearing_link || '',
  counterparty: row.counterparty || '',
  urgency: row.urgency || 'Media',
  documents: Array.isArray(row.documents) ? row.documents : [],
  notes: Array.isArray(row.notes) ? row.notes : [],
  importantDates: Array.isArray(row.important_dates) ? row.important_dates : [],
  officialReferences: Array.isArray(row.official_references) ? row.official_references : [],
  judge: row.judge || '',
  specialist: row.specialist || '',
  cuaderno: row.cuaderno || '',
  escritoNro: row.escrito_nro || '',
});

const toDbCase = (caseData) => ({
  id: caseData.id,
  client_name: caseData.clientName,
  dni: caseData.dni,
  type: caseData.type,
  status: caseData.status,
  summary: caseData.summary || '',
  last_update: caseData.lastUpdate || new Date().toISOString().split('T')[0],
  latest_progress: caseData.latestProgress || '',
  hearing_link: caseData.hearingLink || '',
  counterparty: caseData.counterparty || '',
  urgency: caseData.urgency || 'Media',
  documents: caseData.documents || [],
  notes: caseData.notes || [],
  important_dates: caseData.importantDates || [],
  official_references: caseData.officialReferences || [],
  judge: caseData.judge || '',
  specialist: caseData.specialist || '',
  cuaderno: caseData.cuaderno || '',
  escrito_nro: caseData.escritoNro || '',
  updated_at: new Date().toISOString(),
});

export const canUseSupabaseCases = () => isSupabaseConfigured && Boolean(supabase);

export const fetchSupabaseCases = async () => {
  if (!canUseSupabaseCases()) return { cases: [], error: null, skipped: true };

  const userId = await getCurrentUserId();
  if (!userId) return { cases: [], error: null, skipped: true };

  // Al no filtrar por user_id, RLS devolverá los propios Y los compartidos
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('last_update', { ascending: false });

  if (error) return { cases: [], error, skipped: false };
  
  // Agregamos flags isOwner y isShared para la UI
  const mappedCases = (data || []).map((row) => ({
    ...toAppCase(row),
    isOwner: row.user_id === userId,
    isShared: row.user_id !== userId,
  }));
  
  // Eliminar duplicados en caso de que existan en la DB por falta de constraints previos
  const uniqueCases = Array.from(new Map(mappedCases.map(c => [c.id, c])).values());
  
  return { cases: uniqueCases, error: null, skipped: false };
};

export const upsertSupabaseCase = async (caseData) => {
  if (!canUseSupabaseCases()) return { error: null, skipped: true };

  const userId = await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const payload = {
    ...toDbCase(caseData),
    user_id: userId,
  };

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(payload);

  return { error, skipped: false };
};

export const insertSupabaseCase = async (caseData) => {
  if (!canUseSupabaseCases()) {
    // Modo local: simular un ID temporal
    return { data: { ...caseData, id: `temp-${Date.now()}` }, error: null, skipped: true };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: null, skipped: true };

  const payload = {
    ...toDbCase(caseData),
    user_id: userId,
  };
  
  // Borramos el ID solo si está vacío o es un id temporal para que Supabase genere la secuencia
  if (!payload.id || payload.id.startsWith('temp-') || payload.id.trim() === '') {
    delete payload.id;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select()
    .single();

  if (error || !data) return { data: null, error, skipped: false };
  
  // Retornamos el objeto ya mapeado con el ID final (ej: EXP-2026-015)
  const mapped = toAppCase(data);
  mapped.isOwner = true;
  return { data: mapped, error: null, skipped: false };
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

export const deleteSupabaseCase = async (caseId) => {
  if (!canUseSupabaseCases()) return { error: null, skipped: true };

  const userId = await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', caseId)
    .eq('user_id', userId);

  return { error, skipped: false };
};
