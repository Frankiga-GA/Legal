// src/components/CaseWorkspace.jsx
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bot,
  Calendar,
  CheckCircle2,
  FileText,
  Gavel,
  MessageSquare,
  Plus,
  Trash2,
  Upload,
  User,
  ExternalLink,
  ChevronRight,
  Globe
} from 'lucide-react';
// src/components/CaseWorkspace.jsx
import toast, { Toaster } from 'react-hot-toast';

import { askGeminiAboutCase, isGeminiConfigured, extractResolutionDetails } from '../services/geminiService';
import { uploadDocumentToBackend } from '../services/documentBackendService';
import { getCases, updateCaseAsync } from '../services/caseStore';

const CaseWorkspace = ({ caseId, onClose }) => {
  const [caseData, setCaseData] = useState(null);
  
  // Left panel tabs (excluding AI since it's always on the right)
  const [activeTab, setActiveTab] = useState('summary');
  const [noteText, setNoteText] = useState('');
  const [documentUploadStatus, setDocumentUploadStatus] = useState('');
  const [deadlineForm, setDeadlineForm] = useState({ title: '', date: '', priority: 'Media' });

  // Right panel AI State
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);

  useEffect(() => {
    const allCases = getCases();
    const data = allCases.find(c => c.id === caseId);
    if (data) {
      setCaseData(data);
      if (aiMessages.length === 0) {
        setAiMessages([
          {
            role: 'ai',
            content: `Hola. Estoy analizando el expediente ${data.id}. Puedo resumir los documentos, redactar escritos, buscar fechas o aclararte el impacto de las normas. ¿Qué necesitas?`,
          },
        ]);
      }
    }
  }, [caseId]);

  if (!caseData) return <div className="p-8 text-brand-accent">Cargando expediente...</div>;

  const documents = Array.isArray(caseData.documents) ? caseData.documents : [];
  const notes = Array.isArray(caseData.notes) ? caseData.notes : [];
  const importantDates = Array.isArray(caseData.importantDates) ? caseData.importantDates : [];
  const officialReferences = Array.isArray(caseData.officialReferences) ? caseData.officialReferences : [];

  const handleUpdate = async (changes) => {
    const allCases = getCases();
    const result = await updateCaseAsync(allCases, caseData.id, changes);
    setCaseData(result.updatedCase);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Mostrar spinner y desactivar el input mientras se sube
    setIsUploading(true);
    setDocumentUploadStatus(`Subiendo ${file.name}…`);

    // Notificación de toast (requiere react-hot-toast en el proyecto)
    // Si la dependencia no está instalada, se mostrará un fallback simple.
    // eslint-disable-next-line no-undef
    const showToast = typeof toast !== 'undefined' ? toast : null;

    try {
      const backendResponse = await uploadDocumentToBackend(file);
      const extractedText = String(backendResponse?.extracted_text || '').trim();

      let excerpt = extractedText ? `Texto extraído (${extractedText.length} caracteres).` : 'Archivo subido. No se pudo extraer texto.';
      let aiChanges = {};

      if (extractedText) {
        setDocumentUploadStatus('IA analizando resolución…');
        try {
          const aiDetails = await extractResolutionDetails(extractedText);
          // Incorporar fechas encontradas por IA
          const newImportantDates = [...importantDates];
          if (Array.isArray(aiDetails.newDeadlines)) {
            aiDetails.newDeadlines.forEach((dl, idx) => {
              newImportantDates.unshift({
                id: `ai-dl-${Date.now()}-${idx}`,
                title: dl.title,
                date: dl.date,
                priority: dl.priority || 'Alta',
                status: 'Pendiente',
              });
            });
          }
          aiChanges = {
            latestProgress: aiDetails.latestProgress,
            hearingLink: aiDetails.hearingLink || caseData.hearingLink || '',
            urgency: aiDetails.urgency || caseData.urgency || 'Alta',
            importantDates: newImportantDates,
            isAiUpdated: true,
          };
          setDocumentUploadStatus('Documento analizado y expediente actualizado.');
          // Mensaje de toast success
          if (showToast) showToast.success('Documento procesado correctamente');
          // Notificar al chat de IA
          setAiMessages(prev => [
            ...prev,
            { role: 'ai', content: `Acabo de leer el nuevo documento "${file.name}".\n\nResumen: ${aiDetails.latestProgress}\n\n¿Deseas que redacte un escrito o respuesta basada en esto?` }
          ]);
        } catch (aiError) {
          setDocumentUploadStatus('Documento cargado sin análisis IA profundo.');
          if (showToast) showToast.error('Error al analizar con IA');
        }
      } else {
        setDocumentUploadStatus('Documento sin texto extraíble.');
        if (showToast) showToast.warn('No se pudo extraer texto del documento');
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

      handleUpdate({
        documents: [...documents, newDoc],
        ...aiChanges,
      });
    } catch (error) {
      console.error(error);
      setDocumentUploadStatus(`Error al subir: ${error?.message || 'desconocido'}`);
      if (showToast) showToast.error(`Error al subir: ${error?.message || 'desconocido'}`);
    } finally {
      setIsUploading(false);
      // Limpiar el input del archivo
      e.target.value = '';
    }
  };

  const handleDeleteDoc = (docId) => {
    if (!window.confirm("¿Eliminar este documento?")) return;
    handleUpdate({ documents: documents.filter((doc) => doc.id !== docId) });
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
    handleUpdate({ notes: [newNote, ...notes] });
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
    handleUpdate({ importantDates: [newDeadline, ...importantDates] });
    setDeadlineForm({ title: '', date: '', priority: 'Media' });
  };

  const submitAiQuestion = async (question) => {
    if (!question.trim() || isAiThinking) return;

    setAiMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsAiThinking(true);

    try {
      const response = await askGeminiAboutCase({
        question,
        caseData,
        documents,
        notes,
        importantDates,
        officialReferences,
      });
      setAiMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'ai', content: 'Hubo un error de conexión con la IA. Inténtalo de nuevo.' }]);
    }
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
    { id: 'notes', label: 'Notas', icon: MessageSquare },
    { id: 'official', label: 'Normas', icon: Gavel },
  ];

  return (
    <div className="flex h-full flex-col md:flex-row overflow-hidden bg-brand-black text-brand-ivory">
      
      {/* LEFT COLUMN: Case Details */}
      <div className="flex w-full flex-col border-r border-white/[0.08] bg-brand-dark md:w-3/5 lg:w-[60%]">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] px-6 py-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="flex items-center justify-center rounded-lg border border-white/[0.08] p-2 text-brand-accent hover:bg-brand-black hover:text-brand-ivory transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-ivory">
                  {caseData.status}
                </span>
                <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent">
                  {caseData.type}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-brand-ivory">{caseData.id}</h2>
              <p className="text-xs font-medium text-brand-accent">{caseData.clientName}</p>
            </div>
          </div>
          
          <div className="hidden sm:flex gap-3 text-xs text-brand-accent font-medium">
            <div className="flex flex-col items-center"><span className="text-lg font-bold text-brand-ivory">{documents.length}</span> Docs</div>
            <div className="flex flex-col items-center"><span className="text-lg font-bold text-brand-ivory">{importantDates.length}</span> Plazos</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-white/[0.08] bg-brand-black px-6 shrink-0 flex gap-1 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
                  isActive
                    ? 'border-zinc-900 text-brand-ivory bg-brand-dark'
                    : 'border-transparent text-brand-accent hover:text-brand-ivory hover:bg-white/[0.05]/50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-brand-dark">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoCard icon={User} label="Titular / cliente" value={caseData.clientName} />
                <InfoCard icon={Calendar} label="Última actualización" value={caseData.lastUpdate} />
              </section>

              <section className="rounded-xl border border-white/[0.08] bg-brand-black p-5">
                <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                  <FileText className="h-4 w-4 text-brand-ivory" />
                  Avance Actual (Resumen IA)
                </h4>
                <p className="text-sm leading-relaxed text-brand-ivory text-justify">
                  {caseData.latestProgress || caseData.summary || 'Aún no se ha registrado un resumen para este expediente.'}
                </p>
                {caseData.hearingLink && (
                  <div className="mt-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-brand-ivory" />
                    <a href={caseData.hearingLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-ivory hover:underline">
                      Unirse a la Audiencia Virtual
                    </a>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'documents' && (
            <section className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-brand-ivory">Documentos del caso</h4>
                  <p className="mt-1 text-xs text-brand-accent">Sube aquí las notificaciones o escritos.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-dark px-4 py-2.5 text-xs font-bold text-brand-ivory transition-colors hover:bg-white/[0.04] shadow-sm">
                  <Upload className="h-4 w-4" />
                  Subir Documento
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              {documentUploadStatus && (
                <p className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-xs font-medium text-brand-ivory animate-pulse">
                  {documentUploadStatus}
                </p>
              )}

              <div className="space-y-3">
                {documents.length > 0 ? (
                  documents.map((doc, idx) => (
                    <div key={doc.id || idx} className="group flex items-center justify-between rounded-lg border border-white/[0.08] bg-brand-dark p-4 shadow-sm hover:border-white/[0.12] hover:shadow">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="rounded-lg bg-white/[0.04] p-2 text-brand-ivory shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-brand-ivory">{doc.name}</p>
                          <p className="mt-0.5 text-xs text-brand-accent">{doc.date} • {doc.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="rounded p-2 text-brand-accent hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-brand-accent"><Upload className="mx-auto mb-3 h-8 w-8" /><p className="text-sm">Sin documentos.</p></div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'dates' && (
            <section className="space-y-5">
              <form onSubmit={handleAddDeadline} className="rounded-xl border border-white/[0.08] bg-brand-black p-5">
                <h4 className="mb-4 text-sm font-bold text-brand-ivory">Agregar plazo o vencimiento</h4>
                <div className="grid gap-3">
                  <input
                    type="text"
                    value={deadlineForm.title}
                    onChange={(e) => setDeadlineForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej. Presentar escrito de subsanación"
                    className="w-full rounded-lg border border-white/[0.08] bg-brand-dark px-4 py-2.5 text-sm outline-none focus:border-brand-gold/50 focus:ring-2 focus:ring-zinc-100"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="date"
                      value={deadlineForm.date}
                      onChange={(e) => setDeadlineForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded-lg border border-white/[0.08] bg-brand-dark px-4 py-2.5 text-sm outline-none focus:border-brand-gold/50 focus:ring-2 focus:ring-zinc-100"
                    />
                    <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-xs font-bold text-brand-ivory transition-colors hover:opacity-90 shadow-sm">
                      <Plus className="h-4 w-4" />
                      Guardar plazo
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-3">
                {importantDates.length > 0 ? (
                  importantDates.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-brand-dark p-4 shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-brand-ivory">{item.title}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand-ivory">
                          <Calendar className="h-3.5 w-3.5" />
                          {item.date}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-white/[0.05] text-brand-ivory'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-brand-accent"><Calendar className="mx-auto mb-3 h-8 w-8" /><p className="text-sm">Sin vencimientos.</p></div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'notes' && (
            <section className="space-y-5">
              <form onSubmit={handleAddNote} className="rounded-xl border border-white/[0.08] bg-brand-black p-5">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Anota acuerdos, llamadas o recordatorios del caso..."
                  className="h-24 w-full resize-none rounded-lg border border-white/[0.08] bg-brand-dark px-4 py-3 text-sm outline-none focus:border-brand-gold/50 focus:ring-2 focus:ring-zinc-100"
                />
                <button type="submit" className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-xs font-bold text-brand-ivory transition-colors hover:opacity-90 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Agregar Nota
                </button>
              </form>
              <div className="space-y-3">
                {notes.map((note, idx) => (
                  <div key={idx} className="rounded-lg border border-white/[0.08] bg-brand-dark p-4 shadow-sm">
                    <p className="text-sm text-brand-ivory">{note.text}</p>
                    <p className="mt-2 text-[10px] font-bold text-brand-accent">{note.date} • {note.author}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {activeTab === 'official' && (
            <div className="py-12 text-center text-brand-accent"><Gavel className="mx-auto mb-3 h-8 w-8" /><p className="text-sm">Sin normas vinculadas.</p></div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: AI Chat Contextual */}
      <div className="flex h-full w-full flex-col bg-brand-black md:w-2/5 lg:w-[40%]">
        <div className="flex items-center gap-3 border-b border-white/[0.08] bg-brand-dark px-6 py-4 shadow-sm shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-brand-ivory">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-ivory">Asistente Legal del Caso</h3>
            <p className="text-[10px] uppercase tracking-wider text-brand-accent font-semibold">Contexto: {caseData.id}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          {aiMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' ? 'bg-brand-gold text-brand-black rounded-br-none' : 'bg-white/[0.03] border border-white/[0.08] text-brand-ivory rounded-bl-none'
              }`}>
                {msg.content.split('\n').map((line, lIdx) => (
                  <p key={lIdx} className="min-h-[1em]">{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isAiThinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-brand-dark border border-white/[0.08] px-4 py-3 text-sm text-brand-accent rounded-bl-none flex gap-1 items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.08] bg-brand-dark p-4 shrink-0">
          <div className="mb-3 flex flex-wrap gap-2">
            {['Redactar escrito', 'Resumir caso', '¿Qué plazos hay?'].map(prompt => (
              <button 
                key={prompt}
                onClick={() => submitAiQuestion(prompt)}
                disabled={isAiThinking}
                className="rounded-full border border-white/[0.08] bg-brand-black px-3 py-1.5 text-[10px] font-bold text-brand-accent hover:bg-white/[0.05] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
          <form onSubmit={handleAskAi} className="flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Pide un borrador, pregunta dudas..."
              className="flex-1 rounded-xl border border-white/[0.08] bg-brand-black px-4 py-3 text-sm outline-none focus:border-brand-gold/50 focus:bg-brand-dark transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={isAiThinking || !aiInput.trim()}
              className="flex items-center justify-center rounded-xl bg-brand-dark px-4 text-brand-ivory hover:bg-white/[0.04] disabled:opacity-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-white/[0.08] bg-brand-dark p-4 shadow-sm">
    <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-accent">
      <Icon className="h-4 w-4 text-brand-accent" />
      {label}
    </div>
    <p className="text-sm font-bold text-brand-ivory">{value}</p>
  </div>
);

export default CaseWorkspace;
