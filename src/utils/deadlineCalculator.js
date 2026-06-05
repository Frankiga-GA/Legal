// =============================================================================
// src/utils/deadlineCalculator.js
// =============================================================================
// Motor de calculo de plazos procesales peruanos. Aplica las reglas del
// Codigo Procesal Civil (Art. 150° y 151°) por defecto y del CPP en lo que
// corresponda a plazos en dias naturales.
//
// Unidades soportadas:
//   - business-days: dias habiles (excluye sabado, domingo y feriados)
//   - calendar-days: dias naturales (todos)
//   - months       : meses (mismo dia del mes siguiente; si no existe, ultimo)
//   - years        : anios (mismo dia del anio siguiente)
//
// En cualquier caso, si el ULTIMO dia del plazo cae en sabado, domingo o
// feriado, se prorroga al siguiente dia habil (Art. 150 C.P.C.).
// =============================================================================

import {
  getHolidaysInRange,
  isNonBusinessDay,
  isoDate,
} from './peruvianHolidays';

const toUtc = (dateInput) => {
  if (dateInput instanceof Date) {
    return new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate()));
  }
  return new Date(`${dateInput}T00:00:00Z`);
};

const addUtcDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const formatLongDate = (date) =>
  new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toUtc(date));

const formatShortDate = (date) =>
  new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toUtc(date));

/**
 Suma dias naturales a una fecha.
 */
const addCalendarDays = (start, days) => addUtcDays(start, days);

/**
 Suma N dias habiles. Empieza a contar desde el SIGUIENTE dia habil
 al "start" (Art. 151 C.P.C.: el dia de la notificacion no cuenta).
 */
const addBusinessDays = (start, days) => {
  let cursor = start;
  let counted = 0;
  while (counted < days) {
    cursor = addUtcDays(cursor, 1);
    if (!isNonBusinessDay(cursor)) counted += 1;
  }
  return cursor;
};

/**
 Suma N meses. Si el dia destino no existe (ej. 31 de febrero),
 se va al ultimo dia del mes (Art. 149 C.P.C. analogia).
 */
const addMonths = (start, months) => {
  const targetMonth = start.getUTCMonth() + months;
  const targetYear = start.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const originalDay = start.getUTCDate();
  // Ultimo dia del mes destino
  const lastDayOfTarget = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(originalDay, lastDayOfTarget);
  return new Date(Date.UTC(targetYear, normalizedMonth, targetDay));
};

/**
 Suma N anios (mismo manejo de Feb 29 en bisiestos).
 */
