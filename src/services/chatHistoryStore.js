// src/services/chatHistoryStore.js
// Persistencia del historial de chat por expediente en Supabase.
import { isSupabaseConfigured, supabase } from '../utils/supabase';

const TABLE_NAME = 'case_chats';

const getCurrentUserId = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
};

export const canUseChatHistory = () => isSupabaseConfigured && Boolean(supabase);

export const loadCaseChats = async (caseId) => {
  if (!canUseChatHistory() || !caseId) return { messages: [], error: null, skipped: true };
  const userId = await getCurrentUserId();
  if (!userId) return { messages: [], error: null, skipped: true };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, role, content, created_at')
    .eq('case_id', caseId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) return { messages: [], error, skipped: false };
  return {
    messages: (data || []).map((row) => ({ role: row.role, content: row.content })),
    error: null,
    skipped: false,
  };
};

export const saveCaseChat = async (caseId, role, content) => {
  if (!canUseChatHistory() || !caseId || !content) {
    return { error: null, skipped: true };
  }
  const userId = await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const { error } = await supabase
    .from(TABLE_NAME)
    .insert({ case_id: caseId, user_id: userId, role, content });

  return { error, skipped: false };
};

export const clearCaseChats = async (caseId) => {
  if (!canUseChatHistory() || !caseId) return { error: null, skipped: true };
  const userId = await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('case_id', caseId)
    .eq('user_id', userId);

  return { error, skipped: false };
};

// =============================================================================
// Chat IA global (standalone, no atado a un expediente)
// =============================================================================
// El historial se particiona por (user_id, assistant_id). assistant_id == null
// representa el chat libre sin asistente.
// =============================================================================

const GLOBAL_TABLE = 'global_chats';

const normalizeAssistantId = (id) => (id == null || id === '' ? null : String(id));

export const loadGlobalChats = async (assistantId = null) => {
  if (!canUseChatHistory()) return { messages: [], error: null, skipped: true };
  const userId = await getCurrentUserId();
  if (!userId) return { messages: [], error: null, skipped: true };

  const normalized = normalizeAssistantId(assistantId);
  let query = supabase
    .from(GLOBAL_TABLE)
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  query = normalized === null
    ? query.is('assistant_id', null)
    : query.eq('assistant_id', normalized);

  const { data, error } = await query;
  if (error) return { messages: [], error, skipped: false };
  return {
    messages: (data || []).map((row) => ({ role: row.role, content: row.content })),
    error: null,
    skipped: false,
  };
};

export const saveGlobalChat = async (assistantId, role, content) => {
  if (!canUseChatHistory() || !content) {
    return { error: null, skipped: true };
  }
  const userId = await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const { error } = await supabase
    .from(GLOBAL_TABLE)
    .insert({
      user_id: userId,
      assistant_id: normalizeAssistantId(assistantId),
      role,
      content,
    });

  return { error, skipped: false };
};

export const clearGlobalChats = async (assistantId = null) => {
  if (!canUseChatHistory()) return { error: null, skipped: true };
  const userId = await getCurrentUserId();
  if (!userId) return { error: null, skipped: true };

  const normalized = normalizeAssistantId(assistantId);
  let query = supabase
    .from(GLOBAL_TABLE)
    .delete()
    .eq('user_id', userId);
  query = normalized === null
    ? query.is('assistant_id', null)
    : query.eq('assistant_id', normalized);

  const { error } = await query;
  return { error, skipped: false };
};
