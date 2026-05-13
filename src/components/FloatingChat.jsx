import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { mockCases } from '../data/mockData';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Acknowledge. Soy tu Asistente Legal. Proporciona un nombre, ID de expediente o consulta técnica para iniciar el análisis." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let responseContent = "";
      const lowerInput = userMessage.toLowerCase();

      const foundCase = mockCases.find(c => 
        lowerInput.includes(c.clientName.toLowerCase()) || 
        lowerInput.includes(c.dni) || 
        lowerInput.includes(c.id.toLowerCase())
      );

      if (lowerInput.includes('resumen') && foundCase) {
         responseContent = `📄 **Análisis del Expediente ${foundCase.id}:**\n${foundCase.summary}\n\n**Parámetros Operativos:**\n- Estado: ${foundCase.status}\n- Última sincronización: ${foundCase.lastUpdate}`;
      } else if (foundCase) {
        responseContent = `✅ Registro localizado: **${foundCase.id}** [${foundCase.clientName}].\n\n💡 *Comando sugerido: "Generar resumen operativo".*`;
      } else if (lowerInput.includes('hola') || lowerInput.includes('ayuda')) {
        responseContent = "Sistema listo. Puedo recuperar expedientes, analizar materias o gestionar registros oficiales. Proporciona los parámetros de búsqueda.";
      } else {
        responseContent = "Error de localización. El registro no existe en la base de datos actual. Verifica los parámetros (Nombre, DNI o ID).";
      }

      setMessages(prev => [...prev, { role: 'ai', content: responseContent }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end">
      
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="mb-6 w-[380px] bg-brand-dark border border-white/[0.05] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-500 backdrop-blur-xl">
          {/* Header */}
          <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand-gold" />
              <span className="font-serif font-medium text-brand-ivory tracking-tight">Intelligence Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-brand-accent/40 hover:text-brand-ivory transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                  msg.role === 'ai' ? 'bg-brand-ivory text-brand-black' : 'bg-white/[0.05] text-brand-accent/60'
                }`}>
                  {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`max-w-[85%] text-sm font-light leading-relaxed ${
                  msg.role === 'ai' ? 'text-brand-ivory/80' : 'text-brand-accent'
                }`}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-3 last:mb-0 whitespace-pre-wrap">{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4">
                 <div className="w-7 h-7 rounded-lg bg-brand-ivory text-brand-black flex items-center justify-center"><Bot className="w-4 h-4"/></div>
                 <div className="flex gap-1 items-center opacity-40">
                    <span className="w-1 h-1 bg-brand-ivory rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-brand-ivory rounded-full animate-bounce delay-75"></span>
                    <span className="w-1 h-1 bg-brand-ivory rounded-full animate-bounce delay-150"></span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/[0.05]">
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enviar consulta..."
                className="w-full pl-6 pr-14 py-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl focus:outline-none focus:border-brand-gold/40 transition-all text-brand-ivory placeholder:text-brand-accent/20 text-sm font-light"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-accent hover:text-brand-gold transition-colors disabled:opacity-10"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 active:scale-95 group ${
          isOpen ? 'bg-brand-ivory text-brand-black rotate-90' : 'bg-brand-dark border border-white/[0.1] text-brand-ivory'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-gold rounded-full animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.6)]"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;