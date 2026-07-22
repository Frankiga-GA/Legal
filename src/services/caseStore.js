import { fetchSupabaseCases, updateSupabaseCase, insertSupabaseCase, deleteSupabaseCase } from './supabaseCaseStore';
import { clearCaseChats } from './chatHistoryStore';
import { getOrCreateCaseFolder, isGoogleDriveConfigured, getStoredDriveToken } from './googleDriveService';

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
  
  if (isGoogleDriveConfigured && getStoredDriveToken()) {
    getOrCreateCaseFolder(insertedCase.clientName).catch(err => {
      console.warn("Fallo al crear carpeta en Drive durante creación de expediente", err);
    });
  }
  
  return { cases: [insertedCase, ...cases], error: null };
};

export const updateCaseAsync = async (cases, caseId, changes) => {
  const nextCases = cases.map((caseItem) => (
    caseItem.id === caseId
      ? normalizeCase({ ...caseItem, ...changes, lastUpdate: new Date().toISOString().split('T')[0] })
      : caseItem
  ));
  const newId = changes.id || caseId;
  const updatedCase = nextCases.find((c) => c.id === newId);
  if (!updatedCase) return { cases: nextCases, updatedCase: null, error: null };
  
  // Actualizamos la fila directamente en Supabase mediante el ID antiguo (caseId)
  const { error } = await updateSupabaseCase(caseId, updatedCase);
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
