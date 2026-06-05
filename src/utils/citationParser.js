// =============================================================================
// src/utils/citationParser.js
// =============================================================================
// Detecta referencias legales y jurisprudenciales dentro del texto de la IA.
// Devuelve una lista de citas estructuradas con su tipo para poder
// renderizarlas como chips o listarlas en un panel.
//
// Tipos soportados:
//   - constitution: "Art. 23° de la Constitucion"
//   - law:          "Art. 1245° del Codigo Civil"
//   - decree:       "Ley N.° 27037", "D.Leg. N.° 650"
//   - jurisprudence: "Cas. N.° 1234-2021-Lima", "STC Exp. N.° 0008-2020-PI/TC"
//   - resolution:   "Res. N.° 456-2023/SUNARP"
// =============================================================================

// Normaliza el texto para que coincidan patrones con/sin tildes
const norm = (text) =>
  String(text || '')
    .replace(/[áÁ]/g, 'a')
    .replace(/[éÉ]/g, 'e')
    .replace(/[íÍ]/g, 'i')
    .replace(/[óÓ]/g, 'o')
    .replace(/[úÚüÜ]/g, 'u')
    .replace(/[ñÑ]/g, 'n');

// Cuerpos legales conocidos (clave: como aparecen en la oracion)
const KNOWN_BODIES = [
  { id: 'constitucion', label: 'Constitucion', icon: 'constitution' },
  { id: 'codigo-civil', label: 'Codigo Civil', icon: 'law' },
  { id: 'codigo-procesal-civil', label: 'Codigo Procesal Civil', icon: 'law' },
  { id: 'codigo-penal', label: 'Codigo Penal', icon: 'law' },
  { id: 'codigo-procesal-penal', label: 'Codigo Procesal Penal', icon: 'law' },
  { id: 'codigo-tributario', label: 'Codigo Tributario', icon: 'law' },
  { id: 'codigo-comercio', label: 'Codigo de Comercio', icon: 'law' },
  { id: 'codigo-ninos', label: 'Codigo de los Ninos y Adolescentes', icon: 'law' },
  { id: 'codigo-proteccion-consumidor', label: 'Codigo de Proteccion y Defensa del Consumidor', icon: 'law' },
  { id: 'tuoa', label: 'TUO de la Ley de Procedimiento Administrativo General', icon: 'law' },
  { id: 'ley-cts', label: 'D.Leg. N.° 650 (CTS)', icon: 'decree' },
  { id: 'ley-igv', label: 'TUO de la Ley del IGV', icon: 'decree' },
];

const findBodyLabel = (text) => {
  const lower = norm(text).toLowerCase();
  // Buscamos la frase mas larga primero para no matchear "Codigo" suelto
  const sorted = [...KNOWN_BODIES].sort((a, b) => b.label.length - a.label.length);
  for (const body of sorted) {
    if (lower.includes(norm(body.label).toLowerCase())) {
      return body;
    }
  }
  return null;
};

const buildCitation = ({ type, label, full, icon }) => ({
  type,
  label,
  full,
  icon: icon || type,
});

const extractUnique = (items) => {
  const seen = new Set();
  const out = [];
  items.forEach((item) => {
    const key = `${item.type}::${item.label.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });
  return out;
};

export const parseCitations = (text) => {
  if (!text) return [];
  const citations = [];
  const normText = norm(text);

  // 1) Articulos de un cuerpo legal: "Art. 23° de la Constitucion"
  //    o "Articulo 1245 del Codigo Civil"
  const articleRegex = /(?:Art\.?|Art[íi]culo)\s+(\d+(?:[°º])?(?:\s*(?:inc\.|inciso|literal)\s*\d+[°º]?)?)/gi;
  let match;
  while ((match = articleRegex.exec(normText)) !== null) {
    const article = match[1];
    // Buscamos el cuerpo legal en una ventana de 80 chars despues del articulo
    const window = normText.slice(match.index, match.index + 80);
    const body = findBodyLabel(window);
    if (body) {
      citations.push(
        buildCitation({
          type: body.icon === 'constitution' ? 'constitution' : 'law',
          label: `Art. ${article} ${body.label}`,
          full: `Art. ${article} ${body.label}`,
          icon: body.icon,
        })
      );
    }
  }

  // 2) Ley / Decreto Legislativo / Decreto Supremo / Decreto de Urgencia
  const decreeRegex = /\b(Ley|D\.?Leg\.?|D\.?L\.?|D\.?S\.?|D\.?U\.?)\s*N[°º.]?\s*(\d+(?:-\d+)?)/gi;
  while ((match = decreeRegex.exec(text)) !== null) {
    const kind = match[1].toUpperCase().replace(/\./g, '');
    const number = match[2];
    const label = `${kind} N.° ${number}`;
    citations.push(buildCitation({ type: 'decree', label, full: label, icon: 'decree' }));
  }

  // 3) Casaciones del Poder Judicial
  const casacionRegex = /\bCas(?:aci[oó]n)?\.?\s*N[°º.]?\s*(\d+(?:-\d+)?(?:-[A-Za-z]+)?)/gi;
  while ((match = casacionRegex.exec(text)) !== null) {
    const number = match[1];
    const label = `Cas. N.° ${number}`;
    citations.push(buildCitation({ type: 'jurisprudence', label, full: label, icon: 'jurisprudence' }));
  }

  // 4) Sentencias del Tribunal Constitucional
  //    "STC Exp. N.° 0008-2020-PI/TC" o "Exp. N.° 0008-2020-PI/TC"
  const stcRegex = /\b(?:STC\s+)?Exp\.?\s*N[°º.]?\s*(\d+(?:-\d+)?(?:-[A-Z/]+)?)/gi;
  while ((match = stcRegex.exec(text)) !== null) {
    const number = match[1];
    // Evitamos confundir con numeros de casacion
    if (/-\d{4}-[A-Z]/.test(number)) {
      const label = `STC Exp. N.° ${number}`;
      citations.push(
        buildCitation({ type: 'jurisprudence', label, full: label, icon: 'jurisprudence' })
      );
    }
  }

  // 5) Resoluciones administrativas
  const resRegex = /\bRes\.?\s*N[°º.]?\s*(\d+(?:-\d+)?(?:-[A-Z/]+)?)/g;
  while ((match = resRegex.exec(text)) !== null) {
    const number = match[1];
    const label = `Res. N.° ${number}`;
    citations.push(buildCitation({ type: 'resolution', label, full: label, icon: 'resolution' }));
  }

  return extractUnique(citations);
};

/**
 Extrae la lista unica de TODAS las citas de una conversacion completa
 (util para el panel lateral "Fuentes citadas").
 */
export const collectCitations = (messages = []) => {
  const all = [];
  messages.forEach((message) => {
    if (message?.role === 'ai' && message?.content) {
      all.push(...parseCitations(message.content));
    }
  });
  return extractUnique(all);
};
