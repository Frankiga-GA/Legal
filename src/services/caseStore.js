import { mockCases } from '../data/mockData';
import { demoDocumentsByCaseId } from '../data/demoDocuments';
import { fetchSupabaseCases, replaceSupabaseCases, upsertSupabaseCase } from './supabaseCaseStore';

const STORAGE_KEY = 'lusti-cases';

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
  documents: mergeDemoDocuments(caseData),
  notes: Array.isArray(caseData.notes) ? caseData.notes : [],
  importantDates: Array.isArray(caseData.importantDates) ? caseData.importantDates : [],
  officialReferences: Array.isArray(caseData.officialReferences) ? caseData.officialReferences : [],
});

export const getCases = () => {
  try {
    const storedCases = window.localStorage.getItem(STORAGE_KEY);

    if (!storedCases) {
      const initialCases = cloneCases(mockCases).map(normalizeCase);
      saveCases(initialCases);
      return initialCases;
    }

    const parsedCases = JSON.parse(storedCases);
    return Array.isArray(parsedCases) ? parsedCases.map(normalizeCase) : [];
  } catch (error) {
    console.warn('No se pudieron cargar los expedientes locales.', error);
    return cloneCases(mockCases).map(normalizeCase);
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

    saveCases(cases);
    return { cases, source: 'supabase', error: null };
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
  const initialCases = cloneCases(mockCases).map(normalizeCase);
  saveCases(initialCases);
  return initialCases;
};

export const resetCasesAsync = async () => {
  const initialCases = resetCases();
  const { error } = await replaceSupabaseCases(initialCases);
  if (error) console.warn('No se pudo restaurar la demo en Supabase.', error.message);
  return { cases: initialCases, error };
};
