// Plantillas de escritos legales peruanos con variables {{...}}

export const WRITING_TEMPLATES = [
  {
    id: 'demanda-desalojo',
    title: 'Demanda de Desalojo',
    description: 'Desalojo por falta de pago u ocupación precaria',
    icon: 'Gavel',
    prompt: `Redacta una DEMANDA DE DESAJO por {{tipoDemanda}} dirigida al JUZGADO {{juzgado}} de {{distritoJudicial}}.

DATOS DEL DEMANDANTE:
- Nombre: {{cliente}}
- DNI/RUC: {{dni}}
- Domicilio procesal: {{domicilioProcesal}}

DATOS DEL DEMANDADO:
- Nombre: {{demandado}}
- Domicilio: {{domicilioDemandado}}

DATOS DEL INMUEBLE:
- Dirección: {{inmueble}}
- Descripción: {{descripcionInmueble}}

RELACIÓN CONTRACTUAL:
- Tipo de contrato: {{tipoContrato}}
- Fecha de inicio: {{fechaInicio}}
- Fecha de vencimiento: {{fechaVencimiento}}
- Monto de renta mensual: {{montoRenta}}
- {{detallesIncumplimiento}}

Escribe la demanda en formato profesional con los siguientes títulos numerados en romanos:

I. DEMANDANTE
II. DEMANDADO
III. PETITORIO
IV. FUNDAMENTOS DE HECHO
V. FUNDAMENTOS DE DERECHO (cita el Código Procesal Civil, Código Civil peruano)
VI. MONTO DEL PETITORIO
VII. VÍA PROCEDIMENTAL
VIII. MEDIOS PROBATORIOS
IX. ANEXOS

FIRMA:
Abogado: {{abogado}}
CAL: {{cal}}
Estudio: {{estudio}}`,
  },
  {
    id: 'apelacion-laboral',
    title: 'Apelación Laboral',
    description: 'Recurso de apelación contra sentencia laboral',
    icon: 'FileText',
    prompt: `Redacta un RECURSO DE APELACIÓN contra la Sentencia expedida en el Expediente {{expedienteNumero}} sobre {{materiaLaboral}}.

DATOS:
- Juzgado de origen: {{juzgadoOrigen}}
- Distrito judicial: {{distritoJudicial}}
- Demandante: {{cliente}}
- Demandado: {{demandado}}
- Número de resolución apelada: {{resolucionApelada}}
- Fecha de notificación: {{fechaNotificacion}}
- Fecha de vencimiento del plazo: {{fechaVencimiento}}

{{agravios}}

Estructura:
I. SUMILLA
II. FUNDAMENTOS DEL RECURSO (detallar cada agravio por separado)
III. NATURALEZA DEL AGRAVIO
IV. SUSTENTO LEGAL (Constitución, NLPT, Ley 29497)
V. MEDIOS PROBATORIOS
VI. ANEXOS

FIRMA:
Abogado: {{abogado}}
CAL: {{cal}}`,
  },
  {
    id: 'carta-notarial',
    title: 'Carta Notarial',
    description: 'Requiere pago, desalojo o cese de actividad',
    icon: 'Mail',
    prompt: `Redacta una CARTA NOTARIAL dirigida a {{destinatario}} con domicilio en {{domicilioDestinatario}}.

ASUNTO: {{asuntoCarta}}

De: {{cliente}}
Identificado con {{tipoDocumento}} N° {{dni}}
Domicilio: {{domicilioCliente}}

{{cuerpoCarta}}

Plazo para cumplir: {{plazoDias}} días hábiles contados desde la recepción de la presente.

La presente carta tiene carácter de {{tipoIntimacion}} y servirá como medio probatorio en caso de iniciar las acciones legales correspondientes.

Atentamente,
{{abogado}}
CAL: {{cal}}
Estudio: {{estudio}}`,
  },
  {
    id: 'contestacion-demanda',
    title: 'Contestación de Demanda',
    description: 'Absuelve el traslado de una demanda civil',
    icon: 'FileText',
    prompt: `Redacta un ESCRITO DE CONTESTACIÓN DE DEMANDA en el proceso seguido ante el {{juzgado}} de {{distritoJudicial}}.

Expediente: {{expedienteNumero}}
Materia: {{materia}}
Demandante: {{demandante}}
Demandado: {{cliente}}

{{argumentosDefensa}}

Estructura:
I. SUMILLA (contradigo la demanda en todos sus extremos / la niego / la reconozco parcialmente)
II. FUNDAMENTOS DE LA CONTESTACIÓN
III. EXCEPCIONES (si las hubiera)
IV. FUNDAMENTOS DE DERECHO
V. MEDIOS PROBATORIOS
VI. ANEXOS

FIRMA:
Abogado: {{abogado}}
CAL: {{cal}}`,
  },
  {
    id: 'solicitud-medida-cautelar',
    title: 'Solicitud de Medida Cautelar',
    description: 'Embargo, secuestro o medida temporal fuera del proceso',
    icon: 'Shield',
    prompt: `Redacta una SOLICITUD DE MEDIDA CAUTELAR dentro del proceso seguido ante el {{juzgado}} de {{distritoJudicial}}.

Expediente: {{expedienteNumero}}
Materia: {{materia}}
Demandante: {{cliente}}
Demandado: {{demandado}}

TIPO DE MEDIDA SOLICITADA: {{tipoMedida}} (embargo / secuestro / inhibición / otras)
BIEN SOBRE EL QUE RECAE: {{bienMedida}}
MONTO DE LA MEDIDA: S/ {{montoMedida}}

{{fundamentosMedida}}

Estructura:
I. SUMILLA
II. FUNDAMENTOS DE LA SOLICITUD (periculum in mora, fumus boni iuris, contracautela)
III. BIEN Y MONTO
IV. CONTRACAUTELA (ofrezco caución juratoria / fianza)
V. FUNDAMENTOS DE DERECHO (Código Procesal Civil arts. 608 y ss.)
VI. MEDIOS PROBATORIOS
VII. ANEXOS

FIRMA:
Abogado: {{abogado}}
CAL: {{cal}}`,
  },
  {
    id: 'escrito-simple',
    title: 'Escrito Simple',
    description: 'Apersonamiento, solicitud de copias, señalamiento de domicilio',
    icon: 'FileText',
    prompt: `Redacta un ESCRITO SIMPLE dirigido al {{juzgado}} de {{distritoJudicial}}.

Expediente: {{expedienteNumero}}
Materia: {{materia}}
Solicitante: {{cliente}}
Abogado: {{abogado}}
CAL: {{cal}}

{{contenidoEscrito}}

FIRMA:
{{cliente}}
{{abogado}}
CAL: {{cal}}`,
  },
  {
    id: 'absolucion-excepciones',
    title: 'Absolución de Excepciones',
    description: 'Responde a las excepciones procesales planteadas por la parte contraria',
    icon: 'Shield',
    prompt: `Redacta un ESCRITO DE ABSOLUCIÓN DE EXCEPCIONES en el proceso seguido ante el {{juzgado}} de {{distritoJudicial}}.

Expediente: {{expedienteNumero}}
Materia: {{materia}}
Demandante: {{cliente}}
Demandado: {{demandado}}

EXCEPCIONES DEDUCIDAS: {{excepcionesDeducidas}}
FUNDAMENTOS PARA ABSOLVERLAS:
{{fundamentosAbsolucion}}

Estructura:
I. SUMILLA
II. FUNDAMENTOS (analizar cada excepción y argumentar por qué debe desestimarse)
III. FUNDAMENTOS DE DERECHO
IV. MEDIOS PROBATORIOS
V. ANEXOS

FIRMA:
Abogado: {{abogado}}
CAL: {{cal}}`,
  },
];

export const TEMPLATE_VARIABLES = {
  cliente: { label: 'Nombre del cliente', default: '' },
  dni: { label: 'DNI/RUC del cliente', default: '' },
  domicilioProcesal: { label: 'Domicilio procesal', default: '[]' },
  abogado: { label: 'Nombre del abogado', default: '' },
  cal: { label: 'N° CAL', default: '' },
  estudio: { label: 'Nombre del estudio', default: '' },
  juzgado: { label: 'Juzgado', default: '' },
  distritoJudicial: { label: 'Distrito judicial', default: '' },
  demandado: { label: 'Nombre del demandado', default: '' },
  domicilioDemandado: { label: 'Domicilio del demandado', default: '' },
  expedienteNumero: { label: 'N° de expediente', default: '' },
  materia: { label: 'Materia', default: '' },
};

export const getTemplateById = (id) => WRITING_TEMPLATES.find((t) => t.id === id);
