import { getCurrentSession } from './authService';

const ASSISTANTS_KEY = (userId) => `lusti-assistants-${userId || 'anonymous'}`;
const PROMPTS_KEY = (userId) => `lusti-saved-prompts-${userId || 'anonymous'}`;

const readJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[personalization] No se pudo guardar en localStorage.', error);
  }
};

const generateId = (prefix) => {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
};

const resolveUserId = async () => {
  try {
    const session = await getCurrentSession();
    return session?.user?.id || 'anonymous';
  } catch {
    return 'anonymous';
  }
};

const sortByCreatedAtDesc = (list) =>
  [...list].sort((a, b) => {
    const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  });

// =============================================================================
// Asistentes personalizados
// =============================================================================

export const listAssistants = async () => {
  const userId = await resolveUserId();
  return sortByCreatedAtDesc(readJson(ASSISTANTS_KEY(userId), []));
};

export const createAssistant = async ({ name, description = '', systemPrompt = '', specialty = '' }) => {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('El asistente necesita un nombre.');
  const userId = await resolveUserId();
  const list = readJson(ASSISTANTS_KEY(userId), []);
  const next = {
    id: generateId('ast'),
    name: cleanName,
    description: String(description || '').trim(),
    systemPrompt: String(systemPrompt || '').trim(),
    specialty: String(specialty || '').trim(),
    createdAt: new Date().toISOString(),
  };
  const updated = [next, ...list];
  writeJson(ASSISTANTS_KEY(userId), updated);
  return next;
};

export const updateAssistant = async (id, patch) => {
  const userId = await resolveUserId();
  const list = readJson(ASSISTANTS_KEY(userId), []);
  const updated = list.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item));
  writeJson(ASSISTANTS_KEY(userId), updated);
  return updated.find((item) => item.id === id) || null;
};

export const deleteAssistant = async (id) => {
  const userId = await resolveUserId();
  const list = readJson(ASSISTANTS_KEY(userId), []);
  const updated = list.filter((item) => item.id !== id);
  writeJson(ASSISTANTS_KEY(userId), updated);
  return updated;
};

// =============================================================================
// Prompts guardados
// =============================================================================

export const PROMPT_CATEGORIES = [
  'Analisis',
  'Redaccion',
  'Resumen',
  'Calculo',
  'Consulta general',
];

export const listSavedPrompts = async () => {
  const userId = await resolveUserId();
  return sortByCreatedAtDesc(readJson(PROMPTS_KEY(userId), []));
};

export const createSavedPrompt = async ({ name, content, category = 'Consulta general' }) => {
  const cleanName = String(name || '').trim();
  const cleanContent = String(content || '').trim();
  if (!cleanName) throw new Error('El prompt necesita un nombre.');
  if (!cleanContent) throw new Error('El contenido del prompt no puede estar vacio.');
  const userId = await resolveUserId();
  const list = readJson(PROMPTS_KEY(userId), []);
  const next = {
    id: generateId('prm'),
    name: cleanName,
    content: cleanContent,
    category: PROMPT_CATEGORIES.includes(category) ? category : 'Consulta general',
    createdAt: new Date().toISOString(),
  };
  const updated = [next, ...list];
  writeJson(PROMPTS_KEY(userId), updated);
  return next;
};

export const updateSavedPrompt = async (id, patch) => {
  const userId = await resolveUserId();
  const list = readJson(PROMPTS_KEY(userId), []);
  const updated = list.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item));
  writeJson(PROMPTS_KEY(userId), updated);
  return updated.find((item) => item.id === id) || null;
};

export const deleteSavedPrompt = async (id) => {
  const userId = await resolveUserId();
  const list = readJson(PROMPTS_KEY(userId), []);
  const updated = list.filter((item) => item.id !== id);
  writeJson(PROMPTS_KEY(userId), updated);
  return updated;
};

export const copyPromptToClipboard = async (id) => {
  const list = await listSavedPrompts();
  const found = list.find((item) => item.id === id);
  if (!found) return false;
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(found.content);
    return true;
  } catch {
    return false;
  }
};
