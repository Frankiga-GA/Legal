// =============================================================================
// geminiService.js
// =============================================================================
// MIGRADO: ya no llama a Google directo. Todo va al backend en
// `/ai/raw`, que es el unico que conoce la GEMINI_API_KEY privada.
//
// Cualquier VITE_GEMINI_API_KEY que quede en .env se IGNORA.
// =============================================================================

import { isSupabaseConfigured, supabase } from '../utils/supabase';

// Control de peticion activa. Al iniciar una nueva, se aborta la anterior
// automaticamente. Cada componente llama a abortActiveRequest() al
// desmontarse para cancelar cualquier fetch en vuelo.
let activeController = null;

export const abortActiveRequest = () => {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
};

const REQUEST_TIMEOUT = 20000; // 20s max antes de abortar

const fetchWithSignal = (url, options = {}) => {
  abortActiveRequest();
  activeController = new AbortController();
  const timeoutId = setTimeout(() => activeController.abort(), REQUEST_TIMEOUT);

  return fetch(url, { ...options, signal: activeController.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
};

const fetchWithRetry = async (url, options, retries = 1) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetchWithSignal(url, options);
      if (!response.ok && i === retries) return response;
      if (!response.ok) continue;
      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('La IA no respondió a tiempo. Intentalo de nuevo.');
      }
      if (i === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Cache simple de respuestas para evitar pedidos duplicados.
const responseCache = new Map();
const CACHE_MAX = 60;
const CACHE_TTL = 5 * 60 * 1000;

const cacheKey = (params) =>
  JSON.stringify({
    p: params.prompt?.slice(0, 200),
    s: params.systemPrompt?.slice(0, 100),
    h: params.history?.length || 0,
    f: params.fileName || null,
    t: params.temperature ?? 0.25,
    m: params.maxOutputTokens ?? 2048,
    r: params.responseJson ?? false,
  });

const cacheGet = (key) => {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.t < CACHE_TTL) return entry.v;
  responseCache.delete(key);
  return null;
};

const cacheSet = (key, value) => {
  if (responseCache.size >= CACHE_MAX) {
    const first = responseCache.keys().next().value;
    if (first) responseCache.delete(first);
  }
  responseCache.set(key, { v: value, t: Date.now() });
};

export const clearCache = () => responseCache.clear();

// =============================================================================
// PROMPT MAESTRO - ABOGADO PERUANO
// =============================================================================
// Se inyecta como system_prompt en TODAS las llamadas a la IA para que la
// calidad sea consistente sin importar desde donde se chatee.
// =============================================================================
export const SYSTEM_PROMPT_LEGAL_PERU = `
Eres LUSTI, un abogado peruano senior especialista en derecho procesal civil, laboral, constitucional, tributario, penal y administrativo. Tu jurisdiccion es EXCLUSIVAMENTE PERU. No citas normas extranjeras.

RESPETA ESTRICTAMENTE ESTAS REGLAS:

1. FORMATO DE RESPUESTA (OBLIGATORIO para toda respuesta):
   RESUMEN EJECUTIVO (2-3 lineas que respondan directamente)
   FUNDAMENTO LEGAL (articulos y normativa aplicable)
   JURISPRUDENCIA RELEVANTE (Cas. N. + Sala + Ano + ratio decidendi)
   RIESGOS / CONTRAARGUMENTOS
   PROXIMA ACCION CONCRETA (que debe hacer el abogado)

   Si la pregunta es general o informativa, adapta el formato manteniendo siempre RESUMEN EJECUTIVO al inicio y PROXIMA ACCION al final.

2. NO USES MARKDOWN. Prohibido: ##, ###, **, *, -, >. Usa solo texto limpio con parrafos separados por lineas en blanco. Para enumerar usa numeros o letras seguidas de punto (ej: 1. 2. a. b.).

3. CITAS OBLIGATORIAS en formato exacto:
   - Articulos: "Art. N. del [Cuerpo Legal]" (ej: "Art. 429 del CPC")
   - Leyes: "Ley N. 29497", "D.Leg. N. 650", "D.S. N. 001-2023-TR"
   - Casaciones: "Cas. N. 1234-2023-Lima"
   - TC: "STC Exp. N. 0008-2020-PI/TC"
   - Si no estas seguro del numero exacto: "(por confirmar)"

4. PROHIBIDO:
   - No inventes articulos, casaciones, fechas ni hechos
   - No recomiendes asesoria externa. TU eres el abogado del estudio.
   - No digas "No soy abogado" ni "consulte a un abogado"
   - No cortes frases ni dejes la respuesta incompleta
   - No uses el texto "No constituye asesoria legal"

5. Si falta informacion: indica exactamente "FALTA: [dato necesario]"

6. Cuando veas "📎" en el historial o recibas texto de un archivo adjunto, reconocelo. Si el usuario pregunta por un archivo que envio antes y el texto del archivo esta disponible en este mismo prompt, usalo. Si no ves el contenido del archivo en el prompt actual, no digas "no recibi ningun archivo". En su lugar indica: "El archivo que enviaste antes ya no esta disponible en esta conversacion. Por favor adjuntalo nuevamente para que pueda analizarlo."

7. Tono: Profesional, directo, accionable. Como asociado senior que le informa al socio del estudio.`;

const CITATION_RULES = `
CITAS OBLIGATORIAS (solo derecho peruano):
- Art. N. del [Cuerpo]: "Art. 429 del CPC", "Art. 53 de la LPCL", "Art. 139 de la Constitucion"
- Ley: "Ley N. 29497", "D.Leg. N. 650", "D.S. N. 001-2023-TR"
- Casacion: "Cas. N. 1234-2023-Lima", "Casacion N. 1234-2023-Lima"
- TC: "STC Exp. N. 0008-2020-PI/TC"
- Admin: "Res. N. 456-2023/SUNARP"
- NO inventes numeros. Si dudas: "(por confirmar)"`;

const isProductionBuild = import.meta.env.PROD;

if (isProductionBuild) {
  // Antes advertiamos de la key en bundle; ahora el bundle no debe tenerla.
}

export const isGeminiConfigured = isSupabaseConfigured && Boolean(supabase);

const getAccessToken = async () => {
  if (!isGeminiConfigured) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session) return null;
  return data.session.access_token;
};

