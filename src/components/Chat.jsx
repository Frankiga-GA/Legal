import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { mockCases, mockAIResponses } from '../data/mockData'; // <-- CORREGIDO: solo "../" no "../../../"

const Chat = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: mockAIResponses.default }
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

    // Simulación de lógica de IA (Backend Mock)
    setTimeout(() => {
      let responseContent = "";
      const lowerInput = userMessage.toLowerCase();

      // Lógica simple de detección de intención para la demo
      const foundCase = mockCases.find(c => 
        lowerInput.includes(c.clientName.toLowerCase()) || 
        lowerInput.includes(c.dni) || 
        lowerInput.includes(c.id.toLowerCase())
      );

      if (lowerInput.includes('resumen') || lowerInput.includes('caso') || foundCase) {
        if (foundCase) {
          responseContent = mockAIResponses.search(foundCase);
        } else {
          responseContent = mockAIResponses.notFound;
        }
      } else {
        responseContent = "Entiendo. Para darte una respuesta precisa sobre un caso, por favor menciona el nombre del cliente, DNI o código de expediente. También puedo ayudarte a redactar cláusulas contractuales.";
      }

      setMessages(prev => [...prev, { role: 'ai', content: responseContent }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header del Chat */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Asistente Legal IA</h3>
            <p className="text-xs text-slate-500">Especializado en Jurisprudencia y Expedientes</p>
          </div>
        </div>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'ai' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {msg.role === 'ai' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'ai' 
                ? 'bg-white text-slate-800 border border-slate-100' 
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
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta por un caso, pide un resumen o solicita un borrador..."
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            className="absolute right-3 top-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          La IA puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  );
};

export default Chat;