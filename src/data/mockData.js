// src/data/mockData.js
import { demoDocumentsByCaseId } from './demoDocuments';

export const mockCases = [
  {
    id: 'EXP-2026-001',
    clientName: 'Juan Perez',
    dni: '12345678',
    type: 'Laboral',
    status: 'Activo',
    lastUpdate: '2026-05-01',
    summary: 'Demanda por despido arbitrario. Etapa de pruebas.',
    documents: demoDocumentsByCaseId['EXP-2026-001'],
  },
  {
    id: 'EXP-2026-002',
    clientName: 'Maria Gomez',
    dni: '87654321',
    type: 'Civil',
    status: 'Pendiente',
    lastUpdate: '2026-05-05',
    summary: 'Contrato de alquiler residencial. Revision de clausulas.',
    documents: demoDocumentsByCaseId['EXP-2026-002'],
  },
  {
    id: 'EXP-2026-003',
    clientName: 'Constructora ABC S.A.C.',
    dni: '20123456789',
    type: 'Corporativo',
    status: 'Cerrado',
    lastUpdate: '2026-03-15',
    summary: 'Asesoria en fusion empresarial. Caso cerrado exitosamente.',
    documents: demoDocumentsByCaseId['EXP-2026-003'],
  },
];

export const mockAIResponses = {
  default: 'Hola, soy tu Asistente Legal IA. Puedo ayudarte a buscar expedientes, resumir casos o redactar borradores. En que te ayudo hoy?',
  search: (caseInfo) => `He encontrado el caso ${caseInfo.id} de ${caseInfo.clientName}.\n\nResumen rapido: ${caseInfo.summary}\n\nUltima actualizacion: ${caseInfo.lastUpdate}`,
  notFound: 'No encontre ningun expediente con esos datos. Verifica el DNI, nombre o codigo.',
};
