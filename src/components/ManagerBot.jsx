/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Briefcase,
  ShieldAlert,
  Scale,
  Heart,
  Calculator,
  FileSignature,
  Building,
  BookOpen,
  Check,
  ChevronDown,
  ClipboardCopy,
  Edit3,
  FileText,
  HardDrive,
  MessageSquare,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStoredDriveToken, listDriveFolders, listDriveChildren, downloadDriveFileAsFile, DRIVE_TEXT_MIME_TYPES } from '../services/googleDriveService';
import { uploadDocumentToBackend } from '../services/documentBackendService';
import {
  PROMPT_CATEGORIES,
  copyPromptToClipboard,
  createAssistant,
  createSavedPrompt,
  deleteAssistant,
  deleteSavedPrompt,
  listAssistants,
  listSavedPrompts,
  updateAssistant,
  updateSavedPrompt,
} from '../services/personalizationStore';

const SPECIALTY_OPTIONS = [
  'Laboral',
  'Penal',
  'Civil',
  'Familia',
  'Comercial',
  'Tributario',
  'Notarial',
  'Administrativo',
  'Constitucional',
  'General',
];

const SPECIALTY_UI = {
  Laboral: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'hover:border-blue-500/50', gradient: 'from-blue-500/10 to-transparent' },
  Penal: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10', border: 'hover:border-red-500/50', gradient: 'from-red-500/10 to-transparent' },
  Civil: { icon: Scale, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'hover:border-emerald-500/50', gradient: 'from-emerald-500/10 to-transparent' },
  Familia: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'hover:border-pink-500/50', gradient: 'from-pink-500/10 to-transparent' },
  Comercial: { icon: Briefcase, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'hover:border-orange-500/50', gradient: 'from-orange-500/10 to-transparent' },
  Tributario: { icon: Calculator, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'hover:border-purple-500/50', gradient: 'from-purple-500/10 to-transparent' },
  Notarial: { icon: FileSignature, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'hover:border-yellow-500/50', gradient: 'from-yellow-500/10 to-transparent' },
  Administrativo: { icon: Building, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'hover:border-cyan-500/50', gradient: 'from-cyan-500/10 to-transparent' },
  Constitucional: { icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'hover:border-indigo-500/50', gradient: 'from-indigo-500/10 to-transparent' },
  General: { icon: Bot, color: 'text-brand-accent', bg: 'bg-white/[0.05]', border: 'hover:border-brand-gold/50', gradient: 'from-white/[0.03] to-transparent' },
};

const TABS = [
  { id: 'assistants', label: 'Asistentes', icon: Bot },
  { id: 'prompts', label: 'Consultas frecuentes', icon: MessageSquare },
];

const emptyAssistant = {
  name: '',
  description: '',
  systemPrompt: '',
  specialty: 'General',
};

const emptyPrompt = {
  name: '',
  content: '',
  category: 'Consulta general',
};

