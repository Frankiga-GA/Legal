import { isSupabaseConfigured, supabase } from '../utils/supabase';

const DEFAULT_ORG_NAME = 'Mi estudio legal';

const getCurrentUser = async () => {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user || null;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildDefaultSlug = (user) => {
  const emailPrefix = user.email?.split('@')[0] || 'estudio';
  return `${slugify(emailPrefix) || 'estudio'}-${String(user.id).slice(0, 8)}`;
};

export const ensureDefaultOrganization = async () => {
  if (!isSupabaseConfigured || !supabase) return { organizationId: null, user: null, skipped: true };

  const user = await getCurrentUser();
  if (!user) return { organizationId: null, user: null, skipped: true };

  const { data: rpcOrganizationId, error: rpcError } = await supabase.rpc('ensure_default_organization');
  if (!rpcError && rpcOrganizationId) {
    return { organizationId: rpcOrganizationId, user, skipped: false };
  }

  if (rpcError && !isMissingRpcError(rpcError)) {
    console.warn('No se pudo asegurar la organizacion por RPC. Se intentara el flujo directo.', rpcError);
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1);

  if (!membershipError && memberships?.[0]?.organization_id) {
    return { organizationId: memberships[0].organization_id, user, skipped: false };
  }

  const { data: ownedOrganization, error: ownedError } = await supabase
    .from('organizations')
    .select('id')
    .eq('created_by', user.id)
    .limit(1)
    .maybeSingle();

  if (!ownedError && ownedOrganization?.id) {
    await ensureMembership(ownedOrganization.id, user.id);
    return { organizationId: ownedOrganization.id, user, skipped: false };
  }

  const { data: organization, error: createError } = await supabase
    .from('organizations')
    .insert({
      name: DEFAULT_ORG_NAME,
      slug: buildDefaultSlug(user),
      created_by: user.id,
      plan: 'starter',
    })
    .select('id')
    .single();

  if (createError) {
    console.warn('No se pudo crear la organizacion por defecto. Se continuara en modo local.', createError);
    return { organizationId: null, user, skipped: true, error: createError };
  }

  await ensureMembership(organization.id, user.id);
  return { organizationId: organization.id, user, skipped: false };
};

const isMissingRpcError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return message.includes('could not find the function') || message.includes('schema cache');
};

const ensureMembership = async (organizationId, userId) => {
  const { error } = await supabase
    .from('organization_members')
    .upsert(
      {
        organization_id: organizationId,
        user_id: userId,
        role: 'owner',
      },
      { onConflict: 'organization_id,user_id' }
    );

  if (error) {
    console.warn('No se pudo asegurar la membresia de la organizacion.', error);
  }
};
