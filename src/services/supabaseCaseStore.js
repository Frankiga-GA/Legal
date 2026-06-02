import { isSupabaseConfigured, supabase } from '../utils/supabase';
import { ensureDefaultOrganization } from './organizationService';

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
  officialReferences: Array.isArray(row.official_references) ? row.official_references : [],
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
  official_references: caseData.officialReferences || [],
  updated_at: new Date().toISOString(),
});

const isMissingOrganizationColumn = (error) =>
  error?.message?.includes('organization_id') || error?.details?.includes('organization_id');

export const canUseSupabaseCases = () => isSupabaseConfigured && Boolean(supabase);

export const fetchSupabaseCases = async () => {
  if (!canUseSupabaseCases()) return { cases: [], error: null, skipped: true };

  const { organizationId, user } = await ensureDefaultOrganization();
  const userId = user?.id || await getCurrentUserId();
  if (!userId) return { cases: [], error: null, skipped: true };

  const baseQuery = supabase.from(TABLE_NAME).select('*').order('last_update', { ascending: false });
  const { data, error } = organizationId
    ? await baseQuery.eq('organization_id', organizationId)
    : await baseQuery.eq('user_id', userId);

  if (error && organizationId && isMissingOrganizationColumn(error)) {
    const fallback = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('last_update', { ascending: false });

    if (fallback.error) return { cases: [], error: fallback.error, skipped: false };
    return { cases: fallback.data.map(toAppCase), error: null, skipped: false };
  }

  if (error) return { cases: [], error, skipped: false };
  return { cases: data.map(toAppCase), error: null, skipped: false };
};

export const upsertSupabaseCase = async (caseData) => {
  if (!canUseSupabaseCases()) return { error: null, skipped: true };

  const { organizationId, user } = await ensureDefaultOrganization();
  const userId = user?.id || await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const orgPayload = {
    ...toDbCase(caseData),
    user_id: userId,
    organization_id: organizationId,
    created_by: userId,
  };

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(orgPayload, { onConflict: 'id' });

  if (error && isMissingOrganizationColumn(error)) {
    const fallback = await supabase
      .from(TABLE_NAME)
      .upsert({ ...toDbCase(caseData), user_id: userId }, { onConflict: 'id' });
    return { error: fallback.error, skipped: false };
  }

  return { error, skipped: false };
};

export const replaceSupabaseCases = async (cases) => {
  if (!canUseSupabaseCases()) return { error: null, skipped: true };

  const { organizationId, user } = await ensureDefaultOrganization();
  const userId = user?.id || await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const deleteQuery = supabase.from(TABLE_NAME).delete();
  const { error: deleteError } = organizationId
    ? await deleteQuery.eq('organization_id', organizationId)
    : await deleteQuery.eq('user_id', userId);

  if (deleteError && organizationId && isMissingOrganizationColumn(deleteError)) {
    const fallbackDelete = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', userId);

    if (fallbackDelete.error) return { error: fallbackDelete.error, skipped: false };

    const fallbackInsert = await supabase
      .from(TABLE_NAME)
      .insert(cases.map((caseData) => ({ ...toDbCase(caseData), user_id: userId })));

    return { error: fallbackInsert.error, skipped: false };
  }

  if (deleteError) return { error: deleteError, skipped: false };

  const { error } = await supabase
    .from(TABLE_NAME)
    .insert(cases.map((caseData) => ({
      ...toDbCase(caseData),
      user_id: userId,
      organization_id: organizationId,
      created_by: userId,
    })));

  return { error, skipped: false };
};

export const deleteSupabaseCase = async (caseId) => {
  if (!canUseSupabaseCases()) return { error: null, skipped: true };

  const { organizationId, user } = await ensureDefaultOrganization();
  const userId = user?.id || await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const deleteQuery = supabase.from(TABLE_NAME).delete().eq('id', caseId);
  const { error } = organizationId
    ? await deleteQuery.eq('organization_id', organizationId)
    : await deleteQuery.eq('user_id', userId);

  if (error && organizationId && isMissingOrganizationColumn(error)) {
    const fallbackDelete = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', caseId)
      .eq('user_id', userId);

    return { error: fallbackDelete.error, skipped: false };
  }

  return { error, skipped: false };
};
