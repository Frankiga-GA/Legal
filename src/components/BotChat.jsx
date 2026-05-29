/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bot, Copy, Download, FileText, FolderOpen, Layers3, Save, Search, Send, Sparkles, User, X } from 'lucide-react';
import { askGeminiSpecializedAssistant, isGeminiConfigured } from '../services/geminiService';
import { downloadDriveFileAsFile, getStoredDriveToken, isSupportedTemplateFile } from '../services/googleDriveService';
import { requestDocumentChat, uploadDocumentToBackend } from '../services/documentBackendService';

const variablePattern = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g;
const examplePrompts = [
  'Resume esta demanda en 5 puntos',
  'Detecta riesgos laborales y pruebas faltantes',
  'Genera una carta notarial con tono firme',
  'Completa esta plantilla con los datos del caso',
  'Extrae datos clave del PDF: partes, fechas y montos',
];

const extractVariables = (template) => {
  const content = `${template?.prompt || ''}\n${template?.body || ''}\n${template?.content || ''}`;
  return [...new Set([...content.matchAll(variablePattern)].map((match) => match[1]))];
};

const fillTemplate = (template, values) => {
  const raw = template?.body || template?.content || template?.prompt || '';
  return raw.replace(variablePattern, (_match, key) => values[key] ?? `{{${key}}}`);
};

const decodeTextDataUrl = (dataUrl = '') => {
  if (!dataUrl.startsWith('data:text/')) return '';
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return '';
  try {
    return decodeURIComponent(dataUrl.slice(commaIndex + 1));
  } catch {
    try {
      return atob(dataUrl.slice(commaIndex + 1));
    } catch {
      return '';
    }
  }
};

const dataUrlToFile = (dataUrl, fileName = 'archivo.pdf') => {
  if (!dataUrl || !dataUrl.includes(',')) return null;
  const [header, payload] = dataUrl.split(',');
  const mimeTypeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeTypeMatch?.[1] || 'application/octet-stream';
  try {
    const binaryString = atob(payload);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new File([bytes], fileName, { type: mimeType });
  } catch {
    return null;
  }
};

