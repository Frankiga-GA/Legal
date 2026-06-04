// src/services/userPreferencesStore.js
// Preferencias por usuario. Persistidas en localStorage con namespace
// por user_id para que cada cuenta tenga sus propios ajustes.
const STORAGE_PREFIX = 'lusti-prefs';

const defaultsFor = (userId) => ({
  firm: {
    firmName: '',
    lawyerName: '',
    calNumber: '',
    address: '',
    phone: '',
    contactEmail: '',
    city: '',
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
  meta: {
    updatedAt: null,
  },
});

const storageKey = (userId, area) => `${STORAGE_PREFIX}-${area}-${userId || 'anon'}`;

const readArea = (userId, area) => {
  try {
    const raw = window.localStorage.getItem(storageKey(userId, area));
    if (!raw) return defaultsFor(userId)[area];
    const parsed = JSON.parse(raw);
    return { ...defaultsFor(userId)[area], ...parsed };
  } catch {
    return defaultsFor(userId)[area];
  }
};

const writeArea = (userId, area, value) => {
  try {
    const payload = { ...value, meta: { updatedAt: new Date().toISOString() } };
    window.localStorage.setItem(storageKey(userId, area), JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
};

export const loadAllPreferences = (userId) => {
  const base = defaultsFor(userId);
  return {
    firm: readArea(userId, 'firm') || base.firm,
    ai: readArea(userId, 'ai') || base.ai,
    notifications: readArea(userId, 'notifications') || base.notifications,
  };
};

export const saveFirmProfile = (userId, profile) => writeArea(userId, 'firm', profile);
export const saveAiPreferences = (userId, prefs) => writeArea(userId, 'ai', prefs);
export const saveNotificationPreferences = (userId, prefs) => writeArea(userId, 'notifications', prefs);
