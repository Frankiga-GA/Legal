// =============================================================================
// src/utils/peruvianHolidays.js
// =============================================================================
// Feriados nacionales del Peru. Los fijos se declaran por anio, los movibles
// (Semana Santa) se calculan con el algoritmo de Gauss / Computus.
// =============================================================================

// Algoritmo de Meeus/Jones/Butcher para calcular Domingo de Pascua.
const computeEaster = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
};

const toUtcDate = (year, monthZeroBased, day) =>
  new Date(Date.UTC(year, monthZeroBased, day));

const addDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

// Feriados fijos (mes en base 0: enero=0, diciembre=11)
const FIXED_HOLIDAYS = [
  { month: 0, day: 1, label: 'Ano Nuevo' },
  { month: 4, day: 1, label: 'Dia del Trabajo' },
  { month: 5, day: 29, label: 'San Pedro y San Pablo' },
  { month: 6, day: 28, label: 'Fiestas Patrias' },
  { month: 6, day: 29, label: 'Fiestas Patrias' },
  { month: 7, day: 30, label: 'Santa Rosa de Lima' },
  { month: 9, day: 8, label: 'Batalla de Angamos' },
  { month: 10, day: 1, label: 'Todos los Santos' },
  { month: 11, day: 8, label: 'Inmaculada Concepcion' },
  { month: 11, day: 9, label: 'Batalla de Ayacucho' },
  { month: 11, day: 25, label: 'Navidad' },
];

// Feriados regionales / sectoriales relevantes para el sistema judicial
const SECTORIAL_HOLIDAYS = [
  { month: 6, day: 23, label: 'Dia de la Fuerza Aerea del Peru' },
  { month: 6, day: 27, label: 'Dia del Bicentenario (sectorial)' },
];

/**
 Devuelve el set de feriados (YYYY-MM-DD) para un anio dado.
 Incluye feriados fijos + Semana Santa calculada.
 */
export const getHolidaysForYear = (year) => {
  const map = new Map();
  [...FIXED_HOLIDAYS, ...SECTORIAL_HOLIDAYS].forEach(({ month, day, label }) => {
    const key = isoDate(toUtcDate(year, month, day));
    map.set(key, { date: key, label, kind: 'nacional' });
  });

  const easter = computeEaster(year);
  const thursday = addDays(easter, -3);
  const friday = addDays(easter, -2);
  map.set(isoDate(thursday), { date: isoDate(thursday), label: 'Jueves Santo', kind: 'religioso' });
  map.set(isoDate(friday), { date: isoDate(friday), label: 'Viernes Santo', kind: 'religioso' });
  return map;
};

export const isoDate = (date) => {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isWeekend = (date) => {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

const getHolidaysAroundYear = (date) => {
  const year = date.getUTCFullYear();
  return new Map([
    ...getHolidaysForYear(year - 1),
    ...getHolidaysForYear(year),
    ...getHolidaysForYear(year + 1),
  ]);
};

/**
 Devuelve true si la fecha (YYYY-MM-DD o Date) cae en feriado nacional.
 No considera fines de semana, solo feriados.
 */
export const isHoliday = (dateInput) => {
  const date = dateInput instanceof Date ? dateInput : new Date(`${dateInput}T00:00:00Z`);
  const holidays = getHolidaysAroundYear(date);
  return holidays.has(isoDate(date));
};

export const getHolidayLabel = (dateInput) => {
  const date = dateInput instanceof Date ? dateInput : new Date(`${dateInput}T00:00:00Z`);
  const holidays = getHolidaysAroundYear(date);
  return holidays.get(isoDate(date))?.label || null;
};

/**
 Devuelve true si la fecha cae en fin de semana O feriado.
 */
export const isNonBusinessDay = (dateInput) => {
  const date = dateInput instanceof Date ? dateInput : new Date(`${dateInput}T00:00:00Z`);
  if (isWeekend(date)) return true;
  return isHoliday(date);
};

/**
 Devuelve la lista completa de feriados entre dos fechas (inclusive).
 */
export const getHolidaysInRange = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const result = [];
  const holidays = getHolidaysAroundYear(start);
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = isoDate(cursor);
    if (holidays.has(key)) {
      result.push({ date: key, ...holidays.get(key) });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
};
