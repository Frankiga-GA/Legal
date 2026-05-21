import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  FileText,
  FolderOpen,
  MessageSquare,
  Newspaper,
  Plus,
  UploadCloud,
} from 'lucide-react';
import { getCases, loadCases } from '../services/caseStore';

const Dashboard = ({ setActiveTab }) => {
  const [cases, setCases] = useState(() => getCases());

  useEffect(() => {
    let isMounted = true;

    loadCases().then((result) => {
      if (isMounted) setCases(result.cases);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCases = cases.filter(caso => caso.status === 'Activo');
  const pendingCases = cases.filter(caso => caso.status === 'Pendiente');
  const indexedDocs = cases.reduce((total, caso) => total + (caso.documents?.length || 0), 0);
  const upcomingDeadlines = getUpcomingDeadlines(cases);
  const weekDeadlines = upcomingDeadlines.filter(item => item.daysUntil <= 7);
  const urgentDeadlines = upcomingDeadlines.filter(item => item.daysUntil <= 1 || item.priority === 'Alta');

  const stats = [
    {
      title: 'Expedientes activos',
      value: activeCases.length.toString().padStart(2, '0'),
      detail: `${pendingCases.length} pendientes por revisar`,
      icon: FolderOpen,
    },
    {
      title: 'Documentos vinculados',
      value: indexedDocs.toString().padStart(2, '0'),
      detail: 'Listos para analisis por caso',
      icon: FileText,
    },
    {
      title: 'Alertas de la semana',
      value: weekDeadlines.length.toString().padStart(2, '0'),
      detail: `${urgentDeadlines.length} requieren atencion`,
      icon: Bell,
    },
    {
      title: 'Consultas IA',
      value: '18',
      detail: 'Borradores y resumenes asistidos',
      icon: MessageSquare,
    },
  ];

  const priorityCases = cases.slice(0, 4).map((caso, index) => ({
    ...caso,
    nextStep: [
      'Validar documentos pendientes',
      'Preparar borrador de respuesta',
      'Revisar ultima actuacion',
      'Actualizar resumen ejecutivo',
    ][index] || 'Revisar seguimiento',
  }));

  const legalAlerts = [
    { id: 1, source: 'El Peruano', title: 'Nueva norma laboral detectada', time: 'Hace 20 min', type: 'Norma legal' },
    { id: 2, source: 'Jurisprudencia', title: 'Criterio reciente sobre despido motivado', time: 'Hace 2 h', type: 'TC' },
    { id: 3, source: 'Agenda interna', title: `${upcomingDeadlines.length} vencimientos registrados`, time: 'Hoy', type: 'Gestion' },
  ];

  const quickActions = [
    { label: 'Nuevo expediente', icon: Plus, tab: 'library', primary: true },
    { label: 'Subir documento', icon: UploadCloud, tab: 'library' },
    { label: 'Consultar IA', icon: MessageSquare, tab: 'ai-chat' },
    { label: 'Ver alertas legales', icon: Newspaper, tab: 'elperuano' },
  ];

  return (
    <div className="min-h-screen bg-brand-black p-6 md:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b border-white/[0.06] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">Operacion al dia</span>
            </div>
            <div>
              <h1 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory md:text-5xl">Resumen del estudio</h1>
              <p className="mt-3 max-w-2xl text-sm font-light leading-6 text-brand-accent/60">
                Expedientes, vencimientos, documentos y alertas legales concentrados en una sola vista de trabajo.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-brand-accent/70">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">Jornada</span>
            <span className="font-medium text-brand-ivory">Jueves, 21 mayo 2026</span>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.title} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-brand-gold/30">
              <div className="mb-6 flex items-start justify-between">
                <div className="rounded-lg bg-brand-gold/10 p-2.5">
                  <stat.icon className="h-5 w-5 text-brand-gold" />
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-400/70" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-serif text-brand-ivory">{stat.value}</p>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-accent/70">{stat.title}</h2>
                <p className="text-xs font-light text-brand-accent/40">{stat.detail}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <div className="flex flex-col gap-3 border-b border-white/[0.05] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-serif text-brand-ivory">Expedientes prioritarios</h3>
                <p className="mt-1 text-xs text-brand-accent/45">Casos que requieren seguimiento operativo.</p>
              </div>
              <button
                onClick={() => setActiveTab('library')}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold transition-colors hover:text-brand-ivory"
              >
                Abrir boveda <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/[0.05] bg-white/[0.015]">
                  <tr>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/45">Expediente</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/45">Cliente</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/45">Materia</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/45">Siguiente paso</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/45">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {priorityCases.map(caso => (
                    <tr key={caso.id} className="transition-colors hover:bg-white/[0.025]">
                      <td className="px-5 py-4 font-serif text-sm text-brand-ivory">{caso.id}</td>
                      <td className="px-5 py-4 text-sm text-brand-ivory/75">{caso.clientName}</td>
                      <td className="px-5 py-4 text-xs text-brand-accent/60">{caso.type}</td>
                      <td className="px-5 py-4 text-xs text-brand-accent/70">{caso.nextStep}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/70">
                          {caso.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-red-500/15 bg-red-500/[0.04] p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-300" />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-brand-ivory">Vencimientos</h3>
                  <p className="text-xs text-brand-accent/45">Prioridad procesal tomada de expedientes reales.</p>
                </div>
              </div>
              <div className="space-y-3">
                {upcomingDeadlines.length > 0 ? upcomingDeadlines.slice(0, 4).map(item => (
                  <div key={item.id} className="rounded-lg border border-white/[0.05] bg-brand-black/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-brand-ivory/85">{item.title}</p>
                        <p className="mt-1 text-xs text-brand-accent/45">{item.caseId} - {item.clientName}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${getPriorityTextClass(item.priority)}`}>{item.priority}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-brand-gold">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {item.due}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-lg border border-dashed border-white/[0.08] bg-brand-black/20 p-8 text-center">
                    <CalendarClock className="mx-auto mb-3 h-8 w-8 text-brand-accent/15" />
                    <p className="text-sm text-brand-accent/45">No hay vencimientos registrados todavia.</p>
                    <button
                      onClick={() => setActiveTab('library')}
                      className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold hover:text-brand-ivory"
                    >
                      Abrir boveda
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
              <h3 className="mb-4 text-lg font-serif text-brand-ivory">Accesos rapidos</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {quickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => setActiveTab(action.tab)}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 text-left transition-all ${
                      action.primary
                        ? 'bg-brand-ivory text-brand-black hover:bg-white'
                        : 'border border-white/[0.06] bg-white/[0.02] text-brand-ivory/75 hover:border-brand-gold/25 hover:text-brand-ivory'
                    }`}
                  >
                    <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em]">
                      <action.icon className="h-4 w-4" />
                      {action.label}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/[0.06] bg-white/[0.015]">
          <div className="flex flex-col gap-3 border-b border-white/[0.05] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-serif text-brand-ivory">Alertas legales y actividad reciente</h3>
              <p className="mt-1 text-xs text-brand-accent/45">Normas, jurisprudencia y movimientos internos relevantes.</p>
            </div>
            <button
              onClick={() => setActiveTab('elperuano')}
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold transition-colors hover:text-brand-ivory"
            >
              Ver monitor legal <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {legalAlerts.map(alert => (
              <div key={alert.id} className="grid gap-3 p-5 transition-colors hover:bg-white/[0.02] md:grid-cols-[140px_1fr_120px] md:items-center">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold">
                  <Newspaper className="h-4 w-4" />
                  {alert.source}
                </div>
                <div>
                  <p className="text-sm text-brand-ivory/80">{alert.title}</p>
                  <p className="mt-1 text-xs text-brand-accent/40">{alert.type}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-accent/45 md:justify-end">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {alert.time}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const getUpcomingDeadlines = (cases) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return cases
    .flatMap(caso => (Array.isArray(caso.importantDates) ? caso.importantDates : []).map(dateItem => {
      const parsedDate = new Date(`${dateItem.date}T00:00:00`);
      const daysUntil = Math.ceil((parsedDate - today) / 86400000);

      return {
        ...dateItem,
        id: `${caso.id}-${dateItem.id || dateItem.title}`,
        caseId: caso.id,
        clientName: caso.clientName,
        parsedDate,
        daysUntil,
        due: formatDueDate(daysUntil, dateItem.date),
      };
    }))
    .filter(item => item.date && !Number.isNaN(item.parsedDate.getTime()) && item.daysUntil >= 0)
    .sort((a, b) => a.parsedDate - b.parsedDate);
};

const formatDueDate = (daysUntil, fallbackDate) => {
  if (daysUntil === 0) return 'Hoy';
  if (daysUntil === 1) return 'Manana';
  if (daysUntil <= 7) return `En ${daysUntil} dias`;
  return fallbackDate;
};

const getPriorityTextClass = (priority) => {
  if (priority === 'Alta') return 'text-red-300';
  if (priority === 'Media') return 'text-brand-gold';
  return 'text-emerald-300';
};

export default Dashboard;