const BotChat = ({ bot, onBack, onSaveGeneratedDocument }) => {
  const availableTemplates = useMemo(() => bot.allTemplates || bot.templates || [], [bot.allTemplates, bot.templates]);
  const availableFileTemplates = useMemo(
    () => (bot.templateFiles || bot.fileTemplates || []).filter((file) => isSupportedTemplateFile(file)),
    [bot.templateFiles, bot.fileTemplates]
  );
  const activePromptFiles = useMemo(
    () => bot.selectedPromptFiles || bot.promptFiles || [],
    [bot.selectedPromptFiles, bot.promptFiles]
  );
  const documentCount = bot.docs ?? bot.documents ?? 0;
  const driveFolder = bot.driveFolder || null;

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Soy ${bot.name}. ${bot.description || 'Listo para apoyar el analisis legal.'}\n\nPuedo ayudarte con tareas concretas: resumir demandas, detectar riesgos, extraer datos de PDFs, completar plantillas o generar borradores. Tengo ${documentCount} documentos de referencia disponibles. ${activePromptFiles.length ? `Tambien cargo ${activePromptFiles.length} prompts activos para ajustar el enfoque.` : 'No hay prompts activos cargados.'}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedFileTemplateId, setSelectedFileTemplateId] = useState(null);
  const [templateValues, setTemplateValues] = useState({});
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [backendStatus, setBackendStatus] = useState('');
  const [selectedFileTemplateExtractedText, setSelectedFileTemplateExtractedText] = useState('');
  const messagesEndRef = useRef(null);

  const resolveFileTemplateText = async (template) => {
    const localText = (template?.fileText || '').trim();
    if (localText) return localText;

    if (template?.fileDataUrl) {
      const reconstructedFile = dataUrlToFile(template.fileDataUrl, template.fileName || `${template.name}.pdf`);
      if (!reconstructedFile) throw new Error('No se pudo reconstruir el archivo adjunto');
      setBackendStatus('Extrayendo texto del archivo...');
      const backendResponse = await uploadDocumentToBackend(reconstructedFile);
      return String(backendResponse?.extracted_text || '').trim();
    }

    if (template?.mimeType) {
      const driveToken = getStoredDriveToken();
      if (!driveToken?.access_token) {
        throw new Error('No hay token valido de Google Drive para descargar el archivo.');
      }
      setBackendStatus('Descargando archivo desde Drive...');
      const driveFile = await downloadDriveFileAsFile(template, driveToken);
      setBackendStatus('Extrayendo texto del archivo descargado...');
      const backendResponse = await uploadDocumentToBackend(driveFile);
      return String(backendResponse?.extracted_text || '').trim();
    }

    return '';
  };

  const selectedTemplate = useMemo(
    () => availableTemplates.find((template) => template.id === selectedTemplateId) || null,
    [availableTemplates, selectedTemplateId]
  );
  const selectedFileTemplate = useMemo(
    () => availableFileTemplates.find((template) => template.id === selectedFileTemplateId) || null,
    [availableFileTemplates, selectedFileTemplateId]
  );
  const activePromptLabel = useMemo(() => {
    if (activePromptFiles.length) return activePromptFiles[0]?.name || 'Prompt activo';
    if (bot.promptFolder?.name) return bot.promptFolder.name;
    if (bot.promptFolderId) return 'Carpeta de prompts seleccionada';
    return '';
  }, [activePromptFiles, bot.promptFolder, bot.promptFolderId]);
  const hasActivePrompt = Boolean(activePromptLabel);
  const templateVariables = useMemo(() => extractVariables(selectedTemplate), [selectedTemplate]);
  const missingVariables = useMemo(
    () => templateVariables.filter((key) => !String(templateValues[key] || '').trim()),
    [templateValues, templateVariables]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateValues({});
      setGeneratedDocument('');
      setSaveStatus('');
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        content: `Plantilla activa: ${selectedTemplate.name}\n\nDetecte ${templateVariables.length} variables. Voy a pedir solo las que falten.`,
      },
    ]);
  }, [selectedTemplate, templateVariables.length]);

  useEffect(() => {
    if (!selectedFileTemplate) return;
    const runExtraction = async () => {
      setSelectedFileTemplateExtractedText('');
      setGeneratedDocument('');
      setSaveStatus('');

      try {
        if (selectedFileTemplate.fileText?.trim()) {
          const localText = selectedFileTemplate.fileText.trim();
          setSelectedFileTemplateExtractedText(localText);
          setGeneratedDocument('');
          setBackendStatus(`Archivo listo para procesar (${localText.length} caracteres)`);
          return;
        }

        if (selectedFileTemplate.fileDataUrl || selectedFileTemplate.mimeType) {
          const extracted = await resolveFileTemplateText(selectedFileTemplate);
          setSelectedFileTemplateExtractedText(extracted);
          setGeneratedDocument('');
          setBackendStatus(
            extracted
              ? `Archivo procesado por Python (${extracted.length} caracteres)`
              : 'Archivo recibido, sin texto extraible'
          );
          return;
        }

        setBackendStatus('Archivo seleccionado, pero no incluye contenido descargable');
      } catch (error) {
        setBackendStatus(`No se pudo leer el archivo: ${error?.message || 'error desconocido'}`);
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            content: `No se pudo leer "${selectedFileTemplate.name}".`,
          },
        ]);
      }
    };

    runExtraction();
    setSaveStatus('');
  }, [selectedFileTemplate]);

  useEffect(() => {
    // No-op: prompt files stay internal to the Gemini context to keep the chat clean.
  }, [activePromptFiles]);

  const buildLocalAssistantResponse = (userMessage) => {
    const lowerInput = userMessage.toLowerCase();
    if (bot.name.toLowerCase().includes('laboral')) {
      if (lowerInput.includes('liquidacion') || lowerInput.includes('despido')) {
        return [
          'Revision laboral preliminar:',
          '',
          '1. El despido arbitrario puede activar indemnizacion segun tiempo de servicio.',
          '2. Los beneficios sociales deben verificarse contra fecha de cese y pagos pendientes.',
          '3. Conviene revisar comunicaciones previas y medios probatorios antes de definir estrategia.',
        ].join('\n');
      }
      return 'Como asistente laboral, puedo ayudarte con cartas, calculos de beneficios, revision de contratos o analisis de contingencias.';
    }
    return 'Recibido. Para darte una respuesta util, comparte la materia, el objetivo de la revision o el documento que quieres analizar.';
  };

  const runTemplateFlow = (message) => {
    const currentValue = message.trim();
    if (!selectedTemplate) return false;

    if (!templateVariables.length) {
      setGeneratedDocument(fillTemplate(selectedTemplate, {}));
      setMessages((prev) => [...prev, { role: 'ai', content: `La plantilla "${selectedTemplate.name}" no tiene variables. Ya genere el documento.` }]);
      return true;
    }

    const nextMissing = missingVariables[0];
    if (!nextMissing) {
      setGeneratedDocument(fillTemplate(selectedTemplate, templateValues));
      setMessages((prev) => [...prev, { role: 'ai', content: 'Ya estan completas todas las variables. Abajo te dejo el documento editable.' }]);
      return true;
    }

    const updated = { ...templateValues, [nextMissing]: currentValue };
    setTemplateValues(updated);

    const stillMissing = templateVariables.find((key) => !String(updated[key] || '').trim());
    if (!stillMissing) {
      setGeneratedDocument(fillTemplate(selectedTemplate, updated));
      setMessages((prev) => [...prev, { role: 'ai', content: `Perfecto. Ya complete la plantilla "${selectedTemplate.name}". Puedes editar el documento final abajo.` }]);
    } else {
      setMessages((prev) => [...prev, { role: 'ai', content: `Gracias. Ahora necesito: ${stillMissing}.` }]);
    }

    return true;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    const attachmentFileName = selectedFileTemplate?.name || '';
    const attachmentFileType = selectedFileTemplate?.fileType || '';
    let attachmentFileText = (selectedFileTemplateExtractedText || '').trim();
    if (!attachmentFileText && selectedFileTemplate?.fileText) {
      attachmentFileText = String(selectedFileTemplate.fileText || '').trim();
    }
    if (!attachmentFileText && (selectedFileTemplate?.fileDataUrl || selectedFileTemplate?.mimeType)) {
      try {
        attachmentFileText = await resolveFileTemplateText(selectedFileTemplate);
        setSelectedFileTemplateExtractedText(attachmentFileText);
        setGeneratedDocument('');
        setBackendStatus(
          attachmentFileText
            ? `Archivo procesado por Python (${attachmentFileText.length} caracteres)`
            : 'Archivo recibido, sin texto extraible'
        );
      } catch (error) {
        setBackendStatus(`No se pudo leer el archivo: ${error?.message || 'error desconocido'}`);
      }
    }
    const attachedFile = selectedFileTemplate
      ? {
          role: 'file',
          fileName: attachmentFileName,
          fileType: attachmentFileType || 'Archivo',
          preview: (attachmentFileText || `Archivo listo para editar: ${attachmentFileName}`).slice(0, 280),
        }
      : null;

    setMessages((prev) => [
      ...prev,
      ...(attachedFile ? [attachedFile] : []),
      { role: 'user', content: userMessage },
    ]);
    setInput('');
    if (selectedFileTemplate) {
      setSelectedFileTemplateId(null);
      setSaveStatus('');
    }
    setIsTyping(true);

    try {
      if (selectedFileTemplate) {
        setBackendStatus(
          attachmentFileText
            ? `Texto extraído listo (${attachmentFileText.length} caracteres). La IA lo usará como contexto.`
            : 'Archivo recibido, sin texto extraíble'
        );

        if (!attachmentFileText) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              content: `No pude extraer texto útil de "${attachmentFileName}". Si es un PDF escaneado, revisa OCR o sube una versión con texto seleccionable.`,
            },
          ]);
          return;
        }

        let responseContent = '';
        try {
          const backendResponse = await requestDocumentChat({
            message: userMessage,
            prompt: bot.promptContext || bot.description || '',
            fileName: attachmentFileName,
            fileType: attachmentFileType,
            fileText: attachmentFileText,
          });
          responseContent = backendResponse?.message || '';
          if (responseContent.startsWith('No se pudo usar Gemini en el backend')) {
            responseContent = '';
          }
        } catch (backendError) {
          console.warn('No se pudo usar el backend documental. Intentando Gemini del frontend.', backendError);
        }

        if (!responseContent) {
          responseContent = isGeminiConfigured
            ? await askGeminiSpecializedAssistant({
                bot,
                question: userMessage,
                attachmentContext: [
                  `Archivo adjunto: ${attachmentFileName}`,
                  `Tipo: ${attachmentFileType || 'Archivo'}`,
                  'Texto extraído:',
                  attachmentFileText,
                ].join('\n'),
              })
            : buildLocalAssistantResponse(userMessage);
        }

        setGeneratedDocument(responseContent);
        setMessages((prev) => [...prev, { role: 'ai', content: responseContent }]);
        return;
      }

      const usedTemplate = runTemplateFlow(userMessage);
      if (!usedTemplate) {
        const responseContent = isGeminiConfigured
          ? await askGeminiSpecializedAssistant({
              bot,
              question: userMessage,
              attachmentContext: attachmentFileText || attachmentFileName || '',
            })
          : buildLocalAssistantResponse(userMessage);
        setMessages((prev) => [...prev, { role: 'ai', content: responseContent }]);
      }
    } catch (error) {
      console.warn('Gemini no pudo responder en asistente especializado. Usando fallback local.', error);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: `${buildLocalAssistantResponse(userMessage)}\n\nNota: Gemini no respondio en este intento, asi que use el analisis local de LUSTI.` },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setSelectedFileTemplateId(null);
    setIsTemplateDrawerOpen(false);
    setIsTemplatePickerOpen(false);
    setTemplateValues({});
    setGeneratedDocument('');
    setMessages((prev) => [...prev, { role: 'ai', content: `Elegiste "${template.name}". Escribe el primer dato para empezar.` }]);
  };

  const handleSelectFileTemplate = (template) => {
    setSelectedFileTemplateId(template.id);
    setSelectedTemplateId(null);
    setIsTemplatePickerOpen(false);
    setTemplateValues({});
    setGeneratedDocument(template.fileText || decodeTextDataUrl(template.fileDataUrl) || '');
    setIsTemplateDrawerOpen(false);
  };

  const clearSelectedFileTemplate = () => {
    setSelectedFileTemplateId(null);
    setGeneratedDocument('');
    setSaveStatus('');
  };

  const openFileTemplate = () => {
    if (!selectedFileTemplate?.fileDataUrl) return;
    const win = window.open(selectedFileTemplate.fileDataUrl, '_blank', 'noopener,noreferrer');
    if (win) win.focus();
  };

  const copyDocument = async () => {
    if (!generatedDocument) return;
    await navigator.clipboard.writeText(generatedDocument);
  };

  const downloadDocument = () => {
    if (!generatedDocument) return;
    const blob = new Blob([generatedDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name || 'documento'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveDocument = async () => {
    if (!generatedDocument.trim() || !onSaveGeneratedDocument) return;
    setSaveStatus('Guardando...');
    try {
      const title = selectedTemplate?.name || selectedFileTemplate?.name || `Documento de ${bot.name}`;
      const result = await onSaveGeneratedDocument({ title, content: generatedDocument, selectedTemplate, selectedFileTemplate });
      if (result?.saved) {
        setGeneratedFiles((current) => [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title,
            preview: generatedDocument.slice(0, 180),
            type: selectedTemplate?.name ? 'Plantilla' : selectedFileTemplate?.name ? 'Formato' : 'Documento',
            updatedAt: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 6));
      }
      setSaveStatus(result?.saved ? 'Guardado en historial' : 'No se pudo guardar en Supabase');
    } catch (error) {
      console.warn('No se pudo guardar el documento generado.', error);
      setSaveStatus('Error al guardar');
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-brand-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]"></div>

        <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/[0.05] p-4 sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <button onClick={onBack} className="rounded-xl p-3 text-brand-accent/40 transition-colors hover:bg-white/[0.05] hover:text-brand-ivory">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="rounded-lg bg-brand-gold p-2.5">
            <Sparkles className="h-5 w-5 text-brand-black" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-serif font-medium tracking-tight text-brand-ivory sm:text-xl">{bot.name}</h3>
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-brand-gold">
              {isGeminiConfigured ? 'Gemini activo' : 'IA local'} • Contexto privado
            </p>
            {activePromptLabel ? (
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    hasActivePrompt ? 'bg-emerald-400 text-emerald-400' : 'bg-red-400 text-red-400'
                  }`}
                />
                <p className="truncate text-[9px] font-bold uppercase tracking-widest text-brand-gold/80 sm:text-[10px]">
                  Prompt: {activePromptLabel}
                </p>
              </div>
            ) : null}
            {driveFolder ? (
              <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-widest text-brand-accent/35 sm:text-[10px]">
                Drive: {driveFolder.name}
              </p>
            ) : null}
          </div>
        </div>

        <button
          onClick={() => setIsTemplatePickerOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30"
        >
          <Layers3 className="h-4 w-4" />
          Elegir plantilla
        </button>
      </div>

      <div className="custom-scrollbar relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto grid min-h-full w-full max-w-[1400px] gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-10 lg:py-10">
          <div className="flex min-w-0 flex-col">
            <div className="flex-1 space-y-8">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 sm:gap-6 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${msg.role === 'ai' ? 'bg-brand-ivory text-brand-black' : 'border border-white/[0.05] bg-white/[0.03] text-brand-accent/40'}`}>
                  {msg.role === 'ai' ? (
                    <Bot className="h-5 w-5" />
                  ) : msg.role === 'file' ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className={`flex-1 ${msg.role === 'user' || msg.role === 'file' ? 'text-right' : ''}`}>
                  {msg.role === 'file' ? (
                    <div className="ml-auto inline-flex w-full max-w-[520px] items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-left">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-rose-500/90 text-white">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">Archivo adjunto</div>
                        <div className="mt-1 truncate text-sm font-semibold text-brand-ivory">{msg.fileName || 'Archivo'}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-widest text-brand-accent/30">{msg.fileType || 'Archivo'}</div>
                        {msg.preview ? <p className="mt-3 whitespace-pre-wrap text-sm font-light leading-relaxed text-brand-ivory/75">{msg.preview}</p> : null}
                      </div>
                    </div>
                  ) : (
                    <div className={`inline-block max-w-full rounded-lg px-4 py-4 text-[15px] font-light leading-relaxed sm:px-5 sm:py-4 ${msg.role === 'ai' ? 'border border-white/[0.05] bg-white/[0.03] text-brand-ivory/85' : 'bg-brand-gold text-brand-black'}`}>
                      {(msg.content || '').split('\n').map((line, i) => (
                        <p key={i} className="whitespace-pre-wrap last:mb-0">{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 sm:gap-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-ivory text-brand-black">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 opacity-30">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-ivory"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-ivory delay-75"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-ivory delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-8 rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 sm:p-5 lg:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                  <Sparkles className="h-4 w-4" />
                  Respuesta asistida
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-accent/35">
                  {selectedTemplate ? selectedTemplate.name : 'Sin plantilla activa'}
                  <span>Â·</span>
                {selectedFileTemplate ? selectedFileTemplate.name : 'Sin formato activo'}
              </div>
            </div>

            {backendStatus ? (
              <div className="mb-3 rounded-lg border border-emerald-400/15 bg-emerald-400/5 px-4 py-3 text-[11px] font-medium text-emerald-300">
                {backendStatus}
              </div>
            ) : null}

            {selectedFileTemplate ? (
              <div className="mb-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">
                    Texto extraÃ­do
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">
                    {selectedFileTemplateExtractedText ? `${selectedFileTemplateExtractedText.length} caracteres` : 'pendiente'}
                  </span>
                </div>
                <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-brand-ivory/70">
                  {selectedFileTemplateExtractedText
                    ? `${selectedFileTemplateExtractedText.slice(0, 1200)}${selectedFileTemplateExtractedText.length > 1200 ? '...' : ''}`
                    : 'Leyendo archivo... si el documento es un PDF escaneado puede requerir OCR.'}
                </p>
              </div>
            ) : null}

            <div className="mb-4 rounded-lg border border-white/[0.05] bg-white/[0.015] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-brand-gold">Prueba con una tarea real</p>
                  <p className="mt-1 text-xs text-brand-accent/45">Estos prompts muestran valor legal concreto en la demo.</p>
                </div>
                <Search className="h-4 w-4 text-brand-accent/35" />
              </div>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-xs font-medium text-brand-ivory/75 transition-colors hover:border-brand-gold/30 hover:text-brand-ivory"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="group relative">
            {selectedFileTemplate ? (
              <div className="mb-3 inline-flex max-w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.03] px-3 py-2.5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-rose-500/90 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-brand-ivory">{selectedFileTemplate.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-brand-accent/35">
                      {selectedFileTemplate.fileSize ? `${Math.round(selectedFileTemplate.fileSize / 1024)} KB` : 'Archivo'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFileTemplate}
                    className="ml-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-brand-accent/40 transition-colors hover:bg-white/[0.06] hover:text-brand-ivory"
                    aria-label="Quitar archivo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedFileTemplate ? `Escribe los datos para completar "${selectedFileTemplate.name}"...` : `Escribe una consulta para ${bot.name}...`}
                className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] py-4 pl-5 pr-28 text-sm font-light text-brand-ivory transition-colors placeholder:text-brand-accent/10 focus:border-brand-gold/40 focus:bg-white/[0.04] focus:outline-none sm:py-5 sm:pl-6 sm:pr-32 sm:text-base"
              />
              <button
                type="button"
                onClick={() => setIsTemplatePickerOpen(true)}
                className="absolute right-16 top-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30 hover:text-brand-gold sm:right-20 sm:px-4 sm:py-2 sm:text-[11px]"
              >
                Plantilla
              </button>
              <button
                onClick={handleSend}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-brand-accent transition-colors hover:text-brand-gold disabled:opacity-10 sm:right-5 sm:p-3"
                disabled={!input.trim() || isTyping}
              >
                <Send className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-accent/20">
              <span>Asistencia documental generativa</span>
              <button type="button" onClick={() => setIsTemplateDrawerOpen(true)} className="text-brand-accent/35 transition-colors hover:text-brand-ivory">
                Ver recursos
              </button>
            </div>

            {saveStatus ? <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-xs text-brand-ivory/70">{saveStatus}</div> : null}
          </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-brand-accent/30">
            {driveFolder ? (
              <button onClick={openFileTemplate} className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-2 transition-colors hover:border-brand-gold/30 hover:text-brand-ivory">
                Abrir Drive
              </button>
            ) : null}
            {selectedTemplate ? (
              <button onClick={() => setIsTemplateDrawerOpen(true)} className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-2 transition-colors hover:border-brand-gold/30 hover:text-brand-ivory">
                Cambiar plantilla
              </button>
            ) : null}
          </div>
          </div>

          <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
            <div className="flex h-full flex-col rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 sm:p-5 lg:p-6">
              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">Instrucciones</div>
                <h4 className="mt-2 text-lg font-serif text-brand-ivory">Contexto del asistente</h4>
                <p className="mt-2 text-sm font-light leading-relaxed text-brand-accent/40">
                  {bot.description || 'Este asistente trabaja con el contexto configurado y con los archivos vinculados.'}
                </p>
              </div>

              <div className="mb-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h5 className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">Documentos generados</h5>
                  <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">{generatedFiles.length}</span>
                </div>
                <div className="space-y-2">
                  {generatedFiles.length ? generatedFiles.map((file) => (
                    <div key={file.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                      <div className="text-sm text-brand-ivory">{file.title}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-brand-accent/35">
                        {file.type} Â· {new Date(file.updatedAt).toLocaleString()}
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs font-light text-brand-accent/40">{file.preview}</p>
                    </div>
                  )) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4 text-sm text-brand-accent/35">
                      Los documentos editados o generados por la IA aparecerÃ¡n aquÃ­.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">Estado</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-brand-ivory">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor] ${
                      hasActivePrompt ? 'bg-emerald-400 text-emerald-400' : 'bg-red-400 text-red-400'
                    }`}
                  />
                  <span>{activePromptLabel ? `Prompt: ${activePromptLabel}` : 'Sin prompt activo'}</span>
                </div>
                <div className="mt-2 text-sm text-brand-ivory">
                  {selectedTemplate ? `Plantilla: ${selectedTemplate.name}` : 'Sin plantilla activa'}
                </div>
                <div className="mt-1 text-sm text-brand-ivory/70">
                  {selectedFileTemplate ? `Formato: ${selectedFileTemplate.name}` : 'Sin formato activo'}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isTemplateDrawerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xl">
          <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/[0.05] bg-brand-black p-5 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-medium text-brand-ivory sm:text-2xl">Recursos guardados</h3>
                <p className="text-sm font-light text-brand-accent/40">Plantillas y formatos disponibles para este asistente.</p>
              </div>
              <button onClick={() => setIsTemplateDrawerOpen(false)} className="text-brand-accent/40 transition-colors hover:text-brand-ivory">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto pr-1 sm:pr-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Plantillas del chat</h4>
                  {availableTemplates.map((template) => {
                  const isActive = selectedTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleSelectTemplate(template)}
                      className={`w-full rounded-2xl border p-5 text-left transition-all ${isActive ? 'border-brand-gold bg-brand-gold/10' : 'border-white/[0.05] bg-white/[0.02] hover:border-brand-gold/30'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h5 className="text-lg font-medium text-brand-ivory">{template.name}</h5>
                          <p className="text-[10px] uppercase tracking-widest text-brand-gold">{template.category || 'General'}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">Prompt</span>
                      </div>
                      <p className="mt-3 text-sm font-light text-brand-accent/40">{template.description}</p>
                    </button>
                  );
                })}
              </div>
                <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Plantillas del chat</h4>
                {availableFileTemplates.map((template) => {
                  const isActive = selectedFileTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleSelectFileTemplate(template)}
                      className={`w-full rounded-2xl border p-5 text-left transition-all ${isActive ? 'border-brand-gold bg-brand-gold/10' : 'border-white/[0.05] bg-white/[0.02] hover:border-brand-gold/30'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-medium text-brand-ivory">{template.name}</h4>
                          <p className="text-[10px] uppercase tracking-widest text-brand-gold">{template.category || 'General'}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">{template.fileSize ? `${Math.round(template.fileSize / 1024)} KB` : 'Archivo'}</span>
                      </div>
                      <p className="mt-3 text-sm font-light text-brand-accent/40">{template.description}</p>
                      <div className="mt-4 rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 text-xs text-brand-ivory/60">
                        {template.fileName || 'Archivo sin nombre'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {isTemplatePickerOpen && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-xl">
          <div className="mx-auto flex h-full w-full max-w-3xl items-center justify-center p-4 sm:p-8">
            <div className="w-full overflow-hidden rounded-3xl border border-white/[0.06] bg-brand-black shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.05] p-4 sm:p-6">
                <div>
                  <h3 className="text-xl font-serif font-medium text-brand-ivory sm:text-2xl">Elegir plantilla</h3>
                  <p className="mt-1 text-sm font-light text-brand-accent/40">Selecciona una plantilla real para usarla en este chat.</p>
                </div>
                <button onClick={() => setIsTemplatePickerOpen(false)} className="text-brand-accent/40 transition-colors hover:text-brand-ivory">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {availableFileTemplates.length ? availableFileTemplates.map((template) => {
                    const isActive = selectedFileTemplateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelectFileTemplate(template)}
                        className={`rounded-2xl border p-5 text-left transition-all ${isActive ? 'border-brand-gold bg-brand-gold/10' : 'border-white/[0.05] bg-white/[0.02] hover:border-brand-gold/30'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-medium text-brand-ivory">{template.name}</h4>
                            <p className="text-[10px] uppercase tracking-widest text-brand-gold">{template.category || 'General'}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">{isActive ? 'Activa' : 'Elegir'}</span>
                        </div>
                        <p className="mt-3 text-sm font-light text-brand-accent/40">{template.description}</p>
                        <div className="mt-4 rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 text-xs text-brand-ivory/60">
                          {template.fileName || 'Archivo sin nombre'}
                        </div>
                      </button>
                    );
                  }) : (
                    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center text-sm text-brand-accent/40 md:col-span-2">
                      No hay plantillas disponibles para este asistente.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotChat;
