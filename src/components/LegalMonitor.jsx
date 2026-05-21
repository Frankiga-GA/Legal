import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  Bot,
  CalendarClock,
  ExternalLink,
  FileSearch,
  Gavel,
  Landmark,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { getCases, loadCases } from '../services/caseStore';

const portals = [
  {
    id: 'cej',
    name: 'CEJ Poder Judicial',
    description: 'Seguimiento de expedientes judiciales y ultimas actuaciones.',
    status: 'Listo para conectar',
    cadence: '3 revisiones diarias',
    coverage: 'Expedientes judiciales',
    health: 86,
  },
  {
    id: 'indecopi',
    name: 'INDECOPI',
    description: 'Consulta administrativa para procedimientos de consumo y competencia.',
    status: 'En preparacion',
    cadence: 'Revision programada',
    coverage: 'Procedimientos administrativos',
    health: 64,
  },
  {
    id: 'sinoe',
    name: 'SINOE',
    description: 'Casilla judicial y notificaciones electronicas vinculadas al estudio.',
    status: 'Proximo modulo',
    cadence: 'Alertas por notificacion',
    coverage: 'Casilla electronica',
    health: 42,
  },
];

const simulatedMovements = [
  {
    id: 'mov-1',
    caseId: 'EXP-2026-001',
    source: 'CEJ',
    title: 'Nueva resolucion pendiente de lectura',
    detail: 'El monitor detecto una actuacion procesal que requiere validar plazo y estrategia.',
    impact: 'Alta',
    time: 'Hace 18 min',
  },
  {
    id: 'mov-2',
    caseId: 'EXP-2026-002',
    source: 'Agenda interna',
    title: 'Vencimiento operativo cercano',
    detail: 'Conviene preparar borrador y revisar anexos antes de la siguiente actuacion.',
    impact: 'Media',
    time: 'Hoy',
  },
  {
    id: 'mov-3',
    caseId: 'EXP-2026-003',
    source: 'INDECOPI',
    title: 'Portal listo para seguimiento administrativo',
    detail: 'Este tipo de expediente puede entrar al flujo de vigilancia cuando se conecte la fuente.',
    impact: 'Baja',
    time: 'Planificado',
  },
];

