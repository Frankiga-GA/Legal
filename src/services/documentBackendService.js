import { isSupabaseConfigured, supabase } from '../utils/supabase';

// Siempre usamos `/api` como prefijo:
//   - En desarrollo: Vite proxy redirige `/api/*` a localhost:8000 (vite.config.js)
//   - En produccion (Vercel): vercel.json rewrite `/api/*` -> serverless function
// De este modo el frontend no depende de la env var VITE_DOCUMENT_BACKEND_URL
// y nunca apunta directo a 127.0.0.1.
const backendUrl = '/api';

const fetchWithTimeout = async (input, init = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado al conectar con ${backendUrl}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const handleJsonResponse = async (response, endpoint = '') => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `El backend de documentos no respondio correctamente en ${endpoint || 'el endpoint solicitado'}.`
    );
  }
  return response.json();
};

// Devuelve el access_token de la sesion actual de Supabase, o null si no hay.
// Se envia como Authorization: Bearer <token> en cada request al backend.
const getAccessToken = async () => {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('No se pudo obtener la sesion para autorizar el backend.', error);
      return null;
    }
    return data?.session?.access_token || null;
  } catch (error) {
    console.warn('Excepcion al leer la sesion de Supabase.', error);
    return null;
  }
};

const authHeaders = async (extra = {}) => {
  const token = await getAccessToken();
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const checkDocumentBackendHealth = async () => {
  const response = await fetchWithTimeout(`${backendUrl}/health`, { method: 'GET' }, 15000);
  return handleJsonResponse(response, '/health');
};

export const uploadDocumentToBackend = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const headers = await authHeaders();

  try {
    const response = await fetchWithTimeout(`${backendUrl}/upload`, {
      method: 'POST',
      body: formData,
      headers,
    }, 180000);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Error al conectar con backend para procesar documento. Intentando fallback local...', error);
    
    const fileName = (file.name || '').toLowerCase();
    const isTextFile = fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv') || (file.type || '').startsWith('text/');
    
    if (isTextFile) {
      try {
        const localText = await file.text();
        return {
          file_name: file.name,
          file_type: file.type || 'text/plain',
          extracted_text: localText,
          isLocalFallback: true,
        };
      } catch (readError) {
        console.error('Fallo la lectura local del archivo:', readError);
      }
    }
    
    throw error;
  }
};

export const processDocumentFromUrl = async (url, fileName, fileType = '') => {
  const headers = await authHeaders({ 'Content-Type': 'application/json' });

  try {
    const response = await fetchWithTimeout(`${backendUrl}/process-url`, {
      method: 'POST',
      body: JSON.stringify({ url, file_name: fileName, file_type: fileType }),
      headers,
    }, 300000); // 5 minutes max (if Vercel doesn't kill it first)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`URL Processing failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error processing document from URL:', error);
    throw error;
  }
};

export const requestDocumentChat = async ({ message, prompt = '', fileName = '', fileType = '', fileText = '' }) => {
  const headers = await authHeaders({ 'Content-Type': 'application/json' });

  const response = await fetchWithTimeout(`${backendUrl}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      prompt,
      file_name: fileName,
      file_type: fileType,
      file_text: fileText,
    }),
  }, 300000);

  return handleJsonResponse(response, '/chat');
};

export const generateDocumentWithBackend = async ({ message, prompt = '', file }) => {
  const formData = new FormData();
  formData.append('message', message);
  formData.append('prompt', prompt);
  if (file) {
    formData.append('file', file);
  }

  const headers = await authHeaders();

  const response = await fetchWithTimeout(`${backendUrl}/generate-document`, {
    method: 'POST',
    body: formData,
    headers,
  }, 300000);

  return handleJsonResponse(response, '/generate-document');
};

export const generateDocumentFile = async ({
  message,
  prompt = '',
  fileName = '',
  fileType = '',
  fileText = '',
  content = '',
  documentType = 'documento',
  outputFormat = 'docx',
}) => {
  const headers = await authHeaders({ 'Content-Type': 'application/json' });

  const response = await fetchWithTimeout(`${backendUrl}/generate-file`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      prompt,
      file_name: fileName,
      file_type: fileType,
      file_text: fileText,
      content,
      document_type: documentType,
      output_format: outputFormat,
    }),
  }, 300000);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'No se pudo generar el archivo.');
  }

  const blob = await response.blob();
  const headerName = response.headers.get('X-Lusti-Filename');
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return {
    blob,
    fileName: headerName || match?.[1] || `documento-lusti.${outputFormat}`,
  };
};
