// =============================================================================
// src/services/aiBridge.js
// =============================================================================
// Puente entre secciones de la app usando sessionStorage.
//
// Caso de uso: el usuario configura un asistente o guarda un prompt en
// `ManagerBot` y luego quiere usarlo en el chat de un expediente. La
// navegacion se hace por App.jsx y CaseWorkspace, asi que necesitamos un
// mecanismo "fire and forget" para pasarles el contexto sin prop drilling.
//
// Por que sessionStorage y no React context: estos valores son "para el
// siguiente chat", no para toda la app. sessionStorage vive solo durante
// la sesion del navegador y se limpia solo al cerrar la pestana.
// =============================================================================

const PENDING_INPUT_KEY = 'lusti-pending-ai-input';
const ACTIVE_ASSISTANT_KEY = 'lusti-active-assistant';

const safeGet = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    /* sessionStorage puede estar deshabilitado en algunos navegadores */
  }
};

// =============================================================================
// Prompt pendiente (texto a pre-rellenar en el input del chat)
// =============================================================================

export const setPendingAiInput = (text) => safeSet(PENDING_INPUT_KEY, text);
export const consumePendingAiInput = () => {
  const value = safeGet(PENDING_INPUT_KEY);
  safeSet(PENDING_INPUT_KEY, null);
  return value;
};

// =============================================================================
// Asistente activo (system prompt a aplicar en el chat)
// =============================================================================

export const setActiveAssistant = (assistant) => {
  if (!assistant) {
    safeSet(ACTIVE_ASSISTANT_KEY, null);
    return;
  }
  safeSet(ACTIVE_ASSISTANT_KEY, JSON.stringify(assistant));
};

export const getActiveAssistant = () => {
  const raw = safeGet(ACTIVE_ASSISTANT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearActiveAssistant = () => safeSet(ACTIVE_ASSISTANT_KEY, null);