const addYears = (start, years) => {
  const targetYear = start.getUTCFullYear() + years;
  const originalMonth = start.getUTCMonth();
  const originalDay = start.getUTCDate();
  const lastDayOfTarget = new Date(Date.UTC(targetYear, originalMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(originalDay, lastDayOfTarget);
  return new Date(Date.UTC(targetYear, originalMonth, targetDay));
};

/**
 Prorroga al siguiente dia habil si la fecha cae en fin de semana o feriado.
 */
const postponeIfNonBusiness = (date) => {
  let cursor = date;
  let guard = 0;
  while (isNonBusinessDay(cursor) && guard < 30) {
    cursor = addUtcDays(cursor, 1);
    guard += 1;
  }
  return cursor;
};

const buildBreakdown = (start, result, unit, days) => {
  const startIso = isoDate(start);
  const resultIso = isoDate(result);
  const holidaysHit = getHolidaysInRange(startIso, resultIso).filter(
    (h) => h.date !== startIso && h.date !== resultIso
  );
  const totalCalendar = Math.round((result - start) / 86400000);
  return {
    startDate: startIso,
    startLabel: formatLongDate(start),
    resultDate: resultIso,
    resultLabel: formatLongDate(result),
    resultShort: formatShortDate(result),
    calendarDaysElapsed: totalCalendar,
    holidaysInRange: holidaysHit,
    wasPostponed: isoDate(result) !== isoDate(
      unit === 'business-days' ? addBusinessDays(start, days)
      : unit === 'calendar-days' ? addCalendarDays(start, days)
      : unit === 'months' ? addMonths(start, days)
      : addYears(start, days)
    ),
  };
};

/**
 API principal.
 - startDate: 'YYYY-MM-DD'
 - amount: numero entero
 - unit: 'business-days' | 'calendar-days' | 'months' | 'years'
 - includeStartDay: si true cuenta el mismo dia del inicio (no es lo habitual
   procesalmente, pero queda como opcion)
 */
export const calculateDeadline = ({
  startDate,
  amount,
  unit = 'business-days',
  includeStartDay = false,
} = {}) => {
  const errors = [];
  if (!startDate) errors.push('Debes indicar la fecha de inicio.');
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) errors.push('La cantidad debe ser un numero positivo.');
  if (!['business-days', 'calendar-days', 'months', 'years'].includes(unit)) {
    errors.push('Unidad de plazo no valida.');
  }
  if (errors.length) {
    return { ok: false, errors };
  }

  const start = toUtc(startDate);
  const baseStart = includeStartDay ? start : addUtcDays(start, 0);

  let baseResult;
  switch (unit) {
    case 'business-days':
      baseResult = addBusinessDays(baseStart, num);
      break;
    case 'calendar-days':
      baseResult = addCalendarDays(baseStart, num);
      break;
    case 'months':
      baseResult = addMonths(baseStart, num);
      break;
    case 'years':
      baseResult = addYears(baseStart, num);
      break;
    default:
      baseResult = baseStart;
  }

  // Ajuste por Art. 150 C.P.C. (ultimo dia no habil se prorroga)
  const finalResult = postponeIfNonBusiness(baseResult);
  const breakdown = buildBreakdown(baseStart, finalResult, unit, num);
  const postponedFrom = isoDate(baseResult) !== isoDate(finalResult) ? isoDate(baseResult) : null;

  return {
    ok: true,
    input: { startDate, amount: num, unit, includeStartDay },
    result: {
      date: isoDate(finalResult),
      label: formatLongDate(finalResult),
      short: formatShortDate(finalResult),
      raw: finalResult,
    },
    breakdown: { ...breakdown, postponedFrom },
    unitLabel: getUnitLabel(unit, num),
  };
};

export const getUnitLabel = (unit, amount) => {
  const plural = Number(amount) === 1;
  switch (unit) {
    case 'business-days':
      return plural ? 'dia habil' : 'dias habiles';
    case 'calendar-days':
      return plural ? 'dia natural' : 'dias naturales';
    case 'months':
      return plural ? 'mes' : 'meses';
    case 'years':
      return plural ? 'ano' : 'anos';
    default:
      return '';
  }
};

export const UNITS = [
  { id: 'business-days', label: 'Dias habiles', hint: 'Excluye sabado, domingo y feriados.' },
  { id: 'calendar-days', label: 'Dias naturales', hint: 'Cuenta todos los dias corridos.' },
  { id: 'months', label: 'Meses', hint: 'Mismo dia del mes siguiente.' },
  { id: 'years', label: 'Anios', hint: 'Mismo dia del anio siguiente.' },
];

// Sugerencias de plazos comunes por materia (referencia practica)
export const SUGGESTIONS = {
  civil: [
    { title: 'Apelar sentencia', amount: 5, unit: 'business-days' },
    { title: 'Contestar demanda', amount: 30, unit: 'business-days' },
    { title: 'Excepciones / defensas previas', amount: 10, unit: 'business-days' },
    { title: 'Apelar auto de inadmisibilidad', amount: 3, unit: 'business-days' },
  ],
  penal: [
    { title: 'Apelar sentencia (proceso comun)', amount: 10, unit: 'business-days' },
    { title: 'Plazo de prision preventiva', amount: 18, unit: 'months' },
    { title: 'Prescripcion de la accion (delitos graves)', amount: 15, unit: 'years' },
  ],
  laboral: [
    { title: 'Demanda de nulidad de despido', amount: 30, unit: 'calendar-days' },
    { title: 'Apelar sentencia laboral', amount: 10, unit: 'business-days' },
    { title: 'Contestar demanda laboral', amount: 10, unit: 'business-days' },
  ],
  administrativo: [
    { title: 'Recurso de reconsideracion', amount: 15, unit: 'business-days' },
    { title: 'Recurso de apelacion', amount: 15, unit: 'business-days' },
    { title: 'Silencio administrativo (resolver)', amount: 30, unit: 'calendar-days' },
  ],
};
