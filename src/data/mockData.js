// src/data/mockData.js
import { demoDocumentsByCaseId } from './demoDocuments';

const buildNotes = (items) => items.map((item, index) => ({
  id: `note-${index + 1}`,
  author: item.author || 'Equipo legal',
  date: item.date,
  text: item.text,
}));

const buildDates = (items) => items.map((item, index) => ({
  id: `date-${index + 1}`,
  title: item.title,
  date: item.date,
  priority: item.priority,
  status: item.status || 'Pendiente',
}));

const buildReferences = (items) => items.map((item, index) => ({
  id: `ref-${index + 1}`,
  registryId: item.registryId || `exp-ref-${index + 1}`,
  title: item.title,
  date: item.date,
  type: item.type,
  source: item.source,
  entity: item.entity,
  summary: item.summary,
  impact: item.impact,
  url: item.url || '#',
  category: item.category,
  urgency: item.urgency || 'Media',
  official: true,
}));

export const mockCases = [
  {
    id: 'EXP-2026-001',
    clientName: 'Juan Perez Rojas',
    dni: '12345678',
    type: 'Laboral',
    status: 'Activo',
    lastUpdate: '2026-05-24',
    latestProgress: 'Se programó audiencia de conciliación laboral para el 04 de junio. Pendiente preparar estrategia.',
    hearingLink: 'https://meet.google.com/abc-defg-hij',
    urgency: 'Alta',
    summary: 'Demanda por despido arbitrario con reclamo de beneficios sociales y horas extras. La prioridad es reforzar prueba de impedimento de ingreso y preparar audiencia.',
    documents: demoDocumentsByCaseId['EXP-2026-001'],
    notes: buildNotes([
      { date: '2026-05-24', author: 'Abg. Rodriguez', text: 'Falta solicitar liquidacion final y constancia CTS. Preparar linea de tiempo para audiencia.' },
      { date: '2026-05-18', author: 'Asistente legal', text: 'Testigos confirman que seguridad impidio ingreso por orden de administracion.' },
      { date: '2026-05-11', author: 'Equipo legal', text: 'Revisar si las boletas reflejan pago de horas extras de enero a marzo.' },
    ]),
    importantDates: buildDates([
      { title: 'Audiencia de conciliacion laboral', date: '2026-06-04', priority: 'Alta' },
      { title: 'Presentar medios probatorios complementarios', date: '2026-06-10', priority: 'Alta' },
      { title: 'Reporte al cliente sobre estrategia', date: '2026-06-14', priority: 'Media' },
    ]),
    officialReferences: buildReferences([
      {
        title: 'Precedente sobre despido sin comunicacion escrita',
        date: '2026-05-12',
        type: 'Jurisprudencia',
        source: 'TC',
        entity: 'Tribunal Constitucional',
        category: 'Laboral',
        summary: 'Criterio reciente refuerza exigencia de motivacion y comunicacion formal del cese.',
        impact: 'Puede fortalecer el argumento de despido arbitrario si se acredita impedimento de ingreso.',
        urgency: 'Alta',
      },
    ]),
  },
  {
    id: 'EXP-2026-002',
    clientName: 'Inversiones Santa Lucia S.A.C.',
    dni: '20604578122',
    type: 'Civil',
    status: 'Activo',
    lastUpdate: '2026-05-23',
    latestProgress: 'En trámite envío de carta notarial de requerimiento de pago por arrendamiento comercial moroso.',
    hearingLink: '',
    urgency: 'Alta',
    summary: 'Incumplimiento de contrato de arrendamiento comercial con tres meses de mora. Se evalua carta notarial, resolucion contractual y eventual desalojo.',
    documents: demoDocumentsByCaseId['EXP-2026-002'],
    notes: buildNotes([
      { date: '2026-05-23', author: 'Abg. Medina', text: 'Preparar liquidacion de deuda y verificar si la garantia puede aplicarse parcialmente.' },
      { date: '2026-05-19', author: 'Asistente legal', text: 'Cliente confirma que no existe acta fotografica de entrega inicial.' },
    ]),
    importantDates: buildDates([
      { title: 'Enviar carta notarial de requerimiento', date: '2026-06-03', priority: 'Alta' },
      { title: 'Reunion con propietario para definir estrategia', date: '2026-06-07', priority: 'Media' },
      { title: 'Evaluar demanda de desalojo', date: '2026-06-18', priority: 'Media' },
    ]),
    officialReferences: buildReferences([
      {
        title: 'Criterio judicial sobre requerimiento previo en arrendamientos',
        date: '2026-04-28',
        type: 'Casacion',
        source: 'Poder Judicial',
        entity: 'Corte Suprema',
        category: 'Civil',
        summary: 'Se destaca la importancia de acreditar requerimiento previo antes de resolver por incumplimiento.',
        impact: 'Conviene enviar carta notarial detallada antes de iniciar acciones.',
      },
    ]),
  },
  {
    id: 'EXP-2026-003',
    clientName: 'Nova Retail Peru S.A.C.',
    dni: '20588997140',
    type: 'Corporativo',
    status: 'Pendiente',
    lastUpdate: '2026-05-22',
    latestProgress: 'En revisión el contrato SaaS con el proveedor tecnológico. Falta subsanar cláusula de tratamiento de datos.',
    hearingLink: '',
    urgency: 'Media',
    summary: 'Revision de contrato tecnologico con proveedor SaaS. Riesgo principal: tratamiento de datos personales, SLA ambiguo y reporte de incidentes.',
    documents: demoDocumentsByCaseId['EXP-2026-003'],
    notes: buildNotes([
      { date: '2026-05-22', author: 'Abg. Torres', text: 'Solicitar al proveedor matriz de subencargados y ubicacion de servidores.' },
      { date: '2026-05-18', author: 'Equipo legal', text: 'Cliente quiere cerrar contrato esta semana, pero falta anexo de seguridad.' },
    ]),
    importantDates: buildDates([
      { title: 'Enviar comentarios al contrato SaaS', date: '2026-06-02', priority: 'Alta' },
      { title: 'Reunion de cierre con proveedor', date: '2026-06-06', priority: 'Media' },
    ]),
    officialReferences: buildReferences([
      {
        title: 'Guia sobre incidentes de seguridad y datos personales',
        date: '2026-05-03',
        type: 'Guia',
        source: 'Autoridad de Datos',
        entity: 'MINJUSDH',
        category: 'Proteccion de datos',
        summary: 'Lineamientos para notificacion y gestion de incidentes de seguridad.',
        impact: 'Agregar procedimiento de incidentes y obligaciones de cooperacion del proveedor.',
      },
    ]),
  },
  {
    id: 'EXP-2026-004',
    clientName: 'Carla Mendoza Salas',
    dni: '45881236',
    type: 'Familia',
    status: 'Activo',
    lastUpdate: '2026-05-21',
    latestProgress: 'Se admitió demanda de alimentos. Se programó audiencia única para el 20 de junio.',
    hearingLink: 'https://zoom.us/j/9876543210',
    urgency: 'Alta',
    summary: 'Proceso de alimentos para menor de edad. Se requiere sustentar gastos mensuales y acreditar capacidad economica del obligado.',
    documents: demoDocumentsByCaseId['EXP-2026-004'],
    notes: buildNotes([
      { date: '2026-05-21', author: 'Abg. Paredes', text: 'Pedir movimientos bancarios y comprobantes de gastos medicos faltantes.' },
      { date: '2026-05-17', author: 'Asistente legal', text: 'Cliente indica que el demandado trabaja de forma independiente y recibe pagos por Yape/Plin.' },
    ]),
    importantDates: buildDates([
      { title: 'Completar anexos de gastos del menor', date: '2026-06-05', priority: 'Alta' },
      { title: 'Audiencia unica', date: '2026-06-20', priority: 'Alta' },
    ]),
    officialReferences: buildReferences([
      {
        title: 'Criterio sobre prueba indiciaria de ingresos en alimentos',
        date: '2026-05-09',
        type: 'Jurisprudencia',
        source: 'Poder Judicial',
        entity: 'Corte Superior',
        category: 'Familia',
        summary: 'Se admite valorar signos exteriores y movimientos recurrentes cuando no hay boletas formales.',
        impact: 'Util para pedir informacion financiera y sustentar capacidad economica presunta.',
        urgency: 'Alta',
      },
    ]),
  },
  {
    id: 'EXP-2026-005',
    clientName: 'Restobar El Puerto E.I.R.L.',
    dni: '20447788991',
    type: 'Administrativo',
    status: 'Activo',
    lastUpdate: '2026-05-25',
    latestProgress: 'Pendiente presentar recurso de reconsideración contra multa municipal antes del 01 de junio.',
    hearingLink: '',
    urgency: 'Alta',
    summary: 'Sancion municipal por presunta falta de licencia vigente. Existe renovacion en tramite e inspeccion favorable previa.',
    documents: demoDocumentsByCaseId['EXP-2026-005'],
    notes: buildNotes([
      { date: '2026-05-25', author: 'Abg. Salazar', text: 'Preparar reconsideracion invocando solicitud presentada dentro de plazo e inspeccion favorable.' },
      { date: '2026-05-22', author: 'Equipo legal', text: 'Falta obtener copia certificada del cargo de renovacion con todos los anexos.' },
    ]),
    importantDates: buildDates([
      { title: 'Vence plazo para recurso de reconsideracion', date: '2026-06-01', priority: 'Alta' },
      { title: 'Solicitar copia certificada del expediente administrativo', date: '2026-06-04', priority: 'Media' },
    ]),
    officialReferences: buildReferences([
      {
        title: 'Ordenanza municipal sobre licencias de funcionamiento',
        date: '2026-04-30',
        type: 'Ordenanza',
        source: 'Municipalidad',
        entity: 'Municipalidad Provincial',
        category: 'Administrativo',
        summary: 'Regula renovacion, fiscalizacion y medidas correctivas para locales comerciales.',
        impact: 'Revisar si la entidad respeto el procedimiento y si correspondia medida preventiva antes de multa.',
      },
    ]),
  },
];

export const mockAIResponses = {
  default: 'Hola, soy tu Asistente Legal IA. Puedo resumir expedientes, detectar riesgos, extraer datos de documentos o preparar borradores. ¿Con qué caso trabajamos?',
  search: (caseInfo) => `He encontrado el caso ${caseInfo.id} de ${caseInfo.clientName}.\n\nResumen rápido: ${caseInfo.summary}\n\nÚltima actualización: ${caseInfo.lastUpdate}`,
  notFound: 'No encontré ningún expediente con esos datos. Verifica el DNI, nombre o código.',
};