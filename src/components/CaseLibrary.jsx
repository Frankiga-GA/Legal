// src/components/CaseLibrary.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  Flame,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Upload,
  Table,
  Check,
  X,
  Loader2,
  Globe,
  HelpCircle,
  Sparkles,
  Inbox,
} from 'lucide-react';
import CreateCaseModal from './CreateCaseModal';
import { addCaseAsync, deleteCaseAsync, getCases, loadCases, resetCasesAsync, updateCaseAsync } from '../services/caseStore';
import { uploadDocumentToBackend } from '../services/documentBackendService';
import { extractResolutionDetails } from '../services/geminiService';

const CaseLibrary = ({ setActiveTab, onOpenCase, userId, focusTab: defaultFocusTab, onFocusTabChange }) => {
  const [cases, setCases] = useState(() => getCases());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todas');
  const [sortBy, setSortBy] = useState('urgencia'); // 'urgencia' | 'plazo' | 'reciente' | 'nombre'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dataSource, setDataSource] = useState('local');
  const [visibleCount, setVisibleCount] = useState(24);

  // Spreadsheet and Simplified UX states
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (default) | 'excel' | 'standard'
  const [editingCell, setEditingCell] = useState(null); // { caseId, field }
  const [editValue, setEditValue] = useState('');
  const [uploadingCaseId, setUploadingCaseId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null); // { caseId, latestProgress, hearingLink, urgency, newDeadlines }

  // Focus tab: HOY (default) / Todos / Activos / Pendientes / Cerrados
  const [focusTab, setFocusTabInternal] = useState(defaultFocusTab);
  const setFocusTab = (tab) => { setFocusTabInternal(tab); onFocusTabChange?.(tab); };

  // Onboarding: muestra una vez por usuario (key separada por userId)
  const onboardingKey = userId ? `lusti-onboarding-dismissed-${userId}` : 'lusti-onboarding-dismissed-anon';
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(onboardingKey) === 'true';
    } catch {
      return false;
    }
  });

  // Si cambia el userId (otro usuario logueado), resetear el flag
  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(onboardingKey) === 'true';
      setOnboardingDismissed(dismissed);
    } catch {
      setOnboardingDismissed(false);
    }
  }, [onboardingKey]);

  const handleSaveNewCase = async (newCase) => {
    const result = await addCaseAsync(cases, newCase);
    setCases(result.cases);
    setStatusMessage(result.error
      ? `Expediente ${newCase.id} guardado localmente. Supabase no respondió.`
      : `Expediente ${newCase.id} creado y guardado.`
    );
    dismissOnboarding();
  };

  const dismissOnboarding = () => {
    setOnboardingDismissed(true);
    try {
      window.localStorage.setItem(onboardingKey, 'true');
    } catch {
      // ignore quota errors
    }
  };

  const handleUpdateCase = async (caseId, changes) => {
    const result = await updateCaseAsync(cases, caseId, changes);
    setCases(result.cases);
    setStatusMessage(result.error
      ? 'Expediente actualizado localmente. Supabase no respondió.'
      : 'Expediente actualizado.'
    );
  };

  const handleDeleteCase = async (caseId) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el expediente ${caseId}? Esta acción borrará permanentemente todos sus documentos y datos.`)) {
      return;
    }
    const result = await deleteCaseAsync(cases, caseId);
    setCases(result.cases);
    setStatusMessage(result.error
      ? 'Expediente eliminado localmente. Supabase no respondió.'
      : `Expediente ${caseId} eliminado.`
    );
  };

  // Cambia el estado del expediente al siguiente en el ciclo: Activo → Pendiente → Cerrado → Activo
  const handleCycleStatus = async (e, caso) => {
    e.stopPropagation();
    const currentIndex = STATUS_CYCLE.indexOf(caso.status);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIndex];
    await handleUpdateCase(caso.id, { status: nextStatus });
  };

  const handleResetCases = async () => {
    const result = await resetCasesAsync();
    setCases(result.cases);
    setSearchTerm('');
    setTypeFilter('Todas');
    setFocusTab('todos');
    setStatusMessage(result.error
      ? 'Bóveda restaurada localmente. Supabase no respondió.'
      : 'Bóveda restaurada con los expedientes base.'
    );
    dismissOnboarding();
  };

  // Inline editing actions
  const startEditing = (caseId, field, value) => {
    setEditingCell({ caseId, field });
    setEditValue(value || '');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    const { caseId, field } = editingCell;
    await handleUpdateCase(caseId, { [field]: editValue });
    setEditingCell(null);
  };

  // Direct automatic upload flow (Subir resolución -> Analizar expediente -> resultado listo)
  const handleQuickUpload = async (e, caseId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCaseId(caseId);
    setUploadStatus('Extrayendo texto...');
    try {
      const backendResponse = await uploadDocumentToBackend(file);
      const extractedText = String(backendResponse?.extracted_text || '').trim();
      
      setUploadStatus('IA analizando resolución...');
      const aiDetails = await extractResolutionDetails(extractedText);
      
      const newDoc = {
        id: Date.now(),
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        date: new Date().toISOString().split('T')[0],
        type: file.type,
        excerpt: aiDetails.latestProgress,
        content: extractedText,
      };

      const caso = cases.find(c => c.id === caseId);
      const existingDocs = Array.isArray(caso.documents) ? caso.documents : [];
      const existingDates = Array.isArray(caso.importantDates) ? caso.importantDates : [];
      
      const newImportantDates = [...existingDates];
      if (Array.isArray(aiDetails.newDeadlines)) {
        aiDetails.newDeadlines.forEach((dl, index) => {
          newImportantDates.unshift({
            id: `ai-dl-${Date.now()}-${index}`,
            title: dl.title,
            date: dl.date,
            priority: dl.priority || 'Alta',
            status: 'Pendiente',
          });
        });
      }

      const changes = {
        latestProgress: aiDetails.latestProgress,
        hearingLink: aiDetails.hearingLink || caso.hearingLink || '',
        urgency: aiDetails.urgency || caso.urgency || 'Alta',
        documents: [...existingDocs, newDoc],
        importantDates: newImportantDates,
        isAiUpdated: true,
      };

      await handleUpdateCase(caseId, changes);
      setStatusMessage(`¡IA leyó la resolución y actualizó el expediente ${caseId}!`);

      // Instantly open the unified case workspace
      onOpenCase(caseId);
    } catch (error) {
      console.error('Error in quick upload:', error);
      setStatusMessage(`Error al procesar con IA: ${error.message}`);
    } finally {
      setUploadingCaseId(null);
      setUploadStatus('');
      e.target.value = '';
    }
  };

  useEffect(() => {
    let isMounted = true;

    loadCases().then((result) => {
      if (!isMounted) return;
      setCases(result.cases);
      setDataSource(result.source);
      if (result.error) {
        setStatusMessage('Supabase aún no está listo. Usando almacenamiento local.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!statusMessage) return;

    const timerId = window.setTimeout(() => setStatusMessage(''), 4500);
    return () => window.clearTimeout(timerId);
  }, [statusMessage]);

  const filteredCases = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return cases
      .filter(caso =>
        caso.clientName.toLowerCase().includes(normalizedSearch) ||
        caso.dni.includes(searchTerm) ||
        caso.id.toLowerCase().includes(normalizedSearch)
      )
      .filter(caso => {
        if (focusTab === 'hoy') {
          // HOY: solo lo que requiere atención inmediata (urgencia efectiva)
          const eff = getEffectiveUrgency(caso);
          if (eff === 'Alta') return true;
          const dates = Array.isArray(caso.importantDates) ? caso.importantDates : [];
          return dates.some(d => isDateActive(d) && isWithinHorizon(d.date, 3));
        }
        // Mapeo del tab de foco al filtro de status clásico
        if (focusTab === 'todos') return true;
        const statusMap = { activos: 'Activo', pendientes: 'Pendiente', cerrados: 'Cerrado' };
        return caso.status === statusMap[focusTab];
      })
      .filter(caso => typeFilter === 'Todas' || caso.type === typeFilter)
      .sort((a, b) => {
        // HOY siempre ordena por fecha más próxima primero
        if (focusTab === 'hoy') {
          const na = nextDateValue(a);
          const nb = nextDateValue(b);
          if (na && nb) return na - nb;
          if (na) return -1;
          if (nb) return 1;
        }
        // Orden seleccionado por el usuario
        if (sortBy === 'plazo') {
          const na = nextDateValue(a);
          const nb = nextDateValue(b);
          if (na && nb) return na - nb;
          if (na) return -1;
          if (nb) return 1;
        }
        if (sortBy === 'reciente') {
          return new Date(b.lastUpdate) - new Date(a.lastUpdate);
        }
        if (sortBy === 'nombre') {
          return String(a.clientName || '').localeCompare(String(b.clientName || ''), 'es', { sensitivity: 'base' });
        }
        // Default: 'urgencia' usando la urgencia efectiva (Alta > Media > Baja)
        const priorityScore = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
        const scoreA = priorityScore[getEffectiveUrgency(a)] || 2;
        const scoreB = priorityScore[getEffectiveUrgency(b)] || 2;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.lastUpdate) - new Date(a.lastUpdate);
      });
  }, [cases, searchTerm, focusTab, typeFilter, sortBy]);

  const displayedCases = filteredCases.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCases.length;

  useEffect(() => {
    setVisibleCount(24);
  }, [searchTerm, focusTab, typeFilter, sortBy]);

  const vaultStats = useMemo(() => {
    const totalDocs = cases.reduce((total, caso) => total + getCount(caso.documents), 0);
    const totalDates = cases.reduce((total, caso) => total + getCount(caso.importantDates), 0);

    return [
      { label: 'Total expedientes', value: cases.length },
      { label: 'Activos', value: cases.filter(caso => caso.status === 'Activo').length },
      { label: 'Pendientes', value: cases.filter(caso => caso.status === 'Pendiente').length },
      { label: 'Documentos', value: totalDocs },
      { label: 'Fechas', value: totalDates },
    ];
  }, [cases]);

  const statusOptions = ['Todos', ...Array.from(new Set(cases.map(caso => caso.status)))];
  const typeOptions = ['Todas', ...Array.from(new Set(cases.map(caso => caso.type)))];

  // statusOptions se mantiene para compatibilidad con restores/legacy
  void statusOptions;

  // Conteo de casos que requieren atención HOY (para badge del tab y saludo)
  const hoyCount = useMemo(() => {
    return cases.filter(caso => {
      const eff = getEffectiveUrgency(caso);
      if (eff === 'Alta') return true;
      const dates = Array.isArray(caso.importantDates) ? caso.importantDates : [];
      return dates.some(d => isDateActive(d) && isWithinHorizon(d.date, 3));
    }).length;
  }, [cases]);

  const greetingText = useMemo(() => formatGreeting(hoyCount), [hoyCount]);

  return (
    <div className="min-h-screen bg-brand-black p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory">Tus expedientes</h2>
            <p className="flex items-center gap-2 text-base font-medium tracking-wide text-brand-ivory/90">
              <CalendarDays className="h-4 w-4 text-brand-gold" />
              {greetingText}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-1 shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'cards'
                    ? 'bg-brand-gold text-brand-black shadow-md'
                    : 'text-brand-accent hover:text-brand-ivory'
                }`}
              >
                <Inbox className="h-3.5 w-3.5" />
                Tarjetas
              </button>
              <button
                onClick={() => setViewMode('excel')}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'excel'
                    ? 'bg-brand-gold text-brand-black shadow-md'
                    : 'text-brand-accent hover:text-brand-ivory'
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                Planilla
              </button>
              <button
                onClick={() => setViewMode('standard')}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'standard'
                    ? 'bg-brand-gold text-brand-black shadow-md'
                    : 'text-brand-accent hover:text-brand-ivory'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Estándar
              </button>
            </div>
            
            <button
              onClick={() => setActiveTab?.('ai-chat')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-5 py-3 text-sm font-semibold text-brand-accent hover:border-brand-gold/25 hover:text-brand-ivory transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Asistente IA
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-ivory px-6 py-3 font-bold tracking-tight text-brand-black transition-colors hover:bg-white"
            >
              <Plus className="h-5 w-5" />
              Crear expediente
            </button>
          </div>
        </header>

        {statusMessage && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-300">
            {statusMessage}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {vaultStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/[0.08] bg-white/[0.015] p-4">
              <p className="text-2xl font-serif text-brand-ivory">{stat.value}</p>
              <p className="mt-1 text-xs font-bold text-brand-accent">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Tabs de foco: HOY (default) / Todos / Activos / Pendientes / Cerrados */}
        <nav className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-1">
          {TABS.map((tab) => {
            const isHoy = tab.id === 'hoy';
            const isActive = focusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFocusTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-t-md px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                  isActive
                    ? isHoy
                      ? 'border-red-500/70 text-brand-ivory bg-white/[0.04]'
                      : 'border-brand-gold text-brand-ivory bg-white/[0.04]'
                    : 'border-transparent text-brand-accent hover:text-brand-ivory hover:bg-white/[0.02]'
                }`}
              >
                {isHoy && <Flame className={`h-3.5 w-3.5 ${isActive ? 'text-red-400' : 'text-brand-accent'}`} />}
                <span>{tab.label}</span>
                {isHoy && (
                  <span className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? hoyCount > 0
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/[0.06] text-brand-accent'
                  }`}>
                    {hoyCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="grid gap-4 xl:grid-cols-[1fr_180px_180px_auto]">
          <div className="group relative">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent transition-colors group-focus-within:text-brand-gold" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o DNI/RUC..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-4 pl-14 pr-6 font-light text-brand-ivory transition-all placeholder:text-brand-accent/60 focus:border-brand-gold/40 focus:bg-white/[0.04] focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <FilterSelect label="Materia" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
          <FilterSelect
            label="Ordenar"
            value={SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Urgencia'}
            onChange={(val) => {
              const found = SORT_OPTIONS.find(o => o.label === val);
              if (found) setSortBy(found.id);
            }}
            options={SORT_OPTIONS.map(o => o.label)}
          />
        </div>

        <div className="px-2 text-xs font-medium text-brand-accent">
          Mostrando <span className="text-brand-ivory font-bold">{displayedCases.length}</span> de <span className="text-brand-ivory font-bold">{filteredCases.length}</span> expedientes
          <span className="ml-3 text-emerald-400/80 font-medium inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${dataSource === 'local' ? 'bg-brand-gold' : 'bg-emerald-400'}`}></span>
            {dataSource === 'local' ? 'Guardado en este equipo' : 'Sincronizado en la nube'}
          </span>
        </div>

        {/* View Mode: Tarjetas (default) */}
        {viewMode === 'cards' ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCases.length > 0 ? (
              displayedCases.map((caso) => (
                <CaseCard
                  key={caso.id}
                  caso={caso}
                  isUploading={uploadingCaseId === caso.id}
                  uploadStatus={uploadStatus}
                  onOpen={() => onOpenCase(caso.id)}
                  onUpload={(e) => handleQuickUpload(e, caso.id)}
                  onCycleStatus={handleCycleStatus}
                />
              ))
            ) : (
              <div className="col-span-full rounded-lg border border-white/[0.08] bg-white/[0.015] px-8 py-16 text-center">
                {focusTab === 'hoy' ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-6 w-6 text-emerald-400" />
                    </div>
                    <p className="text-base font-semibold text-brand-ivory">Todo al día</p>
                    <p className="text-xs text-brand-accent">No tenés plazos urgentes para los próximos días.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Search className="h-10 w-10 text-brand-accent/20" />
                    <p className="text-sm font-light text-brand-accent">Sin resultados en la lista actual.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 24)}
                className="rounded-xl border border-white/[0.08] bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-accent transition-colors hover:border-brand-gold/30 hover:text-brand-ivory"
              >
                Ver más expedientes ({filteredCases.length - visibleCount} restantes)
              </button>
            </div>
          )}
          </>
        ) : viewMode === 'excel' ? (
          <>
          <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-brand-dark shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] bg-white/[0.02] px-6 py-3.5 gap-2">
              <div className="flex items-center gap-2 text-xs text-brand-gold">
                <HelpCircle className="h-4 w-4 flex-shrink-0" />
                <span>💡 <strong>Consejo rápido:</strong> Haz doble clic en las celdas de <strong>Avance (Resumen IA)</strong> o <strong>Audiencia Virtual</strong> para editarlas al instante.</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                Planilla de Gestión Activa
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                    <th className="border-r border-white/[0.08] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-accent">Expediente</th>
                    <th className="border-r border-white/[0.08] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-accent">Cliente</th>
                    <th className="border-r border-white/[0.08] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-accent">Materia</th>
                    <th className="border-r border-white/[0.08] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-accent">Estado</th>
                    <th className="border-r border-white/[0.08] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-accent w-[350px]">Avance Actual (Resumen IA)</th>
                    <th className="border-r border-white/[0.08] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-accent">Audiencia Virtual</th>
                    <th className="border-r border-white/[0.08] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-accent">Próximo Plazo</th>
                    <th className="border-r border-white/[0.08] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-brand-accent text-center">Urgencia</th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-brand-accent">Carga Directa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredCases.length > 0 ? (
                    displayedCases.map((caso) => {
                      const nextDate = getNextImportantDate(caso.importantDates);
                      const isUploading = uploadingCaseId === caso.id;
                      const urgencyRowClass = getUrgencyRowClass(getEffectiveUrgency(caso));

                      return (
                        <tr key={caso.id} className={`group transition-colors duration-150 ${urgencyRowClass} hover:!bg-white/[0.05]`}>
                          {/* Code */}
                          <td
                            className="border-r border-white/[0.08] px-4 py-3 font-serif font-medium text-brand-ivory cursor-pointer hover:underline"
                            onClick={() => onOpenCase(caso.id)}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{caso.id}</span>
                              {caso.isAiUpdated && (
                                <span className="rounded bg-brand-gold/15 px-1.5 py-0.5 text-[8px] font-bold text-brand-gold uppercase tracking-wider" title="Actualizado por la IA automáticamente">
                                  🤖 IA
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[9px] uppercase tracking-wider text-brand-accent font-sans">Act. {caso.lastUpdate}</div>
                          </td>

                          {/* Client con avatar */}
                          <td className="border-r border-white/[0.08] px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-wider ${getAvatarClass(caso.clientName)}`}>
                                {getInitials(caso.clientName)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-brand-ivory truncate max-w-[160px]">{caso.clientName}</div>
                                <div className="text-[10px] text-brand-accent">{caso.dni}</div>
                              </div>
                            </div>
                          </td>

                          {/* Materia */}
                          <td className="border-r border-white/[0.08] px-4 py-3">
                            <span className="inline-flex rounded bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 text-xs text-brand-accent">
                              {caso.type}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="border-r border-white/[0.08] px-4 py-3">
                            <StatusBadge status={caso.status} />
                          </td>

                          {/* Avance Actual (Editable) */}
                          <td 
                            className="border-r border-white/[0.08] px-4 py-3 text-xs leading-relaxed max-w-[350px] relative select-none"
                            onDoubleClick={() => startEditing(caso.id, 'latestProgress', caso.latestProgress)}
                          >
                            {editingCell?.caseId === caso.id && editingCell?.field === 'latestProgress' ? (
                              <div className="flex items-start gap-1.5">
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full rounded border border-brand-gold/40 bg-brand-dark p-1.5 text-xs text-brand-ivory outline-none focus:border-brand-gold"
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex flex-col gap-1.5 shrink-0">
                                  <button onClick={saveInlineEdit} className="rounded bg-emerald-500 p-1.5 text-brand-black hover:bg-emerald-400">
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => setEditingCell(null)} className="rounded bg-white/[0.08] p-1.5 text-brand-ivory hover:bg-white/[0.15]">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="group/cell flex items-start justify-between gap-3 cursor-pointer min-h-[2.5rem]" title={caso.latestProgress || 'Doble clic para editar'}>
                                <p className="text-brand-ivory/90 text-justify font-sans leading-snug line-clamp-3">{caso.latestProgress || 'Sin avance registrado. Sube una resolución para autocompletarla.'}</p>
                                <span className="opacity-0 group-hover/cell:opacity-100 text-[9px] text-brand-gold font-bold shrink-0 self-end border border-brand-gold/20 bg-brand-gold/5 px-1 py-0.5 rounded uppercase tracking-wider">
                                  Editar
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Link de Audiencia (Editable) */}
                          <td 
                            className="border-r border-white/[0.08] px-4 py-3 text-xs relative select-none"
                            onDoubleClick={() => startEditing(caso.id, 'hearingLink', caso.hearingLink)}
                          >
                            {editingCell?.caseId === caso.id && editingCell?.field === 'hearingLink' ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full rounded border border-brand-gold/40 bg-brand-dark px-1.5 py-1 text-xs text-brand-ivory outline-none focus:border-brand-gold"
                                  placeholder="https://..."
                                  autoFocus
                                />
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={saveInlineEdit} className="rounded bg-emerald-500 p-1 text-brand-black hover:bg-emerald-400">
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => setEditingCell(null)} className="rounded bg-white/[0.08] p-1 text-brand-ivory hover:bg-white/[0.15]">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="group/cell flex items-center justify-between gap-3 cursor-pointer min-h-[2rem]">
                                {caso.hearingLink ? (
                                  <a 
                                    href={caso.hearingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-semibold text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-all"
                                  >
                                    <Globe className="h-3.5 w-3.5" />
                                    <span>Ingresar</span>
                                  </a>
                                ) : (
                                  <span className="text-brand-accent italic font-semibold">Sin enlace</span>
                                )}
                                <span className="opacity-0 group-hover/cell:opacity-100 text-[9px] text-brand-gold font-bold shrink-0 border border-brand-gold/20 bg-brand-gold/5 px-1 py-0.5 rounded uppercase tracking-wider">
                                  Editar
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Plazo con countdown */}
                          <td className="border-r border-white/[0.08] px-4 py-3 text-xs">
                            {nextDate ? (() => {
                              const countdown = formatCountdown(nextDate.date);
                              return (
                                <div className="min-w-[150px]">
                                  <p className="font-semibold text-brand-ivory">{nextDate.title}</p>
                                  {countdown ? (
                                    <p className={`mt-1 font-bold ${toneClass[countdown.tone]}`}>
                                      {countdown.text}
                                    </p>
                                  ) : (
                                    <p className="mt-1 text-brand-accent">{nextDate.date}</p>
                                  )}
                                </div>
                              );
                            })() : (
                              <span className="text-brand-accent italic">Ninguno</span>
                            )}
                          </td>

                          {/* Urgencia */}
                          <td className="border-r border-white/[0.08] px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              getEffectiveUrgency(caso) === 'Alta'
                                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                : getEffectiveUrgency(caso) === 'Media'
                                  ? 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {getEffectiveUrgency(caso)}
                            </span>
                          </td>

                          {/* Acción: Carga Rápida (icono en hover) */}
                          <td className="px-4 py-3 text-center">
                            {isUploading ? (
                              <div className="flex flex-col items-center justify-center gap-1 min-w-[120px]">
                                <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                                <span className="text-[9px] font-bold text-brand-gold animate-pulse uppercase tracking-wider">{uploadStatus}</span>
                              </div>
                            ) : (
                              <div className="relative inline-block min-w-[120px] flex items-center justify-center gap-1">
                                {/* Indicador permanente: pequeño dot dorado si no tiene documentos */}
                                {(!Array.isArray(caso.documents) || caso.documents.length === 0) && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-brand-gold/60" title="Sin documentos todavía" />
                                )}
                                <label
                                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-brand-gold/30 bg-brand-gold/0 px-2 py-1.5 text-brand-gold opacity-0 transition-all duration-150 group-hover:border-brand-gold/60 group-hover:bg-brand-gold/15 group-hover:opacity-100 hover:!bg-brand-gold hover:!text-brand-black"
                                  title="Subir resolución"
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Subir</span>
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                    onChange={(e) => handleQuickUpload(e, caso.id)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-8 py-20 text-center">
                        {focusTab === 'hoy' ? (
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                              <Check className="h-6 w-6 text-emerald-400" />
                            </div>
                            <p className="text-base font-semibold text-brand-ivory">Todo al día</p>
                            <p className="text-xs text-brand-accent">No tenés plazos urgentes para los próximos días.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <Search className="h-10 w-10 text-brand-accent/20" />
                            <p className="text-sm font-light text-brand-accent">Sin resultados en la planilla actual.</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 24)}
                className="rounded-xl border border-white/[0.08] bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-accent transition-colors hover:border-brand-gold/30 hover:text-brand-ivory"
              >
                Ver más expedientes ({filteredCases.length - visibleCount} restantes)
              </button>
            </div>
          )}
          </>
        ) : (
          <>
          {/* View Mode Standard (Original UI with high contrast texts) */}
          <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.01]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-accent">Identificador</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-accent">Cliente</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-accent">Materia</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-accent">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-accent">Actividad</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-accent">Próximo vencimiento</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-brand-accent">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredCases.length > 0 ? (
                    displayedCases.map((caso) => {
                      const nextDate = getNextImportantDate(caso.importantDates);
                      const urgencyRowClass = getUrgencyRowClass(getEffectiveUrgency(caso));

                      return (
                        <tr key={caso.id} className={`group cursor-pointer transition-colors ${urgencyRowClass} hover:!bg-white/[0.05]`} onClick={() => onOpenCase(caso.id)}>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="rounded-lg bg-white/[0.03] p-2.5 transition-colors group-hover:bg-brand-gold/10">
                                <FileText className="h-4 w-4 text-brand-accent transition-colors group-hover:text-brand-gold" />
                              </div>
                              <div>
                                <span className="font-serif font-medium text-brand-ivory">{caso.id}</span>
                                <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-accent">Actualizado {caso.lastUpdate}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold tracking-wider ${getAvatarClass(caso.clientName)}`}>
                                {getInitials(caso.clientName)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-brand-ivory">{caso.clientName}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-accent">{caso.dni}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex rounded bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 text-xs text-brand-accent">
                              {caso.type}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <StatusBadge status={caso.status} />
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex min-w-[260px] items-center gap-3 text-brand-accent">
                              <ActivityPill icon={Upload} value={getCount(caso.documents)} label="docs" />
                              <ActivityPill icon={MessageSquare} value={getCount(caso.notes)} label="notas" />
                              <ActivityPill icon={CalendarClock} value={getCount(caso.importantDates)} label="fechas" />
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {nextDate ? (() => {
                              const countdown = formatCountdown(nextDate.date);
                              return (
                                <div className="min-w-[210px]">
                                  <div className="text-xs font-semibold text-brand-ivory">{nextDate.title}</div>
                                  <div className={`mt-1 text-[10px] uppercase tracking-wider font-bold ${countdown ? toneClass[countdown.tone] : 'text-brand-gold'}`}>
                                    {countdown ? countdown.text : `${nextDate.date} - ${nextDate.priority}`}
                                  </div>
                                </div>
                              );
                            })() : (
                              <span className="text-xs text-brand-accent/40 italic">Sin fecha registrada</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button className="text-brand-accent transition-colors group-hover:text-brand-gold" aria-label="Ver detalles">
                              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-8 py-20 text-center">
                        {focusTab === 'hoy' ? (
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                              <Check className="h-6 w-6 text-emerald-400" />
                            </div>
                            <p className="text-base font-semibold text-brand-ivory">Todo al día</p>
                            <p className="text-xs text-brand-accent">No tenés plazos urgentes para los próximos días.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <Search className="h-10 w-10 text-brand-accent/20" />
                            <p className="text-sm font-light text-brand-accent">Sin resultados en la base de datos actual.</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 24)}
                className="rounded-xl border border-white/[0.08] bg-brand-dark px-6 py-2.5 text-sm font-medium text-brand-accent transition-colors hover:border-brand-gold/30 hover:text-brand-ivory"
              >
                Ver más expedientes ({filteredCases.length - visibleCount} restantes)
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateCaseModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleSaveNewCase}
        />
      )}

      {!onboardingDismissed && (
        <OnboardingModal
          onDismiss={dismissOnboarding}
          onLoadDemo={handleResetCases}
          onCreateCase={() => {
            dismissOnboarding();
            setIsCreateModalOpen(true);
          }}
          onOpenAssistant={() => {
            dismissOnboarding();
            setActiveTab?.('ai-chat');
          }}
        />
      )}
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options }) => (
  <label className="relative flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 transition-all focus-within:border-brand-gold/40">
    <Filter className="h-4 w-4 shrink-0 text-brand-accent" />
    <span className="pointer-events-none min-w-0 flex-1 py-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-accent">
      {value}
    </span>
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-brand-dark text-brand-ivory">
          {option}
        </option>
      ))}
    </select>
    <ChevronDown className="h-4 w-4 shrink-0 text-brand-accent" />
  </label>
);

const StatusBadge = ({ status, onClick, title }) => {
  const content = (
    <>
      <div className={`h-2 w-2 rounded-full ${
        status === 'Activo' ? 'bg-emerald-500' :
        status === 'Pendiente' ? 'bg-brand-gold' :
        'bg-brand-accent/50'
      }`}></div>
      <span className="text-xs font-semibold text-brand-ivory/90">{status}</span>
      {onClick && <RotateCcw className="h-3 w-3 text-brand-accent/40 opacity-0 transition-opacity group-hover:opacity-100" />}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title || 'Clic para cambiar de estado'}
        className="group flex items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] px-2.5 py-0.5 transition-all hover:border-brand-gold/30 hover:bg-white/[0.05]"
      >
        {content}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {content}
    </div>
  );
};

const ActivityPill = ({ icon: Icon, value, label }) => (
  <div className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1">
    <Icon className="h-3.5 w-3.5 text-brand-gold" />
    <span className="text-xs font-semibold text-brand-accent">{value} {label}</span>
  </div>
);

const getCount = (value) => Array.isArray(value) ? value.length : 0;

const formatDataSource = (source) => {
  if (source === 'supabase') return 'Supabase';
  if (source === 'supabase-seeded') return 'Supabase (Inicial)';
  return 'Local';
};

const getNextImportantDate = (dates) => {
  if (!Array.isArray(dates) || dates.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Ignorar plazos completados: solo se muestran los pendientes como "próximo"
  const pending = dates.filter(item => isDateActive(item));
  if (pending.length === 0) return null;

  const upcoming = pending
    .filter(item => item.date)
    .map(item => ({ ...item, parsedDate: new Date(`${item.date}T00:00:00`) }))
    .filter(item => item.parsedDate >= today)
    .sort((a, b) => a.parsedDate - b.parsedDate);

  return upcoming[0] || pending[0];
};

// Devuelve true si la fecha (YYYY-MM-DD) ya venció o vence dentro de los próximos `dias` días.
const isWithinHorizon = (dateStr, dias = 3) => {
  if (!dateStr) return false;
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((target - today) / (1000 * 60 * 60 * 24));
  return diffDays <= dias;
};

// Próxima fecha importante como timestamp (para ordenar). Null si no hay.
const nextDateValue = (caso) => {
  const next = getNextImportantDate(caso.importantDates);
  if (!next?.date) return null;
  const parsed = new Date(`${next.date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const formatGreeting = (urgentCount) => {
  const today = new Date();
  const formatted = today.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const fecha = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  if (urgentCount === 0) {
    return `${fecha} · Todo al día, sin plazos urgentes.`;
  }
  const noun = urgentCount === 1 ? 'caso necesita' : 'casos necesitan';
  return `${fecha} · ${urgentCount} ${noun} tu atención.`;
};

const TABS = [
  { id: 'hoy', label: 'Hoy', shortLabel: 'Hoy' },
  { id: 'todos', label: 'Todos' },
  { id: 'activos', label: 'Activos' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'cerrados', label: 'Cerrados' },
];

const SORT_OPTIONS = [
  { id: 'urgencia', label: 'Urgencia' },
  { id: 'plazo', label: 'Próximo plazo' },
  { id: 'reciente', label: 'Más reciente' },
  { id: 'nombre', label: 'Nombre A-Z' },
];

const STATUS_CYCLE = ['Activo', 'Pendiente', 'Cerrado'];

// Devuelve 2 iniciales a partir del nombre del cliente.
// "Juan Pérez" -> "JP", "Restobar El Puerto E.I.R.L." -> "RE"
const getInitials = (name) => {
  if (!name) return '?';
  const cleaned = String(name).replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Paleta de colores para el avatar (cicla según hash del nombre)
const AVATAR_PALETTE = [
  'bg-brand-gold/20 text-brand-gold',
  'bg-emerald-500/20 text-emerald-300',
  'bg-sky-500/20 text-sky-300',
  'bg-purple-500/20 text-purple-300',
  'bg-rose-500/20 text-rose-300',
  'bg-amber-500/20 text-amber-300',
];

const getAvatarClass = (name) => {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

// Color de fondo sutil para la fila según urgencia
const getUrgencyRowClass = (urgency) => {
  if (urgency === 'Alta') return 'bg-red-500/[0.045]';
  if (urgency === 'Media') return 'bg-brand-gold/[0.035]';
  if (urgency === 'Baja') return 'bg-emerald-500/[0.025]';
  return '';
};

// Urgencia efectiva para el color de la card.
// Si la IA marcó "Alta" pero no hay plazos urgentes reales, baja a "Media".
// Un plazo es "urgente real" si: tiene priority 'Alta' O vence en los próximos 3 días O ya venció.
// Plazos ya completados (status === 'Completado') no cuentan como urgentes.
const isDateActive = (d) => d && d.status !== 'Completado';
const getEffectiveUrgency = (caso) => {
  const dates = Array.isArray(caso.importantDates) ? caso.importantDates : [];
  const hasRealUrgent = dates.some(d => isDateActive(d) && (d.priority === 'Alta' || isWithinHorizon(d.date, 3)));
  if (hasRealUrgent) return 'Alta';
  if (caso.urgency === 'Alta') return 'Media';
  return caso.urgency || 'Media';
};

// Formato de countdown legible para plazos: "Vence HOY", "Vence en 3 días", "Vencido hace 2 días"
const formatCountdown = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    const n = Math.abs(diffDays);
    return { text: n === 1 ? 'Vencido ayer' : `Vencido hace ${n} días`, tone: 'overdue' };
  }
  if (diffDays === 0) return { text: 'Vence HOY', tone: 'overdue' };
  if (diffDays === 1) return { text: 'Vence mañana', tone: 'soon' };
  if (diffDays <= 3) return { text: `Vence en ${diffDays} días`, tone: 'soon' };
  if (diffDays <= 30) return { text: `En ${diffDays} días`, tone: 'normal' };
  return { text: `En ${diffDays} días`, tone: 'normal' };
};

const toneClass = {
  overdue: 'text-red-400',
  soon: 'text-brand-gold',
  normal: 'text-brand-accent',
};

const CaseCard = ({ caso, isUploading, uploadStatus, onOpen, onUpload, onCycleStatus }) => {
  const nextDate = getNextImportantDate(caso.importantDates);
  const countdown = nextDate ? formatCountdown(nextDate.date) : null;
  const hasDocs = Array.isArray(caso.documents) && caso.documents.length > 0;
  // Urgencia visual: considera plazos reales, no solo lo que dijo la IA
  const effectiveUrgency = getEffectiveUrgency(caso);

  // Borde izquierdo de color según urgencia efectiva
  const urgencyBorder = effectiveUrgency === 'Alta'
    ? 'border-l-red-500/70'
    : effectiveUrgency === 'Media'
      ? 'border-l-brand-gold/70'
      : effectiveUrgency === 'Baja'
        ? 'border-l-emerald-500/70'
        : 'border-l-white/10';

  return (
    <article
      onClick={onOpen}
      className={`group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-xl border border-white/[0.08] border-l-4 ${urgencyBorder} bg-white/[0.015] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-white/[0.03] hover:shadow-xl hover:shadow-black/40`}
    >
      {/* Header: avatar + nombre + badge urgencia */}
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold tracking-wider ${getAvatarClass(caso.clientName)}`}>
          {getInitials(caso.clientName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-base font-medium text-brand-ivory" title={caso.clientName}>
                {caso.clientName}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-brand-accent">
                {caso.dni} · {caso.type}
              </p>
            </div>
            <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              effectiveUrgency === 'Alta'
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : effectiveUrgency === 'Media'
                  ? 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold'
                  : effectiveUrgency === 'Baja'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/[0.1] bg-white/[0.05] text-brand-accent'
            }`}>
              {effectiveUrgency}
            </span>
          </div>
        </div>
      </div>

      {/* Estado + IA badge */}
      <div className="flex items-center gap-2 text-[10px]">
        <StatusBadge status={caso.status} onClick={(e) => onCycleStatus(e, caso)} title="Clic para cambiar de estado" />
        {caso.isAiUpdated && (
          <span className="rounded bg-brand-gold/15 px-1.5 py-0.5 font-bold text-brand-gold uppercase tracking-wider" title="Actualizado por la IA">
            🤖 IA
          </span>
        )}
        {caso.hearingLink && (
          <a
            href={caso.hearingLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-full bg-brand-gold/15 px-2 py-0.5 font-semibold text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-all"
          >
            <Globe className="h-3 w-3" />
            <span>Audiencia</span>
          </a>
        )}
      </div>

      {/* Vista previa del avance (último resumen IA) */}
      {caso.latestProgress ? (
        <p className="line-clamp-2 text-[11px] leading-snug text-brand-accent/80" title={caso.latestProgress}>
          {caso.latestProgress}
        </p>
      ) : (
        <p className="text-[11px] italic text-brand-accent/40">
          Sin avance. Subí una resolución para que la IA lo complete.
        </p>
      )}

      {/* Próximo plazo */}
      {nextDate ? (
        <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-brand-accent/60">Próximo plazo</p>
          <p className="mt-1 truncate text-sm font-semibold text-brand-ivory" title={nextDate.title}>
            {nextDate.title}
          </p>
          {countdown && (
            <p className={`mt-1 text-xs font-bold ${toneClass[countdown.tone]}`}>
              {countdown.text}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/[0.06] bg-white/[0.01] p-3 text-center text-[11px] text-brand-accent/50 italic">
          Sin plazos registrados
        </div>
      )}

      {/* Footer: ID + última act + acción */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/[0.05] pt-3">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[11px] text-brand-gold">{caso.id}</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-wider text-brand-accent/60">
            Act. {caso.lastUpdate}
          </p>
        </div>
        {isUploading ? (
          <div className="flex items-center gap-1.5 text-brand-gold">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{uploadStatus || '...'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {!hasDocs && (
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold/60" title="Sin documentos" />
            )}
            <label
              onClick={(e) => e.stopPropagation()}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-brand-gold/30 bg-brand-gold/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-gold transition-all hover:border-brand-gold/60 hover:bg-brand-gold/20"
              title="Subir resolución"
            >
              <Upload className="h-3 w-3" />
              <span>Subir</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={onUpload}
                className="hidden"
              />
            </label>
            <ChevronRight className="h-4 w-4 text-brand-accent transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold" />
          </div>
        )}
      </div>
    </article>
  );
};

const OnboardingModal = ({ onDismiss, onLoadDemo, onCreateCase, onOpenAssistant }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/95 p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-brand-gold/20 bg-brand-dark shadow-2xl">
        <div className="border-b border-white/[0.05] p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/15">
              <Sparkles className="h-6 w-6 text-brand-gold" />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-medium text-brand-ivory">¡Bienvenido a LUSTI!</h2>
              <p className="mt-1 text-sm text-brand-accent">Tu nueva mesa de trabajo legal. ¿Cómo querés empezar?</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-8">
          <button
            type="button"
            onClick={onLoadDemo}
            className="flex w-full items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-brand-gold/30 hover:bg-white/[0.04]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
              <Inbox className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-ivory">Cargar expedientes de ejemplo</p>
              <p className="mt-1 text-xs text-brand-accent">3 casos demo para ver cómo se ve todo funcionando.</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-brand-accent" />
          </button>

          <button
            type="button"
            onClick={onCreateCase}
            className="flex w-full items-center gap-4 rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-5 text-left transition-all hover:border-brand-gold/50 hover:bg-brand-gold/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/20">
              <Plus className="h-5 w-5 text-brand-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-ivory">Crear mi primer expediente</p>
              <p className="mt-1 text-xs text-brand-accent">Empezá con un caso real. Solo 4 datos y listo.</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-brand-gold" />
          </button>

          <button
            type="button"
            onClick={onOpenAssistant}
            className="flex w-full items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-brand-gold/30 hover:bg-white/[0.04]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/15">
              <MessageSquare className="h-5 w-5 text-purple-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-ivory">Hablar con el Asistente IA</p>
              <p className="mt-1 text-xs text-brand-accent">Consultá dudas legales, redactá escritos o pedí resúmenes.</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-brand-accent" />
          </button>
        </div>

        <div className="flex justify-end border-t border-white/[0.05] bg-white/[0.01] p-6">
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-semibold uppercase tracking-widest text-brand-accent/60 transition-colors hover:text-brand-ivory"
          >
            Quizás después
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseLibrary;