const Modal = ({ title, icon: Icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/90 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-brand-dark shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/15">
            <Icon className="h-5 w-5 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl font-medium text-brand-ivory">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
    </div>
  </div>
);

const FormField = ({ label, hint, children }) => (
  <label className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent">{label}</span>
    {children}
    {hint ? <span className="block text-[11px] font-light text-brand-accent/60">{hint}</span> : null}
  </label>
);

const inputClass =
  'w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/30 focus:border-brand-gold/40';

const textareaClass = `${inputClass} resize-y min-h-[110px] font-light leading-relaxed`;

const CustomSelect = ({ value, onChange, options, placeholder = 'Seleccionar...' }) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const current = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlighted((prev) => (prev + 1) % options.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlighted((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
      } else if (event.key === 'Enter' && highlighted >= 0) {
        event.preventDefault();
        onChange(options[highlighted].value);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, options, highlighted, onChange]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlighted(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white/[0.02] px-4 py-3 text-left text-sm transition-colors ${
          open
            ? 'border-brand-gold/40 text-brand-ivory'
            : 'border-white/[0.08] text-brand-ivory hover:border-white/[0.15]'
        }`}
      >
        <span className={current ? 'text-brand-ivory' : 'text-brand-accent/40'}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-brand-accent/60 transition-transform ${open ? 'rotate-180 text-brand-gold' : ''}`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-white/[0.08] bg-brand-dark shadow-2xl shadow-black/40">
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {options.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHighlighted = index === highlighted;
              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setHighlighted(index)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      isHighlighted
                        ? 'bg-brand-gold/10 text-brand-ivory'
                        : 'text-brand-accent hover:bg-white/[0.04] hover:text-brand-ivory'
                    }`}
                  >
                    <span className="font-light">{opt.label}</span>
                    {isSelected ? <Check className="h-4 w-4 text-brand-gold" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const ManagerBot = ({ onUseInChat }) => {
  const [activeTab, setActiveTab] = useState('assistants');
  const [assistants, setAssistants] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAssistant, setEditingAssistant] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [showDriveImport, setShowDriveImport] = useState(false);
  const [driveItems, setDriveItems] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [selectedDriveFile, setSelectedDriveFile] = useState(null);
  const [driveFolder, setDriveFolder] = useState(null);
  const [driveFolderPath, setDriveFolderPath] = useState([]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const [a, p] = await Promise.all([listAssistants(), listSavedPrompts()]);
      setAssistants(a);
      setPrompts(p);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const flash = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage({ type: '', text: '' }), 2500);
  };

  const filteredAssistants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return assistants;
    return assistants.filter((item) =>
      [item.name, item.description, item.specialty, item.systemPrompt]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [assistants, searchTerm]);

  const filteredPrompts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return prompts;
    return prompts.filter((item) =>
      [item.name, item.content, item.category].some((field) =>
        String(field || '').toLowerCase().includes(term)
      )
    );
  }, [prompts, searchTerm]);

  const handleSaveAssistant = async (form, id) => {
    try {
      if (id) {
        await updateAssistant(id, form);
        flash('ok', 'Asistente actualizado.');
      } else {
        await createAssistant(form);
        flash('ok', 'Asistente creado.');
      }
      setEditingAssistant(null);
      setIsCreatingAssistant(false);
      await refresh();
    } catch (error) {
      flash('error', error?.message || 'No se pudo guardar el asistente.');
    }
  };

  const handleDeleteAssistant = async (id) => {
    if (!window.confirm('Eliminar este asistente?')) return;
    await deleteAssistant(id);
    flash('ok', 'Asistente eliminado.');
    await refresh();
  };

  const handleSavePrompt = async (form, id) => {
    try {
      if (id) {
        await updateSavedPrompt(id, form);
        flash('ok', 'Prompt actualizado.');
      } else {
        await createSavedPrompt(form);
        flash('ok', 'Prompt guardado.');
      }
      setEditingPrompt(null);
      setIsCreatingPrompt(false);
      await refresh();
    } catch (error) {
      flash('error', error?.message || 'No se pudo guardar el prompt.');
    }
  };

  const handleDeletePrompt = async (id) => {
    if (!window.confirm('Eliminar este prompt?')) return;
    await deleteSavedPrompt(id);
    flash('ok', 'Prompt eliminado.');
    await refresh();
  };

  const handleCopyPrompt = async (id) => {
    const ok = await copyPromptToClipboard(id);
    flash(ok ? 'ok' : 'error', ok ? 'Prompt copiado al portapapeles.' : 'No se pudo copiar.');
  };

  const openDriveImport = async () => {
    if (!getStoredDriveToken()?.access_token) {
      toast.error('Conecta Google Drive primero desde Configuracion.');
      return;
    }
    setDriveLoading(true);
    setShowDriveImport(true);
    setDriveFolder(null);
    setDriveFolderPath([]);
    await loadDriveItems();
  };

  const loadDriveItems = async (folderId) => {
    setDriveLoading(true);
    try {
      let items;
      if (folderId) {
        items = await listDriveChildren(folderId);
      } else {
        const folders = await listDriveFolders();
        items = folders;
      }
      const fileTypes = new Set([...DRIVE_TEXT_MIME_TYPES, 'application/vnd.google-apps.folder']);
      const filtered = items.filter((f) => fileTypes.has(f.mimeType));
      setDriveItems(filtered);
    } catch (e) {
      toast.error(e.message || 'No se pudo leer Drive.');
    } finally {
      setDriveLoading(false);
    }
  };

  const openDriveFolder = async (folder) => {
    setDriveFolder(folder);
    setDriveFolderPath((prev) => [...prev, folder]);
    setSelectedDriveFile(null);
    await loadDriveItems(folder.id);
  };

  const goBackDrive = async () => {
    if (driveFolderPath.length <= 1) {
      setDriveFolder(null);
      setDriveFolderPath([]);
      setSelectedDriveFile(null);
      await loadDriveItems();
    } else {
      const parentPath = driveFolderPath.slice(0, -1);
      const parent = parentPath[parentPath.length - 1] || null;
      setDriveFolder(parent);
      setDriveFolderPath(parentPath);
      setSelectedDriveFile(null);
      await loadDriveItems(parent?.id);
    }
  };

  const handleImportDriveFile = async () => {
    if (!selectedDriveFile) return;
    try {
      let text = '';
      const isPlainText = selectedDriveFile.mimeType === 'text/plain' || selectedDriveFile.mimeType === 'text/markdown';
      if (isPlainText) {
        const file = await downloadDriveFileAsFile(selectedDriveFile);
        text = await file.text();
      } else {
        const file = await downloadDriveFileAsFile(selectedDriveFile);
        const result = await uploadDocumentToBackend(file);
        text = result?.extracted_text || '';
      }
      if (!text.trim()) {
        toast.error('No se pudo extraer texto del archivo.');
        return;
      }
      const name = selectedDriveFile.name.replace(/\.[^.]+$/, '');
      await createSavedPrompt({ name, content: text, category: 'Consulta general' });
      flash('ok', `Prompt "${name}" importado desde Drive.`);
      setShowDriveImport(false);
      setSelectedDriveFile(null);
      setDriveItems([]);
      setDriveFolder(null);
      setDriveFolderPath([]);
      await refresh();
    } catch (e) {
      toast.error(e.message || 'Error al importar el archivo.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-black p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <h2 className="flex items-center gap-4 text-4xl font-serif font-medium tracking-tight text-brand-ivory">
            <Bot className="h-8 w-8 text-brand-gold" />
            Asistentes y Plantillas
          </h2>
          <p className="max-w-2xl text-sm font-light leading-relaxed text-brand-accent/70">
            Configura tus asistentes personalizados con prompts de sistema propios y guarda las
            consultas recurrentes para reutilizarlas con un click en cualquier expediente.
          </p>
        </header>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-1 rounded-xl border border-white/[0.05] bg-white/[0.02] p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchTerm('');
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-gold/15 text-brand-gold'
                      : 'text-brand-accent hover:bg-white/[0.04] hover:text-brand-ivory'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className="ml-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-brand-accent">
                    {tab.id === 'assistants' ? assistants.length : prompts.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={activeTab === 'assistants' ? 'Buscar asistente...' : 'Buscar prompt...'}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-2.5 pl-10 pr-4 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/40 focus:border-brand-gold/40"
              />
            </div>
            {activeTab === 'assistants' ? (
              <button
                type="button"
                onClick={() => {
                  setEditingAssistant(null);
                  setIsCreatingAssistant(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-2.5 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
              >
                <Plus className="h-4 w-4" />
                Nuevo asistente
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openDriveImport}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-brand-accent transition-colors hover:bg-white/[0.04] hover:text-brand-ivory"
                >
                  <HardDrive className="h-4 w-4" />
                  Importar desde Drive
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPrompt(null);
                    setIsCreatingPrompt(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-2.5 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
                >
                  <Plus className="h-4 w-4" />
                  Nueva consulta
                </button>
              </div>
            )}
          </div>
        </div>

        {actionMessage.text ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              actionMessage.type === 'ok'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            {actionMessage.text}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-10 text-center text-sm text-brand-accent">
            Cargando...
          </div>
        ) : activeTab === 'assistants' ? (
          <AssistantsList
            items={filteredAssistants}
            onEdit={(item) => {
              setEditingAssistant(item);
              setIsCreatingAssistant(false);
            }}
            onDelete={handleDeleteAssistant}
            onCreate={() => setIsCreatingAssistant(true)}
            onUse={async (item) => {
              if (typeof onUseInChat !== 'function') {
                flash('error', 'No se puede abrir un chat desde esta vista.');
                return;
              }
              const ok = await onUseInChat({
                assistant: { id: item.id, name: item.name, systemPrompt: item.systemPrompt },
              });
              if (ok) flash('ok', `Asistente "${item.name}" activado en el chat.`);
            }}
          />
        ) : (
          <PromptsList
            items={filteredPrompts}
            onEdit={(item) => {
              setEditingPrompt(item);
              setIsCreatingPrompt(false);
            }}
            onDelete={handleDeletePrompt}
            onCopy={handleCopyPrompt}
            onCreate={() => setIsCreatingPrompt(true)}
            onUse={async (item) => {
              if (typeof onUseInChat !== 'function') {
                flash('error', 'No se puede abrir un chat desde esta vista.');
                return;
              }
              const ok = await onUseInChat({ pendingInput: item.content });
              if (ok) flash('ok', `Prompt "${item.name}" cargado en el chat.`);
            }}
          />
        )}
      </div>

      {(isCreatingAssistant || editingAssistant) && (
        <AssistantForm
          initial={editingAssistant || emptyAssistant}
          editingId={editingAssistant?.id || null}
          onClose={() => {
            setEditingAssistant(null);
            setIsCreatingAssistant(false);
          }}
          onSave={handleSaveAssistant}
          prompts={prompts}
        />
      )}

      {(isCreatingPrompt || editingPrompt) && (
        <PromptForm
          initial={editingPrompt || emptyPrompt}
          editingId={editingPrompt?.id || null}
          onClose={() => {
            setEditingPrompt(null);
            setIsCreatingPrompt(false);
          }}
          onSave={handleSavePrompt}
        />
      )}

      {/* Modal de importacion desde Drive */}
      {showDriveImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowDriveImport(false); setSelectedDriveFile(null); }}>
          <div className="mx-4 flex h-[70vh] w-full max-w-lg flex-col rounded-xl border border-white/[0.08] bg-brand-dark shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-brand-gold" />
                <h3 className="text-sm font-bold text-brand-ivory">Importar prompt desde Drive</h3>
              </div>
              <button onClick={() => { setShowDriveImport(false); setSelectedDriveFile(null); }} className="rounded p-1 text-brand-accent hover:bg-white/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 border-b border-white/[0.05] px-4 py-2 text-xs text-brand-accent">
              <button onClick={() => { setDriveFolder(null); setDriveFolderPath([]); setSelectedDriveFile(null); loadDriveItems(); }} className="hover:text-brand-ivory">Drive</button>
              {driveFolderPath.map((f, i) => (
                <span key={f.id} className="flex items-center gap-1">
                  <span className="text-brand-accent/40">/</span>
                  <span className="text-brand-ivory truncate max-w-[120px]">{f.name}</span>
                </span>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {driveLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
                </div>
              ) : driveItems.length === 0 ? (
                <p className="py-12 text-center text-sm text-brand-accent/50">Esta carpeta esta vacia.</p>
              ) : (
                <div className="space-y-1">
                  {driveFolder && (
                    <button onClick={goBackDrive} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-brand-accent hover:bg-white/[0.04]">
                      <span className="text-lg">...</span>
                      <span className="text-xs">Volver</span>
                    </button>
                  )}
                  {driveItems.map((item) => {
                    const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                    if (isFolder) {
                      return (
                        <button key={item.id} onClick={() => openDriveFolder(item)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-brand-accent hover:bg-white/[0.04]">
                          <span className="text-base">📁</span>
                          <span className="truncate text-left">{item.name}</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedDriveFile(item)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                          selectedDriveFile?.id === item.id ? 'bg-brand-gold/10 text-brand-ivory border border-brand-gold/30' : 'text-brand-accent hover:bg-white/[0.04] border border-transparent'
                        }`}
                      >
                        <span className="text-base shrink-0">{item.mimeType === 'application/pdf' ? '📄' : '📝'}</span>
                        <span className="truncate text-left">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] p-4">
              <button onClick={() => { setShowDriveImport(false); setSelectedDriveFile(null); }} className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-bold text-brand-accent hover:bg-white/[0.06]">
                Cancelar
              </button>
              <button onClick={handleImportDriveFile} disabled={!selectedDriveFile} className="rounded-lg bg-brand-gold px-4 py-2 text-xs font-bold text-brand-black hover:bg-white disabled:opacity-50">
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AssistantsList = ({ items, onEdit, onDelete, onCreate, onUse }) => {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-12 text-center">
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-brand-gold/60" />
        <p className="text-sm font-light text-brand-accent">
          Aún no tienes asistentes personalizados. Crea uno para que te ayude con especialidades legales específicas.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
        >
          <Plus className="h-4 w-4" />
          Crear el primero
        </button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const specUi = SPECIALTY_UI[item.specialty] || SPECIALTY_UI.General;
        const Icon = specUi.icon;
        
        return (
          <article
            key={item.id}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 transition-all duration-300 ${specUi.border} hover:shadow-lg hover:-translate-y-0.5`}
          >
            {/* Fondo gradiente sutil basado en la especialidad */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${specUi.gradient}`} />
            
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${specUi.bg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${specUi.color}`} />
                </div>
                <div>
                  <h3 className="truncate text-sm font-semibold text-brand-ivory transition-colors group-hover:text-white">
                    {item.name}
                  </h3>
                  <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${specUi.bg} ${specUi.color}`}>
                    {item.specialty || 'General'}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="relative mt-4 line-clamp-2 text-xs font-light leading-relaxed text-brand-accent/80">
              {item.description || 'Sin descripcion'}
            </p>
            
            {item.systemPrompt ? (
              <details className="relative mt-3 text-[11px] font-light text-brand-accent/70 z-10">
                <summary className="cursor-pointer text-brand-accent hover:text-brand-ivory transition-colors">
                  Ver instrucciones
                </summary>
                <pre className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-white/[0.05] bg-brand-black/80 p-3 whitespace-pre-wrap text-[11px] text-brand-accent/80 shadow-inner">
                  {item.systemPrompt}
                </pre>
              </details>
            ) : null}
            
            <div className="relative mt-auto flex items-center justify-end gap-2 border-t border-white/[0.05] pt-4 mt-4 z-10">
              {onUse ? (
                <button
                  type="button"
                  onClick={() => onUse(item)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-brand-gold/30 bg-brand-gold/10 px-2.5 py-1.5 text-xs font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Usar
                </button>
              ) : null}
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </div>
        </article>
      );
    })}
    </div>
  );
};

