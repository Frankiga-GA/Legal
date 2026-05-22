import { useEffect, useMemo, useState } from 'react';
import { Bot, ChevronRight, Edit3, FolderOpen, Plus, Search, Sparkles, Trash2, Upload, X } from 'lucide-react';
import BotChat from './BotChat';

const ASSISTANTS_STORAGE_KEY = 'lusti-assistants';
const TEMPLATES_STORAGE_KEY = 'lusti-assistant-templates';

const defaultTemplates = [
  { id: 'tpl-job-offer', name: 'Oferta de trabajo', category: 'RRHH', description: 'Plantilla para publicar vacantes.', prompt: 'Redacta una oferta de trabajo clara, atractiva y profesional.' },
  { id: 'tpl-formal-letter', name: 'Carta formal', category: 'Legal', description: 'Formato para comunicaciones formales.', prompt: 'Redacta una carta formal con tono profesional.' },
  { id: 'tpl-brief-report', name: 'Informe breve', category: 'Análisis', description: 'Resumen ejecutivo y directo.', prompt: 'Redacta un informe breve, ordenado y fácil de leer.' },
  { id: 'tpl-summary', name: 'Resumen ejecutivo', category: 'Dirección', description: 'Sintetiza hallazgos y conclusiones.', prompt: 'Resume la información en formato ejecutivo.' },
];

const defaultAssistants = [
  { id: 1, name: 'Experto Laboral', description: 'Especializado en disputas laborales, liquidaciones y beneficios sociales.', templates: ['tpl-brief-report', 'tpl-formal-letter'], documents: 12 },
  { id: 2, name: 'Contratos Civiles', description: 'Análisis de arrendamientos, compraventas y fianzas.', templates: ['tpl-formal-letter'], documents: 8 },
];

const makeAssistantId = () => `assistant-${Date.now()}`;

const normalizeTemplate = (template) => ({
  id: template.id,
  name: template.name || 'Plantilla sin nombre',
  category: template.category || 'General',
  description: template.description || '',
  prompt: template.prompt || '',
});

const normalizeAssistant = (assistant) => ({
  id: assistant.id,
  name: assistant.name || 'Asistente sin nombre',
  description: assistant.description || 'Asistente general',
  templates: Array.isArray(assistant.templates) ? assistant.templates : [],
  documents: Number(assistant.documents || 0),
});

