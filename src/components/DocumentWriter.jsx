import { useState, useMemo, useEffect } from 'react';
import { FileText, Gavel, Shield, Mail, Loader2, Check, X, PenLine } from 'lucide-react';
import { askGeminiAboutCase } from '../services/geminiService';
import DocumentPdfExport from './DocumentPdfExport';
import { exportToDocx } from '../services/docxExportService';
import { loadAllPreferencesAsync } from '../services/userPreferencesStore';
import { supabase } from '../utils/supabase';

// Inline templates para evitar dependencia de import
const INLINE_TEMPLATES = [
  {
    id: 'demanda-alimentos',
    title: 'Demanda de Alimentos',
    description: 'Solicitud de pensión alimenticia para menores',
    icon: 'Shield',
    prompt: `Redacta una DEMANDA DE ALIMENTOS muy extensa, formal y sumamente detallada, propia de un estudio jurídico especializado en Derecho de Familia en Perú.

DATOS DEL DEMANDANTE (Representante del menor):
- Nombre: {{cliente}}
- DNI: {{dni}}

DATOS DEL DEMANDADO:
- Nombre: {{demandado}}
- Domicilio: {{domicilioDemandado}}

DATOS ESPECÍFICOS A DESARROLLAR:
- Monto solicitado: {{montoSolicitado}}
- Gastos del menor (Estado de necesidad): {{gastosMenor}}
- Ingresos del demandado (Capacidad económica): {{ingresosDemandado}}

INSTRUCCIONES DE REDACCIÓN PARA LA IA (MUY IMPORTANTE):
1. NO te limites a copiar y pegar los datos. Desarrolla y "llena" los fundamentos. Argumenta jurídicamente por qué es necesario el monto, hablando del estado de necesidad del menor y la capacidad del demandado (principio de proporcionalidad).
2. Debes incluir y citar obligatoriamente artículos del Código Civil (ej. Art. 472 concepto de alimentos, Art. 481 proporcionalidad) y del Código de los Niños y Adolescentes (Art. 92).
3. Escribe al menos 3 o 4 párrafos en "Fundamentos de Hecho", redactados con elocuencia y fuerza legal.

REGLAS DE FORMATO OBLIGATORIAS:
1. AUTORIDAD:
SEÑOR JUEZ DE PAZ LETRADO:

2. APERSONAMIENTO:
{{cliente}}, identificado con DNI N° {{dni}}, con domicilio procesal en {{domicilioProcesal}}; a Usted respetuosamente digo:

4. ESTRUCTURA (Debe contener estos apartados en Romanos y bien detallados):
I. PETITORIO
[Redactar el petitorio claro y directo solicitando {{montoSolicitado}} a favor del menor...]

II. FUNDAMENTOS DE HECHO
[Desarrollar ampliamente la relación paterno-filial, el estado de necesidad del menor en base a {{gastosMenor}}, y la holgada o suficiente capacidad económica del demandado en base a {{ingresosDemandado}}...]

III. FUNDAMENTOS JURÍDICOS
[Desarrollar la base legal, citando los Códigos y la Constitución...]

IV. MONTO DEL PETITORIO
[Reiterar el monto: {{montoSolicitado}}]

V. VÍA PROCEDIMENTAL
[Indicar que corresponde a la vía del Proceso Único, Ley N° 27337 y modificatorias...]

VI. MEDIOS PROBATORIOS
[Listar enumeradamente la Partida de Nacimiento, boletas, etc.]

VII. ANEXOS
[Listar 1-A Copia de DNI, 1-B Partida de Nacimiento, etc.]

POR TANTO:
A Usted Señor Juez solicito admitir a trámite la presente demanda, declararla fundada en su oportunidad, con expresa condena de costos y costas.`,
  },
  {
    id: 'contradiccion-mandato',
    title: 'Contradicción a Mandato Ejecutivo',
    description: 'Defensa ante una ejecución (ej. Letra de Cambio, Pagaré)',
    icon: 'Gavel',
    prompt: `Redacta un escrito de CONTRADICCIÓN AL MANDATO EJECUTIVO dirigido al JUZGADO {{juzgado}}.

DATOS DEL DEMANDADO (Cliente):
- Nombre: {{cliente}}
- DNI: {{dni}}
- Demandante: {{demandado}}
- Título valor: {{tituloValor}}
- Fundamento: {{fundamentoContradiccion}}

REGLAS DE FORMATO OBLIGATORIAS:
1. SUMILLA EXACTA:
EXPEDIENTE: {{expedienteNumero}}
ESPECIALISTA: {{especialista}}
CUADERNO: PRINCIPAL
ESCRITO: [CONFIRMAR]
SUMILLA: FORMULO CONTRADICCIÓN A MANDATO EJECUTIVO

2. AUTORIDAD: "SEÑOR JUEZ DEL JUZGADO {{juzgado}}:"

3. APERSONAMIENTO: "{{cliente}}, identificado con DNI N° {{dni}}, señalando domicilio procesal en {{domicilioProcesal}}, en el proceso seguido por {{demandado}}; a Usted respetuosamente digo:"

4. ESTRUCTURA:
I. PETITORIO (Solicito se declare fundada la contradicción por {{motivoContradiccion}})
II. FUNDAMENTOS DE HECHO (Desarrollar detalladamente: {{fundamentoContradiccion}})
III. FUNDAMENTOS JURÍDICOS
IV. MEDIOS PROBATORIOS (Enumerar 1. El mérito de la Letra, etc.)
V. ANEXOS (Enumerar 1-A Copia de DNI, 1-B Tasa judicial, etc.)

POR TANTO:
A Usted Señor Juez solicito admitir el presente escrito.`,
  },
  {
    id: 'recurso-apelacion',
    title: 'Recurso de Apelación',
    description: 'Apelación contra sentencia o auto',
    icon: 'FileText',
    prompt: `Redacta un RECURSO DE APELACIÓN dirigido al JUZGADO {{juzgado}}.

DATOS:
- Apelante: {{cliente}}, DNI: {{dni}}
- Resolución Apelada: {{numeroResolucion}} de fecha {{fechaResolucion}}
- Agravio: {{agravioPrincipal}}

REGLAS DE FORMATO OBLIGATORIAS:
1. SUMILLA EXACTA:
EXPEDIENTE: {{expedienteNumero}}
ESPECIALISTA: {{especialista}}
CUADERNO: PRINCIPAL
ESCRITO: [CONFIRMAR]
SUMILLA: INTERPONGO RECURSO DE APELACIÓN

2. AUTORIDAD: "SEÑOR JUEZ DEL JUZGADO {{juzgado}}:"

3. APERSONAMIENTO: "{{cliente}}, identificado con DNI N° {{dni}}, en los seguidos por el expediente de la referencia; a Usted respetuosamente digo:"

4. ESTRUCTURA:
I. PETITORIO (Revocar o anular la Resolución {{numeroResolucion}})
II. EXPRESIÓN DE AGRAVIOS (Desarrollar: {{agravioPrincipal}})
III. ERRORES DE HECHO Y DERECHO
IV. FUNDAMENTACIÓN JURÍDICA
V. ANEXOS (1-A Copia de DNI, 1-B Tasa judicial por apelación)

POR TANTO:
A Usted Señor Juez solicito conceder la apelación.`,
  },
  {
    id: 'demanda-desalojo',
    title: 'Demanda de Desalojo',
    description: 'Desalojo por falta de pago u ocupación precaria',
    icon: 'Gavel',
    prompt: `Redacta una DEMANDA DE DESALOJO por {{tipoDemanda}} dirigida al JUZGADO {{juzgado}} de {{distritoJudicial}}.

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
V. FUNDAMENTOS DE DERECHO
VI. MONTO DEL PETITORIO
VII. VÍA PROCEDIMENTAL
VIII. MEDIOS PROBATORIOS
IX. ANEXOS`,
  },
  {
    id: 'carta-notarial',
    title: 'Carta Notarial',
    description: 'Requiere pago, desalojo o cese de actividad',
    icon: 'Mail',
    prompt: `Redacta una CARTA NOTARIAL sumamente extensa, detallada y de muy alto nivel jurídico en Perú. Inspírate en el estilo de los mejores estudios de abogados corporativos.

DATOS DEL DESTINATARIO:
- Dirigida a: {{destinatario}}
- Domicilio: {{domicilioDestinatario}}

DATOS DEL REMITENTE (Cliente):
- De: {{cliente}}
- Identificado con {{tipoDocumento}} N° {{dni}}
- Domicilio: {{domicilioCliente}}

ASUNTO PRINCIPAL / MATERIA:
{{asuntoCarta}}

HECHOS Y FUNDAMENTOS A DESARROLLAR:
{{cuerpoCarta}}

PLAZO: {{plazoDias}} días hábiles.
TIPO DE INTIMACIÓN: {{tipoIntimacion}}.

INSTRUCCIONES DE REDACCIÓN PARA LA IA (MUY IMPORTANTE):
El documento final debe ser largo, formal y contundente. Usa un lenguaje técnico-jurídico estricto. DEBES utilizar la siguiente estructura obligatoria, rellenando con argumentos sólidos, lógica jurídica y artículos de ley peruanos reales y pertinentes al caso:

CARTA NOTARIAL
[Añadir 2 o 3 líneas de título central describiendo el objetivo, ej: "REQUERIMIENTO DE PAGO Y RESOLUCIÓN DE CONTRATO / INVITACIÓN A CONCILIACIÓN"]

[Nombre del Destinatario: {{destinatario}}]
[Dirección: {{domicilioDestinatario}}]

Estimados señores (o señor/a):

I. ANTECEDENTES Y HECHOS RELEVANTES
[Desarrollar los hechos en varios sub-puntos numerados, ej: 1.1., 1.2., 1.3., detallando cronológicamente el vínculo jurídico, las obligaciones, y el incumplimiento. Sé muy exhaustivo].

II. MARCO NORMATIVO APLICABLE
[Citar al menos 3 o 4 artículos específicos (Código Civil, Constitución, leyes especiales según el caso), numerados como 2.1., 2.2., explicando cómo se aplican al caso concreto y cómo el destinatario los está vulnerando].

III. RESPONSABILIDAD JURÍDICA Y DAÑOS
[Explicar los daños generados (daño emergente, lucro cesante, daño moral, etc.) y la responsabilidad civil, penal o administrativa que recae sobre el destinatario].

IV. INTIMACIÓN FORMAL Y REQUERIMIENTO
Por medio de la presente carta notarial, INTIMO FORMALMENTE a usted(es) a:
[Listar las exigencias de forma imperativa y numerada, ej: 4.1. PAGAR DE INMEDIATO..., 4.2. ABSTENERSE DE..., 4.3. CUMPLIR CON...].

V. PLAZO Y APERCIBIMIENTO
Para ello, otorgo un plazo de {{plazoDias}} DÍAS HÁBILES contados desde la recepción de la presente.
CUMPLIDO EL PLAZO y de no tener respuesta favorable, procederé de inmediato a:
[Listar las acciones legales que se tomarán, ej: 5.1. Iniciar acción civil de indemnización por daños y perjuicios, 5.2. Formular denuncia penal, 5.3. Solicitar medidas cautelares y embargos, etc.].

Vencido dicho plazo, asumirá(n) la plena responsabilidad por las consecuencias jurídicas, administrativas y patrimoniales que ello pudiera acarrear. La presente carta notarial servirá como medio probatorio en caso de iniciar las acciones legales correspondientes.

Atentamente,

DATOS DE CONTACTO:
Domicilio: {{domicilioCliente}}`,
  }
];

