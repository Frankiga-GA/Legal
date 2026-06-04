import { createClient } from '@supabase/supabase-js';

const PLACEHOLDER_PREFIXES = ['__REPLACE_', '__LEAVE_EMPTY_'];

const isPlaceholder = (value) =>
  typeof value !== 'string' ||
  value.trim() === '' ||
  PLACEHOLDER_PREFIXES.some((prefix) => value.trim().startsWith(prefix));

const isValidHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const placeholderDetected = isPlaceholder(supabaseUrl) || isPlaceholder(supabasePublishableKey);
const urlIsValid = isValidHttpUrl(supabaseUrl);
const keyLooksReal = typeof supabasePublishableKey === 'string' && supabasePublishableKey.length >= 20;

let supabase = null;

if (placeholderDetected) {
  console.info(
    '[supabase] VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY tienen un placeholder. ' +
    'La app arranca en modo local (localStorage). Rellenar .env para habilitar Supabase.'
  );
} else if (!urlIsValid || !keyLooksReal) {
  console.warn(
    '[supabase] Configuracion invalida (URL no es http(s) o clave demasiado corta). ' +
    'La app arranca en modo local. Revisa .env.'
  );
} else {
  try {
    supabase = createClient(supabaseUrl, supabasePublishableKey);
  } catch (error) {
    console.error('[supabase] No se pudo crear el cliente. Modo local activado.', error);
    supabase = null;
  }
}

export const isSupabaseConfigured = Boolean(supabase);

export const getSupabaseSession = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session || null;
};

export { supabase };
