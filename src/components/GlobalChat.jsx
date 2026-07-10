/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================================
// src/components/GlobalChat.jsx
// =============================================================================
// Chat IA standalone, NO atado a un expediente. Historial persistido en
// Supabase (tabla global_chats) para sincronizar entre dispositivos.
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  Edit3,
  FileText,
  Library,
  Loader2,
  MessageSquare,
  Mic,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  consumePendingAiInput,
  getActiveAssistant,
  clearActiveAssistant,
} from '../services/aiBridge';
import { isGeminiConfigured, askBackend, abortActiveRequest, SYSTEM_PROMPT_LEGAL_PERU, cleanAssistantText } from '../services/geminiService';
import { searchLegalContext } from '../services/ragService';
import {
  loadGlobalChats,
  saveGlobalChat,
  clearGlobalChats,
  deleteGlobalChatMsg,
  deleteGlobalChatMessages,
} from '../services/chatHistoryStore';
import { uploadDocumentToBackend } from '../services/documentBackendService';
import AiMessage from './AiMessage';
import CitationPanel from './CitationPanel';
import { collectCitations } from '../utils/citationParser';
import { friendlyError } from '../utils/errors';

const HISTORY_LIMIT = 4;
const ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt,.md,.rtf,.jpg,.jpeg,.png,.webp';

const QUICK_ACTIONS = [
  {
    id: 'escribir',
    label: 'Escribir o editar',
    icon: Edit3,
    prompt: 'Ayudame a redactar o mejorar el siguiente texto legal: ',
  },
  {
    id: 'buscar',
    label: 'Buscar algo',
    icon: Search,
    prompt: 'Busca jurisprudencia, normativa o doctrina peruana sobre: ',
  },
];