export const askBackend = async ({ prompt, temperature = 0.25, maxOutputTokens = 2048, responseJson = false, systemPrompt = null, history = null, fileName = null, fileText = null }) => {
  const key = cacheKey({ prompt, systemPrompt, history, fileName, temperature, maxOutputTokens, responseJson });
  if (key && !fileText) {
    const cached = cacheGet(key);
    if (cached) return cached;
  }

  const token = await getAccessToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchWithRetry('/api/ai/raw', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      temperature,
      max_output_tokens: maxOutputTokens,
      response_json: responseJson,
      system_prompt: systemPrompt,
      history,
      file_name: fileName,
      file_text: fileText,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const is502 = response.status === 502;
    throw new Error(is502
      ? 'El servidor de IA no está disponible (502). Groq puede estar saturado. Esperá unos segundos e intentá de nuevo.'
      : errorText || `Backend /ai/raw devolvio ${response.status}.`);
  }

  const data = await response.json();
  if (!data?.text) throw new Error('Backend devolvio una respuesta vacia.');

  if (key && !fileText) cacheSet(key, data.text);
  return data.text;
};

export const cleanAssistantText = (text = '') => text
  .replace(/^###?\s+/gm, '')
  .replace(/\*\*/g, '')
  .replace(/^\s*\*\s+/gm, '')
  .replace(/^\s*-\s+/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const buildCaseContext = ({ caseData, documents, notes, importantDates, officialReferences }) => ({
  expediente: {
    id: caseData.id,
    cliente: caseData.clientName,
    identificacion: caseData.dni,
    materia: caseData.type,
    estado: caseData.status,
    resumen: caseData.summary || 'Sin resumen registrado.',
    ultimaActualizacion: caseData.lastUpdate,
  },
  documentos: documents.map((doc) => ({
    nombre: doc.name,
    fecha: doc.date,
    tipo: doc.type,
    tamano: doc.size,
    extracto: doc.excerpt,
    contenido: doc.content,
  })),
  notas: notes.map((note) => ({
    texto: note.text,
    autor: note.author,
    fecha: note.date,
  })),
  vencimientos: importantDates.map((item) => ({
    titulo: item.title,
    fecha: item.date,
    prioridad: item.priority,
    estado: item.status,
  })),
  normasVinculadas: officialReferences.map((item) => ({
    titulo: item.title,
    fuente: item.source,
    entidad: item.entity,
    tipo: item.type,
    materia: item.category,
    fecha: item.date,
    impacto: item.impact,
    url: item.url,
  })),
});

const buildPrompt = (question, context) => `
CONTEXTO DEL EXPEDIENTE:
${JSON.stringify(context, null, 2)}

${CITATION_RULES}

PREGUNTA DEL USUARIO:
${question}
`;

export const askGeminiAboutCase = async ({
  question,
  caseData,
  documents,
  notes,
  importantDates,
  officialReferences,
  systemPrompt = null,
  history = null,
}) => {
  if (!isGeminiConfigured) {
    throw new Error('Gemini no esta configurado (Supabase no disponible).');
  }
  const context = buildCaseContext({ caseData, documents, notes, importantDates, officialReferences });
  const text = await askBackend({
    prompt: buildPrompt(question, context),
    temperature: 0.15,
    maxOutputTokens: 3000,
    systemPrompt: systemPrompt || SYSTEM_PROMPT_LEGAL_PERU,
    history,
  });
  return cleanAssistantText(text);
};

const buildRegistryContext = ({ item, cases }) => ({
  registroOficial: {
    titulo: item.title,
    fecha: item.date,
    tipo: item.type,
    fuente: item.source,
    entidad: item.entity,
    resumen: item.summary,
    impactoBase: item.impact,
    url: item.url,
    materia: item.category,
    urgencia: item.urgency,
  },
  expedientesDisponibles: cases.map((caseItem) => ({
    id: caseItem.id,
    cliente: caseItem.clientName,
    materia: caseItem.type,
    estado: caseItem.status,
    resumen: caseItem.summary,
    ultimaActualizacion: caseItem.lastUpdate,
  })),
});

const buildRegistryPrompt = (context) => `
Analiza el registro oficial con prudencia: si no tienes texto completo, dilo claramente y trabaja solo con el titulo, resumen y metadatos entregados.
No inventes articulos, plazos ni contenido no disponible.

Contexto:
${JSON.stringify(context, null, 2)}

${CITATION_RULES}
`;

export const analyzeOfficialRegistryItem = async ({ item, cases }) => {
  if (!isGeminiConfigured) {
    throw new Error('Gemini no esta configurado.');
  }
  const context = buildRegistryContext({ item, cases });
  const text = await askBackend({
    prompt: buildRegistryPrompt(context),
    temperature: 0.15,
    maxOutputTokens: 2000,
    systemPrompt: SYSTEM_PROMPT_LEGAL_PERU,
  });
  return cleanAssistantText(text);
};

const buildSpecializedAssistantPrompt = ({ bot, question, promptContext, attachmentContext }) => `
Especialidad declarada: ${bot.description || 'Asistencia legal general'}.
Documentos de referencia disponibles segun el sistema: ${bot.docs || 0}.
${promptContext ? `\nInstrucciones o prompts seleccionados para este asistente:\n${promptContext}\n` : ''}
${attachmentContext ? `\nDocumento adjunto cargado por el usuario:\n${attachmentContext}\n` : ''}

${CITATION_RULES}

PREGUNTA DEL USUARIO:
${question}
`;

export const askGeminiSpecializedAssistant = async ({ bot, question, attachmentContext = '', history = null }) => {
  if (!isGeminiConfigured) {
    throw new Error('Gemini no esta configurado.');
  }
  const text = await askBackend({
    prompt: buildSpecializedAssistantPrompt({
      bot,
      question,
      promptContext: bot.promptContext || '',
      attachmentContext,
    }),
    temperature: 0.15,
    maxOutputTokens: 4096,
    systemPrompt: SYSTEM_PROMPT_LEGAL_PERU,
    history,
  });
  return cleanAssistantText(text);
};

const buildVaultAssistantPrompt = ({ question, cases }) => `
Usa solo los expedientes entregados como contexto. Si preguntan por conteos, calcula con estos datos.
Si no encuentras un expediente, dilo sin tratarlo como error tecnico.

Expedientes:
${JSON.stringify(cases.map((caseItem) => ({
  id: caseItem.id,
  cliente: caseItem.clientName,
  identificacion: caseItem.dni,
  materia: caseItem.type,
  estado: caseItem.status,
  resumen: caseItem.summary,
  ultimaActualizacion: caseItem.lastUpdate,
  documentos: Array.isArray(caseItem.documents) ? caseItem.documents.length : 0,
  notas: Array.isArray(caseItem.notes) ? caseItem.notes.length : 0,
  fechas: Array.isArray(caseItem.importantDates) ? caseItem.importantDates.length : 0,
  normas: Array.isArray(caseItem.officialReferences) ? caseItem.officialReferences.length : 0,
})), null, 2)}

${CITATION_RULES}

PREGUNTA:
${question}
`;

export const askGeminiVaultAssistant = async ({ question, cases }) => {
  if (!isGeminiConfigured) {
    throw new Error('Gemini no esta configurado.');
  }
  const text = await askBackend({
    prompt: buildVaultAssistantPrompt({ question, cases }),
    temperature: 0.15,
    maxOutputTokens: 2000,
    systemPrompt: SYSTEM_PROMPT_LEGAL_PERU,
  });
  return cleanAssistantText(text);
};

const buildResolutionPrompt = (documentText) => `
Analiza el siguiente documento judicial o resolucion peruana y extrae la informacion operativa clave de manera precisa.
Responde estrictamente en formato JSON.

Campos requeridos en el JSON:
1. "latestProgress": Un resumen conciso de 1 frase del avance real (que se resolvio, que paso con el caso, ej. "Se declara admisible la demanda de alimentos y se programa audiencia para el 15 de julio"). Evita saludos o disclaimers.
2. "hearingLink": Busca enlaces a salas virtuales (Google Meet, Zoom, MS Teams, Jitsi, etc.) que aparezcan en el texto. Devuelve el enlace exacto como cadena de texto. Si no hay ninguno, devuelve "".
3. "urgency": Indica el nivel de urgencia del caso ("Alta", "Media", "Baja"). Si hay plazos inminentes o audiencias programadas, marca "Alta".
4. "newDeadlines": Un arreglo de objetos con los nuevos plazos detectados en el texto. Cada plazo debe tener:
   - "title": Descripcion del plazo (ej: "Subsanar demanda", "Presentar descargos", "Audiencia unica").
   - "date": Fecha limite en formato "YYYY-MM-DD" (calcula la fecha si el texto menciona "dentro de 3 dias habiles", asumiendo que la fecha de la resolucion es hoy ${new Date().toISOString().split('T')[0]}, o extrae la fecha explicita si figura).
   - "priority": "Alta", "Media", o "Baja".

Ejemplo de respuesta esperada:
{
  "latestProgress": "El juzgado admite a tramite la contestacion de la demanda y corre traslado al demandante.",
  "hearingLink": "https://meet.google.com/abc-defg-hij",
  "urgency": "Alta",
  "newDeadlines": [
    {
      "title": "Audiencia de pruebas",
      "date": "2026-06-25",
      "priority": "Alta"
    }
  ]
}

Documento a analizar:
${documentText}
`;

const extractFirstJsonObject = (text) => {
  const trimmed = text.trim();
  const candidates = [];

  if (trimmed.startsWith('{')) candidates.push(trimmed);

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1].trim());

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // intentar el siguiente
    }
  }
  throw new Error('No se encontro un JSON valido en la respuesta.');
};

