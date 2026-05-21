import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, Send, Sparkles, User } from 'lucide-react';
import { askGeminiSpecializedAssistant, isGeminiConfigured } from '../services/geminiService';

const BotChat = ({ bot, onBack }) => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Soy ${bot.name}. ${bot.description || 'Listo para apoyar el analisis legal.'}\n\nTengo ${bot.docs} documentos de referencia disponibles. Que necesitas revisar hoy?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildLocalAssistantResponse = (userMessage) => {
    const lowerInput = userMessage.toLowerCase();

    if (bot.name.toLowerCase().includes('laboral')) {
      if (lowerInput.includes('liquidacion') || lowerInput.includes('liquidación') || lowerInput.includes('despido')) {
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

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const responseContent = isGeminiConfigured
        ? await askGeminiSpecializedAssistant({ bot, question: userMessage })
        : buildLocalAssistantResponse(userMessage);

      setMessages(prev => [...prev, { role: 'ai', content: responseContent }]);
    } catch (error) {
      console.warn('Gemini no pudo responder en asistente especializado. Usando fallback local.', error);
      setMessages(prev => [
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

  return (
    <div className="relative flex h-full flex-col bg-brand-black">
      <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-brand-gold/5 blur-[150px]"></div>

      <div className="glass-panel relative z-10 flex items-center justify-between border-b border-white/[0.05] p-8">
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
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                {isGeminiConfigured ? 'Gemini activo' : 'IA local'} &bull; Contexto privado
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar relative z-10 flex-1 space-y-12 overflow-y-auto p-10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mx-auto flex max-w-4xl gap-8 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-2xl ${
              msg.role === 'ai' ? 'bg-brand-ivory text-brand-black' : 'border border-white/[0.05] bg-white/[0.03] text-brand-accent/40'
            }`}>
              {msg.role === 'ai' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div className={`flex-1 space-y-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block text-[15px] font-light leading-relaxed ${
                msg.role === 'ai' ? 'text-brand-ivory/80' : 'text-brand-accent/80'
              }`}>
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
              <span className="h-1 w-1 rounded-full bg-brand-ivory animate-bounce"></span>
              <span className="h-1 w-1 rounded-full bg-brand-ivory animate-bounce delay-75"></span>
              <span className="h-1 w-1 rounded-full bg-brand-ivory animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative z-10 border-t border-white/[0.05] bg-white/[0.01] p-10">
        <div className="group relative mx-auto max-w-3xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Escribe una consulta para ${bot.name}...`}
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
          Asistencia legal generativa &bull; Verifica la informacion antes de presentarla
        </p>
      </div>
    </div>
  );
};

export default BotChat;
