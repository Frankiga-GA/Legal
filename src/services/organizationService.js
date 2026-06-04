// =============================================================================
// src/services/organizationService.js
// =============================================================================
// Stub post-simplificacion (v3.0): sin organizaciones. Solo expone
// `ensureDefaultOrganization` como no-op para mantener compatibilidad
// con supabaseCaseStore.js (que ahora filtra por user_id directamente).
// =============================================================================

import { supabase, isSupabaseConfigured } from '../utils/supabase';

const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('No se pudo obtener el usuario actual.', error);
    return null;
  }
  return data.user || null;
};

// Antes creaba una org por defecto; ahora es un no-op que devuelve el user.
// Mantiene la firma para que supabaseCaseStore.js no rompa.
export const ensureDefaultOrganization = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { organizationId: null, user: null, skipped: true };
  }
  const user = await getCurrentUser();
  if (!user) {
    return { organizationId: null, user: null, skipped: true };
  }
  return { organizationId: null, user, skipped: false };
};

export const getCurrentOrganization = async () => null;

// Miembros: ya no aplica. Devolvemos listas vacias para no romper imports
// accidentales desde componentes legacy.
export async function listMembers(_organizationId) {
  return [];
}

export async function changeMemberRole() {
  throw new Error('Organizaciones deshabilitadas en esta version.');
}

export async function removeMember() {
  throw new Error('Organizaciones deshabilitadas en esta version.');
}

export async function transferOwnership() {
  throw new Error('Organizaciones deshabilitadas en esta version.');
}

export const hasOrgPermission = () => true;
