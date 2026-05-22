// src/components/MiniChat.jsx
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

const MiniChat = ({ caseData }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: `Hola, soy tu asistente para el caso ${caseData.id}. ¿Necesitas un resumen, ver documentos o analizar riesgos?` }
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

    // Simulación de respuesta inteligente basada en el caso
    setTimeout(() => {
      let responseContent = "";
      const lowerInput = userMessage.toLowerCase();

      // Lógica simple de detección de intención
      if (lowerInput.includes('resumen') || lowerInput.includes('estado')) {
        responseContent = `Estado: ${caseData.status}\n\nResumen: ${caseData.summary}\n\nUltima act.: ${caseData.lastUpdate}`;
      } else if (lowerInput.includes('documento') || lowerInput.includes('prueba') || lowerInput.includes('archivo')) {
        if (caseData.documents.length === 0) {
          responseContent = "Aún no hay documentos adjuntos a este caso.";
        } else {
          const docList = caseData.documents.map(d => `- ${d.name}`).join('\n');
          responseContent = `He encontrado ${caseData.documents.length} documento(s):\n\n${docList}`;
        }
      } else if (lowerInput.includes('riesgo') || lowerInput.includes('peligro')) {
        responseContent = `Analisis de riesgo simulado: Basado en el tipo de caso ${caseData.type}, se recomienda revisar las clausulas de indemnizacion y plazos procesales.`;
      } else {
        responseContent = "Entendido. Puedo ayudarte con resúmenes, listas de documentos o análisis básicos. ¿Qué más necesitas saber de este expediente?";
      }

      setMessages(prev => [...prev, { role: 'ai', content: responseContent }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-[300px] bg-slate-50">
      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
              msg.role === 'ai' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed shadow-sm ${
              msg.role === 'ai' 
                ? 'bg-white text-slate-800 border border-slate-200' 
                : 'bg-blue-600 text-white'
            }`}>
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className="mb-1 last:mb-0 whitespace-pre-wrap">
                  {line.replace(/\*\*(.*?)\*\*/g, '$1')} 
                </p>
              ))}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta sobre este caso..."
            className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniChat;
