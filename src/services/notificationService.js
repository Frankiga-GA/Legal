// =============================================================================
// src/services/notificationService.js
// =============================================================================
// Dispara notificaciones del navegador para plazos criticos de los expedientes.
// Usa localStorage para no notificar dos veces el mismo plazo.
// =============================================================================

const NOTIFIED_KEY = (userId) => `lusti-notified-deadlines-${userId || 'anonymous'}`;

const readNotified = (userId) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(NOTIFIED_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeNotified = (userId, list) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NOTIFIED_KEY(userId), JSON.stringify(list));
  } catch {
    /* localStorage lleno: lo ignoramos, las notificaciones volveran a salir */
  }
};

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const fireBrowserNotification = ({ title, body, caseId, deadlineId }) => {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, {
      body,
      tag: `deadline-${deadlineId}`,
      requireInteraction: false,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.warn('[notifications] No se pudo disparar la notificacion.', error);
  }
};

/**
 * Revisa los plazos de todos los expedientes y dispara notificaciones para
 * los que estan a menos de 24h y todavia no fueron notificados.
 *
 * @param {Array} cases - Lista de expedientes (cada uno con importantDates)
 * @param {string} userId - ID del usuario actual
 * @param {object} options
 * @param {boolean} options.deadlineAlerts - Si false, no hace nada
 * @returns {Array} Lista de plazos que se acaban de notificar
 */
export const checkDeadlinesAndNotify = (cases, userId, { deadlineAlerts = true } = {}) => {
  if (!deadlineAlerts) return [];
  if (typeof window === 'undefined') return [];
  if (!('Notification' in window) || Notification.permission !== 'granted') return [];

  const list = Array.isArray(cases) ? cases : [];
  if (!list.length) return [];

  const alreadyNotified = new Set(readNotified(userId));
  const newlyNotified = [];
  const now = Date.now();

  list.forEach((caso) => {
    const dates = Array.isArray(caso.importantDates) ? caso.importantDates : [];
    dates.forEach((date) => {
      // Solo pendientes
      if (date.status && date.status !== 'Pendiente') return;
      const target = parseDate(date.date);
      if (!target) return;

      const diff = target.getTime() - now;
      // Menos de 24h (o ya vencido): notificamos
      if (diff > DAY) return;

      // Generamos un id estable para el plazo (caso + titulo + fecha)
      const deadlineId = `${caso.id}::${date.title || ''}::${date.date}`;
      if (alreadyNotified.has(deadlineId)) return;

      const isOverdue = diff < 0;
      const hours = Math.abs(Math.round(diff / HOUR));
      const timeframe = isOverdue
        ? `Vencio hace ${hours} h`
        : hours <= 1
          ? 'Vence en menos de 1 h'
          : `Vence en ${hours} h`;

      fireBrowserNotification({
        title: isOverdue ? `Plazo vencido: ${caso.clientName || caso.id}` : `Plazo critico: ${caso.clientName || caso.id}`,
        body: `${date.title || 'Plazo'} - ${timeframe}`,
        caseId: caso.id,
        deadlineId,
      });

      newlyNotified.push(deadlineId);
    });
  });

  if (newlyNotified.length) {
    writeNotified(userId, [...alreadyNotified, ...newlyNotified]);
  }
  return newlyNotified;
};

/**
 * Limpia el registro de plazos notificados (util cuando el usuario
 * reactiva el toggle de alertas).
 */
export const resetNotifiedDeadlines = (userId) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(NOTIFIED_KEY(userId));
  } catch {
    /* noop */
  }
};