const MAX_RESOLUTION_CHARS = 18000;

const truncateForAi = (text = '') => {
  if (!text || text.length <= MAX_RESOLUTION_CHARS) return text;
  const head = text.slice(0, MAX_RESOLUTION_CHARS);
  return `${head}\n\n[... texto truncado para analisis ...]`;
};

export const extractResolutionDetails = async (documentText) => {
  if (!isGeminiConfigured) {
    return simulateLocalResolutionExtraction(documentText);
  }
  const trimmedText = truncateForAi(documentText);
  try {
    const text = await askBackend({
      prompt: buildResolutionPrompt(trimmedText),
      temperature: 0.1,
      maxOutputTokens: 2000,
      responseJson: true,
    });
    return extractFirstJsonObject(text);
  } catch (error) {
    console.warn('Fallo en la extraccion de resolucion con IA. Usando simulacion local.', error);
    return simulateLocalResolutionExtraction(documentText);
  }
};

const simulateLocalResolutionExtraction = (text) => {
  const lowerText = text.toLowerCase();

  let latestProgress = 'Se vinculo una nueva resolucion al expediente. Revisar los anexos.';
  let hearingLink = '';
  let urgency = 'Media';
  const newDeadlines = [];

  const meetMatch = text.match(/(https?:\/\/(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com)\/[^\s"']+)/i);
  if (meetMatch) {
    hearingLink = meetMatch[1];
    urgency = 'Alta';
    latestProgress = 'Se programo audiencia virtual y se detecto enlace de sala en la resolucion.';
    newDeadlines.push({
      id: Date.now(),
      title: 'Audiencia Virtual',
      date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      priority: 'Alta',
      status: 'Pendiente',
    });
  } else if (lowerText.includes('audiencia') || lowerText.includes('vista de la causa')) {
    urgency = 'Alta';
    latestProgress = 'Se programo audiencia o vista de causa en el expediente.';
    newDeadlines.push({
      id: Date.now(),
      title: 'Audiencia programada',
      date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      priority: 'Alta',
      status: 'Pendiente',
    });
  } else if (lowerText.includes('traslado') || lowerText.includes('subsanar') || lowerText.includes('plazo') || lowerText.includes('dias')) {
    urgency = 'Alta';
    latestProgress = 'Se notifica plazo para subsanar o absolver traslado en el expediente.';
    newDeadlines.push({
      id: Date.now(),
      title: 'Subsanar / Absolver resolucion',
      date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      priority: 'Alta',
      status: 'Pendiente',
    });
  } else if (lowerText.includes('sentencia') || lowerText.includes('declara')) {
    latestProgress = 'Se notifico sentencia o resolucion decisoria en el expediente.';
    urgency = 'Media';
  }

  return {
    latestProgress,
    hearingLink,
    urgency,
    newDeadlines,
  };
};
