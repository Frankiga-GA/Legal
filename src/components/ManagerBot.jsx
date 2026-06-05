/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  ClipboardCopy,
  Edit3,
  FileText,
  MessageSquare,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
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

const TABS = [
  { id: 'assistants', label: 'Asistentes', icon: Bot },
  { id: 'prompts', label: 'Prompts guardados', icon: MessageSquare },
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

const ManagerBot = () => {
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
              <button
                type="button"
                onClick={() => {
                  setEditingPrompt(null);
                  setIsCreatingPrompt(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-2.5 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
              >
                <Plus className="h-4 w-4" />
                Nuevo prompt
              </button>
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
    </div>
  );
};

const AssistantsList = ({ items, onEdit, onDelete, onCreate }) => {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-12 text-center">
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-brand-gold/60" />
        <p className="text-sm font-light text-brand-accent">
          Aun no tienes asistentes personalizados.
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
      {items.map((item) => (
        <article
          key={item.id}
          className="group flex flex-col rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 transition-colors hover:border-brand-gold/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/10">
                <Bot className="h-4 w-4 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-ivory">{item.name}</h3>
                {item.specialty ? (
                  <span className="inline-block rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-accent">
                    {item.specialty}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {item.description ? (
            <p className="mt-3 line-clamp-2 text-xs font-light leading-relaxed text-brand-accent/80">
              {item.description}
            </p>
          ) : null}
          {item.systemPrompt ? (
            <details className="mt-3 text-[11px] font-light text-brand-accent/70">
              <summary className="cursor-pointer text-brand-accent hover:text-brand-ivory">
                Ver prompt de sistema
              </summary>
              <pre className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-white/[0.05] bg-brand-black/50 p-3 whitespace-pre-wrap text-[11px] text-brand-accent/80">
                {item.systemPrompt}
              </pre>
            </details>
          ) : null}
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/[0.05] pt-3">
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

const PromptsList = ({ items, onEdit, onDelete, onCopy, onCreate }) => {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-12 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-brand-gold/60" />
        <p className="text-sm font-light text-brand-accent">
          Aun no tienes prompts guardados. Guarda tus consultas recurrentes para reutilizarlas.
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

const AssistantForm = ({ initial, editingId, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    systemPrompt: initial.systemPrompt || '',
    specialty: initial.specialty || 'General',
  });
  const [error, setError] = useState('');

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
          <select
            value={form.specialty}
            onChange={(event) => update('specialty', event.target.value)}
            className={inputClass}
          >
            {SPECIALTY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
        <FormField label="Prompt de sistema" hint="Define el tono, las reglas y el enfoque del asistente.">
          <textarea
            value={form.systemPrompt}
            onChange={(event) => update('systemPrompt', event.target.value)}
            placeholder="Eres un abogado especialista en derecho laboral peruano..."
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
            {editingId ? 'Guardar cambios' : 'Crear asistente'}
          </button>
        </div>
      </form>
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
    <Modal title={editingId ? 'Editar prompt' : 'Nuevo prompt guardado'} icon={MessageSquare} onClose={onClose}>
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
          <select
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            className={inputClass}
          >
            {PROMPT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
