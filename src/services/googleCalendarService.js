import { getStoredDriveToken, clearStoredDriveToken } from './googleDriveService';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

const getAuthHeaders = () => {
  const token = getStoredDriveToken();
  if (!token?.access_token) throw new Error('No hay sesion de Google. Conecta Google Drive primero.');
  return { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    clearStoredDriveToken();
    throw new Error('Sesion de Google expirada. Conecta Google Drive nuevamente.');
  }
  if (response.status === 403) {
    throw new Error('Falta permiso Calendar. Re-conecta Google en Configuracion.');
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Calendar: ${response.status} - ${body}`);
  }
  return response.json();
};

const buildEventBody = ({ title, date, priority, caseId, caseName }) => ({
  summary: `${title} - ${caseName || 'LUSTI'}`,
  description: `Expediente: ${caseId || 'N/A'}\nPrioridad: ${priority || 'Media'}\nSincronizado desde LUSTI`,
  start: { date, timeZone: 'America/Lima' },
  end: { date, timeZone: 'America/Lima' },
  colorId: priority === 'Alta' ? '11' : priority === 'Baja' ? '9' : '5',
});

export const createCalendarEvent = async ({ title, date, priority, caseId, caseName }) => {
  const headers = getAuthHeaders();
  const body = buildEventBody({ title, date, priority, caseId, caseName });
  const response = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await handleResponse(response);
  return { googleEventId: data.id, htmlLink: data.htmlLink };
};

export const updateCalendarEvent = async (eventId, { title, date, priority, caseId, caseName }) => {
  const headers = getAuthHeaders();
  const body = buildEventBody({ title, date, priority, caseId, caseName });
  const response = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  await handleResponse(response);
};

export const deleteCalendarEvent = async (eventId) => {
  const headers = getAuthHeaders();
  const response = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    await handleResponse(response);
  }
};

export const syncDeadlinesToCalendar = async (deadlines, onProgress) => {
  const results = { created: 0, updated: 0, deleted: 0, errors: [] };
  const headers = getAuthHeaders();

  // Obtener eventos existentes en Calendar para evitar duplicados
  const existingResp = await fetch(`${CALENDAR_API}/calendars/primary/events?maxResults=2500&q=LUSTI`, { headers });
  const existingData = await handleResponse(existingResp);
  const existingEvents = (existingData.items || []).reduce((map, ev) => {
    const descMatch = ev.description?.match(/Expediente: (.+)/);
    const key = descMatch ? `${descMatch[1]}|${ev.summary}` : ev.summary;
    map.set(key, ev);
    return map;
  }, new Map());

  const processedKeys = new Set();

  for (let i = 0; i < deadlines.length; i++) {
    const d = deadlines[i];
    const key = `${d.caseId || ''}|${d.title} - ${d.caseName || ''}`;
    processedKeys.add(key);

    try {
      if (existingEvents.has(key)) {
        await updateCalendarEvent(existingEvents.get(key).id, {
          title: d.title, date: d.date, priority: d.priority,
          caseId: d.caseId, caseName: d.caseName,
        });
        results.updated++;
      } else {
        await createCalendarEvent({
          title: d.title, date: d.date, priority: d.priority,
          caseId: d.caseId, caseName: d.caseName,
        });
        results.created++;
      }
    } catch (e) {
      results.errors.push({ deadline: d.title, error: e.message });
    }

    if (onProgress) onProgress(Math.round(((i + 1) / deadlines.length) * 100));
  }

  // Borrar eventos en Calendar que ya no existen en LUSTI
  for (const [key, ev] of existingEvents) {
    if (!processedKeys.has(key)) {
      try {
        await deleteCalendarEvent(ev.id);
        results.deleted++;
      } catch {
        // ignorar errores al borrar
      }
    }
  }

  return results;
};
