import { useState, useMemo, useEffect } from 'react';
import { FileText, Gavel, Shield, Mail, Loader2, Check, X, PenLine } from 'lucide-react';
import { askGeminiAboutCase } from '../services/geminiService';

// Inline templates para evitar dependencia de import
const INLINE_TEMPLATES = [
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
  juzgado: '',
  distritoJudicial: 'Lima',
  domicilioProcesal: '[]',
  demandado: caseData?.counterparty || '',
  ...(caseData?._templateValues || {}),
});

const DocumentWriter = ({ caseData, onClose, onSave }) => {
  const [step, setStep] = useState('select');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [customValues, setCustomValues] = useState({});
  const [generatedText, setGeneratedText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const template = selectedTemplateId ? getInlineTemplate(selectedTemplateId) : null;
  const autoValues = buildAutoValues(caseData);
  const allValues = { ...autoValues, ...customValues };

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
      const result = await askGeminiAboutCase({
        caseData,
        question: `Genera un documento legal profesional en español peruano basado en esta plantilla. Rellena los datos faltantes de manera jurídicamente correcta. NO uses frases genéricas como "es importante considerar" ni "de acuerdo a la normativa vigente". Devuelve SOLO el texto del documento, sin introducciones ni explicaciones.\n\nPlantilla:\n${filledPrompt}`
      });
      const text = typeof result === 'string' ? result : result?.text || 'Error al generar';
      const cleaned = text
        .replace(/\*\*/g, '')
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentWriter;
