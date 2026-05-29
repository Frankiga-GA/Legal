import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  FileText,
  LockKeyhole,
  Scale,
  SearchCheck,
  Shield,
} from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  const modules = [
    {
      icon: Database,
      title: 'Expedientes ordenados',
      description: 'Clientes, materias, documentos, notas y vencimientos en una vista operativa para todo el estudio.',
    },
    {
      icon: Bot,
      title: 'IA con contexto legal',
      description: 'Resume documentos, detecta riesgos y prepara borradores usando informacion real del expediente.',
    },
    {
      icon: Bell,
      title: 'Plazos bajo control',
      description: 'Visualiza fechas criticas, actividad reciente y tareas pendientes antes de que se vuelvan urgentes.',
    },
    {
      icon: FileSearch,
      title: 'Vigilancia normativa',
      description: 'Relaciona novedades legales con expedientes para decidir que requiere accion inmediata.',
    },
  ];

  const workflow = [
    { step: '01', title: 'Crea el expediente', text: 'Registra cliente, materia, estado y resumen operativo.' },
    { step: '02', title: 'Conecta documentos', text: 'Agrega contratos, escritos, anexos, pruebas y archivos de Drive.' },
    { step: '03', title: 'Consulta la IA', text: 'Pide resumenes, riesgos, vencimientos, datos faltantes y borradores.' },
    { step: '04', title: 'Gestiona el seguimiento', text: 'Mantiene notas, fechas importantes y acciones por caso.' },
  ];

  const painPoints = [
    'Expedientes repartidos entre carpetas, correos, chats y hojas de calculo.',
    'Plazos revisados manualmente cuando el equipo ya esta contra el tiempo.',
    'Documentos importantes sin resumen, sin trazabilidad y sin contexto util.',
    'Consultas repetitivas que quitan horas a abogados y asistentes.',
  ];

  const proofPoints = [
    {
      icon: SearchCheck,
      title: 'Demo guiada',
      text: 'Flujo claro para crear caso, cargar documentos y consultar la IA.',
    },
    {
      icon: Shield,
      title: 'Datos sensibles',
      text: 'El lenguaje, permisos y estructura parten del trabajo legal.',
    },
    {
      icon: FileText,
      title: 'Documentos primero',
      text: 'La IA trabaja sobre expedientes, plantillas y archivos reales.',
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-black text-brand-ivory selection:bg-brand-gold/30">
      <div className="fixed inset-0 grid-pattern opacity-10 pointer-events-none"></div>
      <div className="fixed inset-0 noise-bg pointer-events-none z-50"></div>

      <section className="relative min-h-[92vh] overflow-hidden">
        <img
          src="/Legal1.jpeg"
          alt="Estudio juridico"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/90 to-brand-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black/20"></div>

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col px-6 py-7">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-brand-gold p-3 text-brand-black">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-xl font-bold tracking-tight">LUSTI</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-gold">Legal Intelligence</p>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="hidden rounded-lg border border-white/[0.12] bg-white/[0.05] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-ivory/85 transition-colors hover:bg-white/[0.1] hover:text-white sm:inline-flex"
            >
              Acceder
            </button>
          </nav>

          <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="max-w-4xl space-y-8">
              <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-4 py-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-brand-gold"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">Legal workspace con IA documental</span>
              </div>

              <div className="space-y-5">
                <h1 className="max-w-5xl text-5xl font-serif font-medium leading-[1.05] tracking-tight text-white md:text-7xl">
                  Convierte expedientes dispersos en una operacion legal inteligente.
                </h1>
                <p className="max-w-2xl text-lg font-light leading-8 text-brand-accent/75 md:text-xl">
                  LUSTI organiza casos, documentos, vencimientos y asistentes IA para que una firma trabaje con mas control, menos busqueda manual y respuestas mejor sustentadas.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={onGetStarted}
                  className="group inline-flex items-center justify-center gap-3 rounded-lg bg-brand-ivory px-8 py-4 font-bold text-brand-black transition-colors hover:bg-white"
                >
                  Ver demo privada
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href="#modulos"
                  className="inline-flex items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] px-8 py-4 font-bold text-brand-ivory/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  Explorar valor
                </a>
              </div>

              <div className="grid max-w-2xl grid-cols-3 gap-3 pt-2">
                <TrustMetric value="3" label="flujos clave" />
                <TrustMetric value="IA" label="por expediente" />
                <TrustMetric value="360" label="vista legal" />
              </div>
            </div>

            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-gold">Por que importa</p>
          <h2 className="text-4xl font-serif font-medium leading-tight text-brand-ivory md:text-5xl">
            La firma pierde velocidad cuando la informacion legal no esta conectada.
          </h2>
        </div>
        <div className="grid gap-3">
          {painPoints.map((point) => (
            <div key={point} className="flex items-start gap-4 rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
              <p className="text-sm leading-6 text-brand-accent/70">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="modulos" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-gold">La propuesta</p>
            <h2 className="max-w-3xl text-4xl font-serif font-medium leading-tight text-brand-ivory md:text-5xl">
              Un sistema que se vende por claridad, no por cantidad de botones.
            </h2>
          </div>
          <p className="max-w-md text-sm font-light leading-6 text-brand-accent/60">
            La experiencia principal se centra en expediente, documento e IA. Todo lo demas acompana esa ruta.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {proofPoints.map((item) => (
            <TrustBlock key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-6 md:p-10">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-gold">Como funciona</p>
              <h2 className="text-4xl font-serif font-medium text-brand-ivory">Del expediente al analisis en minutos.</h2>
            </div>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-brand-gold px-6 py-3 text-sm font-bold text-brand-black transition-colors hover:bg-brand-ivory"
            >
              Iniciar demo <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {workflow.map((item) => (
              <WorkflowStep key={item.step} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.01] py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3">
          <TrustBlock icon={Shield} title="Privacidad por diseno" text="Los datos del expediente se tratan como informacion sensible desde el primer flujo." />
          <TrustBlock icon={LockKeyhole} title="Control del estudio" text="Cada caso concentra documentos, notas y fechas para reducir dispersion operativa." />
          <TrustBlock icon={FileText} title="Trazabilidad del caso" text="La boveda ayuda a revisar que existe, que falta y cual es el siguiente paso." />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 py-28 text-center">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-gold">Siguiente paso</p>
        <h2 className="text-4xl font-serif font-medium leading-tight text-brand-ivory md:text-6xl">
          Muestra LUSTI como una plataforma seria desde el primer clic.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-7 text-brand-accent/65">
          Entra a la plataforma, abre un expediente demo, carga un documento y deja que la IA muestre valor concreto.
        </p>
        <button
          onClick={onGetStarted}
          className="mt-10 inline-flex items-center justify-center gap-3 rounded-lg bg-brand-ivory px-8 py-4 font-bold text-brand-black transition-colors hover:bg-white"
        >
          Entrar a la plataforma
          <ArrowRight className="h-5 w-5" />
        </button>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <p className="font-serif text-xl text-brand-ivory">LUSTI</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-accent/30">
            2026 Legal workspace para estudios juridicos
          </p>
        </div>
      </footer>
    </div>
  );
};

const TrustMetric = ({ value, label }) => (
  <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
    <p className="text-2xl font-serif text-brand-gold">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/50">{label}</p>
  </div>
);

const ProductPreview = () => (
  <div className="relative mt-4 overflow-hidden rounded-lg border border-white/[0.08] bg-brand-black/80 p-4 sm:p-5">
    <div className="absolute inset-x-0 top-0 h-px bg-white/[0.08]"></div>
    <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">Panel operativo</p>
        <h3 className="mt-2 font-serif text-2xl text-brand-ivory">Caso laboral urgente</h3>
      </div>
      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">Activo</span>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <MiniStat value="12" label="docs" />
      <MiniStat value="03" label="plazos" />
      <MiniStat value="08" label="notas" />
    </div>
    <div className="mt-5 space-y-3">
      {[
        ['IA del expediente', 'Resumen ejecutivo, riesgos y siguientes acciones listos.'],
        ['Proximo vencimiento', 'Audiencia de conciliacion: requiere preparacion.'],
        ['Documento reciente', 'Contrato y anexos vinculados al analisis.'],
      ].map(([title, text]) => (
        <div key={title} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-gold">{title}</p>
          <p className="mt-2 text-sm text-brand-accent/70">{text}</p>
        </div>
      ))}
    </div>
    <div className="mt-5 overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.025]">
      <div className="flex w-max animate-live-feed gap-3 px-4 py-3">
        {[
          'Nuevo documento indexado',
          'Alerta de vencimiento detectada',
          'IA genero resumen del caso',
          'Nota interna agregada',
          'Expediente actualizado',
          'Nuevo documento indexado',
          'Alerta de vencimiento detectada',
        ].map((item, index) => (
          <span key={`${item}-${index}`} className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/55">
            {item}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const MiniStat = ({ value, label }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
    <p className="text-2xl font-serif text-brand-ivory">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/45">{label}</p>
  </div>
);

const ModuleCard = ({ icon: Icon, title, description }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-6 transition-colors hover:border-brand-gold/30">
    <div className="mb-8 inline-flex rounded-lg bg-brand-gold/10 p-3 text-brand-gold">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="font-serif text-2xl text-brand-ivory">{title}</h3>
    <p className="mt-4 text-sm font-light leading-6 text-brand-accent/65">{description}</p>
  </div>
);

const WorkflowStep = ({ step, title, text }) => (
  <div className="rounded-lg border border-white/[0.06] bg-brand-black/30 p-5">
    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">{step}</p>
    <h3 className="mt-6 font-serif text-xl text-brand-ivory">{title}</h3>
    <p className="mt-3 text-sm font-light leading-6 text-brand-accent/60">{text}</p>
  </div>
);

const TrustBlock = ({ icon: Icon, title, text }) => (
  <div className="rounded-lg border border-white/[0.06] bg-brand-black/30 p-6">
    <Icon className="mb-6 h-6 w-6 text-brand-gold" />
    <h3 className="font-serif text-2xl text-brand-ivory">{title}</h3>
    <p className="mt-4 text-sm font-light leading-6 text-brand-accent/60">{text}</p>
  </div>
);

export default LandingPage;