const getInlineTemplate = (id) => INLINE_TEMPLATES.find((t) => t.id === id);

const ICON_MAP = { FileText, Gavel, Shield, Mail };

const VARIABLE_RE = /\{\{(\w+)\}\}/g;

const extractVariables = (prompt) => {
  const vars = new Set();
  let m;
  while ((m = VARIABLE_RE.exec(prompt)) !== null) vars.add(m[1]);
  return [...vars];
};

const buildAutoValues = (caseData) => ({
  cliente: caseData?.clientName || '',
  dni: caseData?.dni || '',
  materia: caseData?.type || '',
  expedienteNumero: caseData?.id || '',
  abogado: '',
  cal: '',
  estudio: '',
  juzgado: caseData?.judge || '',
  distritoJudicial: 'Lima',
  domicilioProcesal: '[]',
  demandado: caseData?.counterparty || '',
  especialista: caseData?.specialist || '',
  cuaderno: caseData?.cuaderno || 'PRINCIPAL',
  escritoNro: caseData?.escritoNro || '',
  ...(caseData?._templateValues || {}),
});

const DocumentWriter = ({ caseData, onClose, onSave, firmProfile }) => {
  const [step, setStep] = useState('select');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [customValues, setCustomValues] = useState({});
  const [generatedText, setGeneratedText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Nuevas funciones
  const [includeJurisprudence, setIncludeJurisprudence] = useState(false);
  const [tone, setTone] = useState('Técnico y Persuasivo');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const template = selectedTemplateId ? getInlineTemplate(selectedTemplateId) : null;
  const autoValues = buildAutoValues(caseData);
  const allValues = { ...autoValues, ...customValues };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);

      // Siempre buscar el perfil fresco desde Supabase en el momento de generar
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      let freshProfile = firmProfile; // fallback al prop si falla

      if (userId) {
        const prefs = await loadAllPreferencesAsync(userId);
        freshProfile = prefs.firm;
      }

      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(
        <DocumentPdfExport
          caseData={caseData}
          documentText={editedText}
          title={template?.title}
          firmProfile={freshProfile}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template?.title?.replace(/\s+/g, '_') || 'Escrito'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Delay revocation to ensure download starts reliably on all browsers
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const VARIABLE_LABELS = {
    cliente: 'Nombre del cliente',
    dni: 'DNI/RUC',
    materia: 'Materia',
    expedienteNumero: 'N° de expediente',
    abogado: 'Nombre del abogado',
    cal: 'N° CAL',
    estudio: 'Nombre del estudio',
    juzgado: 'Juzgado',
    distritoJudicial: 'Distrito judicial',
    demandado: 'Demandado / contraparte',
    domicilioProcesal: 'Domicilio procesal',
    destinatario: 'Destinatario',
    domicilioDestinatario: 'Domicilio del destinatario',
    asuntoCarta: 'Asunto de la carta',
    tipoDocumento: 'Tipo de documento',
    domicilioCliente: 'Domicilio del cliente',
    cuerpoCarta: 'Cuerpo de la carta',
    plazoDias: 'Plazo en días',
    tipoIntimacion: 'Tipo de intimación',
    inmueble: 'Dirección del inmueble',
    descripcionInmueble: 'Descripción del inmueble',
    tipoContrato: 'Tipo de contrato',
    fechaInicio: 'Fecha de inicio',
    fechaVencimiento: 'Fecha de vencimiento',
    montoRenta: 'Monto de renta',
    detallesIncumplimiento: 'Detalles del incumplimiento',
    contenidoEscrito: 'Contenido del escrito',
    tipoDemanda: 'Tipo de demanda',
    montoSolicitado: 'Monto solicitado (Ej. S/ 1500)',
    gastosMenor: 'Gastos del menor (Colegio, salud, etc.)',
    ingresosDemandado: 'Ingresos del demandado',
    tituloValor: 'Título valor cuestionado (Ej. Letra de Cambio)',
    motivoContradiccion: 'Motivo (Ej. Inexigibilidad de la obligación)',
    fundamentoContradiccion: 'Fundamento (Ej. Llenado abusivo, no se entregó dinero)',
    numeroResolucion: 'Número de la resolución apelada',
    fechaResolucion: 'Fecha de la resolución',
    agravioPrincipal: 'Agravio principal',
    especialista: 'Especialista Legal',
    cuaderno: 'Cuaderno',
    escritoNro: 'Escrito N°',
  };

  const variables = useMemo(() => {
    if (!template) return [];
    return extractVariables(template.prompt).map((v) => ({
      name: v,
      label: VARIABLE_LABELS[v] || v,
      value: allValues[v] || '',
    }));
  }, [template, allValues]);

  const handleSelect = (id) => {
    setSelectedTemplateId(id);
    setStep('review');
    setCustomValues({});
    setGeneratedText('');
    setEditedText('');
    setError(null);
  };

  const handleGenerate = async () => {
    if (!template) return;
    setGenerating(true);
    setError(null);
    try {
      const filledPrompt = template.prompt.replace(VARIABLE_RE, (_, key) => allValues[key] || '[___]');
      
      let finalQuestion = `Genera un documento legal profesional en español peruano basado en esta plantilla. 
Tono del escrito: ${tone}.
Rellena los datos faltantes de manera jurídicamente correcta.`;

      if (includeJurisprudence) {
        finalQuestion += `\n\nMUY IMPORTANTE: Incluye al menos 2 citas de Jurisprudencia Peruana relevante (Casaciones de la Corte Suprema) o doctrina en la sección de Fundamentos de Derecho. Pon los títulos de las casaciones en **negrita** para que resalten.`;
      }

      finalQuestion += `\n\nIMPORTANTE: Puedes usar **negritas** para resaltar nombres y títulos. NO uses frases genéricas como "es importante considerar" ni "de acuerdo a la normativa vigente". Devuelve SOLO el texto del documento.\n\nPlantilla a seguir:\n${filledPrompt}`;

      const result = await askGeminiAboutCase({
        caseData,
        documents: Array.isArray(caseData?.documents) ? caseData.documents : [],
        notes: Array.isArray(caseData?.notes) ? caseData.notes : [],
        importantDates: Array.isArray(caseData?.importantDates) ? caseData.importantDates : [],
        officialReferences: Array.isArray(caseData?.officialReferences) ? caseData.officialReferences : [],
        question: finalQuestion,
      });
      const text = typeof result === 'string' ? result : result?.text || 'Error al generar';
      // Mantener las negritas (**), limpiar otros marcadores de markdown
      const cleaned = text
        .replace(/^###?\s+/gm, '')
        .replace(/^\s*[-*]\s+/gm, '')
        .trim();
      setGeneratedText(cleaned);
      setEditedText(cleaned);
      setStep('result');
    } catch (e) {
      setError(e.message || 'Error al generar el documento');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    const doc = {
      id: `doc-${Date.now()}`,
      name: `${template?.title || 'Escrito'} - ${new Date().toLocaleDateString('es-PE')}`,
      date: new Date().toISOString().split('T')[0],
      content: editedText,
      source: 'generated',
    };
    onSave(doc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-white/[0.08] bg-brand-dark shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <h2 className="text-lg font-bold text-brand-ivory">
            {step === 'select' ? 'Redactar Escrito' : template?.title || 'Redactar Escrito'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-brand-accent hover:bg-white/[0.06] hover:text-brand-ivory transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
          )}

          {step === 'select' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(INLINE_TEMPLATES || []).map((t) => {
                const Icon = ICON_MAP[t.icon] || FileText;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t.id)}
                    className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-colors hover:border-brand-gold/30 hover:bg-white/[0.04]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10">
                      <Icon className="h-5 w-5 text-brand-gold" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-ivory">{t.title}</p>
                      <p className="mt-0.5 text-xs text-brand-accent">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 'review' && template && (
            <>
              <p className="text-sm text-brand-accent">Revisa los datos antes de generar el documento:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] mb-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-accent mb-2 uppercase tracking-wider">Tono del escrito</label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-brand-dark px-3 py-2 text-sm text-brand-ivory focus:border-brand-gold/40 focus:outline-none"
                  >
                    <option value="Técnico y Persuasivo">Técnico y Persuasivo</option>
                    <option value="Estricto e Intimidatorio">Estricto e Intimidatorio</option>
                    <option value="Conciliador y Formal">Conciliador y Formal</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeJurisprudence}
                      onChange={(e) => setIncludeJurisprudence(e.target.checked)}
                      className="h-4 w-4 rounded border-white/[0.1] bg-brand-dark text-brand-gold focus:ring-brand-gold/20 focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium text-brand-ivory">Incluir Jurisprudencia (Citas)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                {variables.map((v) => (
                  <div key={v.name}>
                    <label className="block text-xs font-medium text-brand-accent mb-1">{v.label}</label>
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => setCustomValues((prev) => ({ ...prev, [v.name]: e.target.value }))}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-brand-ivory placeholder:text-brand-accent/40 focus:border-brand-gold/40 focus:outline-none"
                      placeholder={v.label}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('select')}
                  className="rounded-lg border border-white/[0.08] px-5 py-2.5 text-sm font-medium text-brand-accent hover:bg-white/[0.04] transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 rounded-lg bg-brand-gold px-6 py-2.5 text-sm font-bold text-brand-black transition-colors hover:bg-white disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
                  {generating ? 'Generando...' : 'Generar Escrito'}
                </button>
              </div>
            </>
          )}

          {step === 'result' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Documento generado
                </p>
              </div>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full min-h-[400px] rounded-xl border border-white/[0.08] bg-brand-black/50 p-5 text-sm text-brand-ivory font-mono leading-relaxed focus:border-brand-gold/40 focus:outline-none resize-y"
                spellCheck={false}
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('select')}
                  className="rounded-lg border border-white/[0.08] px-5 py-2.5 text-sm font-medium text-brand-accent hover:bg-white/[0.04] transition-colors"
                >
                  Nueva plantilla
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-lg bg-brand-ivory px-6 py-2.5 text-sm font-bold text-brand-black transition-colors hover:bg-white"
                >
                  <FileText className="h-4 w-4" />
                  Guardar en el expediente
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-2 rounded-lg bg-brand-accent/20 px-6 py-2.5 text-sm font-bold text-brand-ivory transition-colors hover:bg-brand-accent/30 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  {isExportingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                </button>
                <button
                  onClick={() => exportToDocx(editedText, `${template?.title?.replace(/\s+/g, '_') || 'Escrito'}.docx`)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600/20 px-6 py-2.5 text-sm font-bold text-blue-400 transition-colors hover:bg-blue-600/30 border border-blue-500/30"
                >
                  <FileText className="h-4 w-4" />
                  Descargar Word
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentWriter;
