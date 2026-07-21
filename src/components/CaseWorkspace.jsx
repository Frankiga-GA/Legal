// src/components/CaseWorkspace.jsx
import { useState, useEffect, useRef } from 'react';
import {
  ArrowDownToLine,
  ArrowLeft,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Gavel,
  Globe,
  HardDrive,
  Hash,
  Library,
  Loader2,
  MessageSquare,
  PenLine,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
  User,
  Users,
  Video,
  X,
} from 'lucide-react';
// src/components/CaseWorkspace.jsx
import toast, { Toaster } from 'react-hot-toast';

import { askGeminiAboutCase, isGeminiConfigured, extractResolutionDetails, abortActiveRequest } from '../services/geminiService';
import { searchLegalContext } from '../services/ragService';
import { uploadDocumentToBackend, processDocumentFromUrl } from '../services/documentBackendService';
import { uploadFileToStorage } from '../services/supabaseStorageService';
import { loadCases, updateCaseAsync, deleteCaseAsync } from '../services/caseStore';
import { isSupabaseConfigured, supabase } from '../utils/supabase';
import { loadCaseChats, saveCaseChat, clearCaseChats, deleteCaseChatMsg, deleteCaseChatMessages } from '../services/chatHistoryStore';
import AiMessage from './AiMessage';
import CitationPanel from './CitationPanel';
import DocumentWriter from './DocumentWriter';
import DocumentPreviewModal from './DocumentPreviewModal';
import DriveFilePicker from './DriveFilePicker';
import { collectCitations } from '../utils/citationParser';
import { syncDeadlinesToCalendar } from '../services/googleCalendarService';
import { getStoredDriveToken, isGoogleDriveConfigured, getOrCreateCaseFolder, uploadFileToDrive } from '../services/googleDriveService';
import { loadAllPreferencesAsync } from '../services/userPreferencesStore';
import { listAssistants } from '../services/personalizationStore';
import ShareCaseModal from './ShareCaseModal';
import CreateCaseModal from './CreateCaseModal';

