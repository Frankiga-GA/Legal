import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { mockCases, mockAIResponses } from '../data/mockData';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "👋 Hola, soy tu Asistente Legal IA. Pregúntame por cualquier expediente (ej: 'Busca el caso de Juan Pérez') o pídemos resúmenes." }
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

    // Lógica de IA Simulada (Búsqueda Global)
    setTimeout(() => {
      let responseContent = "";
      const lowerInput = userMessage.toLowerCase();

      // Buscar en TODOS los casos simulados
      const foundCase = mockCases.find(c => 
        lowerInput.includes(c.clientName.toLowerCase()) || 
        lowerInput.includes(c.dni) || 
        lowerInput.includes(c.id.toLowerCase())
      );

      if (lowerInput.includes('resumen') && foundCase) {
         responseContent = `📄 **Resumen del Caso ${foundCase.id}:**\n${foundCase.summary}\n\n📅 **Estado:** ${foundCase.status}\n🔄 **Última act.:** ${foundCase.lastUpdate}`;
      } else if (foundCase) {
        responseContent = `✅ He encontrado el expediente **${foundCase.id}** perteneciente a **${foundCase.clientName}**.\n\n💡 *Puedes preguntarme: "Dame un resumen de este caso".*`;
      } else if (lowerInput.includes('hola') || lowerInput.includes('ayuda')) {
        responseContent = "Hola. Estoy aquí para ayudarte a gestionar tus expedientes. Prueba escribiendo el nombre de un cliente o el código de un caso.";
      } else {
        responseContent = "No encontré ese expediente en la base de datos. Verifica que el nombre o DNI estén correctos. Ejemplos válidos: 'Juan Pérez', 'EXP-2026-001'.";
      }

      setMessages(prev => [...prev, { role: 'ai', content: responseContent }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Ventana de Chat (Solo visible si isOpen es true) */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header del Chat */}
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">Asistente Legal AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="h-[300px] overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  msg.role === 'ai' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm shadow-sm ${
                  msg.role === 'ai' 
                    ? 'bg-white text-slate-800 border border-slate-100' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0 whitespace-pre-wrap">{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                 <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center"><Bot className="w-4 h-4"/></div>
                 <div className="bg-white border border-slate-100 p-3 rounded-xl flex gap-1 items-center">
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
                placeholder="Escribe nombre, DNI o pregunta..."
                className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Flotante (Emoji Robot) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
          isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-blue-600 text-white'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default FloatingChat;