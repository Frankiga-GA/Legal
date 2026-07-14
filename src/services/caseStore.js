import { fetchSupabaseCases, upsertSupabaseCase, insertSupabaseCase, deleteSupabaseCase } from './supabaseCaseStore';
import { clearCaseChats } from './chatHistoryStore';

const normalizeCase = (caseData) => ({
  ...caseData,
  latestProgress: caseData.latestProgress || 'Sin avance registrado.',
  hearingLink: caseData.hearingLink || '',
  counterparty: caseData.counterparty || '',
  urgency: caseData.urgency || 'Media',
  documents: Array.isArray(caseData.documents) ? caseData.documents : [],
  notes: Array.isArray(caseData.notes) ? caseData.notes : [],
  importantDates: Array.isArray(caseData.importantDates) ? caseData.importantDates : [],
  officialReferences: Array.isArray(caseData.officialReferences) ? caseData.officialReferences : [],
});

export const getCases = () => [];

export const loadCases = async () => {
  try {
    const { cases, error, skipped } = await fetchSupabaseCases();
    if (skipped || error) return { cases: [], source: 'supabase', error };
    return { cases: cases.map(normalizeCase), source: 'supabase', error: null };
  } catch (error) {
    return { cases: [], source: 'supabase', error };
  }
};

export const addCaseAsync = async (cases, newCase) => {
  const normalizedCase = normalizeCase(newCase);
  const { data: insertedCase, error } = await insertSupabaseCase(normalizedCase);
  
  if (error || !insertedCase) return { cases, error };
  
  return { cases: [insertedCase, ...cases], error: null };
};

export const updateCaseAsync = async (cases, caseId, changes) => {
  const nextCases = cases.map((caseItem) => (
    caseItem.id === caseId
      ? normalizeCase({ ...caseItem, ...changes, lastUpdate: new Date().toISOString().split('T')[0] })
      : caseItem
  ));
  const updatedCase = nextCases.find((c) => c.id === caseId);
  if (!updatedCase) return { cases: nextCases, updatedCase: null, error: null };
  const { error } = await upsertSupabaseCase(updatedCase);
  return { cases: nextCases, updatedCase, error };
};

export const deleteCaseAsync = async (cases, caseId) => {
  const { error } = await deleteSupabaseCase(caseId);
  if (!error) {
    clearCaseChats(caseId).catch(() => {});
    return { cases: cases.filter((c) => c.id !== caseId), error: null };
  }
  return { cases, error };
};
