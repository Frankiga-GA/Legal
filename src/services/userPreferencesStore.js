// src/services/userPreferencesStore.js
import { supabase } from '../utils/supabase';

const defaultsFor = () => ({
  firm: {
    firmName: '',
    lawyerName: '',
    calNumber: '',
    address: '',
    phone: '',
    contactEmail: '',
    city: '',
    headerBase64: null,
    footerBase64: null,
  },
  ai: {
    tone: 'profesional',
    defaultUrgency: 'Media',
    autoIndexDocuments: true,
    autoAnalyzeNewNorms: true,
    saveChatHistory: true,
  },
  notifications: {
    browserNotifications: false,
    normAlerts: true,
    deadlineAlerts: true,
  },
});

export const loadAllPreferencesAsync = async (userId) => {
  if (!userId) return defaultsFor();

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading preferences from Supabase:', error);
      return defaultsFor();
    }

    if (!data) {
      // Si el usuario no tiene preferencias en la base de datos (ej. cuenta nueva), 
      // insertamos la fila por defecto automáticamente para inicializar su cuenta.
      const defaults = defaultsFor();
      await supabase.from('user_preferences').insert({
        user_id: userId,
        firm: defaults.firm,
        ai: defaults.ai,
        notifications: defaults.notifications,
      });
      return defaults;
    }

    const base = defaultsFor();
    return {
      firm: { ...base.firm, ...(data.firm || {}) },
      ai: { ...base.ai, ...(data.ai || {}) },
      notifications: { ...base.notifications, ...(data.notifications || {}) },
    };
  } catch (err) {
    console.error('Error in loadAllPreferencesAsync:', err);
    return defaultsFor();
  }
};

const writeAreaAsync = async (userId, area, value) => {
  if (!userId) return false;

  try {
    // Primero traemos las preferencias actuales para no sobreescribir las otras áreas
    const { data: current, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current prefs for update:', fetchError);
      return false;
    }

    const upsertData = {
      user_id: userId,
      firm: current?.firm || {},
      ai: current?.ai || {},
      notifications: current?.notifications || {},
      updated_at: new Date().toISOString()
    };

    // Actualizamos el área específica
    upsertData[area] = value;

    const { error: upsertError } = await supabase
      .from('user_preferences')
      .upsert(upsertData, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error upserting preferences:', upsertError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in writeAreaAsync:', err);
    return false;
  }
};

export const saveFirmProfileAsync = (userId, profile) => writeAreaAsync(userId, 'firm', profile);
export const saveAiPreferencesAsync = (userId, prefs) => writeAreaAsync(userId, 'ai', prefs);
export const saveNotificationPreferencesAsync = (userId, prefs) => writeAreaAsync(userId, 'notifications', prefs);
