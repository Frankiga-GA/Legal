import { mockCases } from '../data/mockData';
import { demoDocumentsByCaseId } from '../data/demoDocuments';
import { fetchSupabaseCases, replaceSupabaseCases, upsertSupabaseCase, deleteSupabaseCase } from './supabaseCaseStore';

const STORAGE_KEY = 'lusti-cases';
const DEMO_CASE_IDS = new Set(mockCases.map((caseItem) => caseItem.id));

const cloneCases = (cases) => JSON.parse(JSON.stringify(cases));

const mergeDemoDocuments = (caseData) => {
  const documents = Array.isArray(caseData.documents) ? caseData.documents : [];
  const demoDocuments = demoDocumentsByCaseId[caseData.id] || [];
  const existingKeys = new Set(documents.map((doc) => doc.id || doc.name));
  const missingDemoDocuments = demoDocuments.filter((doc) => !existingKeys.has(doc.id) && !existingKeys.has(doc.name));

  return [...documents, ...missingDemoDocuments];
};

const normalizeCase = (caseData) => ({
  ...caseData,
  latestProgress: caseData.latestProgress || 'Sin avance registrado.',
  hearingLink: caseData.hearingLink || '',
  urgency: caseData.urgency || 'Media',
  documents: mergeDemoDocuments(caseData),
  notes: Array.isArray(caseData.notes) ? caseData.notes : [],
  importantDates: Array.isArray(caseData.importantDates) ? caseData.importantDates : [],
  officialReferences: Array.isArray(caseData.officialReferences) ? caseData.officialReferences : [],
});

const getDemoCases = () => cloneCases(mockCases).map(normalizeCase);

const isOldDemoState = (cases) => {
  if (!Array.isArray(cases) || cases.length === 0) return true;
  if (cases.length > 3) return false;
  return cases.every((caseItem) => DEMO_CASE_IDS.has(caseItem.id));
};

const upgradeLocalDemo = (cases) => {
  if (isOldDemoState(cases)) {
    const demoCases = getDemoCases();
    saveCases(demoCases);
    return demoCases;
  }

  const normalizedCases = cases.map(normalizeCase);
  const existingIds = new Set(normalizedCases.map((caseItem) => caseItem.id));
  const missingDemoCases = getDemoCases().filter((caseItem) => !existingIds.has(caseItem.id));

  if (!missingDemoCases.length) return normalizedCases;

  const nextCases = [...normalizedCases, ...missingDemoCases];
  saveCases(nextCases);
  return nextCases;
};

export const getCases = () => {
  try {
    const storedCases = window.localStorage.getItem(STORAGE_KEY);

    if (!storedCases) {
      const initialCases = getDemoCases();
      saveCases(initialCases);
      return initialCases;
    }

    const parsedCases = JSON.parse(storedCases);
    return Array.isArray(parsedCases) ? upgradeLocalDemo(parsedCases) : getDemoCases();
  } catch (error) {
    console.warn('No se pudieron cargar los expedientes locales.', error);
    return getDemoCases();
  }
};

export const loadCases = async () => {
  const localCases = getCases();

  try {
    const { cases, error, skipped } = await fetchSupabaseCases();

    if (skipped || error) {
      if (error) console.warn('No se pudieron cargar expedientes desde Supabase.', error.message);
      return { cases: localCases, source: 'local', error };
    }

    if (cases.length === 0 && localCases.length > 0) {
      await replaceSupabaseCases(localCases);
      return { cases: localCases, source: 'supabase-seeded', error: null };
    }

    const normalizedCases = cases.map(normalizeCase);
    if (isOldDemoState(normalizedCases)) {
      const demoCases = getDemoCases();
      await replaceSupabaseCases(demoCases);
      saveCases(demoCases);
      return { cases: demoCases, source: 'supabase-seeded', error: null };
    }

    saveCases(normalizedCases);
    return { cases: normalizedCases, source: 'supabase', error: null };
  } catch (error) {
    console.warn('Supabase no esta disponible. Usando almacenamiento local.', error);
    return { cases: localCases, source: 'local', error };
  }
};

export const saveCases = (cases) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases.map(normalizeCase)));
};

export const addCase = (cases, newCase) => {
  const nextCases = [normalizeCase(newCase), ...cases];
  saveCases(nextCases);
  return nextCases;
};

export const addCaseAsync = async (cases, newCase) => {
  const normalizedCase = normalizeCase(newCase);
  const nextCases = [normalizedCase, ...cases];
  saveCases(nextCases);
  const { error } = await upsertSupabaseCase(normalizedCase);
  if (error) console.warn('No se pudo guardar el expediente en Supabase.', error.message);
  return { cases: nextCases, error };
};

export const updateCase = (cases, caseId, changes) => {
  const nextCases = cases.map((caseItem) => (
    caseItem.id === caseId
      ? normalizeCase({ ...caseItem, ...changes, lastUpdate: new Date().toISOString().split('T')[0] })
      : caseItem
  ));

  saveCases(nextCases);
  return nextCases;
};

export const updateCaseAsync = async (cases, caseId, changes) => {
  const nextCases = updateCase(cases, caseId, changes);
  const updatedCase = nextCases.find((caseItem) => caseItem.id === caseId);

  if (updatedCase) {
    const { error } = await upsertSupabaseCase(updatedCase);
    if (error) console.warn('No se pudo actualizar el expediente en Supabase.', error.message);
    return { cases: nextCases, updatedCase, error };
  }

  return { cases: nextCases, updatedCase: null, error: null };
};

export const resetCases = () => {
  const initialCases = getDemoCases();
  saveCases(initialCases);
  return initialCases;
};

export const resetCasesAsync = async () => {
  const initialCases = resetCases();
  const { error } = await replaceSupabaseCases(initialCases);
  if (error) console.warn('No se pudo restaurar la demo en Supabase.', error.message);
  return { cases: initialCases, error };
};

export const deleteCase = (cases, caseId) => {
  const nextCases = cases.filter((caseItem) => caseItem.id !== caseId);
  saveCases(nextCases);
  return nextCases;
};

export const deleteCaseAsync = async (cases, caseId) => {
  const nextCases = deleteCase(cases, caseId);
  const { error } = await deleteSupabaseCase(caseId);
  if (error) console.warn('No se pudo eliminar el expediente de Supabase.', error.message);
  return { cases: nextCases, error };
};
