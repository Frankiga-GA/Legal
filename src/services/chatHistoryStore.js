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
