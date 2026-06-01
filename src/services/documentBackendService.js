const backendUrl = import.meta.env.VITE_DOCUMENT_BACKEND_URL || 'http://127.0.0.1:8000';

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

export const checkDocumentBackendHealth = async () => {
  const response = await fetchWithTimeout(`${backendUrl}/health`, { method: 'GET' }, 15000);
  return handleJsonResponse(response, '/health');
};

export const uploadDocumentToBackend = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithTimeout(`${backendUrl}/upload`, {
    method: 'POST',
    body: formData,
  }, 180000);

  return handleJsonResponse(response, '/upload');
};

export const requestDocumentChat = async ({ message, prompt = '', fileName = '', fileType = '', fileText = '' }) => {
  const response = await fetchWithTimeout(`${backendUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

  const response = await fetchWithTimeout(`${backendUrl}/generate-document`, {
    method: 'POST',
    body: formData,
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
  const response = await fetchWithTimeout(`${backendUrl}/generate-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
