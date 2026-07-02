import { fetchOfficialRegistryItems } from './officialRegistryService';

const SKIP_PATTERNS = [
  /^(hola|buenos|gracias|chau|adios|hey|ok|si|no|dale|listo)$/i,
  /^(quien|como te llamas|que eres|que puedes hacer)/i,
];

export const searchLegalContext = async (question) => {
  const trimmed = question?.trim();
  if (!trimmed || trimmed.length < 10) return null;
  if (SKIP_PATTERNS.some((p) => p.test(trimmed))) return null;

  try {
    const result = await fetchOfficialRegistryItems(trimmed);
    if (!result?.items?.length) return null;

    const topItems = result.items.slice(0, 5);
    const context = topItems.map((item, i) =>
      `${i + 1}. ${item.title} (${item.type || 'Norma'}, ${item.date || 'fecha no disponible'})`
    ).join('\n');

    return `CONTEXTO NORMATIVO ENCONTRADO (puede ser irrelevante):\n${context}\n\nSOLO uses esta normativa si ES EXACTAMENTE DE LA MISMA MATERIA del caso (laboral, civil, penal, etc.). Si es de otra materia, IGNORALA COMPLETAMENTE. No la menciones ni la cites.`;
  } catch {
    return null;
  }
};
