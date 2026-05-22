import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, User, X } from 'lucide-react';
import { getCases, loadCases } from '../services/caseStore';
import { askGeminiVaultAssistant, isGeminiConfigured } from '../services/geminiService';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cases, setCases] = useState(() => getCases());
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Soy LUSTI. Puedo responder sobre expedientes registrados, estados, materias, documentos, vencimientos y normas vinculadas. Que quieres revisar?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    loadCases().then((result) => {
      if (isMounted) setCases(result.cases);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const buildLocalVaultResponse = (question) => {
    const lowerInput = question.toLowerCase();
    const activeCases = cases.filter((caseItem) => caseItem.status === 'Activo');
    const pendingCases = cases.filter((caseItem) => caseItem.status === 'Pendiente');
    const closedCases = cases.filter((caseItem) => caseItem.status === 'Cerrado');
    const foundCase = cases.find((caseItem) => (
      lowerInput.includes(caseItem.clientName.toLowerCase()) ||
      lowerInput.includes(caseItem.dni) ||
      lowerInput.includes(caseItem.id.toLowerCase())
    ));

    if (
      lowerInput.includes('cuantos') ||
      lowerInput.includes('cuántos') ||
      lowerInput.includes('cantidad') ||
      lowerInput.includes('registrados')
    ) {
      return [
        `Hay ${cases.length} expedientes registrados.`,
        '',
        `- Activos: ${activeCases.length}`,
        `- Pendientes: ${pendingCases.length}`,
        `- Cerrados: ${closedCases.length}`,
      ].join('\n');
    }

    if (foundCase) {
      return [
        `Encontre el expediente ${foundCase.id}.`,
        '',
        `Cliente: ${foundCase.clientName}`,
        `Materia: ${foundCase.type}`,
        `Estado: ${foundCase.status}`,
        `Ultima actualizacion: ${foundCase.lastUpdate}`,
        `Resumen: ${foundCase.summary || 'Sin resumen registrado.'}`,
      ].join('\n');
    }

    if (lowerInput.includes('hola') || lowerInput.includes('ayuda')) {
      return 'Hola. Puedo contar expedientes, buscar por cliente/DNI/ID, listar estados o ayudarte a ubicar casos por materia. Prueba: "cuantos casos estan registrados" o "busca EXP-2026-001".';
    }

    return 'No encontre un expediente con esos datos. Puedes buscar por nombre, DNI, ID o preguntarme por conteos generales de la boveda.';
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = isGeminiConfigured
        ? await askGeminiVaultAssistant({ question: userMessage, cases })
        : buildLocalVaultResponse(userMessage);

      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      console.warn('Gemini no pudo responder en chat flotante. Usando fallback local.', error);
      setMessages(prev => [...prev, { role: 'ai', content: `${buildLocalVaultResponse(userMessage)}\n\nNota: Gemini no respondio en este intento, asi que use datos locales de la boveda.` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-6 flex w-[380px] animate-in flex-col overflow-hidden rounded-3xl border border-white/[0.05] bg-brand-dark shadow-2xl backdrop-blur-xl duration-500 fade-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.02] p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-brand-gold" />
              <div>
                <span className="font-serif font-medium tracking-tight text-brand-ivory">LUSTI Assistant</span>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-brand-gold">
                  {isGeminiConfigured ? 'Gemini activo' : 'IA local'} - {cases.length} expedientes
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-brand-accent/40 transition-colors hover:text-brand-ivory">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="custom-scrollbar h-[400px] space-y-8 overflow-y-auto p-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                  msg.role === 'ai' ? 'bg-brand-ivory text-brand-black' : 'bg-white/[0.05] text-brand-accent/60'
                }`}>
                  {msg.role === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={`max-w-[85%] text-sm font-light leading-relaxed ${
                  msg.role === 'ai' ? 'text-brand-ivory/80' : 'text-brand-accent'
                }`}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-3 whitespace-pre-wrap last:mb-0">{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-ivory text-brand-black">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 opacity-40">
                  <span className="h-1 w-1 rounded-full bg-brand-ivory animate-bounce"></span>
                  <span className="h-1 w-1 rounded-full bg-brand-ivory animate-bounce delay-75"></span>
                  <span className="h-1 w-1 rounded-full bg-brand-ivory animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/[0.05] p-6">
            <div className="group relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enviar consulta..."
                className="w-full rounded-2xl border border-white/[0.05] bg-white/[0.02] py-4 pl-6 pr-14 text-sm font-light text-brand-ivory transition-all placeholder:text-brand-accent/20 focus:border-brand-gold/40 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-accent transition-colors hover:text-brand-gold disabled:opacity-10"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex h-16 w-16 transform items-center justify-center rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? 'rotate-90 bg-brand-ivory text-brand-black' : 'border border-white/[0.1] bg-brand-dark text-brand-ivory'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-gold shadow-[0_0_8px_rgba(197,160,89,0.6)] animate-pulse"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;
