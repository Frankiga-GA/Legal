const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
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
    const timer = window.setInterval(() => {
      try {
        let closed = false;
        try {
          closed = popup.closed;
        } catch {
          closed = false;
        }
        if (closed) {
          window.clearInterval(timer);
          reject(new Error('La conexion con Google Drive se cerro antes de completarse.'));
          return;
        }

        let popupUrl;
        try {
          popupUrl = popup.location.href;
        } catch {
          return;
        }
        if (!popupUrl.startsWith(redirectUri)) return;

        const token = parseTokenFromHash(new URL(popupUrl).hash);
        if (!token) return;

        saveStoredDriveToken(token);
        try {
          popup.opener?.postMessage({ type: 'lusti-drive-connected', token }, window.location.origin);
        } catch {
          // Ignore if opener is not reachable.
        }
        popup.close();
        window.clearInterval(timer);
        resolve(token);
      } catch {
        // Cross-origin while Google auth is open. Ignore until it redirects back.
      }
    }, 500);
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
  if (!token?.access_token) return [];
  return fetchDrive(token, "mimeType = 'application/vnd.google-apps.folder' and trashed = false", '150');
};

export const listDriveFiles = async (token = getStoredDriveToken()) => {
  if (!token?.access_token) return [];
  return fetchDrive(token, "trashed = false");
};

export const listDriveChildren = async (folderId = 'root', token = getStoredDriveToken()) => {
  if (!token?.access_token) return [];
  const safeFolderId = String(folderId || 'root').replace(/'/g, "\\'");
  return fetchDrive(token, `'${safeFolderId}' in parents and trashed = false`, '100');
};

export const downloadDriveFileAsFile = async (file, token = getStoredDriveToken()) => {
  if (!token?.access_token) throw new Error('No hay token valido de Google Drive.');
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
