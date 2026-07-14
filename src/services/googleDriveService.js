const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file', // Allows creating folders and uploading files created by the app
  'https://www.googleapis.com/auth/calendar.events',
];

const STORAGE_KEY = 'lusti-google-drive-token';
const DRIVE_TOKEN_CHANGED_EVENT = 'lusti-drive-token-changed';

export const isGoogleDriveConfigured = Boolean(GOOGLE_CLIENT_ID);

export const getStoredDriveToken = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token) return null;
    if (parsed.expires_at && Date.now() > parsed.expires_at) {
      clearStoredDriveToken();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearStoredDriveToken = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(DRIVE_TOKEN_CHANGED_EVENT, { detail: { token: null } }));
};

const saveStoredDriveToken = (token) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
  window.dispatchEvent(new CustomEvent(DRIVE_TOKEN_CHANGED_EVENT, { detail: { token } }));
};

const parseTokenFromHash = (hash) => {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  const expiresIn = Number(params.get('expires_in') || 0);
  return {
    access_token: accessToken,
    token_type: params.get('token_type') || 'Bearer',
    scope: params.get('scope') || '',
    expires_at: expiresIn ? Date.now() + expiresIn * 1000 : null,
  };
};

export const connectGoogleDrive = async () => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Falta configurar VITE_GOOGLE_OAUTH_CLIENT_ID.');
  }

  const redirectUri = window.location.origin;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'token');
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');

  const popup = window.open(url.toString(), 'google-drive-oauth', 'width=520,height=700');
  if (!popup) {
    throw new Error('El navegador bloqueo la ventana de Google.');
  }

  return await waitForDriveToken(redirectUri, popup);
};

const waitForDriveToken = (redirectUri, popup) =>
  new Promise((resolve, reject) => {
    // 5 minute timeout in case user closes popup and we can't detect it due to COOP
    const timeout = setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      reject(new Error('La conexión con Google Drive expiró o fue cerrada.'));
    }, 5 * 60 * 1000);

    const messageHandler = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'lusti-drive-connected' && event.data?.hash) {
        window.removeEventListener('message', messageHandler);
        clearTimeout(timeout);
        
        const token = parseTokenFromHash(new URL('http://localhost' + event.data.hash).hash);
        if (token) {
          saveStoredDriveToken(token);
          resolve(token);
        } else {
          reject(new Error('No se pudo parsear el token de Drive.'));
        }
      }
    };

    window.addEventListener('message', messageHandler);
  });

export const onDriveTokenMessage = (callback) => {
  const handler = (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== 'lusti-drive-connected') return;
    if (!event.data?.token?.access_token) return;
    saveStoredDriveToken(event.data.token);
    callback(event.data.token);
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
};

export const onDriveTokenChange = (callback) => {
  const handler = (event) => {
    callback(event.detail?.token || null);
  };

  window.addEventListener(DRIVE_TOKEN_CHANGED_EVENT, handler);
  return () => window.removeEventListener(DRIVE_TOKEN_CHANGED_EVENT, handler);
};

const buildDriveListUrl = (query, pageSize = '50') => {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set('pageSize', pageSize);
  url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,webViewLink,size,parents)');
  url.searchParams.set('includeItemsFromAllDrives', 'true');
  url.searchParams.set('supportsAllDrives', 'true');
  return url;
};

export const DRIVE_TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.google-apps.document',
]);

export const DRIVE_TEMPLATE_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.google-apps.document',
  'text/plain',
  'text/markdown',
]);

export const isSupportedPromptFile = (file) => DRIVE_TEXT_MIME_TYPES.has(file?.mimeType || '');

export const isSupportedTemplateFile = (file) => DRIVE_TEMPLATE_MIME_TYPES.has(file?.mimeType || '');