const LegalMonitor = ({ setActiveTab }) => {
  const [cases, setCases] = useState(() => getCases());
  const [query, setQuery] = useState('');
  const [activeSource, setActiveSource] = useState('Todas');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState('Hace 12 minutos');

  useEffect(() => {
    let isMounted = true;

    loadCases().then((result) => {
      if (isMounted) setCases(result.cases);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const monitoredCases = useMemo(() => cases.map((caseItem, index) => ({
    ...caseItem,
    portal: ['CEJ', 'INDECOPI', 'SINOE'][index % 3],
    tracking: ['Activo', 'Pendiente', 'Manual'][index % 3],
    lastMovement: ['Resolucion registrada', 'Sin novedades', 'Pendiente de conexion'][index % 3],
    risk: ['Alta', 'Media', 'Baja'][index % 3],
  })), [cases]);

  const filteredCases = monitoredCases.filter((caseItem) => {
    const matchesSource = activeSource === 'Todas' || caseItem.portal === activeSource;
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return matchesSource;

    return matchesSource && [
      caseItem.id,
      caseItem.clientName,
      caseItem.type,
      caseItem.portal,
    ].some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  const scanNow = () => {
    setIsScanning(true);
    window.setTimeout(() => {
      setLastScan('Justo ahora');
      setIsScanning(false);
    }, 900);
  };

  const activeCount = monitoredCases.filter((caseItem) => caseItem.tracking === 'Activo').length;
  const highRiskCount = monitoredCases.filter((caseItem) => caseItem.risk === 'Alta').length;

  return (
    <div className="min-h-screen bg-brand-black p-6 md:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b border-white/[0.06] pb-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1">
              <BellRing className="h-3.5 w-3.5 text-brand-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-gold">Vigilancia Judicial</span>
            </div>
            <div>
              <h1 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory md:text-5xl">Monitor de expedientes</h1>
              <p className="mt-3 text-sm font-light leading-6 text-brand-accent/60">
                Control operativo inspirado en CEJ, INDECOPI y SINOE: seguimiento, alertas y lectura estrategica por expediente desde LUSTI.
              </p>
            </div>
          </div>

          <button
            onClick={scanNow}
            disabled={isScanning}
            className="inline-flex items-center justify-center gap-3 rounded-lg bg-brand-ivory px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-black transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Escaneando' : 'Escanear ahora'}
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric title="Expedientes vigilados" value={activeCount.toString().padStart(2, '0')} detail="Con seguimiento activo" icon={FileSearch} />
          <Metric title="Alertas criticas" value={highRiskCount.toString().padStart(2, '0')} detail="Requieren revision" icon={AlertTriangle} tone="danger" />
          <Metric title="Fuentes conectables" value="03" detail="CEJ, INDECOPI, SINOE" icon={Landmark} />
          <Metric title="Ultimo escaneo" value={isScanning ? '...' : lastScan} detail="Monitor operativo" icon={CalendarClock} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <div className="border-b border-white/[0.05] p-5">
              <h2 className="text-xl font-serif text-brand-ivory">Fuentes de seguimiento</h2>
              <p className="mt-1 text-xs text-brand-accent/45">Mapa de integraciones judiciales para priorizar desarrollo.</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {portals.map((portal) => (
                <div key={portal.id} className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-brand-ivory">{portal.name}</h3>
                      <p className="mt-2 text-xs leading-5 text-brand-accent/55">{portal.description}</p>
                    </div>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-accent/60">
                      {portal.status}
                    </span>
                  </div>
                  <div className="mb-3 h-1.5 rounded-full bg-white/[0.04]">
                    <div className="h-full rounded-full bg-brand-gold" style={{ width: `${portal.health}%` }}></div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-accent/40">
                    <span>{portal.cadence}</span>
                    <span>/</span>
                    <span>{portal.coverage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <div className="flex flex-col gap-4 border-b border-white/[0.05] p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-serif text-brand-ivory">Bandeja de vigilancia</h2>
                <p className="mt-1 text-xs text-brand-accent/45">Expedientes internos preparados para monitoreo externo.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/30" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar expediente"
                    className="h-10 rounded-lg border border-white/[0.06] bg-white/[0.02] pl-10 pr-4 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/25 focus:border-brand-gold/30"
                  />
                </div>
                <div className="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
                  {['Todas', 'CEJ', 'INDECOPI', 'SINOE'].map((source) => (
                    <button
                      key={source}
                      onClick={() => setActiveSource(source)}
                      className={`rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                        activeSource === source ? 'bg-brand-ivory text-brand-black' : 'text-brand-accent/45 hover:text-brand-ivory'
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/[0.05]">
                  <tr>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/45">Expediente</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/45">Portal</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/45">Ultimo movimiento</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/45">Riesgo</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/45">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredCases.map((caseItem) => (
                    <tr key={caseItem.id} className="transition-colors hover:bg-white/[0.025]">
                      <td className="px-5 py-4">
                        <p className="font-serif text-sm text-brand-ivory">{caseItem.id}</p>
                        <p className="mt-1 text-xs text-brand-accent/45">{caseItem.clientName}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-brand-gold">{caseItem.portal}</td>
                      <td className="px-5 py-4 text-xs text-brand-accent/65">{caseItem.lastMovement}</td>
                      <td className={`px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] ${getRiskClass(caseItem.risk)}`}>{caseItem.risk}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/65">
                          {caseItem.tracking}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <div className="border-b border-white/[0.05] p-5">
              <h2 className="text-xl font-serif text-brand-ivory">Movimientos detectados</h2>
              <p className="mt-1 text-xs text-brand-accent/45">Simulacion de alertas que luego vendran de portales conectados.</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {simulatedMovements.map((movement) => (
                <div key={movement.id} className="grid gap-4 p-5 md:grid-cols-[130px_1fr_90px] md:items-center">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold">
                    <Gavel className="h-4 w-4" />
                    {movement.source}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-ivory/85">{movement.title}</p>
                    <p className="mt-1 text-xs leading-5 text-brand-accent/50">{movement.detail}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/35">{movement.caseId}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${getRiskClass(movement.impact)}`}>{movement.impact}</p>
                    <p className="mt-2 text-xs text-brand-accent/40">{movement.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-brand-gold/15 bg-brand-gold/[0.04] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-brand-gold/10 p-2">
                <Bot className="h-5 w-5 text-brand-gold" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-brand-ivory">Lectura IA sugerida</h2>
                <p className="text-xs text-brand-accent/45">Proximo diferencial frente a monitores simples.</p>
              </div>
            </div>
            <div className="space-y-4 text-sm leading-6 text-brand-accent/65">
              <p>
                Cuando una fuente detecte movimiento, LUSTI debe convertirlo en accion: resumen, riesgo, plazo probable y borrador de siguiente paso.
              </p>
              <div className="rounded-lg border border-white/[0.06] bg-brand-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">Recomendacion</p>
                <p className="mt-2 text-sm text-brand-ivory/80">
                  Priorizar CEJ primero, luego INDECOPI y finalmente SINOE para estudios con casilla judicial activa.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <button
                onClick={() => setActiveTab('library')}
                className="flex items-center justify-between rounded-lg bg-brand-ivory px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-white"
              >
                Abrir expedientes
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveTab('elperuano')}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-accent/65 transition-colors hover:border-brand-gold/25 hover:text-brand-ivory"
              >
                Ver normas oficiales
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const Metric = ({ title, value, detail, icon: Icon, tone = 'default' }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
    <div className="mb-6 flex items-start justify-between">
      <div className={`rounded-lg p-2.5 ${tone === 'danger' ? 'bg-red-500/10' : 'bg-brand-gold/10'}`}>
        <Icon className={`h-5 w-5 ${tone === 'danger' ? 'text-red-300' : 'text-brand-gold'}`} />
      </div>
      {tone === 'danger' ? <AlertTriangle className="h-4 w-4 text-red-300/70" /> : <ShieldCheck className="h-4 w-4 text-emerald-400/70" />}
    </div>
    <p className="text-3xl font-serif text-brand-ivory">{value}</p>
    <h2 className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-accent/70">{title}</h2>
    <p className="mt-1 text-xs font-light text-brand-accent/40">{detail}</p>
  </div>
);

const getRiskClass = (risk) => {
  if (risk === 'Alta') return 'text-red-300';
  if (risk === 'Media') return 'text-brand-gold';
  return 'text-emerald-300';
};

export default LegalMonitor;
