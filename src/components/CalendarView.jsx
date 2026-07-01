// =============================================================================
// src/components/CalendarView.jsx
// =============================================================================
// Vista calendario de TODOS los plazos de TODOS los expedientes. Pensado
// para que el abogado vea de un vistazo lo que se vence esta semana / mes.
// =============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Filter, X, RefreshCw } from 'lucide-react';
import { loadCases } from '../services/caseStore';
import { syncDeadlinesToCalendar } from '../services/googleCalendarService';
import { getStoredDriveToken, onDriveTokenChange } from '../services/googleDriveService';
import toast from 'react-hot-toast';

const PRIORITY_TONE = {
  Alta: {
    dot: 'bg-red-400',
    pill: 'border-red-500/40 bg-red-500/[0.12] text-red-300',
    text: 'text-red-300',
  },
  Media: {
    dot: 'bg-amber-400',
    pill: 'border-amber-500/40 bg-amber-500/[0.12] text-amber-300',
    text: 'text-amber-300',
  },
  Baja: {
    dot: 'bg-sky-400',
    pill: 'border-sky-500/40 bg-sky-500/[0.12] text-sky-300',
    text: 'text-sky-300',
  },
};

const STATUS_LABEL = {
  Pendiente: 'Pendiente',
  Completado: 'Completado',
  Vencido: 'Vencido',
};

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const toIso = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const buildMonthGrid = (cursor) => {
  const first = startOfMonth(cursor);
  // Semana inicia en lunes: convertimos getDay() (0=Dom) a 0=Lun
  const weekdayIndex = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - weekdayIndex);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
};