const readLocal = (key, fallback) => {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const ManagerBot = () => {
  const [activeView, setActiveView] = useState('assistants');
  const [assistants, setAssistants] = useState(defaultAssistants);
  const [templates, setTemplates] = useState(defaultTemplates);
  const [search, setSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingAssistantId, setEditingAssistantId] = useState(null);
  const [activeBot, setActiveBot] = useState(null);
  const [newAssistant, setNewAssistant] = useState({
    name: '',
    description: '',
    templates: [],
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'General',
    description: '',
    prompt: '',
  });

  useEffect(() => {
    const storedAssistants = readLocal(ASSISTANTS_STORAGE_KEY, defaultAssistants).map(normalizeAssistant);
    const storedTemplates = readLocal(TEMPLATES_STORAGE_KEY, defaultTemplates).map(normalizeTemplate);

    setAssistants(storedAssistants.length ? storedAssistants : defaultAssistants);
    setTemplates(storedTemplates.length ? storedTemplates : defaultTemplates);
  }, []);

  useEffect(() => {
    writeLocal(ASSISTANTS_STORAGE_KEY, assistants);
  }, [assistants]);

  useEffect(() => {
    writeLocal(TEMPLATES_STORAGE_KEY, templates);
  }, [templates]);

  const filteredAssistants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assistants;
    return assistants.filter((assistant) => {
      const templateNames = assistant.templates
        .map((templateId) => templates.find((template) => template.id === templateId)?.name || '')
        .join(' ');
      return [assistant.name, assistant.description, templateNames].join(' ').toLowerCase().includes(term);
    });
  }, [assistants, templates, search]);

  const filteredTemplates = useMemo(() => {
    const term = templateSearch.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((template) =>
      [template.name, template.category, template.description].join(' ').toLowerCase().includes(term)
    );
  }, [templates, templateSearch]);

  const persistAssistant = (nextAssistants) => {
    setAssistants(nextAssistants);
  };

  const persistTemplate = (nextTemplates) => {
    setTemplates(nextTemplates);
  };

  const resetAssistantForm = () => {
    setNewAssistant({ name: '', description: '', templates: [] });
    setEditingAssistantId(null);
    setIsCreating(false);
  };

  const handleSaveAssistant = async (e) => {
    e.preventDefault();
    if (!newAssistant.name.trim()) return;

    const payload = {
      id: editingAssistantId || makeAssistantId(),
      name: newAssistant.name.trim(),
      description: newAssistant.description.trim() || 'Asistente general',
      templates: newAssistant.templates,
      documents: 0,
    };

    const nextAssistants = editingAssistantId
      ? assistants.map((assistant) => (assistant.id === editingAssistantId ? payload : assistant))
      : [payload, ...assistants];

    persistAssistant(nextAssistants);
    resetAssistantForm();
  };

  const handleEditAssistant = (assistant) => {
    setEditingAssistantId(assistant.id);
    setNewAssistant({
      name: assistant.name,
      description: assistant.description,
      templates: assistant.templates || [],
    });
    setIsCreating(true);
  };

  const deleteAssistant = async (id) => {
    const nextAssistants = assistants.filter((assistant) => assistant.id !== id);
    persistAssistant(nextAssistants);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;

    const nextTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTemplate.name.trim(),
      category: newTemplate.category.trim() || 'General',
      description: newTemplate.description.trim(),
      prompt: newTemplate.prompt.trim(),
    };

    persistTemplate([nextTemplate, ...templates]);
    setNewTemplate({ name: '', category: 'General', description: '', prompt: '' });
  };

  const toggleTemplateForAssistant = (templateId) => {
    setNewAssistant((current) => {
      const selected = current.templates.includes(templateId)
        ? current.templates.filter((id) => id !== templateId)
        : [...current.templates, templateId];

      return { ...current, templates: selected };
    });
  };

  const deleteTemplate = async (templateId) => {
    const nextTemplates = templates.filter((template) => template.id !== templateId);
    persistTemplate(nextTemplates);
    setAssistants((current) =>
      current.map((assistant) => ({
        ...assistant,
        templates: assistant.templates.filter((id) => id !== templateId),
      }))
    );
  };

  const openAssistant = (assistant) => {
    const assistantTemplates = templates.filter((template) => assistant.templates.includes(template.id));
    setActiveBot({
      id: assistant.id,
      name: assistant.name,
      description: assistant.description,
      templates: assistantTemplates,
      docs: assistant.documents || 0,
      allTemplates: templates,
    });
  };

  if (activeBot) {
    return <BotChat bot={activeBot} onBack={() => setActiveBot(null)} />;
  }

  return (
    <div className="relative min-h-screen bg-brand-black p-8 md:p-12">
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-brand-gold/5 blur-[150px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-6 border-b border-white/[0.05] pb-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-gold" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-brand-gold">Asistencia legal especializada</span>
            </div>
            <h2 className="flex items-center gap-4 text-5xl font-serif font-medium tracking-tight text-brand-ivory">
              Asistentes legales
            </h2>
            <p className="text-sm font-light tracking-wide text-brand-accent/40">
              Crea asistentes, asigna plantillas y guarda formatos listos para reutilizar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveView('assistants')}
              className={`rounded-lg border px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'assistants' ? 'border-brand-gold bg-brand-gold text-brand-black' : 'border-white/[0.08] bg-white/[0.02] text-brand-ivory hover:border-brand-gold/30'}`}
            >
              Asistentes
            </button>
            <button
              type="button"
              onClick={() => setActiveView('templates')}
              className={`rounded-lg border px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'templates' ? 'border-brand-gold bg-brand-gold text-brand-black' : 'border-white/[0.08] bg-white/[0.02] text-brand-ivory hover:border-brand-gold/30'}`}
            >
              Plantillas
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-3 rounded-lg bg-brand-gold px-6 py-3 font-bold tracking-tight text-brand-black transition-all hover:bg-white"
            >
              <Plus className="h-5 w-5" />
              Crear asistente
            </button>
          </div>
        </header>

        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            <Search className="h-4 w-4 text-brand-accent/30" />
            <input
              value={activeView === 'assistants' ? search : templateSearch}
              onChange={(e) => (activeView === 'assistants' ? setSearch(e.target.value) : setTemplateSearch(e.target.value))}
              placeholder={activeView === 'assistants' ? 'Buscar asistentes o plantillas asignadas...' : 'Buscar plantillas...'}
              className="w-full bg-transparent text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
            />
          </div>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-brand-accent/35">
            <span>{assistants.length} asistentes</span>
            <span>•</span>
            <span>{templates.length} plantillas</span>
            <span>•</span>
            <span>Guardado localmente</span>
          </div>
        </div>

        {activeView === 'assistants' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssistants.map((assistant) => {
              const assistantTemplates = templates.filter((template) => assistant.templates.includes(template.id));

              return (
                <div key={assistant.id} className="glass-card relative flex h-full flex-col rounded-lg border border-white/[0.05] bg-white/[0.01] p-8 shadow-2xl transition-all hover:border-brand-gold/30">
                  <div className="mb-8 flex items-start justify-between">
                    <div className="rounded-lg bg-brand-gold/10 p-4 text-brand-gold transition-all">
                      <Bot className="h-6 w-6" />
                    </div>
                    <button onClick={() => deleteAssistant(assistant.id)} className="text-brand-accent/20 transition-colors hover:text-red-500/60">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="mb-3 text-2xl font-serif font-medium text-brand-ivory transition-colors group-hover:text-brand-gold">
                    {assistant.name}
                  </h3>
                  <p className="mb-6 flex-1 text-sm font-light leading-relaxed text-brand-accent/40">
                    {assistant.description}
                  </p>

                  <div className="mb-6 space-y-3 border-t border-white/[0.05] pt-6">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-gold">
                      <Sparkles className="h-3 w-3" />
                      Plantillas asignadas
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {assistantTemplates.length ? assistantTemplates.map((template) => (
                        <span key={template.id} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-widest text-brand-ivory/70">
                          {template.name}
                        </span>
                      )) : (
                        <span className="text-xs font-light text-brand-accent/30">Sin plantillas asignadas</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.05] pt-6">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-gold font-bold">
                      <FolderOpen className="h-3 w-3" />
                      {assistant.documents} documentos
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditAssistant(assistant)}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => openAssistant(assistant)}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-ivory px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-brand-black transition-all hover:bg-white"
                      >
                        Consultar
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-serif font-medium text-brand-ivory">{template.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-brand-gold">{template.category}</p>
                    </div>
                    <button onClick={() => deleteTemplate(template.id)} className="text-brand-accent/20 transition-colors hover:text-red-500/60">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mb-4 text-sm font-light leading-relaxed text-brand-accent/40">{template.description}</p>
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 text-xs text-brand-ivory/60">
                    {template.prompt}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSaveTemplate} className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-6">
              <h3 className="mb-4 text-2xl font-serif font-medium text-brand-ivory">Nueva plantilla</h3>
              <div className="space-y-4">
                <input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Nombre de la plantilla"
                  className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
                <input
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  placeholder="Categoría"
                  className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Descripción breve"
                  className="h-24 w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
                <textarea
                  value={newTemplate.prompt}
                  onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                  placeholder="Instrucción base de la plantilla"
                  className="h-28 w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
                <button type="submit" className="w-full rounded-lg bg-brand-gold px-4 py-3 font-bold text-brand-black transition-all hover:bg-white">
                  Guardar plantilla
                </button>
              </div>
            </form>
          </div>
        )}

        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/90 p-6 backdrop-blur-xl">
            <div className="w-full max-w-3xl rounded-lg border border-white/[0.05] bg-brand-dark p-8 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-serif font-medium text-brand-ivory">
                    {editingAssistantId ? 'Editar asistente' : 'Crear asistente legal'}
                  </h3>
                  <p className="mt-2 text-sm font-light text-brand-accent/40">
                    Selecciona las plantillas que este asistente podrá usar o recomendar.
                  </p>
                </div>
                <button onClick={resetAssistantForm} className="text-brand-accent/40 transition-colors hover:text-brand-ivory">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSaveAssistant} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Nombre del asistente</label>
                  <input
                    type="text"
                    value={newAssistant.name}
                    onChange={(e) => setNewAssistant({ ...newAssistant, name: e.target.value })}
                    placeholder="Ej. Experto en ofertas de trabajo"
                    className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Especialidad y alcance</label>
                  <textarea
                    value={newAssistant.description}
                    onChange={(e) => setNewAssistant({ ...newAssistant, description: e.target.value })}
                    placeholder="Define para qué sirve este asistente y qué tipo de ayuda dará..."
                    className="h-32 w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/20"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Plantillas asignadas</label>
                    <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">{newAssistant.templates.length} seleccionadas</span>
                  </div>
                  <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 md:grid-cols-2">
                    {templates.map((template) => {
                      const selected = newAssistant.templates.includes(template.id);
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => toggleTemplateForAssistant(template.id)}
                          className={`rounded-lg border p-4 text-left transition-all ${selected ? 'border-brand-gold bg-brand-gold/10' : 'border-white/[0.05] bg-white/[0.02] hover:border-brand-gold/30'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-semibold text-brand-ivory">{template.name}</h4>
                              <p className="text-[10px] uppercase tracking-widest text-brand-gold">{template.category}</p>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">{selected ? 'Activa' : 'Añadir'}</span>
                          </div>
                          <p className="mt-3 text-xs font-light leading-relaxed text-brand-accent/40">{template.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Documentos de referencia</label>
                  <div className="cursor-pointer rounded-xl border border-dashed border-white/[0.1] p-10 text-center transition-all hover:bg-white/[0.02]">
                    <Upload className="mx-auto mb-4 h-8 w-8 text-brand-accent/20 transition-colors" />
                    <p className="text-xs font-light text-brand-accent/40">Sube documentos PDF o DOCX para que el asistente los use como contexto</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={resetAssistantForm} className="flex-1 rounded-lg border border-white/[0.08] px-4 py-4 font-bold tracking-tight text-brand-ivory transition-all hover:border-brand-gold/30">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 rounded-lg bg-brand-ivory px-4 py-4 font-bold tracking-tight text-brand-black transition-all hover:bg-white">
                    Guardar asistente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerBot;
