import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Bot,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Gavel,
  Link2,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { getCases } from '../services/caseStore';
import { loadCases, updateCaseAsync } from '../services/caseStore';
import { fetchOfficialRegistryItems, getOfficialRegistryFallbackItems } from '../services/officialRegistryService';

const SAVED_REGISTRY_KEY = 'lusti-saved-official-registry';

const ElPeruano = () => {
  const [items, setItems] = useState(() => getOfficialRegistryFallbackItems());
  const [cases, setCases] = useState(() => getCases());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [sourceFilter, setSourceFilter] = useState('Todas');
  const [statusMessage, setStatusMessage] = useState('');
  const [feedSource, setFeedSource] = useState('curated-official-links');
  const [lastChecked, setLastChecked] = useState('');
  const [savedItems, setSavedItems] = useState(() => getSavedRegistryItems());

  const applyRegistryResult = (result) => {
    setItems(result.items);
    setFeedSource(result.source);
    setLastChecked(formatCheckedAt(result.checkedAt));
    setStatusMessage(result.error
      ? 'El navegador bloqueo la consulta en vivo. Mostrando fuentes oficiales curadas.'
      : 'Registros oficiales actualizados desde fuente publica.'
    );
    setLoading(false);
  };

  const loadRegistry = async () => {
    setLoading(true);
    const result = await fetchOfficialRegistryItems();
    applyRegistryResult(result);
  };

  useEffect(() => {
    let isMounted = true;

    loadCases().then((result) => {
      if (isMounted) setCases(result.cases);
    });

    fetchOfficialRegistryItems().then((result) => {
      if (isMounted) applyRegistryResult(result);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!statusMessage) return;

    const timerId = window.setTimeout(() => setStatusMessage(''), 4200);
    return () => window.clearTimeout(timerId);
  }, [statusMessage]);

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(items.map((item) => item.category)))], [items]);
  const sources = useMemo(() => ['Todas', ...Array.from(new Set(items.map((item) => item.source)))], [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items
      .filter((item) => categoryFilter === 'Todas' || item.category === categoryFilter)
      .filter((item) => sourceFilter === 'Todas' || item.source === sourceFilter)
      .filter((item) => {
        if (!normalizedQuery) return true;

        return [
          item.title,
          item.summary,
          item.impact,
          item.entity,
          item.category,
          item.type,
        ].some((value) => String(value).toLowerCase().includes(normalizedQuery));
      });
  }, [items, categoryFilter, sourceFilter, query]);

  const stats = useMemo(() => {
    const highUrgency = items.filter((item) => item.urgency === 'Alta').length;
    const officialSources = new Set(items.map((item) => item.source)).size;

    return [
      { label: 'Registros revisados', value: items.length.toString().padStart(2, '0'), icon: Database },
      { label: 'Alertas altas', value: highUrgency.toString().padStart(2, '0'), icon: AlertTriangle, tone: 'danger' },
      { label: 'Fuentes oficiales', value: officialSources.toString().padStart(2, '0'), icon: ShieldCheck },
      { label: 'Guardados', value: savedItems.length.toString().padStart(2, '0'), icon: Archive },
    ];
  }, [items, savedItems.length]);

  const saveRegistryItem = (item) => {
    const exists = savedItems.some((saved) => saved.id === item.id);
    const nextItems = exists
      ? savedItems
      : [{ ...item, savedAt: new Date().toISOString() }, ...savedItems];

    setSavedItems(nextItems);
    window.localStorage.setItem(SAVED_REGISTRY_KEY, JSON.stringify(nextItems));
    setStatusMessage(exists ? 'Ese registro ya estaba guardado.' : 'Registro oficial guardado en la biblioteca normativa local.');
  };

  const linkRegistryToCase = async (item, caseId) => {
    const targetCase = cases.find((caseItem) => caseItem.id === caseId);
    if (!targetCase) return;

    const references = Array.isArray(targetCase.officialReferences) ? targetCase.officialReferences : [];
    const exists = references.some((reference) => reference.id === item.id);

    if (exists) {
      setStatusMessage(`El registro ya estaba vinculado a ${caseId}.`);
      return;
    }

    const reference = {
      id: item.id,
      title: item.title,
      source: item.source,
      entity: item.entity,
      type: item.type,
      category: item.category,
      date: item.date,
      url: item.url,
      impact: item.impact,
      linkedAt: new Date().toISOString(),
    };

    const result = await updateCaseAsync(cases, caseId, {
      officialReferences: [reference, ...references],
    });

    setCases(result.cases);
    setStatusMessage(result.error
      ? `Registro vinculado localmente a ${caseId}. Supabase no respondio.`
      : `Registro oficial vinculado a ${caseId}.`
    );
  };

  return (
    <div className="min-h-screen bg-brand-black p-6 md:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b border-white/[0.06] pb-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1">
              <Gavel className="h-3.5 w-3.5 text-brand-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-gold">Radar Normativo</span>
            </div>
            <div>
              <h1 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory md:text-5xl">Registros Oficiales</h1>
              <p className="mt-3 text-sm font-light leading-6 text-brand-accent/60">
                Normas, boletines y fuentes juridicas oficiales convertidas en impacto operativo para los expedientes del estudio.
              </p>
            </div>
          </div>

          <button
            onClick={loadRegistry}
            disabled={loading}
            className="inline-flex items-center justify-center gap-3 rounded-lg bg-brand-ivory px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-black transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Consultando' : 'Actualizar fuentes'}
          </button>
        </header>

        {statusMessage && (
          <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/10 px-5 py-4 text-sm text-brand-gold">
            {statusMessage}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Metric key={stat.label} {...stat} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_180px_180px]">
          <div className="group relative">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/40 transition-colors group-focus-within:text-brand-gold" />
            <input
              type="text"
              placeholder="Buscar por norma, entidad, materia o impacto..."
              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] py-4 pl-14 pr-6 font-light text-brand-ivory transition-all placeholder:text-brand-accent/20 focus:border-brand-gold/40 focus:bg-white/[0.04] focus:outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <FilterSelect label="Materia" value={categoryFilter} onChange={setCategoryFilter} options={categories} />
          <FilterSelect label="Fuente" value={sourceFilter} onChange={setSourceFilter} options={sources} />
        </section>

        <div className="flex flex-col gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-accent/40 md:flex-row md:items-center md:justify-between">
          <span>
            Mostrando <span className="text-brand-ivory">{filteredItems.length}</span> de <span className="text-brand-ivory">{items.length}</span> registros
          </span>
          <span className="text-brand-gold">
            Fuente: {formatFeedSource(feedSource)} {lastChecked ? `- ${lastChecked}` : ''}
          </span>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-5">
            {loading && items.length === 0 ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-lg border border-white/[0.05] bg-white/[0.015]"></div>
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <RegistryCard
                  key={item.id}
                  item={item}
                  cases={cases}
                  onSave={() => saveRegistryItem(item)}
                  onLink={linkRegistryToCase}
                  isSaved={savedItems.some((saved) => saved.id === item.id)}
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] p-12 text-center">
                <Search className="mx-auto mb-4 h-10 w-10 text-brand-accent/15" />
                <p className="text-sm text-brand-accent/45">No hay registros con esos filtros.</p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-brand-gold/15 bg-brand-gold/[0.04] p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-brand-gold/10 p-2">
                  <Bot className="h-5 w-5 text-brand-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-serif text-brand-ivory">Lectura IA</h2>
                  <p className="text-xs text-brand-accent/45">Capa de analisis para cada norma.</p>
                </div>
              </div>
              <div className="space-y-4 text-sm leading-6 text-brand-accent/65">
                <p>
                  Cada registro se clasifica por materia y se cruza con tus expedientes para sugerir donde puede haber impacto.
                </p>
                <div className="rounded-lg border border-white/[0.06] bg-brand-black/30 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">Proxima mejora</p>
                  <p className="mt-2 text-sm text-brand-ivory/80">
                    LUSTI analizara automaticamente cada norma, generara un resumen legal y avisara que expedientes podrian verse afectados.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-6">
              <h2 className="text-lg font-serif text-brand-ivory">Biblioteca normativa</h2>
              <p className="mt-1 text-xs text-brand-accent/45">Registros guardados para seguimiento.</p>
              <div className="mt-5 space-y-3">
                {savedItems.length > 0 ? savedItems.slice(0, 5).map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-brand-gold/25"
                  >
                    <p className="line-clamp-2 text-sm text-brand-ivory/80">{item.title}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold">{item.source} - {item.category}</p>
                  </a>
                )) : (
                  <div className="rounded-lg border border-dashed border-white/[0.08] p-6 text-center">
                    <Archive className="mx-auto mb-3 h-8 w-8 text-brand-accent/15" />
                    <p className="text-sm text-brand-accent/35">Aun no hay registros guardados.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

const RegistryCard = ({ item, cases, onSave, onLink, isSaved }) => {
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const relatedCases = getRelatedCases(item, cases);
  const Icon = item.type === 'Jurisprudencia' ? Gavel : FileText;
  const linkOptions = relatedCases.length > 0 ? relatedCases : cases;

  return (
    <article className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-6 transition-colors hover:border-brand-gold/20 hover:bg-white/[0.025]">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-brand-gold/10 p-3 text-brand-gold">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>{item.type}</Badge>
              <Badge>{item.category}</Badge>
              <Badge tone={item.urgency === 'Alta' ? 'danger' : 'default'}>{item.urgency}</Badge>
            </div>
            <h2 className="text-2xl font-serif leading-snug text-brand-ivory">{item.title}</h2>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/40">
              {item.entity} - {item.date} - {item.scrapedAt}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoBlock label="Resumen oficial normalizado" text={item.summary} />
        <InfoBlock label="Impacto sugerido" text={item.impact} highlight />
      </div>

      <div className="mt-5 rounded-lg border border-white/[0.05] bg-brand-black/25 p-4">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold">
          <Link2 className="h-4 w-4" />
          Expedientes relacionados
        </div>
        {relatedCases.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {relatedCases.map((caseItem) => (
              <span key={caseItem.id} className="rounded-full border border-brand-gold/15 bg-brand-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-gold">
                {caseItem.id} - {caseItem.type}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-accent/45">No hay expedientes de la misma materia. Puedes guardarlo como referencia general.</p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.05] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-accent/65 transition-colors hover:border-brand-gold/25 hover:text-brand-ivory"
        >
          Ver fuente oficial
          <ExternalLink className="h-4 w-4" />
        </a>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-[220px] rounded-lg border border-white/[0.08] bg-white/[0.02] px-3">
            <select
              value={selectedCaseId}
              onChange={(event) => setSelectedCaseId(event.target.value)}
              className="h-full w-full bg-transparent py-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-accent/70 outline-none"
            >
              <option value="" className="bg-brand-dark">Elegir expediente</option>
              {linkOptions.map((caseItem) => (
                <option key={caseItem.id} value={caseItem.id} className="bg-brand-dark">
                  {caseItem.id}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!selectedCaseId}
            onClick={() => {
              onLink(item, selectedCaseId);
              setSelectedCaseId('');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-gold/20 bg-brand-gold/10 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-gold transition-colors hover:bg-brand-gold/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Link2 className="h-4 w-4" />
            Vincular
          </button>
          <button
            type="button"
            onClick={onSave}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
              isSaved
                ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                : 'bg-brand-ivory text-brand-black hover:bg-white'
            }`}
          >
            <Archive className="h-4 w-4" />
            {isSaved ? 'Guardado' : 'Guardar'}
          </button>
        </div>
      </div>
    </article>
  );
};

const Metric = ({ label, value, icon: Icon, tone = 'default' }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
    <div className={`mb-5 inline-flex rounded-lg p-2.5 ${tone === 'danger' ? 'bg-red-500/10' : 'bg-brand-gold/10'}`}>
      <Icon className={`h-5 w-5 ${tone === 'danger' ? 'text-red-300' : 'text-brand-gold'}`} />
    </div>
    <p className="text-3xl font-serif text-brand-ivory">{value}</p>
    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-accent/70">{label}</p>
  </div>
);

const FilterSelect = ({ label, value, onChange, options }) => (
  <label className="relative flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 transition-all focus-within:border-brand-gold/40">
    <Filter className="h-4 w-4 shrink-0 text-brand-accent/35" />
    <span className="pointer-events-none min-w-0 flex-1 py-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-accent/70">
      {value}
    </span>
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-brand-dark">
          {option}
        </option>
      ))}
    </select>
  </label>
);

const Badge = ({ children, tone = 'default' }) => (
  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
    tone === 'danger'
      ? 'border-red-400/20 bg-red-500/10 text-red-300'
      : 'border-white/[0.08] bg-white/[0.03] text-brand-accent/65'
  }`}>
    {children}
  </span>
);

const InfoBlock = ({ label, text, highlight = false }) => (
  <div className={`rounded-lg border p-4 ${highlight ? 'border-brand-gold/15 bg-brand-gold/[0.04]' : 'border-white/[0.05] bg-white/[0.01]'}`}>
    <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.16em] ${highlight ? 'text-brand-gold' : 'text-brand-accent/40'}`}>{label}</p>
    <p className="text-sm font-light leading-6 text-brand-ivory/72">{text}</p>
  </div>
);

const getSavedRegistryItems = () => {
  try {
    const stored = window.localStorage.getItem(SAVED_REGISTRY_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getRelatedCases = (item, cases) => {
  const category = item.category.toLowerCase();

  return cases
    .filter((caseItem) => {
      const type = caseItem.type.toLowerCase();
      return type.includes(category) || category.includes(type);
    })
    .slice(0, 4);
};

const formatCheckedAt = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
};

const formatFeedSource = (source) => {
  if (source === 'live') return 'consulta publica en vivo';
  return 'fuentes oficiales curadas';
};

export default ElPeruano;