const buildWeekGrid = (cursor) => {
  const weekdayIndex = (cursor.getDay() + 6) % 7;
  const start = new Date(cursor);
  start.setDate(cursor.getDate() - weekdayIndex);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const collectDeadlines = (cases) => {
  const events = [];
  cases.forEach((caso) => {
    if (!Array.isArray(caso.importantDates)) return;
    caso.importantDates.forEach((d) => {
      events.push({
        ...d,
        caseId: caso.id,
        caseName: caso.clientName,
        caseType: caso.type,
      });
    });
  });
  return events.sort((a, b) => String(a.date).localeCompare(String(b.date)));
};

const CalendarView = ({ onOpenCase }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState('month'); // 'month' | 'week'
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [caseFilter, setCaseFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isCalendarConnected, setIsCalendarConnected] = useState(Boolean(getStoredDriveToken()?.access_token));

  useEffect(() => onDriveTokenChange((token) => {
    setIsCalendarConnected(Boolean(token?.access_token));
  }), []);

  const handleSync = async (silent = false) => {
    if (syncing) return;
    setSyncing(true);
    setSyncProgress(0);
    try {
      const allDeadlines = collectDeadlines(cases);
      if (!allDeadlines.length) {
        if (!silent) toast('No hay plazos para sincronizar.');
        return;
      }
      const result = await syncDeadlinesToCalendar(allDeadlines, setSyncProgress);
      if (!silent) toast.success(`Calendar: ${result.created} creados, ${result.updated} actualizados, ${result.deleted} eliminados`);
    } catch (e) {
      if (!silent) toast.error(e.message || 'Error al sincronizar con Google Calendar');
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await loadCases();
        if (!cancelled) {
          setCases(Array.isArray(result.cases) ? result.cases : []);
        }
      } catch (error) {
        console.error('No se pudieron cargar los expedientes para el calendario.', error);
        toast.error('Error al cargar los expedientes. Verifique su conexión.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-sync al cargar expedientes si hay token
  const autoSync = useRef(false);
  useEffect(() => {
    if (!loading && cases.length > 0 && isCalendarConnected && !autoSync.current) {
      autoSync.current = true;
      handleSync(true);
    }
  }, [loading, cases, isCalendarConnected]);

  const deadlines = useMemo(() => collectDeadlines(cases), [cases]);
  const filtered = useMemo(
    () =>
      deadlines.filter((d) => {
        if (priorityFilter !== 'all' && d.priority !== priorityFilter) return false;
        if (caseFilter !== 'all' && d.caseId !== caseFilter) return false;
        return true;
      }),
    [deadlines, priorityFilter, caseFilter]
  );

  const grid = view === 'month' ? buildMonthGrid(cursor) : buildWeekGrid(cursor);
  const today = new Date();

  const eventsByDate = useMemo(() => {
    const map = new Map();
    filtered.forEach((event) => {
      if (!map.has(event.date)) map.set(event.date, []);
      map.get(event.date).push(event);
    });
    return map;
  }, [filtered]);

  const goPrev = () => {
    const next = new Date(cursor);
    if (view === 'month') next.setMonth(cursor.getMonth() - 1);
    else next.setDate(cursor.getDate() - 7);
    setCursor(next);
  };

  const goNext = () => {
    const next = new Date(cursor);
    if (view === 'month') next.setMonth(cursor.getMonth() + 1);
    else next.setDate(cursor.getDate() + 7);
    setCursor(next);
  };

  const goToday = () => setCursor(new Date());

  const headerLabel =
    view === 'month'
      ? `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`
      : `Semana del ${grid[0].getDate()} ${MONTH_NAMES[grid[0].getMonth()].toLowerCase()}`;

  // Proximos 5 plazos (para la sidebar)
  const upcoming = useMemo(() => {
    const todayIso = toIso(today);
    return filtered
      .filter((d) => d.date >= todayIso && d.status !== 'Completado')
      .slice(0, 5);
  }, [filtered, today]);

  const overdue = useMemo(() => {
    const todayIso = toIso(today);
    return filtered.filter(
      (d) => d.date < todayIso && d.status !== 'Completado'
    );
  }, [filtered, today]);

  const selectedEvents = selectedDate ? eventsByDate.get(toIso(selectedDate)) || [] : [];

  return (
    <div className="h-full overflow-y-auto bg-brand-black text-brand-ivory">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-gold">
              <Clock className="h-5 w-5" />
              <p className="text-[10px] font-semibold uppercase tracking-widest">
                Agenda
              </p>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-medium text-brand-ivory">
              Calendario de plazos
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-brand-accent/70">
              Todos los vencimientos de todos tus expedientes en una sola vista.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-1">
              <button
                type="button"
                onClick={() => setView('month')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === 'month'
                    ? 'bg-brand-gold text-brand-black'
                    : 'text-brand-accent hover:text-brand-ivory'
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => setView('week')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === 'week'
                    ? 'bg-brand-gold text-brand-black'
                    : 'text-brand-accent hover:text-brand-ivory'
                }`}
              >
                Semana
              </button>
            </div>
            {isCalendarConnected && (
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-brand-ivory transition-colors hover:bg-white/[0.06] disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? `${syncProgress}%` : 'Sync Calendar'}
              </button>
            )}
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-brand-ivory transition-colors hover:bg-white/[0.06]"
            >
              Hoy
            </button>
            <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.02]">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-8 w-8 items-center justify-center text-brand-accent transition-colors hover:text-brand-ivory"
                aria-label="Periodo anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs font-semibold tabular-nums text-brand-ivory">
                {headerLabel}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="flex h-8 w-8 items-center justify-center text-brand-accent transition-colors hover:text-brand-ivory"
                aria-label="Periodo siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-brand-accent/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-accent/60">
            Filtrar:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'Alta', 'Media', 'Baja'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  priorityFilter === p
                    ? 'bg-brand-gold text-brand-black'
                    : 'bg-white/[0.04] text-brand-accent hover:bg-white/[0.08]'
                }`}
              >
                {p === 'all' ? 'Todas' : p}
              </button>
            ))}
          </div>
          {cases.length > 1 && (
            <select
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] text-brand-ivory outline-none focus:border-brand-gold/50"
            >
              <option value="all">Todos los expedientes</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.clientName}
                </option>
              ))}
            </select>
          )}
          <div className="ml-auto flex items-center gap-3 text-[10px] text-brand-accent/60">
            <LegendItem color="bg-red-400" label="Alta" />
            <LegendItem color="bg-amber-400" label="Media" />
            <LegendItem color="bg-sky-400" label="Baja" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          {/* Grid principal */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-brand-dark/50">
            <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.02]">
              {WEEKDAY_LABELS.map((day) => (
                <div
                  key={day}
                  className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-brand-accent/60"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-6">
              {grid.map((day, idx) => {
                const isCurrentMonth = day.getMonth() === cursor.getMonth();
                const isToday = isSameDay(day, today);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const dayIso = toIso(day);
                const events = eventsByDate.get(dayIso) || [];
                const isPast = dayIso < toIso(today);
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`group relative flex min-h-[88px] flex-col items-stretch gap-1 border-b border-r border-white/[0.04] p-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-brand-gold/10 ring-1 ring-inset ring-brand-gold/40'
                        : isToday
                          ? 'bg-blue-500/[0.06] hover:bg-blue-500/[0.10]'
                          : isCurrentMonth
                            ? 'hover:bg-white/[0.03]'
                            : 'bg-white/[0.01] hover:bg-white/[0.025]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          isToday
                            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white'
                            : isCurrentMonth
                              ? isPast
                                ? 'text-brand-accent/40'
                                : 'text-brand-ivory'
                              : 'text-brand-accent/25'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {events.length > 0 && (
                        <span className="text-[9px] font-bold text-brand-accent/50">
                          {events.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {events.slice(0, 3).map((event) => {
                        const tone = PRIORITY_TONE[event.priority] || PRIORITY_TONE.Media;
                        const isDone = event.status === 'Completado';
                        return (
                          <div
                            key={event.id}
                            className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] ${
                              isDone ? 'opacity-50 line-through' : ''
                            }`}
                            title={`${event.title} - ${event.caseName}`}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
                            <span className="truncate text-brand-ivory">
                              {event.title}
                            </span>
                          </div>
                        );
                      })}
                      {events.length > 3 && (
                        <span className="px-1.5 text-[9px] text-brand-accent/60">
                          +{events.length - 3} mas
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Detalle del dia seleccionado */}
            {selectedDate && (
              <div className="rounded-2xl border border-white/[0.06] bg-brand-dark p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-brand-ivory">
                    {selectedDate.toLocaleDateString('es-PE', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="flex h-6 w-6 items-center justify-center rounded text-brand-accent/60 hover:bg-white/[0.06] hover:text-brand-ivory"
                    aria-label="Cerrar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {selectedEvents.length === 0 ? (
                  <p className="text-xs text-brand-accent/50">
                    Sin plazos para este dia.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedEvents.map((event) => {
                      const tone = PRIORITY_TONE[event.priority] || PRIORITY_TONE.Media;
                      return (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => onOpenCase && onOpenCase(event.caseId)}
                            className="w-full text-left"
                          >
                            <div
                              className={`rounded-lg border px-2.5 py-2 text-xs transition-all hover:scale-[1.01] ${tone.pill}`}
                            >
                              <p className="font-semibold">{event.title}</p>
                              <p className="mt-0.5 text-[10px] opacity-80">
                                {event.caseId} - {event.caseName}
                              </p>
                              <p className="mt-1 flex items-center gap-2 text-[10px]">
                                <span>{event.priority}</span>
                                <span className="opacity-50">-</span>
                                <span>{STATUS_LABEL[event.status] || event.status}</span>
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Plazos vencidos */}
            {overdue.length > 0 && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
                  Vencidos ({overdue.length})
                </h3>
                <ul className="space-y-1.5">
                  {overdue.slice(0, 4).map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onOpenCase && onOpenCase(event.caseId)}
                        className="w-full text-left text-[11px] text-red-200 hover:underline"
                      >
                        <span className="font-semibold">{event.title}</span>
                        <span className="opacity-70"> - {event.caseName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Proximos */}
            <div className="rounded-2xl border border-white/[0.06] bg-brand-dark p-4">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-brand-accent/60">
                Proximos plazos
              </h3>
              {loading ? (
                <p className="text-xs text-brand-accent/50">Cargando...</p>
              ) : upcoming.length === 0 ? (
                <p className="text-xs text-brand-accent/50">No hay plazos pendientes.</p>
              ) : (
                <ul className="space-y-1.5">
                  {upcoming.map((event) => {
                    const tone = PRIORITY_TONE[event.priority] || PRIORITY_TONE.Media;
                    const days = Math.round(
                      (new Date(event.date) - today) / 86400000
                    );
                    return (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => onOpenCase && onOpenCase(event.caseId)}
                          className="flex w-full items-start gap-2 text-left text-[11px] hover:text-brand-ivory"
                        >
                          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
                          <div className="flex-1">
                            <p className="text-brand-ivory">{event.title}</p>
                            <p className="text-[10px] text-brand-accent/60">
                              {event.caseName} - en {days} dia{days === 1 ? '' : 's'}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
    <span>{label}</span>
  </div>
);

export default CalendarView;
