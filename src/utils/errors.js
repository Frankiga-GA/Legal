const ERROR_MESSAGES = {
  timeout: 'La IA no respondió a tiempo. Intente con una consulta más corta o reintente.',
  network: 'Sin conexión al servidor. Verifique su conexión a internet.',
  model: 'Error del modelo de IA. Reintente en unos segundos.',
  auth: 'Sesión de Google expirada. Vaya a Configuración y conecte Google nuevamente.',
  calendar: 'Calendar no sincronizado. Re-conecte Google en Configuración.',
  upload: 'Error al subir el archivo. Verifique el tamaño y formato.',
  drive: 'No se pudo leer Google Drive. Verifique su conexión.',
  supabase: 'Error al guardar en la nube. Sus datos están seguros localmente.',
  pdf: 'Error al generar el PDF. Reintente.',
  default: 'Ocurrió un error inesperado. Reintente.',
};

export const friendlyError = (error) => {
  const msg = (error?.message || error || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('abort')) return ERROR_MESSAGES.timeout;
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('internet')) return ERROR_MESSAGES.network;
  if (msg.includes('model') || msg.includes('gemini') || msg.includes('groq')) return ERROR_MESSAGES.model;
  if (msg.includes('sesion') || msg.includes('expirada') || msg.includes('token')) return ERROR_MESSAGES.auth;
  if (msg.includes('calendar') || msg.includes('403')) return ERROR_MESSAGES.calendar;
  if (msg.includes('drive')) return ERROR_MESSAGES.drive;
  if (msg.includes('supabase') || msg.includes('insert') || msg.includes('select')) return ERROR_MESSAGES.supabase;
  if (msg.includes('pdf')) return ERROR_MESSAGES.pdf;
  if (msg.includes('upload') || msg.includes('file') || msg.includes('archivo')) return ERROR_MESSAGES.upload;
  return ERROR_MESSAGES.default;
};
