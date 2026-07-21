import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  FolderOpen,
  Gauge,
  MessageSquare,
  Newspaper,
  Plus,
  Scale,
  SearchCheck,
  UploadCloud,
} from 'lucide-react';
import { getCases, loadCases } from '../services/caseStore';

const Dashboard = ({ setActiveTab, isDriveConnected = false }) => {
  const [cases, setCases] = useState(() => getCases());

  useEffect(() => {
    let isMounted = true;

    loadCases().then((result) => {
      if (isMounted) setCases(result.cases);
    }).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCases = cases.filter((caseItem) => caseItem.status === 'Activo');
  const pendingCases = cases.filter((caseItem) => caseItem.status === 'Pendiente');
  const indexedDocs = cases.reduce((total, caseItem) => total + (caseItem.documents?.length || 0), 0);
  const aiReadyDocs = cases.reduce(
    (total, caseItem) => total + (caseItem.documents || []).filter((doc) => doc.content || doc.excerpt).length,
    0
  );
  const upcomingDeadlines = getUpcomingDeadlines(cases);
  const weekDeadlines = upcomingDeadlines.filter((item) => item.daysUntil <= 7);
  const urgentDeadlines = upcomingDeadlines.filter((item) => item.daysUntil <= 1 || item.priority === 'Alta');
  const legalAlerts = buildLegalAlerts({ upcomingDeadlines, urgentDeadlines, cases });
  const activityItems = buildActivityItems(cases);
  const priorityCases = buildPriorityCases(cases, upcomingDeadlines);

  const readinessScore = useMemo(() => {
    const caseSignal = Math.min(activeCases.length * 18, 36);
    const docSignal = indexedDocs ? Math.min(aiReadyDocs / indexedDocs, 1) * 34 : 0;
    const deadlineSignal = urgentDeadlines.length ? 14 : 30;
    return Math.max(42, Math.round(caseSignal + docSignal + deadlineSignal));
  }, [activeCases.length, aiReadyDocs, indexedDocs, urgentDeadlines.length]);

  const stats = [
    {
      title: 'Expedientes activos',
      value: activeCases.length.toString().padStart(2, '0'),
      detail: `${pendingCases.length} pendientes por revisar`,
      icon: FolderOpen,
      tone: 'gold',
    },
    {
      title: 'Docs analizados por IA',
      value: aiReadyDocs.toString().padStart(2, '0'),
      detail: `${indexedDocs} documentos vinculados`,
      icon: FileCheck2,
      tone: 'emerald',
    },
    {
      title: 'Vencimientos proximos',
      value: weekDeadlines.length.toString().padStart(2, '0'),
      detail: `${urgentDeadlines.length} requieren atencion`,
      icon: CalendarClock,
      tone: urgentDeadlines.length ? 'red' : 'gold',
    },
    {
      title: 'Alertas legales',
      value: legalAlerts.length.toString().padStart(2, '0'),
      detail: 'Normas y actividad relevante',
      icon: Bell,
      tone: 'blue',
    },
  ];

  const quickActions = [
    {
      label: 'Crear expediente',
      description: 'Registra cliente, materia y seguimiento inicial.',
      icon: Plus,
      tab: 'library',
      primary: true,
    },
    {
      label: 'Conectar documentos',
      description: isDriveConnected ? 'Usa Drive como fuente documental.' : 'Adjunta archivos desde la boveda del caso.',
      icon: UploadCloud,
      tab: isDriveConnected ? 'drive' : 'library',
    },
    {
      label: 'Preguntar o generar con IA',
      description: 'Consulta asistentes y trabaja con plantillas legales.',
      icon: MessageSquare,
      tab: 'ai-chat',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-black p-5 md:p-8 xl:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="relative overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.018] p-6 md:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-white/[0.08]"></div>
            <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] font-semibold text-emerald-300">Central de operaciones legal</span>
                </div>
                <h1 className="text-4xl font-serif font-medium leading-tight tracking-tight text-brand-ivory md:text-5xl">
                  Tres caminos claros para operar mejor: expediente, documentos e IA.
                </h1>
                <p className="mt-4 max-w-2xl text-sm font-light leading-6 text-brand-accent">
                  LUSTI concentra la venta del producto en crear casos, conectar archivos y convertir ese contexto en respuestas o documentos asistidos por IA.
                </p>
              </div>

              <div className="grid min-w-[260px] gap-3 rounded-lg border border-white/[0.06] bg-brand-black/45 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-brand-gold">Pulso operativo</p>
                    <p className="mt-2 text-4xl font-serif text-brand-ivory">{readinessScore}%</p>
                  </div>
                  <Gauge className="h-8 w-8 text-brand-gold" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-brand-gold" style={{ width: `${readinessScore}%` }}></div>
                </div>
                <p className="text-xs leading-5 text-brand-accent">
                  Basado en expedientes activos, documentos con contenido y vencimientos urgentes.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/[0.06] bg-white/[0.018] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-brand-gold">Hoy</p>
                <p className="mt-2 font-serif text-2xl text-brand-ivory">{formatToday()}</p>
              </div>
              <Scale className="h-6 w-6 text-brand-gold" />
            </div>
            <div className="grid gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => setActiveTab(action.tab)}
                  className={`group flex items-center justify-between rounded-lg p-4 text-left transition-all ${
                    action.primary
                      ? 'bg-brand-ivory text-brand-black hover:bg-white'
                      : 'border border-white/[0.06] bg-white/[0.02] text-brand-ivory hover:border-brand-gold/30 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <action.icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{action.label}</span>
                      <span className={`block truncate text-xs ${action.primary ? 'text-brand-black/85 font-semibold' : 'text-brand-accent'}`}>
                        {action.description}
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </section>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <MetricCard key={stat.title} {...stat} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <div className="flex flex-col gap-3 border-b border-white/[0.05] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-serif text-brand-ivory">Expedientes listos para trabajar</h2>
                <p className="mt-1 text-xs text-brand-accent">El primer flujo empieza aqui: crear caso y dejarlo listo para documentos e IA.</p>
              </div>
              <button
                onClick={() => setActiveTab('library')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-ivory"
              >
                Abrir boveda <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 p-4">
              {priorityCases.length ? priorityCases.map((caseItem) => (
                <button
                  key={caseItem.id}
                  onClick={() => setActiveTab('library')}
                  className="grid gap-4 rounded-lg border border-white/[0.05] bg-white/[0.018] p-4 text-left transition-all hover:border-brand-gold/30 hover:bg-white/[0.035] lg:grid-cols-[1fr_160px_150px]"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-serif text-lg text-brand-ivory">{caseItem.id}</span>
                      <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-brand-accent">
                        {caseItem.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-brand-ivory">{caseItem.clientName}</p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-brand-accent">{caseItem.summary || 'Sin resumen registrado.'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-gold">Materia</p>
                    <p className="mt-2 text-sm text-brand-ivory font-medium">{caseItem.type}</p>
                    <p className="mt-3 text-xs text-brand-accent font-semibold">{caseItem.documentsCount} docs vinculados</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-gold">Siguiente paso</p>
                    <p className="mt-2 text-sm leading-5 text-brand-ivory font-medium">{caseItem.nextStep}</p>
                  </div>
                </button>
              )) : (
                <EmptyState
                  icon={FolderOpen}
                  title="Aun no hay expedientes"
                  text="Crea tu primer expediente para que el dashboard empiece a mostrar información relevante."
                  action="Crear expediente"
                  onAction={() => setActiveTab('library')}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-red-500/15 bg-red-500/[0.04] p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-500/10 p-2">
                    <AlertTriangle className="h-5 w-5 text-red-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif text-brand-ivory">Vencimientos proximos</h2>
                    <p className="text-xs text-brand-accent">Lo que debe verse antes de que sea tarde.</p>
                  </div>
                </div>
                <span className="text-2xl font-serif text-red-200">{upcomingDeadlines.length}</span>
              </div>
              <div className="space-y-3">
                {upcomingDeadlines.length > 0 ? upcomingDeadlines.slice(0, 4).map((item) => (
                  <DeadlineItem key={item.id} item={item} />
                )) : (
                  <EmptyState
                    icon={CalendarClock}
                    title="Sin vencimientos"
                    text="Cuando registres fechas importantes, apareceran aqui por prioridad."
                    compact
                  />
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif text-brand-ivory">IA lista para trabajar</h2>
                  <p className="mt-1 text-xs text-brand-accent">Documentos con contenido usable por asistentes.</p>
                </div>
                <Bot className="h-5 w-5 text-brand-gold" />
              </div>
              <div className="grid gap-3">
                <AiSignal label="Documentos con texto" value={aiReadyDocs} total={indexedDocs || 1} />
                <AiSignal label="Expedientes activos" value={activeCases.length} total={Math.max(cases.length, 1)} />
              </div>
              <button
                onClick={() => setActiveTab('ai-chat')}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-3 text-sm font-bold text-brand-black transition-colors hover:bg-brand-ivory"
              >
                Consultar IA <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <div className="flex items-center justify-between border-b border-white/[0.05] p-5">
              <div>
                <h2 className="text-xl font-serif text-brand-ivory">Alertas legales</h2>
                <p className="mt-1 text-xs text-brand-accent">Normas, agenda interna y senales para revisar.</p>
              </div>
              <button
                onClick={() => setActiveTab('monitor')}
                className="text-brand-gold transition-colors hover:text-brand-ivory"
                aria-label="Abrir monitor legal"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {legalAlerts.map((alert) => (
                <div key={alert.id} className="grid gap-3 p-5 transition-colors hover:bg-white/[0.02]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand-gold">
                      <Newspaper className="h-4 w-4" />
                      {alert.source}
                    </div>
                    <span className="text-xs text-brand-accent">{alert.time}</span>
                  </div>
                  <div>
                    <p className="text-sm text-brand-ivory/90">{alert.title}</p>
                    <p className="mt-1 text-xs text-brand-accent">{alert.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <div className="flex items-center justify-between border-b border-white/[0.05] p-5">
              <div>
                <h2 className="text-xl font-serif text-brand-ivory">Actividad reciente</h2>
                <p className="mt-1 text-xs text-brand-accent">Movimiento visible para que el producto se sient vivo.</p>
              </div>
              <Clock3 className="h-5 w-5 text-brand-gold" />
            </div>
            <div className="divide-y divide-white/[0.04]">
              {activityItems.map((item) => (
                <div key={item.id} className="grid gap-3 p-5 transition-colors hover:bg-white/[0.02] md:grid-cols-[34px_1fr_120px] md:items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-brand-ivory/90 font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-brand-accent">{item.detail}</p>
                  </div>
                  <div className="text-xs text-brand-accent md:text-right">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, detail, icon: Icon, tone }) => {
  const toneClass = {
    gold: 'bg-brand-gold/10 text-brand-gold',
    emerald: 'bg-emerald-500/10 text-emerald-300',
    red: 'bg-red-500/10 text-red-300',
    blue: 'bg-sky-500/10 text-sky-300',
  }[tone] || 'bg-brand-gold/10 text-brand-gold';

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-brand-gold/30">
      <div className="mb-6 flex items-start justify-between">
        <div className={`rounded-lg p-2.5 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      </div>
      <p className="text-3xl font-serif text-brand-ivory">{value}</p>
      <h2 className="mt-2 text-xs font-bold text-brand-accent">{title}</h2>
      <p className="mt-1 text-xs font-medium text-brand-accent">{detail}</p>
    </div>
  );
};

const DeadlineItem = ({ item }) => (
  <div className="rounded-lg border border-white/[0.05] bg-brand-black/30 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-brand-ivory">{item.title}</p>
        <p className="mt-1 text-xs text-brand-accent">{item.caseId} - {item.clientName}</p>
      </div>
      <span className={`text-xs font-bold ${getPriorityTextClass(item.priority)}`}>
        {item.priority || 'Media'}
      </span>
    </div>
    <div className="mt-3 flex items-center gap-2 text-xs text-brand-gold">
      <CalendarClock className="h-3.5 w-3.5" />
      {item.due}
    </div>
  </div>
);

const AiSignal = ({ label, value, total }) => {
  const percent = Math.round(Math.min(value / total, 1) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-brand-accent font-semibold">{label}</span>
        <span className="text-xs font-bold text-brand-ivory">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-brand-gold" style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, text, action, onAction, compact = false }) => (
  <div className={`rounded-lg border border-dashed border-white/[0.08] bg-brand-black/20 text-center ${compact ? 'p-5' : 'p-8'}`}>
    <Icon className="mx-auto mb-3 h-8 w-8 text-brand-accent" />
    <p className="text-sm font-bold text-brand-ivory">{title}</p>
    <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-brand-accent">{text}</p>
    {action ? (
      <button
        onClick={onAction}
        className="mt-4 text-xs font-bold text-brand-gold hover:text-brand-ivory animate-pulse"
      >
        {action}
      </button>
    ) : null}
  </div>
);

const getUpcomingDeadlines = (cases) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return cases
    .flatMap((caseItem) => (Array.isArray(caseItem.importantDates) ? caseItem.importantDates : []).map((dateItem) => {
      const parsedDate = new Date(`${dateItem.date}T00:00:00`);
      const daysUntil = Math.ceil((parsedDate - today) / 86400000);

      return {
        ...dateItem,
        id: `${caseItem.id}-${dateItem.id || dateItem.title}`,
        caseId: caseItem.id,
        clientName: caseItem.clientName,
        parsedDate,
        daysUntil,
        due: formatDueDate(daysUntil, dateItem.date),
      };
    }))
    .filter((item) => item.date && !Number.isNaN(item.parsedDate.getTime()) && item.daysUntil >= 0)
    .sort((a, b) => a.parsedDate - b.parsedDate);
  };

const buildPriorityCases = (cases, deadlines) => {
  const deadlineByCaseId = new Map(deadlines.map((item) => [item.caseId, item]));

  return [...cases]
    .sort((a, b) => {
      const aDeadline = deadlineByCaseId.get(a.id)?.daysUntil ?? 999;
      const bDeadline = deadlineByCaseId.get(b.id)?.daysUntil ?? 999;
      return aDeadline - bDeadline;
    })
    .slice(0, 4)
    .map((caseItem, index) => {
      const deadline = deadlineByCaseId.get(caseItem.id);
      return {
        ...caseItem,
        documentsCount: caseItem.documents?.length || 0,
        nextStep: deadline
          ? `Preparar ${deadline.title.toLowerCase()}`
          : [
              'Validar documentos pendientes',
              'Preparar borrador de respuesta',
              'Revisar ultima actuacion',
              'Actualizar resumen ejecutivo',
            ][index] || 'Revisar seguimiento',
      };
    });
};

const buildLegalAlerts = ({ upcomingDeadlines, urgentDeadlines, cases }) => [
  {
    id: 'legal-1',
    source: 'El Peruano',
    title: 'Nueva norma laboral de urgencia para revision del estudio',
    time: 'Hoy',
    type: 'Norma legal',
  },
  {
    id: 'legal-2',
    source: 'Jurisprudencia',
    title: 'Precedente de despido podria impactar expedientes laborales',
    time: 'Hace 2 h',
    type: 'Analisis preliminar',
  },
  {
    id: 'legal-3',
    source: 'Agenda interna',
    title: urgentDeadlines.length
      ? `${urgentDeadlines.length} vencimientos requieren atencion inmediata`
      : `${upcomingDeadlines.length} vencimientos registrados en el sistema`,
    time: 'Ahora',
    type: `${cases.length} expedientes monitoreados`,
  },
];

const buildActivityItems = (cases) => {
  const caseActivities = cases.slice(0, 4).map((caseItem, index) => ({
    id: `case-${caseItem.id}`,
    icon: index === 0 ? SearchCheck : FileText,
    title: `${caseItem.clientName} actualizado`,
    detail: `${caseItem.type} - ${caseItem.documents?.length || 0} documentos vinculados`,
    time: formatRelativeFromDate(caseItem.lastUpdate),
  }));

  const baseActivities = [
    {
      id: 'ai-ready',
      icon: Bot,
      title: 'Asistentes legales listos para consulta',
      detail: 'Puedes consultar IA especializada desde el menu lateral.',
      time: 'Listo',
    },
    {
      id: 'monitor-ready',
      icon: Newspaper,
      title: 'Monitor legal disponible',
      detail: 'Alertas normativas y registros oficiales preparados para revision.',
      time: 'Activo',
    },
  ];

  return [...caseActivities, ...baseActivities].slice(0, 6);
};

const formatDueDate = (daysUntil, fallbackDate) => {
  if (daysUntil === 0) return 'Hoy';
  if (daysUntil === 1) return 'Manana';
  if (daysUntil <= 7) return `En ${daysUntil} dias`;
  return fallbackDate;
};

const formatRelativeFromDate = (dateValue) => {
  if (!dateValue) return 'Sin fecha';

  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateValue;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAgo = Math.round((today - parsed) / 86400000);

  if (daysAgo <= 0) return 'Hoy';
  if (daysAgo === 1) return 'Ayer';
  if (daysAgo < 30) return `Hace ${daysAgo} dias`;
  return parsed.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

const formatToday = () =>
  new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

const getPriorityTextClass = (priority) => {
  if (priority === 'Alta') return 'text-red-300';
  if (priority === 'Media') return 'text-brand-gold';
  return 'text-emerald-300';
};

export default Dashboard;