const CaseWorkspace = ({ caseId, onClose, session }) => {
  const [caseData, setCaseData] = useState(null);
  const [firmProfile, setFirmProfile] = useState(null);
  const [assistants, setAssistants] = useState([]);
  const [activeAssistant, setActiveAssistant] = useState(null);

  useEffect(() => {
    const fetchProfileAndAssistants = async () => {
      const prefs = await loadAllPreferencesAsync(session?.user?.id || null);
      setFirmProfile(prefs.firm);
      
      try {
        const loadedAssistants = await listAssistants();
        setAssistants(loadedAssistants || []);
      } catch (err) {
        console.warn('Error loading assistants:', err);
      }
    };
    fetchProfileAndAssistants();
  }, [session?.user?.id]);
  
  // Left panel tabs (excluding AI since it's always on the right)
  const [activeTab, setActiveTab] = useState('summary');
  const [noteText, setNoteText] = useState('');
  const [documentUploadStatus, setDocumentUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState({ title: '', date: '', priority: 'Media' });

  // Right panel AI State
  const [aiInput, setAiInput] = useState('');
  const [aiError, setAiError] = useState(null);
  const [mobileAiOpen, setMobileAiOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [citationPanelOpen, setCitationPanelOpen] = useState(false);
  const [showAssistantMenu, setShowAssistantMenu] = useState(false);
  const assistantMenuRef = useRef(null);
  const caseCitations = collectCitations(aiMessages);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [aiMessages, mobileAiOpen]);

  // Audiencia (link de la audiencia virtual)
  const [editingHearing, setEditingHearing] = useState(false);
  const [hearingInput, setHearingInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [showDocumentWriter, setShowDocumentWriter] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let channel = null;

    const fetchCase = () => {
      loadCases().then(({ cases: allCases }) => {
        if (cancelled) return;
        const data = allCases.find(c => c.id === caseId);
        if (data) {
          setCaseData(data);
          setAiMessages(prev => prev.length === 0 ? [
            {
              role: 'ai',
              content: `¡Hola! Soy tu asistente para el caso ${data.id}. Ya tengo el expediente a la vista. Contame en qué te ayudo: resúmenes, plazos críticos, redacción de escritos, análisis de riesgos o lo que se te ocurra.`,
            },
          ] : prev);
        }
      }).catch(console.error);
    };

    fetchCase();

    loadCaseChats(caseId).then(({ messages, error }) => {
      if (cancelled) return;
      if (error) {
        console.warn('No se pudo cargar el historial de chat.', error.message);
        return;
      }
      if (messages && messages.length > 0) {
        setAiMessages(messages);
      }
    }).catch(console.error);

    if (isSupabaseConfigured) {
      channel = supabase
        .channel(`cases-sync-${caseId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cases', filter: `id=eq.${caseId}` },
          (payload) => {
            console.log('⚡ Sincronización en tiempo real detectada:', payload);
            fetchCase(); // Refrescar los datos para evitar colisiones
          }
        )
        .subscribe();
    }

    return () => { 
      cancelled = true; 
      abortActiveRequest(); 
      if (channel) supabase.removeChannel(channel);
    };
  }, [caseId]);

  if (!caseData) return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-2xl animate-pulse space-y-5">
        <div className="h-8 w-64 rounded bg-white/[0.06]" />
        <div className="h-4 w-48 rounded bg-white/[0.06]" />
        <div className="mt-8 h-3 w-full rounded bg-white/[0.06]" />
        <div className="h-3 w-11/12 rounded bg-white/[0.06]" />
        <div className="h-3 w-4/5 rounded bg-white/[0.06]" />
        <div className="mt-6 h-32 w-full rounded-lg bg-white/[0.04]" />
      </div>
    </div>
  );

  const documents = Array.isArray(caseData.documents) ? caseData.documents : [];
  const notes = Array.isArray(caseData.notes) ? caseData.notes : [];
  const importantDates = Array.isArray(caseData.importantDates) ? caseData.importantDates : [];
  const officialReferences = Array.isArray(caseData.officialReferences) ? caseData.officialReferences : [];

  const handleUpdate = async (changes) => {
    try {
      const { cases: allCases } = await loadCases();
      const result = await updateCaseAsync(allCases, caseData.id, changes);
      setCaseData(result.updatedCase);
      syncCalendar(allCases).catch(e => console.warn('Error sincronizando calendario en background:', e));
    } catch (err) {
      console.error('Error al actualizar el expediente:', err);
    }
  };

  const syncCalendar = async (allCases) => {
    if (!getStoredDriveToken()?.access_token) return;
    const allDeadlines = allCases.flatMap(c =>
      (c.importantDates || []).map(d => ({ ...d, caseId: c.id, caseName: c.name || '' }))
    );
    if (!allDeadlines.length) return;
    try {
      await syncDeadlinesToCalendar(allDeadlines);
    } catch (e) {
      if (e.message?.includes('Sesion de Google expirada') || e.message?.includes('calendar')) {
        toast.error('Calendar no sincronizado. Re-conecta Google en Configuracion.');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Mostrar spinner y desactivar el input mientras se sube
    setIsUploading(true);
    setDocumentUploadStatus(`Subiendo ${file.name}…`);

    // Notificación de toast (requiere react-hot-toast en el proyecto)
    // Si la dependencia no está instalada, se mostrará un fallback simple.
     
    const showToast = typeof toast !== 'undefined' ? toast : null;

    try {
      // 1. Subir a Supabase Storage primero
      const { publicUrl, error: storageError } = await uploadFileToStorage(file, caseId);
      if (storageError) {
        console.warn('No se pudo guardar el archivo original en Storage:', storageError);
        if (showToast) showToast('Nota: No se pudo guardar el archivo original en la nube.', { icon: '⚠️' });
      }

      // 2. Backup automático a Google Drive (SOLO si el usuario es el dueño del expediente)
      if (isGoogleDriveConfigured && getStoredDriveToken() && caseData?.isOwner) {
        try {
          const folderId = await getOrCreateCaseFolder(caseData.clientName);
          if (folderId) {
            await uploadFileToDrive(file, folderId);
            if (showToast) showToast.success('Copia de seguridad guardada en Drive.');
          }
        } catch (err) {
          console.warn('No se pudo respaldar en Drive:', err);
        }
      }

      // 3. Extraer texto con el backend
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
        if (showToast) showToast('No se pudo extraer texto del documento', { icon: '⚠️' });
      }

      const newDoc = {
        id: crypto.randomUUID(),
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        date: new Date().toISOString().split('T')[0],
        type: file.type,
        excerpt,
        content: extractedText,
        fileUrl: publicUrl,
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

  const handleImportFromDrive = (driveFiles) => {
    const today = new Date().toISOString().split('T')[0];
    const newDocs = driveFiles.map((f) => ({
      id: `drive-${Date.now()}-${f.id}`,
      name: f.name,
      date: today,
      size: 'Drive',
      source: 'drive',
      driveFileId: f.id,
      mimeType: f.mimeType,
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    }));
    handleUpdate({ documents: [...documents, ...newDocs] });
    toast.success(`${newDocs.length} archivo(s) importado(s) desde Drive`);
  };


  const handleDeleteDoc = (docId) => {
    setDeleteConfirm({ type: 'doc', id: docId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'doc') {
      handleUpdate({ documents: documents.filter((doc) => doc.id !== deleteConfirm.id) });
    } else if (deleteConfirm.type === 'date') {
      handleUpdate({ importantDates: importantDates.filter((d) => d.id !== deleteConfirm.id) });
    } else if (deleteConfirm.type === 'note') {
      handleUpdate({ notes: notes.filter((n) => n.id !== deleteConfirm.id) });
    } else if (deleteConfirm.type === 'case') {
      try {
        const { cases: allCases } = await loadCases();
        await deleteCaseAsync(allCases, caseData.id);
        onClose();
      } catch (error) {
        console.error('Error al eliminar expediente:', error);
        toast.error('Error al eliminar el expediente');
      }
    }
    setDeleteConfirm(null);
  };

  const handleDeleteDate = (dateId) => {
    setDeleteConfirm({ type: 'date', id: dateId });
  };

  // Marca o desmarca un plazo como completado (cambia el status)
  const handleToggleDateStatus = (item) => {
    const newStatus = item.status === 'Completado' ? 'Pendiente' : 'Completado';
    handleUpdate({
      importantDates: importantDates.map((d) => d.id === item.id ? { ...d, status: newStatus } : d),
    });
  };

  const handleDeleteNote = (noteId) => {
    setDeleteConfirm({ type: 'note', id: noteId });
  };

  const handleDeleteCase = () => {
    setDeleteConfirm({ type: 'case' });
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const newNote = {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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

    const pendingId = crypto.randomUUID();
    setAiMessages(prev => [...prev,
      { role: 'user', content: question },
      { role: 'ai', content: '', pending: true, pendingId },
    ]);
    saveCaseChat(caseData.id, 'user', question).catch((err) =>
      console.warn('No se pudo guardar el mensaje en Supabase.', err?.message)
    );
    setIsAiThinking(true);

    try {
      // Pasamos los ultimos mensajes para contexto de conversacion
      const history = aiMessages.slice(-4);
      const legalContext = await searchLegalContext(question);
      const enrichedQuestion = legalContext ? `${legalContext}\n\nPregunta del usuario:\n${question}` : question;
      const response = await askGeminiAboutCase({
        question: enrichedQuestion,
        caseData,
        documents,
        notes,
        importantDates,
        officialReferences,
        systemPrompt: activeAssistant ? activeAssistant.systemPrompt : null,
        history,
      });
      setAiMessages(prev => prev.map((m) =>
        m.pending && m.pendingId === pendingId
          ? { role: 'ai', content: response }
          : m
      ));
      saveCaseChat(caseData.id, 'ai', response).catch((err) =>
        console.warn('No se pudo guardar el mensaje en Supabase.', err?.message)
      );
    } catch (error) {
      const errorMsg = 'Hubo un error de conexión con la IA. Inténtalo de nuevo.';
      setAiMessages(prev => prev.map((m) =>
        m.pending && m.pendingId === pendingId
          ? { role: 'ai', content: errorMsg }
          : m
      ));
    }
    setIsAiThinking(false);
  };

  const handleClearChat = async () => {
    if (!window.confirm('¿Borrar todo el historial de conversación de este expediente?')) return;
    setAiMessages([
      {
        role: 'ai',
        content: `¡Hola! Soy tu asistente para el caso ${caseData.id}. Ya tengo el expediente a la vista. Contame en qué te ayudo: resúmenes, plazos críticos, redacción de escritos, análisis de riesgos o lo que se te ocurra.`,
      },
    ]);
    const { error } = await clearCaseChats(caseData.id);
    if (error) {
      console.warn('No se pudo borrar el historial en Supabase.', error.message);
      toast.error('No se pudo borrar el historial en Supabase.');
    } else {
      toast.success('Historial borrado.');
    }
  };

  const handleEditAiMessage = async (index, newText) => {
    if (!newText.trim() || isAiThinking) return;

    const pendingId = crypto.randomUUID();
    const msgsToDelete = aiMessages.slice(index).map((m) => m.id).filter(Boolean);

    setAiMessages((prev) => [
      ...prev.slice(0, index),
      { role: 'user', content: newText },
      { role: 'ai', content: '', pending: true, pendingId },
    ]);
    setIsAiThinking(true);

    if (msgsToDelete.length) deleteCaseChatMessages(msgsToDelete).catch(() => {});

    try {
      const history = aiMessages.slice(0, index).slice(-4);
      const legalContext = await searchLegalContext(newText);
      const enrichedQuestion = legalContext ? `${legalContext}\n\nPregunta del usuario:\n${newText}` : newText;
      const response = await askGeminiAboutCase({
        question: enrichedQuestion,
        caseData,
        documents,
        notes,
        importantDates,
        officialReferences,
        systemPrompt: activeAssistant ? activeAssistant.systemPrompt : null,
        history,
      });
      setAiMessages((prev) =>
        prev.map((m) =>
          m.pending && m.pendingId === pendingId
            ? { role: 'ai', content: response }
            : m
        )
      );
      saveCaseChat(caseData.id, 'ai', response).catch((err) =>
        console.warn('No se pudo guardar el mensaje en Supabase.', err?.message)
      );
    } catch (error) {
      const errorMsg = 'Hubo un error de conexión con la IA. Inténtalo de nuevo.';
      setAiMessages((prev) =>
        prev.map((m) =>
          m.pending && m.pendingId === pendingId
            ? { role: 'ai', content: errorMsg }
            : m
        )
      );
    }
    setIsAiThinking(false);
  };

  const handleDeleteAiMessage = (index) => {
    const msg = aiMessages[index];
    setAiMessages((prev) => prev.filter((_, i) => i !== index));
    if (msg?.id) deleteCaseChatMsg(msg.id).catch(() => {});
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
    { id: 'hearing', label: 'Audiencia', icon: Video },
  ];

  const handleSaveHearing = (e) => {
    e?.preventDefault();
    handleUpdate({ hearingLink: hearingInput.trim() });
    setEditingHearing(false);
  };

  const handleStartEditHearing = () => {
    setHearingInput(caseData.hearingLink || '');
    setEditingHearing(true);
  };

  return (
    <>
    <div className="relative flex h-full flex-col md:flex-row overflow-hidden bg-brand-black text-brand-ivory">
      
      {/* LEFT COLUMN: Case Details */}
      <div className="flex w-full min-h-0 flex-col border-r border-white/[0.08] bg-brand-dark md:w-3/5 lg:w-[60%]">
        
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
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-3 text-xs text-brand-accent font-medium">
              <div className="flex flex-col items-center"><span className="text-lg font-bold text-brand-ivory">{documents.length}</span> Docs</div>
              <div className="flex flex-col items-center"><span className="text-lg font-bold text-brand-ivory">{importantDates.length}</span> Plazos</div>
            </div>
            {caseData.isOwner && (
              <button
                onClick={() => setShowShareModal(true)}
                className="hidden md:flex items-center gap-2 rounded-lg border border-brand-gold/20 bg-brand-gold/[0.08] px-4 py-2 text-xs font-bold text-brand-gold hover:bg-brand-gold/[0.15] transition-colors"
                title="Compartir Expediente"
              >
                <Users className="h-4 w-4" />
                Compartir
              </button>
            )}


            <button
              onClick={() => setShowDocumentWriter(true)}
              className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-bold text-brand-gold hover:border-brand-gold/40 hover:bg-brand-gold/10 transition-colors"
              title="Redactar escrito"
            >
              <PenLine className="h-4 w-4 inline mr-1" />Redactar
            </button>
            {caseData.isOwner && (
              <button
                onClick={handleDeleteCase}
                className="rounded-lg border border-white/[0.08] p-2 text-brand-accent hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                title="Eliminar expediente completo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
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
        <div className="flex-1 overflow-y-auto min-h-0 p-6 custom-scrollbar bg-brand-dark">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoCard icon={User} label="Titular / cliente" value={caseData.clientName} />
                <InfoCard icon={Calendar} label="Última actualización" value={caseData.lastUpdate} />
                {caseData.judge && <InfoCard icon={Gavel} label="Juez" value={caseData.judge} />}
                {caseData.specialist && <InfoCard icon={User} label="Especialista" value={caseData.specialist} />}
                {caseData.cuaderno && <InfoCard icon={FileText} label="Cuaderno" value={caseData.cuaderno} />}
                {caseData.escritoNro && <InfoCard icon={Hash} label="Escrito N°" value={caseData.escritoNro} />}
              </section>

              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-brand-accent hover:border-brand-gold/30 hover:bg-white/[0.05] hover:text-brand-ivory transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar datos del expediente
                </button>
              </div>

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
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-dark px-4 py-2.5 text-xs font-bold text-brand-ivory transition-colors hover:bg-white/[0.04] shadow-sm ${
                    isUploading ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? 'Subiendo...' : 'Subir Documento'}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowDrivePicker(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-bold text-brand-ivory transition-colors hover:bg-white/[0.06]"
                >
                  <HardDrive className="h-4 w-4" />
                  Desde Drive
                </button>
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
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setPreviewDoc(doc)}
                              className="truncate text-sm font-bold text-brand-ivory hover:text-brand-gold transition-colors text-left"
                            >
                              {doc.name}
                            </button>
                            {doc.source === 'drive' && (
                              <a href={doc.webViewLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-brand-gold hover:text-brand-ivory" title="Abrir en Google Drive">
                                <HardDrive className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-brand-accent">{doc.date} • {doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-2 text-brand-accent hover:bg-brand-gold/10 hover:text-brand-gold transition-colors"
                            title="Descargar Original"
                          >
                            <ArrowDownToLine className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="rounded p-2 text-brand-accent hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                    <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-xs font-bold text-brand-black transition-colors hover:bg-white shadow-sm">
                      <Plus className="h-4 w-4" />
                      Guardar plazo
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-3">
                {importantDates.length > 0 ? (
                  [...importantDates]
                    .sort((a, b) => {
                      // Pendientes primero, completados al final
                      const aDone = a.status === 'Completado' ? 1 : 0;
                      const bDone = b.status === 'Completado' ? 1 : 0;
                      if (aDone !== bDone) return aDone - bDone;
                      return 0;
                    })
                    .map((item, idx) => {
                      const isDone = item.status === 'Completado';
                      return (
                        <div
                          key={item.id || idx}
                          className={`group flex items-center justify-between rounded-lg border p-4 shadow-sm transition-all ${
                            isDone
                              ? 'border-emerald-500/20 bg-emerald-500/[0.04] opacity-60 hover:opacity-80'
                              : 'border-white/[0.08] bg-brand-dark hover:border-white/[0.12]'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                              onClick={() => handleToggleDateStatus(item)}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                isDone
                                  ? 'border-emerald-500 bg-emerald-500 text-brand-black'
                                  : 'border-brand-accent/40 hover:border-emerald-500 hover:bg-emerald-500/10'
                              }`}
                              title={isDone ? 'Reabrir plazo' : 'Marcar como completado'}
                            >
                              {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold ${isDone ? 'text-brand-accent line-through' : 'text-brand-ivory'}`}>
                                {item.title}
                              </p>
                              <p className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${isDone ? 'text-brand-accent line-through' : 'text-brand-ivory'}`}>
                                <Calendar className="h-3.5 w-3.5" />
                                {item.date}
                                {isDone && <span className="ml-1.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 no-underline">✓ COMPLETADO</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isDone
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : item.priority === 'Alta'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-white/[0.05] text-brand-ivory'
                            }`}>
                              {isDone ? 'Hecho' : item.priority}
                            </span>
                            <button
                              onClick={() => handleDeleteDate(item.id)}
                              className="rounded p-2 text-brand-accent opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                              title="Eliminar plazo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
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
                <button type="submit" className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-xs font-bold text-brand-black transition-colors hover:bg-white shadow-sm">
                  <Plus className="h-4 w-4" />
                  Agregar Nota
                </button>
              </form>
              <div className="space-y-3">
                {notes.map((note, idx) => (
                  <div key={note.id || idx} className="group relative rounded-lg border border-white/[0.08] bg-brand-dark p-4 pr-12 shadow-sm hover:border-white/[0.12]">
                    <p className="text-sm text-brand-ivory">{note.text}</p>
                    <p className="mt-2 text-[10px] font-bold text-brand-accent">{note.date} • {note.author}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute right-3 top-3 rounded p-1.5 text-brand-accent opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                      title="Eliminar nota"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {activeTab === 'official' && (
            <div className="py-12 text-center text-brand-accent"><Gavel className="mx-auto mb-3 h-8 w-8" /><p className="text-sm">Sin normas vinculadas.</p></div>
          )}

          {activeTab === 'hearing' && (
            <section className="space-y-5">
              <div>
                <h4 className="text-lg font-bold text-brand-ivory">Audiencia virtual</h4>
                <p className="mt-1 text-xs text-brand-accent">El link se completa automáticamente al subir resoluciones. También podés pegarlo a mano.</p>
              </div>

              {caseData.hearingLink && !editingHearing ? (
                <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/[0.04] p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gold/15">
                      <Video className="h-6 w-6 text-brand-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-ivory">Listo para conectarte</p>
                      <p className="mt-1 break-all text-xs text-brand-accent">{caseData.hearingLink}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={caseData.hearingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-5 py-2.5 text-xs font-bold text-brand-black transition-colors hover:bg-white shadow-sm"
                    >
                      <Globe className="h-4 w-4" />
                      Ingresar a la audiencia
                    </a>
                    <button
                      onClick={handleStartEditHearing}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-brand-dark px-4 py-2.5 text-xs font-bold text-brand-accent transition-colors hover:bg-white/[0.04]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Cambiar link
                    </button>
                    <button
                      onClick={() => handleUpdate({ hearingLink: '' })}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-brand-dark px-4 py-2.5 text-xs font-bold text-brand-accent transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveHearing} className="rounded-xl border border-white/[0.08] bg-brand-black p-5 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/70">Link de la audiencia</p>
                  <input
                    type="url"
                    value={hearingInput}
                    onChange={(e) => setHearingInput(e.target.value)}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz o https://zoom.us/j/123456789"
                    className="w-full rounded-lg border border-white/[0.08] bg-brand-dark px-4 py-3 text-sm outline-none focus:border-brand-gold/50 focus:ring-2 focus:ring-zinc-100"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={!hearingInput.trim()} className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-5 py-2.5 text-xs font-bold text-brand-black transition-colors hover:bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                      <Plus className="h-4 w-4" />
                      Guardar link
                    </button>
                    {editingHearing && caseData.hearingLink && (
                      <button
                        type="button"
                        onClick={() => setEditingHearing(false)}
                        className="rounded-lg border border-white/[0.08] bg-brand-dark px-4 py-2.5 text-xs font-bold text-brand-accent hover:bg-white/[0.04]"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="rounded-lg border border-dashed border-white/[0.06] bg-white/[0.01] p-4 text-[11px] text-brand-accent/70">
                <p className="font-semibold text-brand-accent">💡 Tip</p>
                <p className="mt-1 leading-relaxed">Acepta links de Google Meet, Zoom, Microsoft Teams, Whereby o cualquier sala virtual. Si subís una resolución que mencione la audiencia, la IA detecta el link automáticamente.</p>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: AI Chat Contextual */}
      <div className={`absolute inset-0 z-50 h-full w-full flex-col bg-brand-black md:static md:w-2/5 lg:w-[40%] md:flex ${mobileAiOpen ? 'flex' : 'hidden'}`}>
        <div className="flex items-center gap-3 border-b border-white/[0.08] bg-brand-dark px-6 py-4 shadow-sm shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-brand-ivory">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-brand-ivory">Consultar Expediente</h3>
            <p className="text-[10px] uppercase tracking-wider text-brand-accent font-semibold">Contexto: {caseData.id}</p>
          </div>
          <button onClick={() => setMobileAiOpen(false)} className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-brand-accent hover:bg-white/[0.04]">
            <X className="h-4 w-4" />
          </button>
          {caseCitations.length > 0 && (
            <button
              type="button"
              onClick={() => setCitationPanelOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
              title="Ver todas las fuentes citadas en esta conversacion"
            >
              <Library className="h-3.5 w-3.5" />
              Fuentes ({caseCitations.length})
            </button>
          )}
          <button
            onClick={handleClearChat}
            title="Borrar historial de conversación"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-brand-accent/60 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          {aiMessages.map((msg, idx) => (
            <CaseMessageBubble
              key={msg.id || idx}
              msg={msg}
              onEdit={(newText) => handleEditAiMessage(idx, newText)}
              onDelete={() => handleDeleteAiMessage(idx)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/[0.08] bg-brand-dark p-4 shrink-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
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

            {assistants.length > 0 && (
              <div className="relative" ref={assistantMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowAssistantMenu(!showAssistantMenu)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-all duration-200 ${
                    activeAssistant
                      ? 'border-brand-gold/40 bg-brand-gold/10 text-brand-gold shadow-sm shadow-brand-gold/5'
                      : 'border-white/[0.08] bg-brand-black text-brand-accent hover:border-white/[0.15] hover:bg-white/[0.04]'
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span className="max-w-[100px] truncate">{activeAssistant ? activeAssistant.name : 'General'}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAssistantMenu ? 'rotate-180' : ''}`} />
                </button>

                {showAssistantMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAssistantMenu(false)} />
                    <div className="absolute bottom-full right-0 z-50 mb-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-brand-dark shadow-2xl shadow-black/40 backdrop-blur-xl">
                      <div className="px-3 py-2 border-b border-white/[0.06]">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-brand-accent/60">Cambiar asistente</p>
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar py-1">
                        <button
                          type="button"
                          onClick={() => { setActiveAssistant(null); setShowAssistantMenu(false); }}
                          className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                            !activeAssistant ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-ivory hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            !activeAssistant ? 'bg-brand-gold/20' : 'bg-white/[0.05]'
                          }`}>
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">Asistente General</p>
                            <p className="text-[9px] text-brand-accent/60">IA por defecto</p>
                          </div>
                          {!activeAssistant && <Check className="h-3.5 w-3.5 text-brand-gold shrink-0" />}
                        </button>
                        {assistants.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => { setActiveAssistant(a); setShowAssistantMenu(false); }}
                            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                              activeAssistant?.id === a.id ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-ivory hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              activeAssistant?.id === a.id ? 'bg-brand-gold/20' : 'bg-white/[0.05]'
                            }`}>
                              <Bot className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold truncate">{a.name}</p>
                              {a.specialty && <p className="text-[9px] text-brand-accent/60">{a.specialty}</p>}
                            </div>
                            {activeAssistant?.id === a.id && <Check className="h-3.5 w-3.5 text-brand-gold shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <form onSubmit={handleAskAi} className="flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleAskAi(e);
                }
              }}
              placeholder="Pide un borrador, pregunta dudas...  (Ctrl+Enter)"
              className="flex-1 rounded-xl border border-white/[0.08] bg-brand-black px-4 py-3 text-sm outline-none focus:border-brand-gold/50 focus:bg-brand-dark transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={isAiThinking || !aiInput.trim()}
              className="flex items-center justify-center rounded-xl bg-brand-dark px-4 text-brand-ivory hover:bg-white/[0.04] disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      <CitationPanel
        open={citationPanelOpen}
        onClose={() => setCitationPanelOpen(false)}
        citations={caseCitations}
      />

      {showShareModal && (
        <ShareCaseModal caseId={caseData.id} onClose={() => setShowShareModal(false)} />
      )}

      {showDrivePicker && (
        <DriveFilePicker
          onSelect={handleImportFromDrive}
          onClose={() => setShowDrivePicker(false)}
        />
      )}

      {/* Confirmacion de eliminacion */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl border border-white/[0.08] bg-brand-dark p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-serif font-medium text-brand-ivory">Confirmar</h3>
            <p className="mt-2 text-sm text-brand-accent/70">
              {deleteConfirm.type === 'case'
                ? `¿Eliminar el expediente ${caseData.id} de ${caseData.clientName}? Esta accion borrara permanentemente todos sus documentos, fechas, notas y resumenes.`
                : deleteConfirm.type === 'doc' ? '¿Eliminar este documento?' : deleteConfirm.type === 'date' ? '¿Eliminar este plazo?' : '¿Eliminar esta nota?'}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-bold text-brand-accent transition-colors hover:bg-white/[0.06]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {!mobileAiOpen && (
        <button 
          onClick={() => setMobileAiOpen(true)} 
          className="absolute bottom-6 right-6 z-40 md:hidden flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-brand-black shadow-2xl shadow-brand-gold/20"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}
    </div>
    {showDocumentWriter && (
      <DocumentWriter
        firmProfile={firmProfile}
        caseData={caseData}
        onClose={() => setShowDocumentWriter(false)}
        onSave={(doc) => {
          const updatedDocs = [...documents, doc];
          handleUpdate({ documents: updatedDocs });
          toast.success(`"${doc.name}" guardado en el expediente`);
          setShowDocumentWriter(false);
        }}
      />
    )}
    <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    {showEditModal && (
      <CreateCaseModal
        initialData={caseData}
        onClose={() => setShowEditModal(false)}
        onSave={async (updatedData) => {
          // Permite actualizar el ID si el usuario lo editó
          const { documents, notes, importantDates, status, lastUpdate, ...changes } = updatedData;
          await handleUpdate(changes);
          toast.success('Datos del expediente actualizados');
          if (changes.id && changes.id !== caseId) {
             toast.success('ID de expediente modificado. Reabriendo biblioteca para refrescar datos.');
             onClose();
          }
        }}
      />
    )}
  </>
  );
};

const CaseMessageBubble = ({ msg, onEdit, onDelete }) => {
  const isUser = msg.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const editRef = useRef(null);

  useEffect(() => {
    if (isEditing) editRef.current?.focus();
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (!editText.trim() || editText === msg.content) {
      setIsEditing(false);
      setEditText(msg.content);
      return;
    }
    setIsEditing(false);
    onEdit(editText);
  };

  return (
    <div className="group flex relative">
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className="relative max-w-[85%]">
          <div className={`absolute ${isUser ? '-left-10' : '-right-10'} top-2 hidden gap-1 group-hover:flex`}>
            {isUser && !msg.pending && (
              <button
                type="button"
                onClick={() => { setEditText(msg.content); setIsEditing(true); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-dark/80 text-slate-500 hover:bg-brand-dark hover:text-brand-ivory transition-colors"
                title="Editar mensaje"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {!msg.pending && (
              <button
                type="button"
                onClick={onDelete}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-dark/80 text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Borrar mensaje"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser ? 'bg-brand-gold text-brand-black rounded-br-none' : 'bg-white/[0.03] border border-white/[0.08] text-brand-ivory rounded-bl-none'
          }`}>
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  ref={editRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditText(msg.content);
                    }
                  }}
                  className="w-full resize-none bg-transparent text-sm text-brand-black outline-none"
                  rows={2}
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setEditText(msg.content); }}
                    className="px-3 py-1 text-[11px] text-slate-500 hover:text-brand-black transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 rounded-lg bg-brand-black/10 px-3 py-1 text-[11px] font-medium text-brand-black hover:bg-brand-black/20 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    Guardar
                  </button>
                </div>
              </div>
            ) : msg.role === 'ai' && msg.pending ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] font-light text-slate-500">Pensando...</span>
              </div>
            ) : msg.role === 'ai' ? (
              <AiMessage content={msg.content} author="ai" />
            ) : msg.content.split('\n').map((line, lIdx) => (
                <p key={lIdx} className="min-h-[1em]">{line}</p>
              ))}
          </div>
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
