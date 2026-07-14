import { isSupabaseConfigured, supabase } from '../utils/supabase';

const STORAGE_KEY = 'lusti-saved-official-registry';
const TABLE_NAME = 'saved_registry_items';

const normalizeRegistryItem = (item) => ({
  id: item.id,
  title: item.title,
  date: item.date,
  type: item.type,
  source: item.source,
  entity: item.entity,
  summary: item.summary,
  impact: item.impact,
  url: item.url,
  category: item.category,
  urgency: item.urgency,
  scrapedAt: item.scrapedAt,
  official: Boolean(item.official),
  savedAt: item.savedAt || new Date().toISOString(),
});

const getCurrentUserId = async () => {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.user.id;
};

const toAppItem = (row) => ({
  id: row.registry_id,
  title: row.title,
  date: row.registry_date,
  type: row.registry_type,
  source: row.source,
  entity: row.entity,
  summary: row.summary,
  impact: row.impact,
  url: row.url,
  category: row.category,
  urgency: row.urgency,
  scrapedAt: row.scraped_at,
  official: row.official,
  savedAt: row.saved_at,
});

const toDbItem = (item, userId) => {
  const normalized = normalizeRegistryItem(item);

  return {
    user_id: userId,
    registry_id: normalized.id,
    title: normalized.title,
    registry_date: normalized.date,
    registry_type: normalized.type,
    source: normalized.source,
    entity: normalized.entity,
    summary: normalized.summary,
    impact: normalized.impact,
    url: normalized.url,
    category: normalized.category,
    urgency: normalized.urgency,
    scraped_at: normalized.scrapedAt,
    official: normalized.official,
    saved_at: normalized.savedAt,
    updated_at: new Date().toISOString(),
  };
};

export const getLocalSavedRegistryItems = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeRegistryItem) : [];
  } catch {
    return [];
  }
};

export const saveLocalSavedRegistryItems = (items) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(normalizeRegistryItem)));
};

export const loadSavedRegistryItems = async () => {
  const localItems = getLocalSavedRegistryItems();

  if (!isSupabaseConfigured || !supabase) {
    return { items: localItems, source: 'local', error: null };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) return { items: localItems, source: 'local', error: null };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) return { items: localItems, source: 'local', error };

    if (data.length === 0 && localItems.length > 0) {
      const { error: seedError } = await supabase
        .from(TABLE_NAME)
        .upsert(localItems.map((item) => toDbItem(item, userId)), { onConflict: 'user_id,registry_id' });

      return { items: localItems, source: seedError ? 'local' : 'supabase-seeded', error: seedError };
    }

    const items = data.map(toAppItem);
    saveLocalSavedRegistryItems(items);
    return { items, source: 'supabase', error: null };
  } catch (error) {
    return { items: localItems, source: 'local', error };
  }
};

export const saveRegistryItem = async (currentItems, item) => {
  const normalizedItem = normalizeRegistryItem(item);
  const exists = currentItems.some((saved) => saved.id === normalizedItem.id);
  const nextItems = exists ? currentItems : [normalizedItem, ...currentItems];

  saveLocalSavedRegistryItems(nextItems);

  if (!isSupabaseConfigured || !supabase) {
    return { items: nextItems, saved: !exists, source: 'local', error: null };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) return { items: nextItems, saved: !exists, source: 'local', error: null };

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(toDbItem(normalizedItem, userId), { onConflict: 'user_id,registry_id' });

    return { items: nextItems, saved: !exists, source: error ? 'local' : 'supabase', error };
  } catch (error) {
    return { items: nextItems, saved: !exists, source: 'local', error };
  }
};
