// =============================================================================
// src/components/DeadlineCalculator.jsx
// =============================================================================
// UI principal de la calculadora de plazos procesales. Toma una fecha
// inicial + cantidad + unidad y devuelve la fecha final respetando
// feriados nacionales y la prorroga del Art. 150 C.P.C.
// =============================================================================

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  UNITS,
  SUGGESTIONS,
  calculateDeadline,
  getUnitLabel,
} from '../utils/deadlineCalculator';

const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const DeadlineCalculator = () => {
  const [startDate, setStartDate] = useState(todayIso());
  const [amount, setAmount] = useState(5);
  const [unit, setUnit] = useState('business-days');
  const [materia, setMateria] = useState('civil');

  const result = useMemo(
    () => calculateDeadline({ startDate, amount, unit }),
    [startDate, amount, unit]
  );

  const unitLabel = getUnitLabel(unit, amount);

  return (
    <div className="h-full overflow-y-auto bg-brand-black text-brand-ivory">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-2 text-brand-gold">
            <Clock className="h-5 w-5" />
            <p className="text-[10px] font-semibold uppercase tracking-widest">
              Utilidades
            </p>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-medium text-brand-ivory">
            Calculadora de plazos procesales
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-accent/80">
            Calcula fechas de vencimiento respetando sabados, domingos, feriados
            nacionales y la prorroga del Art. 150° del Codigo Procesal Civil.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Formulario */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.06] bg-brand-dark p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-brand-ivory">
                Datos del plazo
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-brand-black px-3 py-2.5 text-sm text-brand-ivory outline-none focus:border-brand-gold/50"
                  />
                  <p className="mt-1 text-[10px] text-brand-accent/60">
                    Por defecto, la fecha en que se te notifico o notificaste.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        setAmount(Number.isFinite(next) && next > 0 ? next : 1);
                      }}
                      className="w-full rounded-xl border border-white/[0.08] bg-brand-black px-3 py-2.5 text-sm text-brand-ivory outline-none focus:border-brand-gold/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
                      Unidad
                    </label>
                    <select
                      value={unit}
                      onChange={(event) => setUnit(event.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-brand-black px-3 py-2.5 text-sm text-brand-ivory outline-none focus:border-brand-gold/50"
                    >
                      {UNITS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-brand-accent/60">
                  {UNITS.find((u) => u.id === unit)?.hint}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.06] bg-brand-dark p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-brand-gold">
                <Sparkles className="h-4 w-4" />
                <h2 className="text-sm font-semibold text-brand-ivory">
                  Plazos sugeridos
                </h2>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {Object.keys(SUGGESTIONS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMateria(key)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                      materia === key
                        ? 'bg-brand-gold text-brand-black'
                        : 'bg-white/[0.04] text-brand-accent hover:bg-white/[0.08]'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <ul className="space-y-1">
                {SUGGESTIONS[materia].map((s) => (
                  <li key={s.title}>
                    <button
                      type="button"
                      onClick={() => {
                        setAmount(s.amount);
                        setUnit(s.unit);
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-transparent px-2.5 py-1.5 text-left text-sm text-brand-ivory transition-colors hover:border-white/[0.08] hover:bg-white/[0.03]"
                    >
                      <span>{s.title}</span>
                      <span className="text-[11px] text-brand-accent/80">
                        {s.amount} {getUnitLabel(s.unit, s.amount)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Resultado */}
          <section className="lg:col-span-3">
            {!result.ok ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                {result.errors.join(' ')}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-brand-dark to-brand-dark p-6 shadow-lg">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-300">
                    Vencimiento
                  </p>
                  <p className="mt-1 font-serif text-3xl font-medium text-brand-ivory">
                    {result.result.label}
                  </p>
                  <p className="mt-1 text-sm text-brand-accent/80">
                    {amount} {unitLabel} contados desde{' '}
                    {result.breakdown.startLabel}
                  </p>

                  {result.breakdown.postponedFrom && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Plazo prorrogado</p>
                        <p>
                          El plazo natural vencía el{' '}
                          <strong>
                            {new Date(result.breakdown.postponedFrom)
                              .toLocaleDateString('es-PE', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                timeZone: 'UTC',
                              })}
                          </strong>{' '}
                          (caía en día no hábil). Se recorrió al primer día
                          hábil siguiente por Art. 150° C.P.C.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={Calendar}
                    label="Dias corridos"
                    value={result.breakdown.calendarDaysElapsed}
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Dias habiles"
                    value={amount}
                  />
                </div>

                {result.breakdown.holidaysInRange.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.06] bg-brand-dark p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
                      <Calendar className="h-3.5 w-3.5" />
                      Feriados en el periodo
                    </h3>
                    <ul className="space-y-1.5 text-sm">
                      {result.breakdown.holidaysInRange.map((h) => (
                        <li
                          key={h.date}
                          className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
                        >
                          <span className="text-brand-ivory">{h.label}</span>
                          <span className="text-[11px] text-brand-accent/70">
                            {new Date(h.date).toLocaleDateString('es-PE', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              timeZone: 'UTC',
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-white/[0.06] bg-brand-dark p-5 text-[11px] text-brand-accent/70">
                  <p className="font-semibold text-brand-ivory">
                    Base legal aplicada
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    <li>Art. 150° C.P.C. - prorroga del último día del plazo.</li>
                    <li>Art. 151° C.P.C. - exclusión del día inicial.</li>
                    <li>Art. 149° C.P.C. - cómputo de meses y años.</li>
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-white/[0.06] bg-brand-dark p-4">
    <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <p className="font-serif text-2xl text-brand-ivory">{value}</p>
  </div>
);

export default DeadlineCalculator;
