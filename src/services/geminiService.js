const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

export const isGeminiConfigured = Boolean(geminiApiKey);

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
No inventes informacion. Si falta contexto, dilo y pide el dato faltante.
No presentes tu respuesta como asesoria legal definitiva; tratala como analisis preliminar para revision de un abogado.

Formato preferido:
- Respuesta breve inicial.
- Hallazgos relevantes.
- Riesgos o impactos.
- Acciones recomendadas.
- Datos faltantes, si aplica.

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
  return text;
};
