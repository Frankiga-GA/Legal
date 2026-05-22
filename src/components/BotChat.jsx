import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bot, Check, Copy, Download, FileText, Layers3, Send, Sparkles, User, X } from 'lucide-react';
import { askGeminiSpecializedAssistant, isGeminiConfigured } from '../services/geminiService';

const variablePattern = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g;

const extractVariables = (template) => {
  const content = `${template?.prompt || ''}\n${template?.body || ''}\n${template?.content || ''}`;
  const matches = [...content.matchAll(variablePattern)].map((match) => match[1]);
  return [...new Set(matches)];
};

const fillTemplate = (template, values) => {
  const raw = template?.body || template?.content || template?.prompt || '';
  return raw.replace(variablePattern, (_match, key) => values[key] ?? `{{${key}}}`);
};

const BotChat = ({ bot, onBack }) => {
  const availableTemplates = bot.allTemplates || bot.templates || [];
  const documentCount = bot.docs ?? bot.documents ?? 0;
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Soy ${bot.name}. ${bot.description || 'Listo para apoyar el analisis legal.'}\n\nTengo ${documentCount} documentos de referencia disponibles. Puedes usar una plantilla desde este chat cuando quieras.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateValues, setTemplateValues] = useState({});
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const messagesEndRef = useRef(null);

  const selectedTemplate = useMemo(
    () => availableTemplates.find((template) => template.id === selectedTemplateId) || null,
    [availableTemplates, selectedTemplateId]
  );

  const templateVariables = useMemo(
    () => extractVariables(selectedTemplate),
    [selectedTemplate]
  );

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
      setShareUrl('');
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        content: `Plantilla activa: ${selectedTemplate.name}\n\nDetecté ${templateVariables.length} variables. Voy a pedir solo las que falten.`,
      },
    ]);
  }, [selectedTemplateId]);

  const buildLocalAssistantResponse = (userMessage) => {
    const lowerInput = userMessage.toLowerCase();

    if (bot.name.toLowerCase().includes('laboral')) {
      if (lowerInput.includes('liquidacion') || lowerInput.includes('liquidaciÃ³n') || lowerInput.includes('despido')) {
        return [
          'Revision laboral preliminar:',
          '',
          '1. El despido arbitrario puede activar indemnizacion segun tiempo de servicio.',
          '2. Los beneficios sociales deben verificarse contra fecha de cese y pagos pendientes.',
          '3. Conviene revisar comunicaciones previas y medios probatorios antes de definir estrategia.',
        ].join('\n');
      }

      return 'Como asistente laboral, puedo ayudarte con cartas, calculos de beneficios, revision de contratos o analisis de contingencias. Indica el caso, hechos principales o documento a revisar.';
    }

    if (bot.name.toLowerCase().includes('civil') || bot.name.toLowerCase().includes('contrato')) {
      if (lowerInput.includes('alquiler') || lowerInput.includes('arrendamiento')) {
        return [
          'Para revisar un arrendamiento, empezaria por:',
          '',
          '1. Penalidades por retraso.',
          '2. Obligaciones de mantenimiento.',
          '3. Causales de resolucion.',
          '4. Garantias, entrega y devolucion del inmueble.',
        ].join('\n');
      }

      return 'Puedo analizar contratos de compraventa, fianzas o arrendamientos comerciales. Indica si quieres detectar riesgos, preparar un borrador o mejorar clausulas.';
    }

    return 'Recibido. Para darte una respuesta util, comparte la materia, el objetivo de la revision o el documento que quieres analizar.';
  };

  const runTemplateFlow = async (message) => {
    const currentValue = message.trim();
    if (!selectedTemplate) return false;

    if (!templateVariables.length) {
      const generated = fillTemplate(selectedTemplate, {});
      setGeneratedDocument(generated);
      setMessages((prev) => [...prev, { role: 'ai', content: `La plantilla "${selectedTemplate.name}" no tiene variables. Ya generé el documento.` }]);
      return true;
    }

    const nextMissing = missingVariables[0];
    if (!nextMissing) {
      const generated = fillTemplate(selectedTemplate, templateValues);
      setGeneratedDocument(generated);
      setMessages((prev) => [...prev, { role: 'ai', content: 'Ya están completas todas las variables. Abajo te dejo el documento editable.' }]);
      return true;
    }

    setTemplateValues((prev) => {
      const updated = { ...prev, [nextMissing]: currentValue };
      const stillMissing = templateVariables.find((key) => !String(updated[key] || '').trim());

      if (!stillMissing) {
        const generated = fillTemplate(selectedTemplate, updated);
        setGeneratedDocument(generated);
        setMessages((messagesPrev) => [
          ...messagesPrev,
          { role: 'ai', content: `Perfecto. Ya completé la plantilla "${selectedTemplate.name}". Puedes editar el documento final abajo.` },
        ]);
      } else {
        setMessages((messagesPrev) => [
          ...messagesPrev,
          { role: 'ai', content: `Gracias. Ahora necesito: ${stillMissing}.` },
        ]);
      }

      return updated;
    });

    return true;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const usedTemplate = await runTemplateFlow(userMessage);
      if (!usedTemplate) {
        const responseContent = isGeminiConfigured
          ? await askGeminiSpecializedAssistant({ bot, question: userMessage })
          : buildLocalAssistantResponse(userMessage);

        setMessages((prev) => [...prev, { role: 'ai', content: responseContent }]);
      }
    } catch (error) {
      console.warn('Gemini no pudo responder en asistente especializado. Usando fallback local.', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `${buildLocalAssistantResponse(userMessage)}\n\nNota: Gemini no respondio en este intento, asi que use el analisis local de LUSTI.`,
        },
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
    setIsTemplateDrawerOpen(false);
    setTemplateValues({});
    setGeneratedDocument('');
    setMessages((prev) => [...prev, { role: 'ai', content: `Elegiste "${template.name}". Escribe el primer dato para empezar.` }]);
  };

  const handleUpdateTemplateValue = (key, value) => {
    setTemplateValues((prev) => ({ ...prev, [key]: value }));
  };

  const regenerateDocument = () => {
    if (!selectedTemplate) return;
    setGeneratedDocument(fillTemplate(selectedTemplate, templateValues));
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

  const createShareLink = async () => {
    if (!generatedDocument) return;
    const payload = {
      template: selectedTemplate?.name || 'Documento',
      content: generatedDocument,
      createdAt: new Date().toISOString(),
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = `${window.location.origin}${window.location.pathname}#doc=${encoded}`;
    setShareUrl(url);
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="relative flex h-full flex-col bg-brand-black">
      <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-brand-gold/5 blur-[150px]"></div>

      <div className="glass-panel relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.05] p-8">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="rounded-xl p-3 text-brand-accent/40 transition-colors hover:bg-white/[0.05] hover:text-brand-ivory">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="rounded-xl bg-brand-gold p-3 shadow-[0_0_20px_rgba(197,160,89,0.2)]">
            <Sparkles className="h-5 w-5 text-brand-black" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-medium tracking-tight text-brand-ivory">{bot.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                {isGeminiConfigured ? 'Gemini activo' : 'IA local'} &bull; Contexto privado
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTemplateDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30"
          >
            <Layers3 className="h-4 w-4" />
            Ver plantillas
          </button>
          <button
            onClick={() => setIsTemplateDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-ivory px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-black transition-all hover:bg-white"
          >
            <FileText className="h-4 w-4" />
            Usar plantilla
          </button>
        </div>
      </div>

      <div className="custom-scrollbar relative z-10 flex-1 overflow-y-auto">
        <div className="grid min-h-full lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-12 p-10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mx-auto flex max-w-4xl gap-8 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-2xl ${
                    msg.role === 'ai' ? 'bg-brand-ivory text-brand-black' : 'border border-white/[0.05] bg-white/[0.03] text-brand-accent/40'
                  }`}
                >
                  {msg.role === 'ai' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div className={`flex-1 space-y-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block text-[15px] font-light leading-relaxed ${
                      msg.role === 'ai' ? 'text-brand-ivory/80' : 'text-brand-accent/80'
                    }`}
                  >
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-5 whitespace-pre-wrap last:mb-0">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="mx-auto flex max-w-4xl gap-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-ivory text-brand-black shadow-xl">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 opacity-20">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-brand-ivory"></span>
                  <span className="h-1 w-1 animate-bounce rounded-full bg-brand-ivory delay-75"></span>
                  <span className="h-1 w-1 animate-bounce rounded-full bg-brand-ivory delay-150"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/[0.05] bg-white/[0.01] p-10 lg:border-l lg:border-t-0">
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-brand-gold">Plantilla activa</h4>
                  {selectedTemplate ? (
                    <button
                      onClick={() => {
                        setSelectedTemplateId(null);
                        setTemplateValues({});
                        setGeneratedDocument('');
                      }}
                      className="text-brand-accent/40 transition-colors hover:text-brand-ivory"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xl font-serif font-medium text-brand-ivory">{selectedTemplate.name}</h5>
                      <p className="text-xs uppercase tracking-widest text-brand-gold">{selectedTemplate.category}</p>
                    </div>
                    <p className="text-sm font-light leading-relaxed text-brand-accent/40">{selectedTemplate.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {templateVariables.length ? templateVariables.map((variable) => (
                        <span key={variable} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-widest text-brand-ivory/70">
                          {`{{${variable}}}`}
                        </span>
                      )) : <span className="text-sm text-brand-accent/30">Esta plantilla no contiene variables.</span>}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-light text-brand-accent/40">
                    Selecciona una plantilla para que el asistente empiece a pedir solo los datos faltantes.
                  </p>
                )}
              </div>

              {selectedTemplate && templateVariables.length > 0 && (
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6">
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-gold">Variables</h4>
                  <div className="space-y-3">
                    {templateVariables.map((key) => (
                      <label key={key} className="block">
                        <span className="mb-2 block text-[10px] uppercase tracking-widest text-brand-accent/50">{`{{${key}}}`}</span>
                        <input
                          value={templateValues[key] || ''}
                          onChange={(e) => handleUpdateTemplateValue(key, e.target.value)}
                          placeholder={`Escribe ${key}`}
                          className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={regenerateDocument}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-black transition-all hover:bg-white"
                  >
                    <Check className="h-4 w-4" />
                    Generar documento
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-brand-gold">Documento final</h4>
                  <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">
                    {generatedDocument ? 'Editable' : 'Vacío'}
                  </span>
                </div>
                <textarea
                  value={generatedDocument}
                  onChange={(e) => setGeneratedDocument(e.target.value)}
                  placeholder="Aquí aparecerá el documento final editable..."
                  className="h-[360px] w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={copyDocument} className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30">
                    <Copy className="h-4 w-4" />
                    Copiar
                  </button>
                  <button onClick={downloadDocument} className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30">
                    <Download className="h-4 w-4" />
                    Descargar TXT
                  </button>
                  <button onClick={createShareLink} className="inline-flex items-center gap-2 rounded-lg bg-brand-ivory px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-black transition-all hover:bg-white">
                    Compartir link
                  </button>
                </div>
                {shareUrl ? (
                  <div className="mt-4 rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-4 text-xs text-brand-ivory/70">
                    Link copiado: {shareUrl}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/[0.05] bg-white/[0.01] p-10">
        <div className="group relative mx-auto max-w-3xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTemplate ? `Completa ${missingVariables[0] || 'el siguiente dato'}...` : `Escribe una consulta para ${bot.name}...`}
            className="w-full rounded-3xl border border-white/[0.05] bg-white/[0.02] py-6 pl-8 pr-20 font-light text-brand-ivory shadow-2xl transition-all placeholder:text-brand-accent/10 focus:border-brand-gold/40 focus:bg-white/[0.04] focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-3 text-brand-accent transition-colors hover:text-brand-gold disabled:opacity-10"
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-brand-accent/20">
          Asistencia documental generativa &bull; Verifica la informacion antes de presentarla
        </p>
      </div>

      {isTemplateDrawerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xl">
          <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-white/[0.05] bg-brand-black p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-serif font-medium text-brand-ivory">Plantillas</h3>
                <p className="text-sm font-light text-brand-accent/40">Selecciona una para empezar a completar variables.</p>
              </div>
              <button onClick={() => setIsTemplateDrawerOpen(false)} className="text-brand-accent/40 transition-colors hover:text-brand-ivory">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              {availableTemplates.map((template) => {
                const vars = extractVariables(template);
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
                        <h4 className="text-lg font-medium text-brand-ivory">{template.name}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-brand-gold">{template.category || 'General'}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">{vars.length} vars</span>
                    </div>
                    <p className="mt-3 text-sm font-light text-brand-accent/40">{template.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vars.length ? vars.map((variable) => (
                        <span key={variable} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-widest text-brand-ivory/70">
                          {`{{${variable}}}`}
                        </span>
                      )) : (
                        <span className="text-xs text-brand-accent/30">Sin variables</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotChat;
