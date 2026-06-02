// src/components/CreateCaseModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { X, FileText, User, Upload, Paperclip, HardDrive, RefreshCw, ExternalLink, ChevronLeft, FolderOpen } from 'lucide-react';
import { getStoredDriveToken, listDriveChildren } from '../services/googleDriveService';

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

const isDriveFolder = (item) => item?.mimeType === FOLDER_MIME_TYPE;

const sortDriveItems = (items = []) =>
  [...items].sort((a, b) => {
    if (isDriveFolder(a) && !isDriveFolder(b)) return -1;
    if (!isDriveFolder(a) && isDriveFolder(b)) return 1;
    return String(a?.name || '').localeCompare(String(b?.name || ''), 'es', { sensitivity: 'base' });
  });

const CreateCaseModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    clientName: '',
    dni: '',
    type: 'Laboral',
    status: 'Activo',
    summary: '',
    lastUpdate: new Date().toISOString().split('T')[0],
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [driveItems, setDriveItems] = useState([]);
  const [drivePath, setDrivePath] = useState([{ id: 'root', name: 'Mi unidad' }]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files).map((file) => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type,
      date: new Date().toISOString().split('T')[0],
      source: 'Local',
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const loadDriveFiles = async (folderId = drivePath.at(-1)?.id || 'root', nextPath = drivePath) => {
    const token = getStoredDriveToken();
    if (!token?.access_token) {
      setDriveItems([]);
      setDriveError('');
      return;
    }

    setDriveLoading(true);
    setDriveError('');

    try {
      const items = await listDriveChildren(folderId, token);
      setDrivePath(nextPath);
      setDriveItems(sortDriveItems(items));
    } catch (error) {
      setDriveError(error?.message || 'No se pudieron cargar los archivos de Drive.');
      setDriveItems([]);
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    loadDriveFiles();
  }, []);

  const driveTokenAvailable = useMemo(() => Boolean(getStoredDriveToken()?.access_token), []);
  const currentDriveFolder = drivePath.at(-1) || { id: 'root', name: 'Mi unidad' };
  const canGoBackInDrive = drivePath.length > 1;

  const openDriveFolder = (folder) => {
    loadDriveFiles(folder.id, [...drivePath, { id: folder.id, name: folder.name }]);
  };

  const goBackInDrive = () => {
    if (!canGoBackInDrive) return;
    const nextPath = drivePath.slice(0, -1);
    loadDriveFiles(nextPath.at(-1)?.id || 'root', nextPath);
  };

  const addDriveFile = (file) => {
    setSelectedFiles((current) => [
      ...current,
      {
        name: file.name,
        size: file.size ? `${Math.round(Number(file.size) / 1024)} KB` : 'Archivo de Drive',
        type: file.mimeType || 'application/octet-stream',
        date: file.modifiedTime ? file.modifiedTime.split('T')[0] : new Date().toISOString().split('T')[0],
        source: 'Drive',
        webViewLink: file.webViewLink || '',
      },
    ]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.dni) return;

    let finalId = formData.id;
    if (!finalId) {
      finalId = `EXP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    }

    const newCase = {
      ...formData,
      id: finalId,
      documents: selectedFiles,
      notes: [],
      importantDates: [],
    };

    onSave(newCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/90 p-6">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-white/[0.05] bg-brand-dark">
        <div className="flex items-center justify-between border-b border-white/[0.05] p-10">
          <h3 className="flex items-center gap-4 font-serif text-3xl font-medium text-brand-ivory">
            Apertura de Expediente
          </h3>
          <button onClick={onClose} className="rounded-full p-2 text-brand-accent/40 transition-colors hover:bg-white/[0.05]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-8 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">Identificador</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                placeholder="ID Automático"
                className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/10 focus:border-brand-gold/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">Materia Legal</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none transition-all focus:border-brand-gold/40"
              >
                <option className="bg-brand-dark">Laboral</option>
                <option className="bg-brand-dark">Civil</option>
                <option className="bg-brand-dark">Penal</option>
                <option className="bg-brand-dark">Corporativo</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">Titular / Cliente</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/20" />
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="Nombre completo o Razón Social"
                className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] py-4 pl-14 pr-6 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/10 focus:border-brand-gold/40"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">Identificación (DNI / RUC)</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="Ingrese el número de identificación"
              className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/10 focus:border-brand-gold/40"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">Resumen Operativo</label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows="3"
              placeholder="Descripción detallada de la materia..."
              className="w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/10 focus:border-brand-gold/40"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">
              <Paperclip className="h-3.5 w-3.5 text-brand-gold" />
              Activos Documentales
            </label>

            <div className="relative cursor-pointer rounded-lg border border-dashed border-white/[0.1] p-8 text-center transition-colors hover:bg-white/[0.02] group">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <Upload className="mx-auto mb-4 h-8 w-8 text-brand-accent/10 transition-colors group-hover:text-brand-gold" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40">Vincular Archivos</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-brand-accent/40" />
                      <div className="min-w-0">
                        <span className="block max-w-[240px] truncate text-xs font-light text-brand-ivory/60">{file.name}</span>
                        <span className="mt-1 block text-[10px] uppercase tracking-widest text-brand-gold/60">
                          {file.source || 'Local'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-brand-accent/20 transition-colors hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">
              <HardDrive className="h-3.5 w-3.5 text-brand-gold" />
              Carpeta de Drive
            </label>

            {!driveTokenAvailable ? (
              <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-sm text-brand-accent/45">
                Conecta Drive en Preferencias para ver carpetas y documentos disponibles.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-brand-accent/35">Ubicacion actual</p>
                      <p className="mt-1 truncate text-sm font-medium text-brand-ivory">{currentDriveFolder.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={goBackInDrive}
                        disabled={!canGoBackInDrive || driveLoading}
                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-widest text-brand-accent/55 transition-colors hover:text-brand-ivory disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Atras
                      </button>
                      <button
                        type="button"
                        onClick={() => loadDriveFiles()}
                        disabled={driveLoading}
                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-widest text-brand-accent/55 transition-colors hover:text-brand-ivory disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refrescar
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-widest text-brand-accent/35">
                    {drivePath.map((folder, index) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => loadDriveFiles(folder.id, drivePath.slice(0, index + 1))}
                        className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 transition-colors hover:border-brand-gold/25 hover:text-brand-ivory"
                      >
                        {folder.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-brand-accent/35">
                  <span>{driveItems.length ? `${driveItems.length} elementos visibles` : 'Carpeta sin elementos visibles'}</span>
                  <button
                    type="button"
                    onClick={() => loadDriveFiles('root', [{ id: 'root', name: 'Mi unidad' }])}
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 hover:text-brand-ivory"
                  >
                    Ir al inicio
                  </button>
                </div>

                {driveError ? (
                  <div className="rounded-xl border border-red-500/15 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    {driveError}
                  </div>
                ) : null}

                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {driveLoading ? (
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-sm text-brand-accent/45">
                      Cargando archivos de Drive...
                    </div>
                  ) : selectedDriveFolderId ? (
                    filteredDriveFiles.length ? (
                      filteredDriveFiles.map((file) => (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => addDriveFile(file)}
                          className="flex w-full items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-left transition-all hover:border-brand-gold/25 hover:bg-white/[0.04]"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-brand-ivory">{file.name}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-brand-accent/35">
                              {file.mimeType || 'Archivo'}
                              {file.size ? ` • ${Math.round(Number(file.size) / 1024)} KB` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-gold/60">
                            <span>Importar</span>
                            <ExternalLink className="h-4 w-4" />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-sm text-brand-accent/45">
                        No hay archivos dentro de esta carpeta.
                      </div>
                    )
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4 text-sm text-brand-accent/45">
                      Elige una carpeta para ver sus documentos y agregarlos al expediente.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex gap-4 border-t border-white/[0.05] bg-white/[0.01] p-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.1] px-8 py-4 font-semibold tracking-tight text-brand-accent/60 transition-all hover:bg-white/[0.05]"
          >
            Anular
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-brand-ivory px-8 py-4 font-bold tracking-tight text-brand-black transition-colors hover:bg-white"
          >
            Registrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCaseModal;