const GlobalChat = ({ onBack }) => {
  const [activeAssistant, setActiveAssistant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [citationPanelOpen, setCitationPanelOpen] = useState(false);
  const allCitations = collectCitations(messages);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null); // { name, text, status }
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastFileRef = useRef(null); // persiste el ultimo archivo adjunto entre mensajes

  // Lee asistente activo + prompt pendiente al montar
  useEffect(() => {
    const assistant = getActiveAssistant();
    if (assistant) setActiveAssistant(assistant);
    const pending = consumePendingAiInput();
    if (pending) {
      setInput(pending);
      setHasInteracted(true);
    }
    return () => abortActiveRequest();
  }, []);

  // Carga historial desde Supabase cuando cambia el asistente activo
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { messages: stored, error: loadError } = await loadGlobalChats(
        activeAssistant?.id || null
      );
      if (cancelled) return;
      if (loadError) {
        console.warn('No se pudo cargar el historial del chat global.', loadError.message);
      }
      if (stored && stored.length) {
        setMessages(stored);
        setHasInteracted(true);
      } else {
        const greeting = activeAssistant
          ? `Hola, soy ${activeAssistant.name}. Preguntame lo que necesites.`
          : null;
        setMessages(greeting ? [{ role: 'ai', content: greeting }] : []);
        setHasInteracted(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeAssistant]);

  // Auto-scroll al final cuando cambian los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event) => {
    event?.preventDefault();
    const question = input.trim();
    if (!question || isThinking) return;

    setHasInteracted(true);
    setInput('');
    setIsThinking(true);
    setError('');

    // Capturamos el archivo adjunto ANTES de usarlo
    const fileContext = attachedFile && attachedFile.status === 'ready'
      ? { fileName: attachedFile.name, fileText: attachedFile.text }
      : null;
    // Guardamos el ultimo archivo para que persista en mensajes siguientes
    if (fileContext) lastFileRef.current = fileContext;
    setAttachedFile(null);

    // Historial de conversación para dar memoria a la IA (últimos 6 mensajes)
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'ai')
      .filter((m) => !m.pending && m.content)
      .map((m) => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }))
      .slice(-6);

    // Agrega el mensaje del usuario + placeholder de la IA al instante
    const pendingId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: fileContext ? `${question}\n\n📎 ${fileContext.fileName}` : question },
      { role: 'ai', content: '', pending: true, pendingId },
    ]);

    // Persistir el mensaje del usuario (fire-and-forget)
    saveGlobalChat(activeAssistant?.id || null, 'user', fileContext ? `${question}\n\n📎 ${fileContext.fileName}` : question).catch((err) => {
      console.warn('No se pudo guardar el mensaje en Supabase.', err?.message);
    });

    try {
      const systemPrompt = activeAssistant?.systemPrompt || SYSTEM_PROMPT_LEGAL_PERU;
      // Busca normativa relevante en El Peruano para enriquecer la respuesta
      const legalContext = await searchLegalContext(question);
      const enrichedPrompt = legalContext ? `${legalContext}\n\nPregunta del usuario:\n${question}` : question;
      const raw = await askBackend({
        prompt: enrichedPrompt,
        temperature: 0.15,
        maxOutputTokens: 3000,
        systemPrompt,
        history,
        fileName: fileContext?.fileName || lastFileRef.current?.fileName || null,
        fileText: fileContext?.fileText || lastFileRef.current?.fileText || null,
      });
      const text = cleanAssistantText(raw);
      // Reemplaza el placeholder con la respuesta real
      setMessages((prev) =>
        prev.map((m) =>
          m.pending && m.pendingId === pendingId
            ? { role: 'ai', content: text }
            : m
        )
      );
      saveGlobalChat(activeAssistant?.id || null, 'ai', text).catch((err) => {
        console.warn('No se pudo guardar la respuesta en Supabase.', err?.message);
      });
    } catch (err) {
      const msg = friendlyError(err);
      setError(msg);
      // Reemplaza el placeholder con el mensaje de error
      setMessages((prev) =>
        prev.map((m) =>
          m.pending && m.pendingId === pendingId
            ? { role: 'ai', content: `Hubo un error: ${msg}` }
            : m
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    // Reseteamos el input para poder seleccionar el mismo archivo dos veces seguidas
    event.target.value = '';
    if (!file) return;
    setAttachedFile({ name: file.name, text: '', status: 'uploading' });
    try {
      const response = await uploadDocumentToBackend(file);
      const text = String(response?.extracted_text || '').trim();
      setAttachedFile({
        name: file.name,
        text,
        status: text ? 'ready' : 'empty',
      });
    } catch (err) {
      setAttachedFile({ name: file.name, text: '', status: 'error', error: err?.message });
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
  };

  const handleClear = async () => {
    if (!window.confirm('Borrar el historial de este chat?')) return;
    const { error: clearError } = await clearGlobalChats(activeAssistant?.id || null);
    if (clearError) {
      console.warn('No se pudo borrar el historial en Supabase.', clearError.message);
    }
    const greeting = activeAssistant
      ? `Hola, soy ${activeAssistant.name}. Preguntame lo que necesites.`
      : null;
    setMessages(greeting ? [{ role: 'ai', content: greeting }] : []);
    setHasInteracted(false);
  };

  const handleEditMessage = async (index, newText) => {
    if (!newText.trim() || isThinking) return;

    const pendingId = crypto.randomUUID();
    const msgsToDelete = messages.slice(index).map((m) => m.id).filter(Boolean);

    // Preservar adjunto si el mensaje original lo tenía
    const originalMsg = messages[index];
    const hasAttachment = originalMsg?.content?.includes('\n\n📎 ');
    const fileName = hasAttachment ? originalMsg.content.split('\n\n📎 ')[1] : null;

    setMessages((prev) => [
      ...prev.slice(0, index),
      { role: 'user', content: hasAttachment ? `${newText}\n\n📎 ${fileName}` : newText },
      { role: 'ai', content: '', pending: true, pendingId },
    ]);
    setIsThinking(true);

    if (msgsToDelete.length) deleteGlobalChatMessages(msgsToDelete).catch(() => {});

    try {
      const systemPrompt = activeAssistant?.systemPrompt || SYSTEM_PROMPT_LEGAL_PERU;
      const history = messages.slice(0, index).slice(-HISTORY_LIMIT);
      const legalContext = await searchLegalContext(newText);
      const enrichedPrompt = legalContext ? `${legalContext}\n\nPregunta del usuario:\n${newText}` : newText;
      const raw = await askBackend({
        prompt: enrichedPrompt,
        temperature: 0.15,
        maxOutputTokens: 3000,
        systemPrompt,
        history,
        fileName: hasAttachment ? fileName : lastFileRef.current?.fileName || null,
        fileText: hasAttachment ? lastFileRef.current?.fileText || null : null,
      });
      const text = cleanAssistantText(raw);
      setMessages((prev) =>
        prev.map((m) =>
          m.pending && m.pendingId === pendingId
            ? { role: 'ai', content: text }
            : m
        )
      );
    } catch (err) {
      const msg = friendlyError(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.pending && m.pendingId === pendingId
            ? { role: 'ai', content: `Hubo un error: ${msg}` }
            : m
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  const handleDeleteMessage = (index) => {
    const msg = messages[index];
    setMessages((prev) => prev.filter((_, i) => i !== index));
    if (msg?.id) deleteGlobalChatMsg(msg.id).catch(() => {});
  };

  const handleDeactivateAssistant = () => {
    clearActiveAssistant();
    setActiveAssistant(null);
  };

  const handleQuickAction = (action) => {
    setInput(action.prompt);
  };

  const showEmptyState = !hasInteracted && messages.length <= 1;

  return (
    <div className="flex h-screen flex-col bg-brand-black text-brand-ivory">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.05] bg-brand-dark px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-serif font-medium text-brand-ivory">
              <MessageSquare className="h-5 w-5 text-brand-gold" />
              Consultar
            </h1>
            <p className="text-[11px] font-light text-brand-accent/70">
              Conversacion libre, no asociada a ningun expediente.
            </p>
          </div>
        </div>
        {activeAssistant ? (
          <div className="flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 py-1.5 pl-3 pr-1.5">
            <Bot className="h-3.5 w-3.5 text-brand-gold" />
            <span className="text-xs font-medium text-brand-gold">
              {activeAssistant.name}
            </span>
            <button
              type="button"
              onClick={handleDeactivateAssistant}
              className="rounded-full p-1 text-brand-gold/70 transition-colors hover:bg-brand-gold/20 hover:text-brand-gold"
              aria-label="Desactivar asistente"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
        {allCitations.length > 0 && (
          <button
            type="button"
            onClick={() => setCitationPanelOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
            title="Ver todas las fuentes citadas en esta conversacion"
          >
            <Library className="h-3.5 w-3.5" />
            Fuentes ({allCitations.length})
          </button>
        )}
      </header>

      {showEmptyState ? (
        <EmptyState
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isThinking={isThinking}
          onQuickAction={handleQuickAction}
          error={error}
          attachedFile={attachedFile}
          onAttachClick={handleAttachClick}
          onRemoveAttachment={handleRemoveAttachment}
          onFileSelected={handleFileSelected}
          fileInputRef={fileInputRef}
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  role={message.role}
                  content={message.content}
                  pending={message.pending}
                  onEdit={(newText) => handleEditMessage(index, newText)}
                  onDelete={() => handleDeleteMessage(index)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <ChatFooter
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onClear={handleClear}
            isThinking={isThinking}
            error={error}
            attachedFile={attachedFile}
            onAttachClick={handleAttachClick}
            onRemoveAttachment={handleRemoveAttachment}
            onFileSelected={handleFileSelected}
            fileInputRef={fileInputRef}
          />
        </>
      )}

      <CitationPanel
        open={citationPanelOpen}
        onClose={() => setCitationPanelOpen(false)}
        citations={allCitations}
      />
    </div>
  );
};

const EmptyState = ({
  input,
  setInput,
  onSend,
  isThinking,
  onQuickAction,
  error,
  attachedFile,
  onAttachClick,
  onRemoveAttachment,
  onFileSelected,
  fileInputRef,
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 pb-10">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <h2 className="font-serif text-4xl font-light tracking-tight text-brand-ivory md:text-5xl">
          {input.trim() ? 'Listo para enviar' : '¿En qué estás trabajando?'}
        </h2>

        <form
          onSubmit={onSend}
          className="rounded-2xl border border-white/[0.08] bg-brand-dark/80 px-4 py-3 shadow-xl backdrop-blur-sm"
        >
          <AttachmentChip
            attachedFile={attachedFile}
            onRemove={onRemoveAttachment}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Pregunta lo que quieras"
            rows={1}
            className="w-full resize-none bg-transparent px-1 py-2 text-base text-brand-ivory outline-none placeholder:text-brand-accent/40"
          />
          <div className="mt-2 flex items-center justify-between">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={onFileSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={onAttachClick}
              className="flex h-9 w-9 items-center justify-center rounded-full text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
              aria-label="Adjuntar archivo"
            >
              <Plus className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
                aria-label="Voz"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-brand-ivory transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Enviar"
              >
                {isThinking ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onQuickAction(action)}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-brand-dark px-4 py-2 text-sm font-light text-brand-ivory transition-colors hover:border-brand-gold/30 hover:bg-white/[0.04]"
              >
                <Icon className="h-4 w-4 text-brand-accent" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ChatFooter = ({
  input,
  setInput,
  onSend,
  onClear,
  isThinking,
  error,
  attachedFile,
  onAttachClick,
  onRemoveAttachment,
  onFileSelected,
  fileInputRef,
}) => (
  <footer className="shrink-0 border-t border-white/[0.05] bg-brand-dark px-5 py-4">
    <div className="mx-auto max-w-3xl">
      {!isGeminiConfigured ? (
        <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          El backend de IA no esta configurado. Revisa Supabase y las env vars en Vercel.
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
      <form
        onSubmit={onSend}
        className="rounded-2xl border border-white/[0.08] bg-brand-dark/80 px-3 py-2"
      >
        <AttachmentChip
          attachedFile={attachedFile}
          onRemove={onRemoveAttachment}
        />
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Pregunta lo que quieras"
          rows={1}
          className="w-full resize-none bg-transparent px-1 py-1.5 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/40"
        />
        <div className="mt-1 flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={onFileSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={onAttachClick}
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
            aria-label="Adjuntar archivo"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
              aria-label="Voz"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClear}
              className="flex h-8 w-8 items-center justify-center rounded-full text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
              aria-label="Borrar historial"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-brand-ivory transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Enviar"
            >
              {isThinking ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  </footer>
);

const AttachmentChip = ({ attachedFile, onRemove }) => {
  if (!attachedFile) return null;

  let label = attachedFile.name;
  let tone = 'border-white/[0.1] bg-white/[0.04] text-brand-ivory';
  let icon = <Paperclip className="h-3.5 w-3.5 text-brand-accent" />;
  if (attachedFile.status === 'uploading') {
    label = `Subiendo ${attachedFile.name}...`;
    tone = 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold';
    icon = <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-gold" />;
  } else if (attachedFile.status === 'error') {
    label = `${attachedFile.name} (no se pudo leer)`;
    tone = 'border-red-500/30 bg-red-500/10 text-red-300';
    icon = <FileText className="h-3.5 w-3.5 text-red-300" />;
  } else if (attachedFile.status === 'empty') {
    label = `${attachedFile.name} (sin texto legible)`;
    tone = 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    icon = <FileText className="h-3.5 w-3.5 text-amber-300" />;
  }

  return (
    <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${tone}`}>
      {icon}
      <span className="max-w-[260px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 transition-colors hover:bg-white/10"
        aria-label="Quitar archivo"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

const MessageBubble = ({ role, content, pending, onEdit, onDelete }) => {
  const isUser = role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const editRef = useRef(null);

  useEffect(() => {
    if (isEditing) editRef.current?.focus();
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (!editText.trim() || editText === content) {
      setIsEditing(false);
      setEditText(content);
      return;
    }
    setIsEditing(false);
    onEdit(editText);
  };

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="relative max-w-[85%]">
        {/* Botones de accion en hover */}
        <div className={`absolute ${isUser ? '-left-10' : '-right-10'} top-2 hidden gap-1 group-hover:flex`}>
          {isUser && !pending && (
            <button
              type="button"
              onClick={() => { setEditText(content); setIsEditing(true); }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-dark/80 text-slate-500 hover:bg-brand-dark hover:text-brand-ivory transition-colors"
              title="Editar mensaje"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {!pending && (
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

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'rounded-br-sm bg-brand-gold/15 text-brand-ivory'
              : 'rounded-bl-sm border border-white/[0.05] bg-brand-dark text-brand-ivory'
          }`}
        >
          {!isUser && (
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold/80">
              <Sparkles className="h-3 w-3" />
              LUSTI
            </div>
          )}
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
                    setEditText(content);
                  }
                }}
                className="w-full resize-none bg-transparent text-sm text-brand-ivory outline-none"
                rows={2}
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditText(content); }}
                  className="px-3 py-1 text-[11px] text-slate-400 hover:text-brand-ivory transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 rounded-lg bg-brand-gold/20 px-3 py-1 text-[11px] font-medium text-brand-gold hover:bg-brand-gold/30 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Guardar
                </button>
              </div>
            </div>
          ) : !isUser && pending ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] font-light text-slate-500">Pensando...</span>
            </div>
          ) : !isUser ? (
            <AiMessage content={content} author="ai" />
          ) : (
            <p className="whitespace-pre-wrap font-light">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalChat;
