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
    prompt: `Redacta una DEMANDA DE ALIMENTOS dirigida al JUZGADO DE PAZ LETRADO.

DATOS DEL DEMANDANTE (Representante del menor):
- Nombre: {{cliente}}
- DNI: {{dni}}

DATOS DEL DEMANDADO:
- Nombre: {{demandado}}
- Domicilio: {{domicilioDemandado}}

DATOS ESPECÍFICOS:
- Monto solicitado: {{montoSolicitado}}
- Gastos del menor: {{gastosMenor}}
- Ingresos del demandado: {{ingresosDemandado}}

REGLAS DE FORMATO OBLIGATORIAS:
1. SUMILLA EXACTA:
EXPEDIENTE: {{expedienteNumero}}
ESPECIALISTA: {{especialista}}
CUADERNO: PRINCIPAL
ESCRITO: 01
SUMILLA: INTERPONGO DEMANDA DE ALIMENTOS

2. AUTORIDAD: SEÑOR JUEZ DE PAZ LETRADO:

3. APERSONAMIENTO: "{{cliente}}, identificado con DNI N° {{dni}}, con domicilio procesal en {{domicilioProcesal}}; a Usted respetuosamente digo:"

4. ESTRUCTURA:
I. PETITORIO
II. FUNDAMENTOS DE HECHO (Incluir gastos e ingresos)
III. FUNDAMENTOS DE DERECHO
IV. MONTO DEL PETITORIO ({{montoSolicitado}})
V. VÍA PROCEDIMENTAL
VI. MEDIOS PROBATORIOS (Enumerar 1., 2.)
VII. ANEXOS (Enumerar 1-A Copia de DNI, 1-B Partida de Nacimiento, etc.)

POR TANTO:
A Usted Señor Juez solicito admitir la demanda.`,
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
    prompt: `Redacta una CARTA NOTARIAL dirigida a {{destinatario}} con domicilio en {{domicilioDestinatario}}.

ASUNTO: {{asuntoCarta}}

De: {{cliente}}
Identificado con {{tipoDocumento}} N° {{dni}}
Domicilio: {{domicilioCliente}}

{{cuerpoCarta}}

Plazo para cumplir: {{plazoDias}} días hábiles contados desde la recepción de la presente.
La presente carta tiene carácter de {{tipoIntimacion}} y servirá como medio probatorio en caso de iniciar las acciones legales correspondientes.`,
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
        console.log('[PDF DEBUG] Fresh profile cargado:', {
          hasHeader: !!freshProfile?.headerBase64,
          headerLength: freshProfile?.headerBase64?.length,
        });
      } else {
        console.log('[PDF DEBUG] No hay sesión activa, usando firmProfile del prop');
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
