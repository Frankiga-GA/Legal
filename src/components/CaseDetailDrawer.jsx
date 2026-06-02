// src/components/CaseDetailDrawer.jsx
import { useState } from 'react';
import {
  Bot,
  Calendar,
  CheckCircle2,
  FileText,
  Gavel,
  ExternalLink,
  MessageSquare,
  Plus,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { askGeminiAboutCase, isGeminiConfigured } from '../services/geminiService';
import { uploadDocumentToBackend } from '../services/documentBackendService';

const CaseDetailDrawer = ({ caseData, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [noteText, setNoteText] = useState('');
  const [documentUploadStatus, setDocumentUploadStatus] = useState('');
  const [deadlineForm, setDeadlineForm] = useState({
    title: '',
    date: '',
    priority: 'Media',
  });
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'ai',
      content: 'Listo para revisar este expediente. Puedo resumir el caso, listar documentos, detectar vencimientos, sugerir proximos pasos o preparar un borrador breve.',
    },
  ]);

  if (!caseData) return null;

  const documents = Array.isArray(caseData.documents) ? caseData.documents : [];
  const notes = Array.isArray(caseData.notes) ? caseData.notes : [];
  const importantDates = Array.isArray(caseData.importantDates) ? caseData.importantDates : [];
  const officialReferences = Array.isArray(caseData.officialReferences) ? caseData.officialReferences : [];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDocumentUploadStatus(`Leyendo ${file.name}...`);
    let extractedText = '';
    let excerpt = 'Archivo subido por el usuario. No se pudo extraer texto util automaticamente.';

    try {
      const backendResponse = await uploadDocumentToBackend(file);
      extractedText = String(backendResponse?.extracted_text || '').trim();
      excerpt = extractedText
        ? `Texto extraido por Python (${extractedText.length} caracteres): ${extractedText.slice(0, 280)}${extractedText.length > 280 ? '...' : ''}`
        : 'Archivo subido por el usuario. El backend no encontro texto extraible.';
      setDocumentUploadStatus(
        extractedText
          ? `Documento leido: ${extractedText.length} caracteres disponibles para la IA.`
          : 'Documento subido, pero sin texto extraible.'
      );
    } catch (error) {
      console.warn('No se pudo extraer texto del documento del expediente.', error);
      setDocumentUploadStatus(`Documento subido, pero no se pudo leer: ${error?.message || 'error desconocido'}`);
    }

    const newDoc = {
      id: Date.now(),
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      date: new Date().toISOString().split('T')[0],
      type: file.type,
      excerpt,
      content: extractedText,
    };

    onUpdate(caseData.id, {
      documents: [...documents, newDoc],
    });

    e.target.value = '';
  };

  const handleDeleteDoc = (docId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este documento de este expediente?")) {
      return;
    }
    onUpdate(caseData.id, {
      documents: documents.filter((doc) => doc.id !== docId),
    });
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newNote = {
      id: Date.now(),
      text: noteText.trim(),
      author: 'Equipo legal',
      date: new Date().toISOString().split('T')[0],
    };

    onUpdate(caseData.id, {
      notes: [newNote, ...notes],
    });
    setNoteText('');
  };

  const handleAddDeadline = (e) => {
    e.preventDefault();
    if (!deadlineForm.title.trim() || !deadlineForm.date) return;

    const newDeadline = {
      id: Date.now(),
      title: deadlineForm.title.trim(),
      date: deadlineForm.date,
      priority: deadlineForm.priority,
      status: 'Pendiente',
    };

    onUpdate(caseData.id, {
      importantDates: [newDeadline, ...importantDates],
    });
    setDeadlineForm({ title: '', date: '', priority: 'Media' });
  };

  const getAiResponse = async (question) => {
    const fallback = () => buildCaseResponse(question, caseData, documents, notes, importantDates, officialReferences);

    if (!isGeminiConfigured) return fallback();

    try {
      return await askGeminiAboutCase({
        question,
        caseData,
        documents,
        notes,
        importantDates,
        officialReferences,
      });
    } catch (error) {
      console.warn('Gemini no pudo responder. Usando IA local.', error);
      return `${fallback()}\n\nNota: Gemini no respondio en este intento, asi que use el analisis local de LUSTI.`;
    }
  };

  const submitAiQuestion = async (question) => {
    if (!question.trim() || isAiThinking) return;

    setAiMessages(prev => [
      ...prev,
      { role: 'user', content: question },
    ]);
    setIsAiThinking(true);

    const response = await getAiResponse(question);

    setAiMessages(prev => [
      ...prev,
      { role: 'ai', content: response },
    ]);
    setIsAiThinking(false);
  };

  const handleAskAi = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const question = aiInput.trim();
    setAiInput('');
    await submitAiQuestion(question);
  };

  const tabs = [
    { id: 'summary', label: 'Resumen', icon: FileText },
    { id: 'documents', label: 'Documentos', icon: Upload },
    { id: 'dates', label: 'Fechas', icon: Calendar },
    { id: 'official', label: 'Normas', icon: Gavel },
    { id: 'notes', label: 'Notas', icon: MessageSquare },
    { id: 'ai', label: 'IA', icon: Bot },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-white/[0.06] bg-brand-dark shadow-2xl sm:w-[640px]">
      <div className="border-b border-white/[0.06] bg-white/[0.01] p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold">
                {caseData.status}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/60">
                {caseData.type}
              </span>
            </div>
            <h3 className="truncate text-3xl font-serif font-medium tracking-tight text-brand-ivory">{caseData.id}</h3>
            <p className="mt-2 text-sm text-brand-accent/60">{caseData.clientName}</p>
          </div>
          <div className="flex items-center gap-1">
            {onDelete && (
              <button 
                onClick={() => onDelete(caseData.id)} 
                title="Eliminar expediente"
                className="rounded-lg p-2 text-red-400/50 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-2 text-brand-accent/40 transition-colors hover:bg-white/[0.05] hover:text-brand-ivory">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <SummaryMetric label="Documentos" value={documents.length} />
          <SummaryMetric label="Fechas" value={importantDates.length} />
          <SummaryMetric label="Notas" value={notes.length} />
          <SummaryMetric label="Normas" value={officialReferences.length} />
        </div>
      </div>

      <div className="border-b border-white/[0.06] bg-brand-black/20 px-6 py-3">
        <div className="grid grid-cols-6 gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] transition-all ${
                  isActive
                    ? 'bg-brand-ivory text-brand-black'
                    : 'text-brand-accent/45 hover:bg-white/[0.04] hover:text-brand-ivory'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoCard icon={User} label="Titular / cliente" value={caseData.clientName} />
              <InfoCard icon={Calendar} label="Ultima actualizacion" value={caseData.lastUpdate} />
            </section>

            <section className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/50">
                <FileText className="h-4 w-4 text-brand-gold" />
                Resumen del caso
              </h4>
              <p className="text-sm font-light leading-7 text-brand-ivory/72">
                {caseData.summary || 'Aun no se ha registrado un resumen para este expediente.'}
              </p>
            </section>

            <section className="rounded-lg border border-brand-gold/15 bg-brand-gold/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-serif text-brand-ivory">Asistente del expediente</h4>
                  <p className="mt-1 text-xs text-brand-accent/50">Preparado para usar resumen, documentos, notas y fechas del caso.</p>
                </div>
                <Bot className="h-6 w-6 text-brand-gold" />
              </div>
              <button
                onClick={() => setActiveTab('ai')}
                className="inline-flex w-full items-center justify-between rounded-lg bg-brand-ivory px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-white"
              >
                Consultar IA sobre este expediente
                <MessageSquare className="h-4 w-4" />
              </button>
            </section>
          </div>
        )}

        {activeTab === 'documents' && (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-serif text-brand-ivory">Documentos vinculados</h4>
                <p className="mt-1 text-xs text-brand-accent/45">Archivos que forman el contexto documental del expediente.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-ivory px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-white">
                <Upload className="h-4 w-4" />
                Subir
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            {documentUploadStatus ? (
              <p className="rounded-lg border border-brand-gold/15 bg-brand-gold/[0.04] px-4 py-3 text-xs text-brand-accent/70">
                {documentUploadStatus}
              </p>
            ) : null}

            <div className="space-y-3">
              {documents.length > 0 ? (
                documents.map((doc, idx) => (
                  <DocumentRow key={doc.id || `${doc.name}-${idx}`} doc={doc} onDeleteDoc={handleDeleteDoc} />
                ))
              ) : (
                <EmptyState icon={Upload} text="Todavia no hay documentos vinculados." />
              )}
            </div>
          </section>
        )}

        {activeTab === 'dates' && (
          <section className="space-y-5">
            <form onSubmit={handleAddDeadline} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
              <h4 className="mb-4 text-lg font-serif text-brand-ivory">Agregar vencimiento</h4>
              <div className="grid gap-3">
                <input
                  type="text"
                  value={deadlineForm.title}
                  onChange={(e) => setDeadlineForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej. Presentar escrito de subsanacion"
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/20 focus:border-brand-gold/40"
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <input
                    type="date"
                    value={deadlineForm.date}
                    onChange={(e) => setDeadlineForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors focus:border-brand-gold/40"
                  />
                  <select
                    value={deadlineForm.priority}
                    onChange={(e) => setDeadlineForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors focus:border-brand-gold/40"
                  >
                    <option className="bg-brand-dark">Alta</option>
                    <option className="bg-brand-dark">Media</option>
                    <option className="bg-brand-dark">Baja</option>
                  </select>
                </div>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-ivory px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-white">
                  <Plus className="h-4 w-4" />
                  Guardar fecha
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {importantDates.length > 0 ? (
                importantDates.map((item, idx) => (
                  <DeadlineRow key={item.id || `${item.title}-${idx}`} item={item} />
                ))
              ) : (
                <EmptyState icon={Calendar} text="No hay vencimientos registrados." />
              )}
            </div>
          </section>
        )}

        {activeTab === 'official' && (
          <section className="space-y-5">
            <div>
              <h4 className="text-lg font-serif text-brand-ivory">Registros oficiales vinculados</h4>
              <p className="mt-1 text-xs text-brand-accent/45">Normas y fuentes oficiales relacionadas con este expediente desde el Radar Normativo.</p>
            </div>

            <div className="space-y-3">
              {officialReferences.length > 0 ? (
                officialReferences.map((reference, idx) => (
                  <OfficialReferenceRow key={reference.id || `${reference.title}-${idx}`} reference={reference} />
                ))
              ) : (
                <EmptyState icon={Gavel} text="No hay normas vinculadas a este expediente." />
              )}
            </div>
          </section>
        )}

        {activeTab === 'notes' && (
          <section className="space-y-5">
            <form onSubmit={handleAddNote} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
              <h4 className="mb-4 text-lg font-serif text-brand-ivory">Agregar nota interna</h4>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Registra acuerdos, observaciones, llamadas o decisiones del caso..."
                className="h-28 w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/20 focus:border-brand-gold/40"
              />
              <button type="submit" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-ivory px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-white">
                <Plus className="h-4 w-4" />
                Guardar nota
              </button>
            </form>

            <div className="space-y-3">
              {notes.length > 0 ? (
                notes.map((note, idx) => (
                  <NoteRow key={note.id || `${note.date}-${idx}`} note={note} />
                ))
              ) : (
                <EmptyState icon={MessageSquare} text="Aun no hay notas internas." />
              )}
            </div>
          </section>
        )}

        {activeTab === 'ai' && (
          <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <div className="border-b border-white/[0.06] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-serif text-brand-ivory">IA del expediente</h4>
                  <p className="mt-1 text-xs text-brand-accent/45">
                    {isGeminiConfigured
                      ? 'Conectada a Gemini y preparada para usar resumen, documentos, fechas, notas y normas vinculadas.'
                      : 'Responde con IA local. Agrega VITE_GEMINI_API_KEY para activar Gemini.'}
                  </p>
                </div>
                <div className="rounded-lg bg-brand-gold/10 p-3 text-brand-gold">
                  <Bot className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
              {aiMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[86%] rounded-lg border px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'border-brand-gold/20 bg-brand-gold/10 text-brand-ivory'
                      : 'border-white/[0.06] bg-brand-black/30 text-brand-ivory/75'
                  }`}>
                    {message.content.split('\n').map((line, lineIndex) => (
                      <p key={lineIndex} className="mb-2 last:mb-0 whitespace-pre-wrap">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-white/[0.06] bg-brand-black/30 px-4 py-3 text-sm leading-6 text-brand-accent/60">
                    Analizando expediente con IA...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  'Resumen ejecutivo',
                  'Documentos faltantes',
                  'Proximos pasos',
                    'Normas vinculadas',
                    'Riesgos del caso',
                    'Impacto normativo',
                  ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isAiThinking}
                    onClick={() => submitAiQuestion(prompt)}
                    className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-accent/60 transition-colors hover:border-brand-gold/25 hover:text-brand-ivory"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAskAi} className="flex gap-3">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Pregunta sobre este expediente..."
                  className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/20 focus:border-brand-gold/40"
                />
                <button
                  type="submit"
                  disabled={isAiThinking}
                  className="rounded-lg bg-brand-ivory px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-black transition-colors hover:bg-white"
                >
                  {isAiThinking ? '...' : 'Enviar'}
                </button>
              </form>
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-white/[0.06] bg-white/[0.01] p-5">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <p className="text-xs font-light text-brand-accent/70">
            Cambios guardados localmente. Listo para migrar a base de datos cuando conectemos Supabase.
          </p>
        </div>
      </div>
    </div>
  );
};

const SummaryMetric = ({ label, value }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
    <p className="text-2xl font-serif text-brand-ivory">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/45">{label}</p>
  </div>
);

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/45">
      <Icon className="h-4 w-4 text-brand-gold" />
      {label}
    </div>
    <p className="text-sm text-brand-ivory/80">{value}</p>
  </div>
);

const DocumentRow = ({ doc, onDeleteDoc }) => (
  <div className="group rounded-lg border border-white/[0.06] bg-white/[0.015] p-4 transition-colors hover:bg-white/[0.03]">
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-brand-ivory/80">{doc.name}</p>
          <p className="mt-1 text-xs text-brand-accent/35">{doc.size || 'Archivo vinculado'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/35">{doc.date}</span>
        {onDeleteDoc && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDoc(doc.id);
            }}
            className="rounded p-1 text-brand-accent/20 transition-colors hover:bg-red-500/10 hover:text-red-400 group-hover:text-brand-accent/40"
            title="Eliminar documento"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
    {doc.excerpt && (
      <p className="mt-3 border-t border-white/[0.04] pt-3 text-xs font-light leading-5 text-brand-accent/55">
        {doc.excerpt}
      </p>
    )}
  </div>
);

const DeadlineRow = ({ item }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-brand-ivory/85">{item.title}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-brand-gold">
          <Calendar className="h-3.5 w-3.5" />
          {item.date}
        </p>
      </div>
      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
        item.priority === 'Alta'
          ? 'border-red-400/20 bg-red-500/10 text-red-300'
          : item.priority === 'Media'
            ? 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold'
            : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
      }`}>
        {item.priority}
      </span>
    </div>
  </div>
);

const NoteRow = ({ note }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
    <div className="mb-3 flex items-center justify-between gap-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold">{note.author}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/35">{note.date}</span>
    </div>
    <p className="text-sm font-light leading-6 text-brand-ivory/72">{note.text}</p>
  </div>
);

const OfficialReferenceRow = ({ reference }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold">
        {reference.source}
      </span>
      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/60">
        {reference.category}
      </span>
    </div>
    <h5 className="text-base font-serif leading-snug text-brand-ivory">{reference.title}</h5>
    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/35">
      {reference.entity} - {reference.date} - {reference.type}
    </p>
    {reference.impact && (
      <div className="mt-4 rounded-lg border border-brand-gold/15 bg-brand-gold/[0.04] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold">Impacto sugerido</p>
        <p className="mt-2 text-sm font-light leading-6 text-brand-ivory/72">{reference.impact}</p>
      </div>
    )}
    {reference.url && (
      <a
        href={reference.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold transition-colors hover:text-brand-ivory"
      >
        Ver fuente oficial
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    )}
  </div>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center">
    <Icon className="mx-auto mb-3 h-8 w-8 text-brand-accent/15" />
    <p className="text-sm text-brand-accent/35">{text}</p>
  </div>
);

const buildCaseResponse = (question, caseData, documents, notes, importantDates, officialReferences = []) => {
  const normalizedQuestion = question.toLowerCase();
  const documentList = documents.length
    ? documents.map((doc, index) => `${index + 1}. ${doc.name}${doc.date ? ` (${doc.date})` : ''}${doc.excerpt ? ` - ${doc.excerpt}` : ''}`).join('\n')
    : 'No hay documentos vinculados todavia.';
  const dateList = importantDates.length
    ? importantDates.map((item, index) => `${index + 1}. ${item.title} - ${item.date} [${item.priority}]`).join('\n')
    : 'No hay vencimientos registrados.';
  const referenceList = officialReferences.length
    ? officialReferences.map((item, index) => `${index + 1}. ${item.title} - ${item.source}/${item.entity} [${item.category}]`).join('\n')
    : 'No hay normas o registros oficiales vinculados.';
  const impactList = officialReferences.length
    ? officialReferences.map((item, index) => `${index + 1}. ${item.impact || 'Revisar impacto especifico.'}`).join('\n')
    : 'No hay impactos normativos vinculados todavia.';
  const latestNote = notes[0]?.text || 'No hay notas internas registradas.';

  if (normalizedQuestion.includes('resumen') || normalizedQuestion.includes('ejecutivo')) {
    return [
      `Resumen ejecutivo de ${caseData.id}`,
      `Cliente: ${caseData.clientName}`,
      `Materia: ${caseData.type}`,
      `Estado: ${caseData.status}`,
      `Resumen registrado: ${caseData.summary || 'Sin resumen registrado.'}`,
      `Documentos vinculados: ${documents.length}`,
      `Fechas importantes: ${importantDates.length}`,
      `Normas vinculadas: ${officialReferences.length}`,
      `Nota interna mas reciente: ${latestNote}`,
      officialReferences.length ? `Principal alerta normativa: ${officialReferences[0].impact || officialReferences[0].title}` : 'No hay alertas normativas vinculadas al expediente.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('norma') || normalizedQuestion.includes('registro') || normalizedQuestion.includes('oficial')) {
    return [
      `Normas vinculadas a ${caseData.id}`,
      referenceList,
      '',
      'Lectura operativa',
      impactList,
      '',
      officialReferences.length
        ? 'Recomendacion: validar vigencia, revisar texto oficial completo y decidir si cambia la teoria del caso, documentos requeridos o proximo escrito.'
        : 'Recomendacion: desde Registros Oficiales vincula normas relevantes para que el expediente tenga contexto normativo propio.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('impacto') || normalizedQuestion.includes('afecta') || normalizedQuestion.includes('afectar')) {
    return [
      'Impacto normativo preliminar',
      officialReferences.length
        ? impactList
        : 'No hay normas vinculadas, asi que no puedo cruzar impacto normativo especifico con este expediente.',
      '',
      `Materia del expediente: ${caseData.type}`,
      `Estado actual: ${caseData.status}`,
      '',
      officialReferences.length
        ? 'Accion sugerida: convertir cada impacto en una tarea concreta: revisar plazo, ajustar argumento, pedir documento, preparar informe o advertir al cliente.'
        : 'Accion sugerida: vincular una norma desde Registros Oficiales y volver a consultar este analisis.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('documento') || normalizedQuestion.includes('archivo') || normalizedQuestion.includes('faltan')) {
    return [
      'Revision documental',
      documentList,
      '',
      documents.length
        ? 'Siguiente paso sugerido: clasificar cada documento por tipo, fecha, relevancia probatoria y relacion con el petitorio.'
        : 'Siguiente paso sugerido: subir demanda, anexos, comunicaciones relevantes y cualquier actuacion procesal disponible.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('vencimiento') || normalizedQuestion.includes('fecha') || normalizedQuestion.includes('plazo')) {
    return [
      'Fechas y vencimientos del expediente',
      dateList,
      '',
      importantDates.length
        ? 'Recomendacion: revisar primero los items de prioridad Alta y confirmar responsable interno.'
        : 'Recomendacion: registra audiencia, plazo de contestacion, subsanaciones y fechas de seguimiento.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('riesgo') || normalizedQuestion.includes('contingencia')) {
    return [
      'Riesgos preliminares detectables con la informacion actual',
      `1. Riesgo documental: ${documents.length ? 'hay documentos vinculados, pero falta clasificarlos por valor probatorio.' : 'no hay documentos vinculados al expediente.'}`,
      `2. Riesgo de plazo: ${importantDates.length ? 'existen fechas registradas que deben monitorearse.' : 'no hay vencimientos registrados.'}`,
      `3. Riesgo normativo: ${officialReferences.length ? 'hay normas vinculadas; revisar si modifican argumentos, plazos o documentacion.' : 'no hay normas vinculadas para evaluar cambios regulatorios o jurisprudenciales.'}`,
      `4. Riesgo de estrategia: ${caseData.summary ? 'el resumen existe, pero conviene convertirlo en teoria del caso.' : 'falta un resumen operativo del caso.'}`,
      '',
      'Esto es una revision preliminar; debe validarse con el expediente completo.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('paso') || normalizedQuestion.includes('tarea') || normalizedQuestion.includes('hacer')) {
    return [
      'Proximos pasos sugeridos',
      '1. Revisar y completar el resumen operativo del expediente.',
      documents.length ? '2. Clasificar documentos por demanda, prueba, comunicacion y actuacion.' : '2. Subir los documentos principales del caso.',
      importantDates.length ? '3. Confirmar responsables para los vencimientos registrados.' : '3. Registrar vencimientos, audiencias o fechas de seguimiento.',
      officialReferences.length ? '4. Revisar normas vinculadas y decidir si afectan estrategia, escrito o comunicacion al cliente.' : '4. Vincular normas relevantes desde Registros Oficiales.',
      notes.length ? '5. Convertir notas internas en tareas accionables.' : '5. Agregar una primera nota interna con estado y estrategia.',
      '6. Preparar una consulta juridica especifica para el asistente.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('borrador') || normalizedQuestion.includes('redacta') || normalizedQuestion.includes('escrito')) {
    return [
      'Borrador breve',
      `En el expediente ${caseData.id}, seguido por ${caseData.clientName}, correspondiente a materia ${caseData.type}, se deja constancia de que el caso se encuentra en estado ${caseData.status}.`,
      '',
      `Resumen base: ${caseData.summary || 'Pendiente de completar.'}`,
      officialReferences.length ? `Base normativa vinculada: ${officialReferences.map((item) => item.title).join('; ')}` : 'Base normativa vinculada: pendiente de asociar desde Registros Oficiales.',
      '',
      'Se recomienda complementar este borrador con pretension, fundamentos de hecho, fundamentos de derecho y anexos disponibles.',
    ].join('\n');
  }

  return [
    'Puedo ayudarte con este expediente desde estas rutas:',
    '- Resumen ejecutivo del caso.',
    '- Revision de documentos vinculados.',
    '- Fechas y vencimientos.',
    '- Riesgos preliminares.',
    '- Normas vinculadas e impacto normativo.',
    '- Proximos pasos.',
    '- Borrador breve.',
    '',
    'Prueba preguntando: "Dame los riesgos del caso" o "Prepara proximos pasos".',
  ].join('\n');
};

export default CaseDetailDrawer;
