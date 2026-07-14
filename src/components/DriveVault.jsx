import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, FolderOpen, HardDrive, RefreshCw, Search } from 'lucide-react';
import { listDriveFiles, listDriveFolders, connectGoogleDrive } from '../services/googleDriveService';

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

const isFolderItem = (item) => item?.mimeType === FOLDER_MIME_TYPE;

const sortByModifiedDesc = (items = []) =>
  [...items].sort((a, b) => {
    const aTime = a?.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
    const bTime = b?.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
    return bTime - aTime;
  });

const getMimeLabel = (mimeType = '') => {
  if (mimeType === 'text/plain') return 'TXT';
  if (mimeType === 'text/markdown') return 'MD';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
  if (mimeType === 'application/vnd.google-apps.document') return 'Google Doc';
  if (mimeType === FOLDER_MIME_TYPE) return 'Carpeta';
  if (mimeType === 'application/vnd.google-apps.shortcut') return 'Acceso directo';
  return mimeType || 'Archivo';
};

const DriveVault = () => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDrive = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [nextFolders, nextFiles] = await Promise.all([listDriveFolders(), listDriveFiles()]);
      setFolders(sortByModifiedDesc(nextFolders).filter(Boolean));
      setFiles(sortByModifiedDesc(nextFiles).filter((file) => !isFolderItem(file)));
    } catch (driveError) {
      console.warn('No se pudo cargar Drive.', driveError);
      setError(driveError?.message || 'No se pudo cargar Google Drive.');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrive();
  }, []);

  useEffect(() => {
    const onFocus = () => loadDrive();
    const intervalId = window.setInterval(loadDrive, 60000);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const filteredFiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    const baseFiles = files.filter((file) => !isFolderItem(file));
    if (!term) return baseFiles;
    return baseFiles.filter((file) =>
      [file.name, file.mimeType, file.modifiedTime].join(' ').toLowerCase().includes(term)
    );
  }, [files, search]);

  const openFile = (file) => {
    if (!file.webViewLink) return;
    window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-brand-black p-6 md:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b border-white/[0.06] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1">
              <HardDrive className="h-3.5 w-3.5 text-brand-gold" />
              <span className="text-[11px] font-semibold text-brand-gold">Conectar documentos</span>
            </div>
            <div>
              <h1 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory md:text-5xl">Documentos conectados</h1>
              <p className="mt-3 max-w-2xl text-sm font-light leading-6 text-brand-accent/60">
                Segundo flujo de LUSTI: conectar archivos para que los expedientes y asistentes tengan contexto real.
              </p>
              <p className="mt-3 max-w-2xl text-[10px] uppercase tracking-widest text-brand-accent/35">
                Formatos recomendados: .txt, .md. Compatibles: .pdf, .docx y Google Docs.
              </p>
            </div>
          </div>

          <button
            onClick={loadDrive}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar auto
          </button>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Metric label="Carpetas" value={folders.length} />
          <Metric label="Archivos" value={files.length} />
          <Metric label="Estado" value={isLoading ? 'Cargando' : error ? 'Error' : 'Listo'} />
        </section>

        {error === 'ERROR_AUTH_EXPIRED' && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-red-200">Sesión de Google Drive Caducada</h3>
              <p className="text-xs text-red-200/70 mt-1">Por medidas de seguridad, Google cerró tu conexión de 1 hora. Vuelve a conectar para ver tus archivos.</p>
            </div>
            <button
              onClick={async () => {
                try {
                  await connectGoogleDrive();
                  loadDrive();
                } catch (e) {
                  console.error(e);
                }
              }}
              className="rounded-lg bg-red-500/20 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/30"
            >
              Reconectar Drive
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif text-brand-ivory">Carpetas</h2>
                <p className="text-xs text-brand-accent/40">Fuentes de archivo detectadas en Drive.</p>
              </div>
              <FolderOpen className="h-5 w-5 text-brand-gold" />
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <PlaceholderRows count={4} />
              ) : folders.length ? (
                folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-ivory">{folder.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-brand-accent/35">
                          <span className="rounded-full border border-white/[0.05] bg-white/[0.03] px-2 py-1">Carpeta</span>
                          <span>{folder.modifiedTime || 'Sin fecha'}</span>
                        </div>
                      </div>
                      <button onClick={() => openFile(folder)} className="text-brand-accent/35 hover:text-brand-gold">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text={error || 'No hay carpetas visibles en esta cuenta de Drive. Si no conectaste Drive, esta seccion puede quedar vacia sin afectar el sistema.'} />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-serif text-brand-ivory">Archivos</h2>
                <p className="text-xs text-brand-accent/40">Todo lo que Drive devuelve para este usuario.</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                <Search className="h-4 w-4 text-brand-accent/30" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar archivo..."
                  className="w-full bg-transparent text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <PlaceholderRows count={6} />
              ) : filteredFiles.length ? (
                filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => openFile(file)}
                    className="group flex w-full items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 text-left transition-colors hover:border-brand-gold/30 hover:bg-white/[0.035]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="rounded-xl bg-brand-gold/10 p-2.5 text-brand-gold transition-colors group-hover:bg-brand-gold/15">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-ivory">{file.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-brand-accent/35">
                          <span className="rounded-full border border-white/[0.05] bg-white/[0.03] px-2 py-1">
                            {getMimeLabel(file.mimeType)}
                          </span>
                          {file.size ? <span>{`${Math.round(Number(file.size) / 1024)} KB`}</span> : null}
                          {file.modifiedTime ? <span>{file.modifiedTime}</span> : null}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-brand-accent/30" />
                  </button>
                ))
              ) : (
                <EmptyState text="No se encontraron archivos con ese criterio. Si no hay Drive conectado, el sistema sigue funcionando sin esta boveda." />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">{label}</p>
    <p className="mt-3 text-3xl font-serif text-brand-ivory">{value}</p>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-sm text-brand-accent/45">
    {text}
  </div>
);

const PlaceholderRows = ({ count }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="h-16 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.02]" />
    ))}
  </div>
);

export default DriveVault;
