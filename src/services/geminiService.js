const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

export const isGeminiConfigured = Boolean(geminiApiKey);

const cleanAssistantText = (text = '') => text
  .replace(/\*\*/g, '')
  .replace(/^\s*\*\s+/gm, '- ')
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
Eres LUSTI, un asistente legal para estudios juridicos peruanos.
Responde en espanol claro, profesional y accionable.
No uses Markdown. No uses asteriscos para negritas. Usa texto limpio, guiones simples y secciones cortas.
No inventes informacion. Si falta contexto, dilo y pide el dato faltante.
No presentes tu respuesta como asesoria legal definitiva; tratala como analisis preliminar para revision de un abogado.

Formato preferido:
- Respuesta breve inicial.
- Hallazgos relevantes.
- Riesgos o impactos.
- Acciones recomendadas.
- Datos faltantes, si aplica.

Si la pregunta pide leer documentos, usa el campo "contenido" y cita los nombres de documentos disponibles.
No digas que no puedes identificar el contenido si el contexto incluye extracto o contenido documental.

Contexto del expediente:
${JSON.stringify(context, null, 2)}

Pregunta del usuario:
${question}
`;

export const askGeminiAboutCase = async ({
  question,
  caseData,
  documents,
  notes,
  importantDates,
  officialReferences,
}) => {
  if (!isGeminiConfigured) {
    throw new Error('Gemini no esta configurado.');
  }

  const context = buildCaseContext({ caseData, documents, notes, importantDates, officialReferences });
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(question, context) }],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          topP: 0.9,
          maxOutputTokens: 1200,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Gemini no pudo responder.');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) throw new Error('Gemini devolvio una respuesta vacia.');
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
Eres LUSTI, un analista legal peruano para estudios juridicos.
Analiza el registro oficial con prudencia: si no tienes texto completo, dilo claramente y trabaja solo con el titulo, resumen y metadatos entregados.
No inventes articulos, plazos ni contenido no disponible.

Entrega la respuesta en este formato:
No uses Markdown ni asteriscos.
Resumen legal:
Impacto probable:
Materias afectadas:
Expedientes sugeridos:
Acciones recomendadas:
Datos faltantes:

Contexto:
${JSON.stringify(context, null, 2)}
`;

export const analyzeOfficialRegistryItem = async ({ item, cases }) => {
  if (!isGeminiConfigured) {
    throw new Error('Gemini no esta configurado.');
  }

  const context = buildRegistryContext({ item, cases });
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildRegistryPrompt(context) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 1000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Gemini no pudo analizar el registro.');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) throw new Error('Gemini devolvio un analisis vacio.');
  return cleanAssistantText(text);
};

const buildSpecializedAssistantPrompt = ({ bot, question, promptContext, attachmentContext }) => `
Eres ${bot.name}, un asistente legal especializado para un estudio juridico peruano.
Especialidad declarada: ${bot.description || 'Asistencia legal general'}.
Documentos de referencia disponibles segun el sistema: ${bot.docs || 0}.
${promptContext ? `\nInstrucciones o prompts seleccionados para este asistente:\n${promptContext}\n` : ''}
${attachmentContext ? `\nDocumento adjunto cargado por el usuario:\n${attachmentContext}\n` : ''}

Responde en espanol claro, profesional y util.
No uses Markdown. No uses asteriscos para negritas. Usa texto limpio.
Si el usuario saluda, saluda brevemente y ofrece formas concretas de ayuda segun tu especialidad.
Si falta informacion para analizar un caso, pide los datos necesarios.
No inventes documentos, normas, plazos ni hechos no entregados.
No presentes la respuesta como asesoria legal definitiva; indica que es analisis preliminar para revision de un abogado.
Cuando haya documento adjunto y el usuario pida resumen o analisis, responde ordenado:
1. Resumen breve
2. Datos clave encontrados
3. Riesgos o puntos de atencion
4. Informacion faltante
5. Siguientes pasos recomendados
Si el usuario pide extraer datos, organiza por partes, fechas, montos, obligaciones y observaciones.
Responde completo: no cortes frases ni dejes campos a medias.

Pregunta del usuario:
${question}
`;

export const askGeminiSpecializedAssistant = async ({ bot, question, attachmentContext = '' }) => {
  if (!isGeminiConfigured) {
    throw new Error('Gemini no esta configurado.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildSpecializedAssistantPrompt({
                  bot,
                  question,
                  promptContext: bot.promptContext || '',
                  attachmentContext,
                }),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          topP: 0.9,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Gemini no pudo responder.');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) throw new Error('Gemini devolvio una respuesta vacia.');
  return cleanAssistantText(text);
};

const buildVaultAssistantPrompt = ({ question, cases }) => `
Eres LUSTI, asistente operativo de la boveda de expedientes de un estudio juridico peruano.
Responde en espanol claro y breve.
No uses Markdown. No uses asteriscos para negritas. Usa texto limpio.
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

Pregunta:
${question}
`;

export const askGeminiVaultAssistant = async ({ question, cases }) => {
  if (!isGeminiConfigured) {
    throw new Error('Gemini no esta configurado.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildVaultAssistantPrompt({ question, cases }) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 900,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Gemini no pudo responder.');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) throw new Error('Gemini devolvio una respuesta vacia.');
  return cleanAssistantText(text);
};
