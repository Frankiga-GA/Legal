// src/components/CaseLibrary.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
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
} from 'lucide-react';
import CreateCaseModal from './CreateCaseModal';
import { addCaseAsync, deleteCaseAsync, getCases, loadCases, resetCasesAsync, updateCaseAsync } from '../services/caseStore';
import { uploadDocumentToBackend } from '../services/documentBackendService';
import { extractResolutionDetails } from '../services/geminiService';

const CaseLibrary = ({ setActiveTab, onOpenCase }) => {
  const [cases, setCases] = useState(() => getCases());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todas');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dataSource, setDataSource] = useState('local');

  // Spreadsheet and Simplified UX states
  const [viewMode, setViewMode] = useState('excel'); // default to 'excel' for direct IA value
  const [editingCell, setEditingCell] = useState(null); // { caseId, field }
  const [editValue, setEditValue] = useState('');
  const [uploadingCaseId, setUploadingCaseId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null); // { caseId, latestProgress, hearingLink, urgency, newDeadlines }

  const handleSaveNewCase = async (newCase) => {
    const result = await addCaseAsync(cases, newCase);
    setCases(result.cases);
    setStatusMessage(result.error
      ? `Expediente ${newCase.id} guardado localmente. Supabase no respondió.`
      : `Expediente ${newCase.id} creado y guardado.`
    );
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

  const handleResetCases = async () => {
    const result = await resetCasesAsync();
    setCases(result.cases);
    setSearchTerm('');
    setStatusFilter('Todos');
    setTypeFilter('Todas');
    setStatusMessage(result.error
      ? 'Bóveda restaurada localmente. Supabase no respondió.'
      : 'Bóveda restaurada con los expedientes base.'
    );
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
      .filter(caso => statusFilter === 'Todos' || caso.status === statusFilter)
      .filter(caso => typeFilter === 'Todas' || caso.type === typeFilter)
      .sort((a, b) => {
        // Sort by urgency priority (Alta -> Media -> Baja) then date
        const priorityScore = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
        const scoreA = priorityScore[a.urgency || 'Media'] || 2;
        const scoreB = priorityScore[b.urgency || 'Media'] || 2;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.lastUpdate) - new Date(a.lastUpdate);
      });
  }, [cases, searchTerm, statusFilter, typeFilter]);

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

  return (
    <div className="min-h-screen bg-brand-black p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory">Expedientes</h2>
            <p className="text-sm font-light tracking-wide text-brand-accent">
              Gestione y controle sus expedientes. Siga los plazos, enlaces de audiencias y resúmenes de avances generados automáticamente por la IA.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-1 shrink-0">
              <button
                onClick={() => setViewMode('excel')}
                className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'excel'
                    ? 'bg-brand-gold text-brand-black shadow-md'
                    : 'text-brand-accent hover:text-brand-ivory'
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                Planilla IA (Excel)
              </button>
              <button
                onClick={() => setViewMode('standard')}
                className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'standard'
                    ? 'bg-brand-gold text-brand-black shadow-md'
                    : 'text-brand-accent hover:text-brand-ivory'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Vista Estándar
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
          <FilterSelect label="Estado" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <FilterSelect label="Materia" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
          <button
            type="button"
            onClick={handleResetCases}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-5 py-4 text-sm font-semibold text-brand-accent hover:bg-white/[0.05] hover:text-brand-ivory transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Demo
          </button>
        </div>

        <div className="px-2 text-xs font-medium text-brand-accent">
          Mostrando <span className="text-brand-ivory font-bold">{filteredCases.length}</span> de <span className="text-brand-ivory font-bold">{cases.length}</span> expedientes
          <span className="ml-3 text-brand-gold font-bold">Base de Datos: {formatDataSource(dataSource)}</span>
        </div>

        {/* View Mode Excel (Spreadsheet) */}
        {viewMode === 'excel' ? (
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
                    filteredCases.map((caso) => {
                      const nextDate = getNextImportantDate(caso.importantDates);
                      const isUploading = uploadingCaseId === caso.id;

                      return (
                        <tr key={caso.id} className="group hover:bg-white/[0.02] transition-colors duration-150">
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

                          {/* Client */}
                          <td className="border-r border-white/[0.08] px-4 py-3">
                            <div className="font-semibold text-brand-ivory">{caso.clientName}</div>
                            <div className="text-[10px] text-brand-accent">{caso.dni}</div>
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
                              <div className="group/cell flex items-start justify-between gap-3 cursor-pointer min-h-[2.5rem]" title="Doble clic para editar">
                                <p className="text-brand-ivory/90 text-justify font-sans">{caso.latestProgress || 'Sin avance registrado. Sube una resolución para autocompletarla.'}</p>
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

                          {/* Plazo */}
                          <td className="border-r border-white/[0.08] px-4 py-3 text-xs">
                            {nextDate ? (
                              <div className="min-w-[150px]">
                                <p className="font-semibold text-brand-ivory">{nextDate.title}</p>
                                <p className="mt-1 text-brand-gold font-bold">{nextDate.date}</p>
                              </div>
                            ) : (
                              <span className="text-brand-accent italic">Ninguno</span>
                            )}
                          </td>

                          {/* Urgencia */}
                          <td className="border-r border-white/[0.08] px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              caso.urgency === 'Alta'
                                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                : caso.urgency === 'Media'
                                  ? 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {caso.urgency || 'Media'}
                            </span>
                          </td>

                          {/* Acción: Carga Rápida */}
                          <td className="px-4 py-3 text-center">
                            {isUploading ? (
                              <div className="flex flex-col items-center justify-center gap-1 min-w-[120px]">
                                <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                                <span className="text-[9px] font-bold text-brand-gold animate-pulse uppercase tracking-wider">{uploadStatus}</span>
                              </div>
                            ) : (
                              <div className="relative inline-block min-w-[120px]">
                                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded bg-brand-gold px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-black hover:bg-brand-ivory transition-colors">
                                  <Upload className="h-3 w-3" />
                                  Subir Resolución
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
                      <td colSpan="9" className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <Search className="h-10 w-10 text-brand-accent/20" />
                          <p className="text-sm font-light text-brand-accent">Sin resultados en la planilla actual.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* View Mode Standard (Original UI with high contrast texts) */
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
                    filteredCases.map((caso) => {
                      const nextDate = getNextImportantDate(caso.importantDates);

                      return (
                        <tr key={caso.id} className="group cursor-pointer transition-colors hover:bg-white/[0.02]" onClick={() => onOpenCase(caso.id)}>
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
                            <div className="text-sm font-semibold text-brand-ivory">{caso.clientName}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-accent">{caso.dni}</div>
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
                            {nextDate ? (
                              <div className="min-w-[210px]">
                                <div className="text-xs font-semibold text-brand-ivory">{nextDate.title}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-gold font-bold">{nextDate.date} - {nextDate.priority}</div>
                              </div>
                            ) : (
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
                      <td colSpan="7" className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <Search className="h-10 w-10 text-brand-accent/20" />
                          <p className="text-sm font-light text-brand-accent">Sin resultados en la base de datos actual.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateCaseModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleSaveNewCase}
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

const StatusBadge = ({ status }) => (
  <div className="flex items-center gap-2">
    <div className={`h-2 w-2 rounded-full ${
      status === 'Activo' ? 'bg-emerald-500' :
      status === 'Pendiente' ? 'bg-brand-gold' :
      'bg-brand-accent/50'
    }`}></div>
    <span className="text-xs font-semibold text-brand-ivory/90">{status}</span>
  </div>
);

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

  const upcoming = dates
    .filter(item => item.date)
    .map(item => ({ ...item, parsedDate: new Date(`${item.date}T00:00:00`) }))
    .filter(item => item.parsedDate >= today)
    .sort((a, b) => a.parsedDate - b.parsedDate);

  return upcoming[0] || dates[0];
};

export default CaseLibrary;