const PromptsList = ({ items, onEdit, onDelete, onCopy, onCreate, onUse }) => {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-12 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-brand-gold/60" />
        <p className="text-sm font-light text-brand-accent">
          Aún no tienes consultas frecuentes guardadas. Guarda los textos largos que usas siempre para reutilizarlos con un clic.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
        >
          <Plus className="h-4 w-4" />
          Guardar el primero
        </button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="group flex flex-col rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 transition-colors hover:border-brand-gold/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-brand-ivory">{item.name}</h3>
              <span className="mt-1 inline-block rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-accent">
                {item.category}
              </span>
            </div>
          </div>
          <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs font-light leading-relaxed text-brand-accent/80">
            {item.content}
          </p>
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/[0.05] pt-3">
            {onUse ? (
              <button
                type="button"
                onClick={() => onUse(item)}
                className="inline-flex items-center gap-1.5 rounded-md border border-brand-gold/30 bg-brand-gold/10 px-2.5 py-1.5 text-xs font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Usar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onCopy(item.id)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              Copiar
            </button>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

const AssistantForm = ({ initial, editingId, onClose, onSave, prompts }) => {
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    systemPrompt: initial.systemPrompt || '',
    specialty: initial.specialty || 'General',
  });
  const [error, setError] = useState('');
  const [showPromptPicker, setShowPromptPicker] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setError('');
    onSave(form, editingId);
  };

  return (
    <Modal title={editingId ? 'Editar asistente' : 'Nuevo asistente'} icon={Bot} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Nombre del asistente">
          <input
            type="text"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Ej: Asistente CTS y liquidaciones"
            className={inputClass}
            autoFocus
          />
        </FormField>
        <FormField label="Materia (opcional)">
          <CustomSelect
            value={form.specialty}
            onChange={(value) => update('specialty', value)}
            options={SPECIALTY_OPTIONS.map((option) => ({ value: option, label: option }))}
          />
        </FormField>
        <FormField label="Descripcion breve" hint="Una linea que explique cuando usar este asistente.">
          <input
            type="text"
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Especialista en calculos de beneficios sociales."
            className={inputClass}
          />
        </FormField>
        <FormField label="Instrucciones del asistente" hint="Define el tono, las leyes que debe aplicar y el enfoque que debe tener.">
          <div className="space-y-2">
            <textarea
              value={form.systemPrompt}
              onChange={(event) => update('systemPrompt', event.target.value)}
              placeholder="Eres un abogado especialista en derecho laboral peruano..."
              className={textareaClass}
              rows={8}
            />
            {prompts?.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPromptPicker(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-3 py-1.5 text-xs font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
              >
                <FileText className="h-3.5 w-3.5" />
                Elegir prompt guardado
              </button>
            )}
          </div>
        </FormField>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.05] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/15 px-4 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/25"
          >
            <Save className="h-4 w-4" />
            {editingId ? 'Guardar cambios' : 'Crear asistente'}
          </button>
        </div>
      </form>

      {/* Modal selector de prompts guardados */}
      {showPromptPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPromptPicker(false)}>
          <div className="mx-4 flex h-[60vh] w-full max-w-lg flex-col rounded-xl border border-white/[0.08] bg-brand-dark shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
              <h3 className="text-sm font-bold text-brand-ivory">Seleccionar prompt guardado</h3>
              <button onClick={() => setShowPromptPicker(false)} className="rounded p-1 text-brand-accent hover:bg-white/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {prompts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      update('systemPrompt', p.content);
                      setShowPromptPicker(false);
                    }}
                    className="flex w-full flex-col gap-1 rounded-lg border border-white/[0.05] p-4 text-left transition-colors hover:border-brand-gold/30 hover:bg-white/[0.02]"
                  >
                    <span className="text-sm font-semibold text-brand-ivory">{p.name}</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-brand-accent">{p.category}</span>
                    <p className="mt-1 line-clamp-2 text-xs text-brand-accent/60">{p.content}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

