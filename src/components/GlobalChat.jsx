/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================================
// src/components/GlobalChat.jsx
// =============================================================================
// Chat IA standalone, NO atado a un expediente.
//
// Caso de uso: el usuario activo un asistente o cargo un prompt guardado
// desde "Asistentes y Plantillas" y quiere conversar con la IA sin abrir
// un caso. El asistente activo se mantiene durante la sesion y se aplica
// como system prompt a cada llamada.
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, MessageSquare, Send, Sparkles, Trash2, X } from 'lucide-react';
import {
  consumePendingAiInput,
  getActiveAssistant,
  clearActiveAssistant,
} from '../services/aiBridge';
import { isGeminiConfigured, askBackend } from '../services/geminiService';

const HISTORY_KEY = (userId) => `lusti-global-chat-${userId || 'anonymous'}`;
const ASSISTANT_HISTORY_KEY = (userId, assistantId) =>
  `lusti-global-chat-${userId || 'anonymous'}-${assistantId || 'default'}`;

const getUserId = async () => {
  try {
    const { getCurrentSession } = await import('../services/authService');
    const session = await getCurrentSession();
    return session?.user?.id || 'anonymous';
  } catch {
    return 'anonymous';
  }
};

const readHistory = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeHistory = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage puede estar lleno; lo ignoramos para no romper el chat */
  }
};

const GlobalChat = ({ onBack }) => {
  const [activeAssistant, setActiveAssistant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('anonymous');
  const messagesEndRef = useRef(null);

  // Cargar asistente activo y mensaje pendiente al montar
  useEffect(() => {
    const assistant = getActiveAssistant();
    if (assistant) setActiveAssistant(assistant);
    const pending = consumePendingAiInput();
    if (pending) setInput(pending);
  }, []);

  // Cargar historial cuando sabemos el usuario y el asistente
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid = await getUserId();
      if (cancelled) return;
      setUserId(uid);
      const key = activeAssistant
        ? ASSISTANT_HISTORY_KEY(uid, activeAssistant.id)
        : HISTORY_KEY(uid);
      const stored = readHistory(key);
      if (stored && Array.isArray(stored) && stored.length) {
        setMessages(stored);
      } else {
        const greeting = activeAssistant
          ? `Hola, soy ${activeAssistant.name}. Preguntame lo que necesites.`
          : 'Hola, soy LUSTI en modo libre (sin asistente). Puedo ayudarte con cualquier consulta legal general. ¿En qué te ayudo?';
        setMessages([{ role: 'ai', content: greeting }]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeAssistant]);

  // Persistir historial cuando cambia
  useEffect(() => {
    if (!messages.length) return;
    const key = activeAssistant
      ? ASSISTANT_HISTORY_KEY(userId, activeAssistant.id)
      : HISTORY_KEY(userId);
    writeHistory(key, messages);
  }, [messages, userId, activeAssistant]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event) => {
    event?.preventDefault();
    const question = input.trim();
    if (!question || isThinking) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsThinking(true);
    setError('');

    try {
      const systemPrompt = activeAssistant?.systemPrompt || null;
      const promptText = systemPrompt
        ? `${question}\n\n(Contexto: el usuario esta hablando con el asistente "${activeAssistant.name}").`
        : question;
      const text = await askBackend({
        prompt: promptText,
        temperature: 0.4,
        maxOutputTokens: 1500,
        systemPrompt,
      });
      setMessages((prev) => [...prev, { role: 'ai', content: text }]);
    } catch (err) {
      const msg = err?.message || 'Error desconocido al llamar a la IA.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: `Hubo un error: ${msg}` },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClear = () => {
    if (!window.confirm('Borrar el historial de este chat?')) return;
    const greeting = activeAssistant
      ? `Hola, soy ${activeAssistant.name}. Preguntame lo que necesites.`
      : 'Hola, soy LUSTI en modo libre. ¿En qué te ayudo?';
    setMessages([{ role: 'ai', content: greeting }]);
  };

  const handleDeactivateAssistant = () => {
    clearActiveAssistant();
    setActiveAssistant(null);
  };

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

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message, index) => (
            <MessageBubble key={index} role={message.role} content={message.content} />
          ))}
          {isThinking ? <TypingBubble /> : null}
          <div ref={messagesEndRef} />
        </div>
      </div>

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
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribi tu consulta legal..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-brand-black px-4 py-3 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/40 focus:border-brand-gold/40"
            />
            <button
              type="button"
              onClick={handleClear}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.05] text-brand-accent transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
              aria-label="Borrar historial"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gold text-brand-black transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};

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
