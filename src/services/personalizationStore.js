// =============================================================================
// src/services/personalizationStore.js
// =============================================================================
// Asistentes personalizados y prompts guardados, persistidos en Supabase.
// Cada usuario solo ve sus propios registros (RLS en el server).
// =============================================================================

import { isSupabaseConfigured, supabase } from '../utils/supabase';
import { getCurrentSession } from './authService';

const ASSISTANTS_TABLE = 'personal_assistants';
const PROMPTS_TABLE = 'personal_prompts';

const PROMPT_CATEGORIES = [
  'Analisis',
  'Redaccion',
  'Resumen',
  'Calculo',
  'Consulta general',
];

const resolveUserId = async () => {
  try {
    const session = await getCurrentSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
};

const ensureAuth = async () => {
  const userId = await resolveUserId();
  if (!isSupabaseConfigured || !supabase || !userId) {
    throw new Error('Necesitas iniciar sesion para gestionar asistentes o prompts.');
  }
  return userId;
};

const fromAssistantRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  systemPrompt: row.system_prompt || '',
  specialty: row.specialty || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fromPromptRow = (row) => ({
  id: row.id,
  name: row.name,
  content: row.content || '',
  category: row.category || 'Consulta general',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// =============================================================================
// Asistentes personalizados
// =============================================================================

export const listAssistants = async () => {
  const userId = await resolveUserId();
  if (!isSupabaseConfigured || !supabase || !userId) return [];

  const { data, error } = await supabase
    .from(ASSISTANTS_TABLE)
    .select('id, name, description, system_prompt, specialty, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[personalization] No se pudieron cargar los asistentes.', error.message);
    return [];
  }
  return (data || []).map(fromAssistantRow);
};

export const createAssistant = async ({ name, description = '', systemPrompt = '', specialty = '' }) => {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('El asistente necesita un nombre.');
  const userId = await ensureAuth();

  const { data, error } = await supabase
    .from(ASSISTANTS_TABLE)
    .insert({
      user_id: userId,
      name: cleanName,
      description: String(description || '').trim(),
      system_prompt: String(systemPrompt || '').trim(),
      specialty: String(specialty || '').trim(),
    })
    .select('id, name, description, system_prompt, specialty, created_at, updated_at')
    .single();

  if (error) throw new Error(`No se pudo guardar el asistente: ${error.message}`);
  return fromAssistantRow(data);
};

export const updateAssistant = async (id, patch) => {
  const userId = await ensureAuth();
  const update = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = String(patch.name).trim();
  if (patch.description !== undefined) update.description = String(patch.description).trim();
  if (patch.systemPrompt !== undefined) update.system_prompt = String(patch.systemPrompt).trim();
  if (patch.specialty !== undefined) update.specialty = String(patch.specialty).trim();

  const { data, error } = await supabase
    .from(ASSISTANTS_TABLE)
    .update(update)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, name, description, system_prompt, specialty, created_at, updated_at')
    .single();

  if (error) throw new Error(`No se pudo actualizar el asistente: ${error.message}`);
  return fromAssistantRow(data);
};

export const deleteAssistant = async (id) => {
  const userId = await ensureAuth();
  const { error } = await supabase
    .from(ASSISTANTS_TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`No se pudo eliminar el asistente: ${error.message}`);
  return true;
};

// =============================================================================
// Prompts guardados
// =============================================================================

export { PROMPT_CATEGORIES };

export const listSavedPrompts = async () => {
  const userId = await resolveUserId();
  if (!isSupabaseConfigured || !supabase || !userId) return [];

  const { data, error } = await supabase
    .from(PROMPTS_TABLE)
    .select('id, name, content, category, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[personalization] No se pudieron cargar los prompts.', error.message);
    return [];
  }
  return (data || []).map(fromPromptRow);
};

export const createSavedPrompt = async ({ name, content, category = 'Consulta general' }) => {
  const cleanName = String(name || '').trim();
  const cleanContent = String(content || '').trim();
  if (!cleanName) throw new Error('El prompt necesita un nombre.');
  if (!cleanContent) throw new Error('El contenido del prompt no puede estar vacio.');
  const userId = await ensureAuth();

  const safeCategory = PROMPT_CATEGORIES.includes(category) ? category : 'Consulta general';

  const { data, error } = await supabase
    .from(PROMPTS_TABLE)
    .insert({
      user_id: userId,
      name: cleanName,
      content: cleanContent,
      category: safeCategory,
    })
    .select('id, name, content, category, created_at, updated_at')
    .single();

  if (error) throw new Error(`No se pudo guardar el prompt: ${error.message}`);
  return fromPromptRow(data);
};

export const updateSavedPrompt = async (id, patch) => {
  const userId = await ensureAuth();
  const update = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = String(patch.name).trim();
  if (patch.content !== undefined) update.content = String(patch.content).trim();
  if (patch.category !== undefined) {
    update.category = PROMPT_CATEGORIES.includes(patch.category) ? patch.category : 'Consulta general';
  }

  const { data, error } = await supabase
    .from(PROMPTS_TABLE)
    .update(update)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, name, content, category, created_at, updated_at')
    .single();

  if (error) throw new Error(`No se pudo actualizar el prompt: ${error.message}`);
  return fromPromptRow(data);
};

export const deleteSavedPrompt = async (id) => {
  const userId = await ensureAuth();
  const { error } = await supabase
    .from(PROMPTS_TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`No se pudo eliminar el prompt: ${error.message}`);
  return true;
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
