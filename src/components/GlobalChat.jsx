/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================================
// src/components/GlobalChat.jsx
// =============================================================================
// Chat IA standalone, NO atado a un expediente. Historial persistido en
// Supabase (tabla global_chats) para sincronizar entre dispositivos.
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Edit3,
  MessageSquare,
  Mic,
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
import { isGeminiConfigured, askBackend } from '../services/geminiService';
import {
  loadGlobalChats,
  saveGlobalChat,
  clearGlobalChats,
} from '../services/chatHistoryStore';

const HISTORY_LIMIT = 10;

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
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef(null);

  // Lee asistente activo + prompt pendiente al montar
  useEffect(() => {
    const assistant = getActiveAssistant();
    if (assistant) setActiveAssistant(assistant);
    const pending = consumePendingAiInput();
    if (pending) {
      setInput(pending);
      setHasInteracted(true);
    }
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
    const userMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);
    setError('');

    // Persistir el mensaje del usuario (fire-and-forget)
    saveGlobalChat(activeAssistant?.id || null, 'user', question).catch((err) => {
      console.warn('No se pudo guardar el mensaje en Supabase.', err?.message);
    });

    try {
      const systemPrompt = activeAssistant?.systemPrompt || null;
      // Tomamos los ultimos N mensajes previos para que la IA recuerde
      const history = messages.slice(-HISTORY_LIMIT);
      const text = await askBackend({
        prompt: question,
        temperature: 0.4,
        maxOutputTokens: 1500,
        systemPrompt,
        history,
      });
      setMessages((prev) => [...prev, { role: 'ai', content: text }]);
      saveGlobalChat(activeAssistant?.id || null, 'ai', text).catch((err) => {
        console.warn('No se pudo guardar la respuesta en Supabase.', err?.message);
      });
    } catch (err) {
      const msg = err?.message || 'Error desconocido al llamar a la IA.';
      setError(msg);
      const errorBubble = { role: 'ai', content: `Hubo un error: ${msg}` };
      setMessages((prev) => [...prev, errorBubble]);
      saveGlobalChat(activeAssistant?.id || null, 'ai', errorBubble.content).catch(() => {});
    } finally {
      setIsThinking(false);
    }
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
              Chat IA
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
      </header>

      {showEmptyState ? (
        <EmptyState
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isThinking={isThinking}
          onQuickAction={handleQuickAction}
          error={error}
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((message, index) => (
                <MessageBubble key={index} role={message.role} content={message.content} />
              ))}
              {isThinking ? <TypingBubble /> : null}
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
          />
        </>
      )}
    </div>
  );
};

const EmptyState = ({ input, setInput, onSend, isThinking, onQuickAction, error }) => {
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
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Pregunta lo que quieras"
            rows={1}
            className="w-full resize-none bg-transparent px-1 py-2 text-base text-brand-ivory outline-none placeholder:text-brand-accent/40"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
              aria-label="Adjuntar"
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

const ChatFooter = ({ input, setInput, onSend, onClear, isThinking, error }) => (
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
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Pregunta lo que quieras"
          rows={1}
          className="w-full resize-none bg-transparent px-1 py-1.5 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/40"
        />
        <div className="mt-1 flex items-center justify-between">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
            aria-label="Adjuntar"
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

const MessageBubble = ({ role, content }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-br-sm bg-brand-gold/15 text-brand-ivory'
            : 'rounded-bl-sm border border-white/[0.05] bg-brand-dark text-brand-ivory'
        }`}
      >
        {!isUser ? (
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold/80">
            <Sparkles className="h-3 w-3" />
            LUSTI
          </div>
        ) : null}
        <p className="whitespace-pre-wrap font-light">{content}</p>
      </div>
    </div>
  );
};

const TypingBubble = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/[0.05] bg-brand-dark px-4 py-3">
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

export default GlobalChat;
