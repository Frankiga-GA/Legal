import { mockCases } from '../data/mockData';
import { fetchSupabaseCases, replaceSupabaseCases, upsertSupabaseCase, deleteSupabaseCase } from './supabaseCaseStore';

const STORAGE_KEY = 'lusti-cases';
const DELETED_IDS_KEY = 'lusti-deleted-case-ids';

const cloneCases = (cases) => JSON.parse(JSON.stringify(cases));

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

const getDemoCases = () => cloneCases(mockCases).map(normalizeCase);

const upgradeLocalDemo = (cases) => {
  // Solo normalizar y devolver — nunca restaurar casos borrados ni agregar demos
  return cases.map(normalizeCase);
};

export const getCases = () => {
  try {
    const storedCases = window.localStorage.getItem(STORAGE_KEY);

    if (!storedCases) {
      return [];
    }

    const parsedCases = JSON.parse(storedCases);
    return Array.isArray(parsedCases) ? upgradeLocalDemo(parsedCases) : [];
  } catch (error) {
    console.warn('No se pudieron cargar los expedientes locales.', error);
    return [];
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
    // Filtrar expedientes que fueron borrados localmente mientras Supabase no respondia
    const locallyDeleted = (() => {
      try { return JSON.parse(window.localStorage.getItem(DELETED_IDS_KEY) || '[]'); }
      catch { return []; }
    })();
    const filteredCases = normalizedCases.filter((c) => !locallyDeleted.includes(c.id));
    saveCases(filteredCases);
    return { cases: filteredCases, source: 'supabase', error: null };
  } catch (error) {
    console.warn('Supabase no esta disponible. Usando almacenamiento local.', error);
    return { cases: localCases, source: 'local', error };
  }
};

export const saveCases = (cases) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases.map(normalizeCase)));
};

export const addCase = (cases, newCase) => {
  const withId = newCase.id ? newCase : { ...newCase, id: generateCaseId(cases) };
  const nextCases = [normalizeCase(withId), ...cases];
  saveCases(nextCases);
  return nextCases;
};

export const addCaseAsync = async (cases, newCase) => {
  const withId = newCase.id ? newCase : { ...newCase, id: generateCaseId(cases) };
  const normalizedCase = normalizeCase(withId);
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
  // Track localmente que este ID fue borrado, para evitar que Supabase lo rescate
  try {
    const deleted = JSON.parse(window.localStorage.getItem(DELETED_IDS_KEY) || '[]');
    if (!deleted.includes(caseId)) {
      deleted.push(caseId);
      window.localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
    }
  } catch { /* ignore */ }
  return nextCases;
};

export const deleteCaseAsync = async (cases, caseId) => {
  const nextCases = deleteCase(cases, caseId);
  deleteSupabaseCase(caseId).then(({ error }) => {
    if (!error) {
      // Supabase confirmo el borrado, ya no necesario trackearlo
      try {
        const deleted = JSON.parse(window.localStorage.getItem(DELETED_IDS_KEY) || '[]');
        const filtered = deleted.filter((id) => id !== caseId);
        window.localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(filtered));
      } catch { /* ignore */ }
    } else {
      console.warn('No se pudo eliminar el expediente de Supabase.', error.message);
    }
  });
  return { cases: nextCases, error: null };
};
