// src/components/BotChat.jsx
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Sparkles } from 'lucide-react';

const BotChat = ({ bot, onBack }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: `Soy ${bot.name}. ${bot.description ? bot.description : 'Operativo y listo para el análisis.'} \n\nHe sido indexado con ${bot.docs} documentos legales especializados. ¿En qué puedo asistir tu investigación hoy?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let responseContent = "";
      const lowerInput = userMessage.toLowerCase();

      if (bot.name.toLowerCase().includes('laboral')) {
        if (lowerInput.includes('liquidación') || lowerInput.includes('despido')) {
          responseContent = "Basado en mi entrenamiento indexado en derecho laboral:\n\n1. El despido arbitrario típicamente activa un multiplicador de indemnización basado en los años de servicio.\n2. Los beneficios sociales devengados deben liquidarse dentro del plazo legal de 48 horas.\n3. La jurisprudencia sugiere priorizar la conciliación en casos colectivos.";
        } else {
          responseContent = "Como nodo laboral, puedo asistirte en la redacción de cartas de despido, cálculos de beneficios o análisis de contratos de servicios. Por favor, especifica tus requerimientos.";
        }
      } else if (bot.name.toLowerCase().includes('civil') || bot.name.toLowerCase().includes('contrato')) {
        if (lowerInput.includes('alquiler') || lowerInput.includes('arrendamiento')) {
          responseContent = "Respecto a los contratos de arrendamiento, los estatutos actuales requieren:\n- Cláusulas de penalidad específicas por pagos atrasados.\n- Definiciones claras de las responsabilidades de mantenimiento.\n- Firmas legalizadas para cláusulas de allanamiento futuro.";
        } else {
          responseContent = "Puedo analizar contratos de compraventa, fianzas o arrendamientos comerciales. Tengo los modelos actualizados del Código Civil en mi memoria. ¿Te gustaría generar un borrador?";
        }
      } else {
        responseContent = "Recibido. Procesando tu consulta a través de mis nodos legales especializados. ¿Podrías proporcionar más parámetros del caso?";
      }

      setMessages(prev => [...prev, { role: 'ai', content: responseContent }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-full bg-brand-black relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Header */}
      <div className="glass-panel p-8 flex items-center justify-between border-b border-white/[0.05] relative z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 hover:bg-white/[0.05] rounded-xl transition-colors text-brand-accent/40 hover:text-brand-ivory">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-3 bg-brand-gold rounded-xl shadow-[0_0_20px_rgba(197,160,89,0.2)]">
            <Sparkles className="w-5 h-5 text-brand-black" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-medium text-brand-ivory tracking-tight">{bot.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">Nodo Activo • Encriptado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar relative z-10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-8 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-2xl ${
              msg.role === 'ai' ? 'bg-brand-ivory text-brand-black' : 'bg-white/[0.03] text-brand-accent/40 border border-white/[0.05]'
            }`}>
              {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className={`flex-1 space-y-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
               <div className={`inline-block text-[15px] leading-relaxed font-light ${
                 msg.role === 'ai' ? 'text-brand-ivory/80' : 'text-brand-accent/80'
               }`}>
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-5 last:mb-0 whitespace-pre-wrap">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-8 max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-xl bg-brand-ivory text-brand-black flex items-center justify-center shadow-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 opacity-20">
              <span className="w-1 h-1 bg-brand-ivory rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-brand-ivory rounded-full animate-bounce delay-75"></span>
              <span className="w-1 h-1 bg-brand-ivory rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-10 border-t border-white/[0.05] relative z-10 bg-white/[0.01]">
        <div className="max-w-3xl mx-auto relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Sincronizar consulta con ${bot.name}...`}
            className="w-full pl-8 pr-20 py-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl focus:outline-none focus:border-brand-gold/40 focus:bg-white/[0.04] transition-all text-brand-ivory placeholder:text-brand-accent/10 font-light shadow-2xl"
          />
          <button 
            onClick={handleSend}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-3 text-brand-accent hover:text-brand-gold transition-colors disabled:opacity-10"
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <p className="text-center text-[10px] uppercase tracking-[0.4em] text-brand-accent/20 mt-8 font-bold">
          Protocolo de Respuesta Generativa v4.2 &bull; Harvey System
        </p>
      </div>
    </div>
  );
};

export default BotChat;