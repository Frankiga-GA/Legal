// src/data/mockData.js

export const mockCases = [
  {
    id: 'EXP-2026-001',
    clientName: 'Juan Pérez',
    dni: '12345678',
    type: 'Laboral',
    status: 'Activo',
    lastUpdate: '2026-05-01',
    summary: 'Demanda por despido arbitrario. Etapa de pruebas.',
    documents: [
      { name: 'Demanda Inicial.pdf', date: '2026-04-10' },
      { name: 'Pruebas Testimoniales.pdf', date: '2026-04-25' }
    ]
  },
  {
    id: 'EXP-2026-002',
    clientName: 'María Gómez',
    dni: '87654321',
    type: 'Civil',
    status: 'Pendiente',
    lastUpdate: '2026-05-05',
    summary: 'Contrato de alquiler residencial. Revisión de cláusulas.',
    documents: [
      { name: 'Borrador Contrato.docx', date: '2026-05-05' }
    ]
  },
  {
    id: 'EXP-2026-003',
    clientName: 'Constructora ABC S.A.C.',
    dni: '20123456789',
    type: 'Corporativo',
    status: 'Cerrado',
    lastUpdate: '2026-03-15',
    summary: 'Asesoría en fusión empresarial. Caso cerrado exitosamente.',
    documents: [
      { name: 'Acta de Fusión.pdf', date: '2026-03-15' }
    ]
  }
];

export const mockAIResponses = {
  default: "Hola, soy tu Asistente Legal IA. Puedo ayudarte a buscar expedientes, resumir casos o redactar borradores. ¿En qué te ayudo hoy?",
  search: (caseInfo) => `He encontrado el caso **${caseInfo.id}** de **${caseInfo.clientName}**. \n\n📄 **Resumen Rápido:** ${caseInfo.summary}\n\n📅 **Última actualización:** ${caseInfo.lastUpdate}`,
  notFound: "No encontré ningún expediente con esos datos. Verifica el DNI, Nombre o Código."
};