const PromptForm = ({ initial, editingId, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: initial.name || '',
    content: initial.content || '',
    category: initial.category || 'Consulta general',
  });
  const [error, setError] = useState('');

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!form.content.trim()) {
      setError('El contenido del prompt no puede estar vacio.');
      return;
    }
    setError('');
    onSave(form, editingId);
  };

  return (
    <Modal title={editingId ? 'Editar consulta' : 'Nueva consulta frecuente'} icon={MessageSquare} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Nombre">
          <input
            type="text"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Ej: Detectar riesgos en un escrito"
            className={inputClass}
            autoFocus
          />
        </FormField>
        <FormField label="Categoria">
          <CustomSelect
            value={form.category}
            onChange={(value) => update('category', value)}
            options={PROMPT_CATEGORIES.map((option) => ({ value: option, label: option }))}
          />
        </FormField>
        <FormField label="Contenido del prompt" hint="Lo que se va a pegar en el chat al usar este prompt.">
          <textarea
            value={form.content}
            onChange={(event) => update('content', event.target.value)}
            placeholder="Analiza el siguiente escrito y lista los riesgos procesales que encontres..."
            className={textareaClass}
            rows={8}
          />
        </FormField>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.05] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/15 px-4 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/25"
          >
            <Save className="h-4 w-4" />
            {editingId ? 'Guardar cambios' : 'Guardar prompt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ManagerBot;