const fetchDrive = async (token, query, pageSize) => {
  const response = await fetch(buildDriveListUrl(query, pageSize), {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let friendly = 'No se pudo leer Google Drive.';

    if (errorText.includes('accessNotConfigured')) {
      friendly = 'La API de Google Drive no esta habilitada en este proyecto de Google Cloud.';
    } else if (errorText.includes('insufficientPermissions')) {
      friendly = 'El usuario no concedio permisos suficientes para leer Drive.';
    } else if (errorText.includes('invalid_grant')) {
      friendly = 'El token de Google Drive expiro o quedo invalido. Reconecta Drive.';
    }

    throw new Error(`${friendly} Detalle: ${errorText}`);
  }

  const data = await response.json();
  return Array.isArray(data.files) ? data.files : [];
};

export const listDriveFolders = async (token = getStoredDriveToken()) => {
  if (!token?.access_token) throw new Error('ERROR_AUTH_EXPIRED');
  return fetchDrive(token, "mimeType = 'application/vnd.google-apps.folder' and trashed = false", '150');
};

export const listDriveFiles = async (token = getStoredDriveToken()) => {
  if (!token?.access_token) throw new Error('ERROR_AUTH_EXPIRED');
  return fetchDrive(token, "trashed = false");
};

export const listDriveChildren = async (folderId = 'root', token = getStoredDriveToken()) => {
  if (!token?.access_token) throw new Error('ERROR_AUTH_EXPIRED');
  const safeFolderId = String(folderId || 'root').replace(/'/g, "\\'");
  return fetchDrive(token, `'${safeFolderId}' in parents and trashed = false`, '100');
};

export const downloadDriveFileAsFile = async (file, token = getStoredDriveToken()) => {
  if (!token?.access_token) throw new Error('ERROR_AUTH_EXPIRED');
  if (!file?.id) throw new Error('No se encontro el identificador del archivo de Drive.');

  const mimeType = file.mimeType || '';
  const isGoogleDoc = mimeType === 'application/vnd.google-apps.document';
  const baseUrl = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export`
    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}`;

  const url = new URL(baseUrl);
  if (isGoogleDoc) {
    url.searchParams.set('mimeType', 'text/plain');
  } else {
    url.searchParams.set('alt', 'media');
  }
  url.searchParams.set('supportsAllDrives', 'true');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`No se pudo descargar el archivo de Drive. Detalle: ${errorText}`);
  }

  const blob = await response.blob();
  const resolvedMimeType = isGoogleDoc ? 'text/plain' : mimeType || blob.type || 'application/octet-stream';
  const extension = (() => {
    if (mimeType === 'application/pdf') return '.pdf';
    if (mimeType === 'text/plain') return '.txt';
    if (mimeType === 'text/markdown') return '.md';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
    if (isGoogleDoc) return '.txt';
    return '';
  })();

  return new File([blob], file.name || `drive-file${extension}`, { type: resolvedMimeType });
};

export const getOrCreateCaseFolder = async (caseId, clientName) => {
  const token = getStoredDriveToken();
  if (!token) return null;
  const folderName = `Expediente - ${caseId} - ${clientName}`;
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  
  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
    const res = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token.access_token}` } });
    const data = await res.json();
    if (data.files && data.files.length > 0) return data.files[0].id;
    
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
    });
    const createdData = await createRes.json();
    return createdData.id;
  } catch (error) {
    console.error("Drive Folder Error:", error);
    return null;
  }
};

export const uploadFileToDrive = async (file, folderId) => {
  const token = getStoredDriveToken();
  if (!token) throw new Error('No hay sesión de Drive');

  // Paso 1: Iniciar subida (resumable)
  const metadata = { name: file.name, parents: [folderId] };
  const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': file.type || 'application/octet-stream',
      'X-Upload-Content-Length': file.size.toString(),
    },
    body: JSON.stringify(metadata),
  });

  if (!initRes.ok) throw new Error('Error iniciando subida a Drive');
  
  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('No se recibió URL de subida de Drive');

  // Paso 2: Subir el contenido binario real
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
  });

  if (!uploadRes.ok) throw new Error('Error subiendo archivo a Drive');
  return uploadRes.json();
};
