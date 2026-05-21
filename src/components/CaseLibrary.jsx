// src/components/CaseLibrary.jsx
import { useEffect, useMemo, useState } from 'react';
import {
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
} from 'lucide-react';
import CaseDetailDrawer from './CaseDetailDrawer';
import CreateCaseModal from './CreateCaseModal';
import { addCaseAsync, getCases, loadCases, resetCasesAsync, updateCaseAsync } from '../services/caseStore';

const CaseLibrary = () => {
  const [cases, setCases] = useState(() => getCases());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todas');
  const [selectedCase, setSelectedCase] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dataSource, setDataSource] = useState('local');

  const handleSaveNewCase = async (newCase) => {
    const result = await addCaseAsync(cases, newCase);
    setCases(result.cases);
    setStatusMessage(result.error
      ? `Expediente ${newCase.id} guardado localmente. Supabase no respondio.`
      : `Expediente ${newCase.id} creado y guardado.`
    );
  };

  const handleUpdateCase = async (caseId, changes) => {
    const result = await updateCaseAsync(cases, caseId, changes);
    setCases(result.cases);
    setSelectedCase(result.updatedCase);
    setStatusMessage(result.error
      ? 'Expediente actualizado localmente. Supabase no respondio.'
      : 'Expediente actualizado.'
    );
  };

  const handleResetCases = async () => {
    const result = await resetCasesAsync();
    setCases(result.cases);
    setSelectedCase(null);
    setSearchTerm('');
    setStatusFilter('Todos');
    setTypeFilter('Todas');
    setStatusMessage(result.error
      ? 'Boveda restaurada localmente. Supabase no respondio.'
      : 'Boveda restaurada con los expedientes base.'
    );
  };

  useEffect(() => {
    let isMounted = true;

    loadCases().then((result) => {
      if (!isMounted) return;
      setCases(result.cases);
      setDataSource(result.source);
      if (result.error) {
        setStatusMessage('Supabase aun no esta listo. Usando almacenamiento local.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!statusMessage) return;

    const timerId = window.setTimeout(() => setStatusMessage(''), 3500);
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
      .sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
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
            <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory">Boveda de Expedientes</h2>
            <p className="text-sm font-light tracking-wide text-brand-accent/60">
              Gestiona casos, documentos, vencimientos y actividad del estudio desde una sola vista.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-ivory px-6 py-3 font-semibold tracking-tight text-brand-black shadow-lg transition-all hover:bg-white"
          >
            <Plus className="h-5 w-5" />
            Nuevo Registro
          </button>
        </header>

        {statusMessage && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            {statusMessage}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {vaultStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
              <p className="text-2xl font-serif text-brand-ivory">{stat.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/45">{stat.label}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-[1fr_180px_180px_auto]">
          <div className="group relative">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/40 transition-colors group-focus-within:text-brand-gold" />
            <input
              type="text"
              placeholder="Buscar por codigo, cliente o identificacion..."
              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] py-4 pl-14 pr-6 font-light text-brand-ivory transition-all placeholder:text-brand-accent/20 focus:border-brand-gold/40 focus:bg-white/[0.04] focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <FilterSelect label="Estado" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <FilterSelect label="Materia" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
          <button
            type="button"
            onClick={handleResetCases}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-brand-accent/60 transition-all hover:bg-white/[0.05] hover:text-brand-ivory"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Demo
          </button>
        </div>

        <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-accent/40">
          Mostrando <span className="text-brand-ivory">{filteredCases.length}</span> de <span className="text-brand-ivory">{cases.length}</span> expedientes
          <span className="ml-3 text-brand-gold">Fuente: {formatDataSource(dataSource)}</span>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/[0.05] bg-white/[0.01]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60">Identificador</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60">Cliente</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60">Materia</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60">Estado</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60">Actividad</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60">Proximo vencimiento</th>
                  <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-brand-accent/60">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredCases.length > 0 ? (
                  filteredCases.map((caso) => {
                    const nextDate = getNextImportantDate(caso.importantDates);

                    return (
                      <tr key={caso.id} className="group cursor-pointer transition-colors hover:bg-white/[0.03]" onClick={() => setSelectedCase(caso)}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-white/[0.03] p-2.5 transition-colors group-hover:bg-brand-gold/10">
                              <FileText className="h-4 w-4 text-brand-accent transition-colors group-hover:text-brand-gold" />
                            </div>
                            <div>
                              <span className="font-serif font-medium text-brand-ivory">{caso.id}</span>
                              <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-accent/30">Actualizado {caso.lastUpdate}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-medium text-brand-ivory/80">{caso.clientName}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-accent/40">{caso.dni}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/65">
                            {caso.type}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <StatusBadge status={caso.status} />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex min-w-[260px] items-center gap-3 text-brand-accent/45">
                            <ActivityPill icon={Upload} value={getCount(caso.documents)} label="docs" />
                            <ActivityPill icon={MessageSquare} value={getCount(caso.notes)} label="notas" />
                            <ActivityPill icon={CalendarClock} value={getCount(caso.importantDates)} label="fechas" />
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {nextDate ? (
                            <div className="min-w-[210px]">
                              <div className="text-xs font-medium text-brand-ivory/75">{nextDate.title}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-wider text-brand-gold">{nextDate.date} - {nextDate.priority}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-brand-accent/25">Sin fecha registrada</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="text-brand-accent/20 transition-colors group-hover:text-brand-gold">
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
                        <Search className="h-10 w-10 text-brand-accent/10" />
                        <p className="text-sm font-light text-brand-accent/40">Sin resultados en la base de datos actual.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedCase && (
        <>
          <div
            className="fixed inset-0 z-40 bg-brand-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setSelectedCase(null)}
          ></div>
          <CaseDetailDrawer
            caseData={selectedCase}
            onClose={() => setSelectedCase(null)}
            onUpdate={handleUpdateCase}
          />
        </>
      )}

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
  <label className="relative flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 transition-all focus-within:border-brand-gold/40">
    <Filter className="h-4 w-4 shrink-0 text-brand-accent/35" />
    <span className="pointer-events-none min-w-0 flex-1 py-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-accent/70">
      {value}
    </span>
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-brand-dark">
          {option}
        </option>
      ))}
    </select>
    <ChevronDown className="h-4 w-4 shrink-0 text-brand-accent/35" />
  </label>
);

const StatusBadge = ({ status }) => (
  <div className="flex items-center gap-2">
    <div className={`h-1.5 w-1.5 rounded-full ${
      status === 'Activo' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
      status === 'Pendiente' ? 'bg-brand-gold shadow-[0_0_8px_rgba(197,160,89,0.4)]' :
      'bg-brand-accent/40'
    }`}></div>
    <span className="text-xs font-light text-brand-accent/80">{status}</span>
  </div>
);

const ActivityPill = ({ icon: Icon, value, label }) => (
  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
    <Icon className="h-3.5 w-3.5 text-brand-gold/70" />
    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-accent/60">{value} {label}</span>
  </div>
);

const getCount = (value) => Array.isArray(value) ? value.length : 0;

const formatDataSource = (source) => {
  if (source === 'supabase') return 'Supabase';
  if (source === 'supabase-seeded') return 'Supabase inicializado';
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
