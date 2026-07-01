import { fetchSupabaseCases, upsertSupabaseCase, deleteSupabaseCase } from './supabaseCaseStore';
import { clearCaseChats } from './chatHistoryStore';

const generateCaseId = (cases) => {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;
  const maxNum = (Array.isArray(cases) ? cases : []).reduce((max, caseItem) => {
    const match = /^EXP-\d{4}-(\d+)$/.exec(caseItem?.id || '');
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
};

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
  const withId = newCase.id ? newCase : { ...newCase, id: generateCaseId(cases) };
  const normalizedCase = normalizeCase(withId);
  const { error } = await upsertSupabaseCase(normalizedCase);
  if (error) return { cases, error };
  return { cases: [normalizedCase, ...cases], error: null };
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
