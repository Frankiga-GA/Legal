import { mockOfficialRegistryItems } from '../data/mockOfficialRegistry';

const EL_PERUANO_SEARCH_URL = 'https://www.elperuano.pe/portal/buscador';

const normalizeText = (value = '') => value.toString().trim().replace(/\s+/g, ' ');

const inferCategory = (text = '') => {
  const normalized = text.toLowerCase();

  if (normalized.includes('trabajo') || normalized.includes('laboral') || normalized.includes('sunafil')) return 'Laboral';
  if (normalized.includes('sunat') || normalized.includes('tribut')) return 'Tributario';
  if (normalized.includes('indecopi') || normalized.includes('consumidor')) return 'Consumidor';
  if (normalized.includes('contratacion') || normalized.includes('osce')) return 'Contrataciones';
  if (normalized.includes('empresa') || normalized.includes('societ')) return 'Corporativo';
  if (normalized.includes('penal') || normalized.includes('delito')) return 'Penal';
  if (normalized.includes('civil') || normalized.includes('propiedad')) return 'Civil';
  return 'General';
};

const inferType = (title = '') => {
  const normalized = title.toLowerCase();

  if (normalized.includes('decreto supremo')) return 'Decreto Supremo';
  if (normalized.includes('decreto legislativo')) return 'Decreto Legislativo';
  if (normalized.includes('resolucion') || normalized.includes('resolución')) return 'Resolucion';
  if (normalized.includes('ley ')) return 'Ley';
  if (normalized.includes('sentencia') || normalized.includes('casacion') || normalized.includes('casación')) return 'Jurisprudencia';
  return 'Norma Legal';
};

const buildImpact = (title, category) => {
  const categoryLabel = category === 'General' ? 'el estudio' : `la practica ${category.toLowerCase()}`;
  return `Revisar posible impacto en ${categoryLabel} y validar si corresponde vincularla a expedientes activos.`;
};

const parseElPeruanoSearch = (html) => {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = Array.from(doc.querySelectorAll('a'))
    .map((link) => ({
      title: normalizeText(link.textContent),
      url: link.href,
    }))
    .filter((item) => item.title.length > 28 && item.url.includes('elperuano.pe'));

  return links.slice(0, 8).map((item, index) => {
    const category = inferCategory(item.title);

    return {
      id: `elperuano-live-${index}`,
      title: item.title,
      date: new Date().toISOString().split('T')[0],
      type: inferType(item.title),
      source: 'El Peruano',
      entity: 'Diario Oficial El Peruano',
      summary: 'Resultado obtenido desde el buscador publico de El Peruano. Abre la fuente para revisar el texto completo.',
      impact: buildImpact(item.title, category),
      url: item.url,
      category,
      urgency: index < 2 ? 'Alta' : 'Media',
      scrapedAt: 'Consulta en vivo',
      official: true,
    };
  });
};

export const fetchOfficialRegistryItems = async () => {
  try {
    const response = await fetch(EL_PERUANO_SEARCH_URL, { mode: 'cors' });
    if (!response.ok) throw new Error('El Peruano no respondio correctamente.');

    const html = await response.text();
    const liveItems = parseElPeruanoSearch(html);

    if (liveItems.length === 0) throw new Error('No se encontraron resultados parseables.');

    return {
      items: liveItems,
      source: 'live',
      error: null,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      items: mockOfficialRegistryItems,
      source: 'curated-official-links',
      error,
      checkedAt: new Date().toISOString(),
    };
  }
};

export const getOfficialRegistryFallbackItems = () => mockOfficialRegistryItems;
