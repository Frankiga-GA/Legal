import { useState, useEffect } from 'react';
import { X, FileText, Folder, Loader2, HardDrive } from 'lucide-react';
import { getStoredDriveToken, listDriveChildren, listDriveFolders, listDriveFiles, DRIVE_TEXT_MIME_TYPES } from '../services/googleDriveService';

const DriveFilePicker = ({ onSelect, onClose }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [folderPath, setFolderPath] = useState([]);

  const token = getStoredDriveToken();

  const loadRoot = async () => {
    setLoading(true);
    setError('');
    try {
      const [rootFolders, rootFiles] = await Promise.all([
        listDriveFolders(token),
        listDriveFiles(token),
      ]);
      setFolders(currentFolder ? rootFolders.filter((f) => currentFolder.children?.includes?.(f.id) ?? true) : rootFolders);
      setFiles(rootFiles.filter((f) => DRIVE_TEXT_MIME_TYPES.has(f.mimeType)));
    } catch (e) {
      setError(e.message || 'No se pudo leer Drive.');
    } finally {
      setLoading(false);
    }
  };

  const openFolder = async (folder) => {
    setLoading(true);
    setError('');
    try {
      const children = await listDriveChildren(folder.id, token);
      setFolders(children.filter((f) => f.mimeType === 'application/vnd.google-apps.folder'));
      setFiles(children.filter((f) => DRIVE_TEXT_MIME_TYPES.has(f.mimeType)));
      setCurrentFolder(folder);
      setFolderPath((prev) => [...prev, folder]);
    } catch (e) {
      setError(e.message || 'No se pudo abrir la carpeta.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (folderPath.length <= 1) {
      setCurrentFolder(null);
      setFolderPath([]);
      loadRoot();
    } else {
      const parent = folderPath[folderPath.length - 2];
      openFolder(parent);
      setFolderPath((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => { loadRoot(); }, []);

  const toggleFile = (fileId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const confirmSelection = () => {
    const selectedFiles = files.filter((f) => selected.has(f.id));
    onSelect(selectedFiles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 flex h-[80vh] w-full max-w-xl flex-col rounded-xl border border-white/[0.08] bg-brand-dark shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-brand-gold" />
            <h3 className="text-sm font-bold text-brand-ivory">Seleccionar archivos de Drive</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-brand-accent hover:bg-white/[0.06]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-white/[0.05] px-4 py-2 text-xs text-brand-accent">
          <button onClick={() => { setCurrentFolder(null); setFolderPath([]); loadRoot(); }} className="hover:text-brand-ivory">Drive</button>
          {folderPath.map((f, i) => (
            <span key={f.id} className="flex items-center gap-1">
              <span className="text-brand-accent/40">/</span>
              <span className="text-brand-ivory">{f.name}</span>
            </span>
          ))}
        </div>

        {error && <p className="px-4 py-2 text-xs text-red-400">{error}</p>}

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
            </div>
          ) : (
            <div className="space-y-0.5">
              {currentFolder && (
                <button onClick={goBack} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-brand-accent hover:bg-white/[0.04]">
                  <Folder className="h-4 w-4" />
                  <span>...</span>
                </button>
              )}
              {folders.map((folder) => (
                <button key={folder.id} onClick={() => openFolder(folder)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-brand-accent hover:bg-white/[0.04]">
                  <Folder className="h-4 w-4 text-brand-gold" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
              {files.map((file) => {
                const isSelected = selected.has(file.id);
                return (
                  <button key={file.id} onClick={() => toggleFile(file.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isSelected ? 'bg-brand-gold/10 text-brand-ivory' : 'text-brand-accent hover:bg-white/[0.04]'
                  }`}>
                    <input type="checkbox" checked={isSelected} readOnly className="h-4 w-4 accent-brand-gold" />
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </button>
                );
              })}
              {!loading && folders.length === 0 && files.length === 0 && (
                <p className="py-12 text-center text-xs text-brand-accent/50">Esta carpeta está vacía.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.08] p-4">
          <span className="text-xs text-brand-accent">{selected.size} archivo(s) seleccionado(s)</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-bold text-brand-accent hover:bg-white/[0.06]">
              Cancelar
            </button>
            <button onClick={confirmSelection} disabled={selected.size === 0} className="rounded-lg bg-brand-gold px-4 py-2 text-xs font-bold text-brand-black hover:bg-white disabled:opacity-50">
              Importar {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveFilePicker;
