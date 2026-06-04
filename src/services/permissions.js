// =============================================================================
// src/services/permissions.js
// =============================================================================
// Stub post-simplificacion (v3.0): sin organizaciones ni roles. Cada usuario
// es dueno pleno de su data. Los componentes que aun importan roleLabel,
// hasMinimumRole, etc. siguen funcionando con valores neutros.
// =============================================================================

import { supabase, isSupabaseConfigured } from '../utils/supabase';

export const ROLES = Object.freeze({
  VIEWER: 'viewer',
  PARALEGAL: 'paralegal',
  LAWYER: 'lawyer',
  ADMIN: 'admin',
  OWNER: 'owner',
});

const ROLE_RANK = {
  [ROLES.VIEWER]: 1,
  [ROLES.PARALEGAL]: 2,
  [ROLES.LAWYER]: 3,
  [ROLES.ADMIN]: 4,
  [ROLES.OWNER]: 5,
};

export function rankOf(role) {
  return ROLE_RANK[role] ?? 0;
}

export function hasMinimumRole(actualRole, minRole) {
  return rankOf(actualRole) >= rankOf(minRole);
}

export function isValidRole(role) {
  return Object.prototype.hasOwnProperty.call(ROLE_RANK, role);
}

export function roleLabel(role) {
  if (role === ROLES.OWNER) return 'Propietario';
  if (role === ROLES.ADMIN) return 'Administrador';
  if (role === ROLES.LAWYER) return 'Abogado';
  if (role === ROLES.PARALEGAL) return 'Asistente legal';
  if (role === ROLES.VIEWER) return 'Visualizador';
  return role || '';
}

export function roleDescription() {
  return 'Acceso completo a tus expedientes y documentos.';
}

export const ROLE_OPTIONS = Object.values(ROLES).map((value) => ({
  value,
  label: roleLabel(value),
  description: roleDescription(),
}));

export const CAPABILITIES = Object.freeze({
  CASE_READ: 'case:read',
  CASE_CREATE: 'case:create',
  CASE_UPDATE: 'case:update',
  CASE_DELETE: 'case:delete',
  ASSISTANT_WRITE: 'assistant:write',
  TEMPLATE_WRITE: 'template:write',
  MEMBER_INVITE: 'member:invite',
  MEMBER_UPDATE_ROLE: 'member:update_role',
  MEMBER_REMOVE: 'member:remove',
  ORG_SETTINGS: 'org:settings',
  AUDIT_READ: 'audit:read',
});

// En modo single-user todo esta permitido.
export function canDo(_capability, _role) {
  return true;
}

// Devuelve siempre 'owner' si hay usuario autenticado; util para no romper
// componentes que esperan { role, isSuperAdmin }.
export async function getMyRole(_organizationId, _options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { role: null, isSuperAdmin: false, source: 'no-supabase' };
  }
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return { role: null, isSuperAdmin: false, source: 'no-user' };
    }
    return { role: ROLES.OWNER, isSuperAdmin: false, source: 'single-user' };
  } catch (error) {
    console.warn('[permissions] No se pudo obtener el usuario actual.', error);
    return { role: null, isSuperAdmin: false, source: 'error' };
  }
}

export function invalidateRoleCache() {
  // No-op: no hay cache de roles en modo single-user.
}

export function useCan(capability, role) {
  return canDo(capability, role);
}
