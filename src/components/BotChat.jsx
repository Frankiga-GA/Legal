// src/components/BotChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Sparkles } from 'lucide-react';

const BotChat = ({ bot, onBack }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: `Hola, soy ${bot.name}. ${bot.description ? bot.description : 'Estoy aquí para ayudarte.'} \n\nHe sido entrenado con ${bot.docs} documentos legales específicos. ¿En qué puedo asesorarte hoy?` 
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

    // Simulación de respuesta contextualizada según el tipo de Bot
    setTimeout(() => {
      let responseContent = "";
      const lowerInput = userMessage.toLowerCase();

      // Lógica simple basada en el nombre/descripción del Bot
      if (bot.name.toLowerCase().includes('laboral')) {
        if (lowerInput.includes('despido') || lowerInput.includes('cts')) {
          responseContent = "Basado en mi entrenamiento con legislación laboral peruana:\n\n1. El despido arbitrario genera una indemnización de 1.5 remuneraciones por año.\n2. La CTS se deposita semestralmente (mayo y noviembre).\n3. Recuerda verificar si existe un sindicato activo.";
        } else {
          responseContent = "Como experto laboral, puedo ayudarte con redacción de cartas de despido, cálculo de beneficios sociales o análisis de contratos de trabajo. ¿Qué necesitas específicamente?";
        }
      } else if (bot.name.toLowerCase().includes('civil') || bot.name.toLowerCase().includes('contrato')) {
        if (lowerInput.includes('alquiler') || lowerInput.includes('arrendamiento')) {
          responseContent = "Para contratos de alquiler, asegúrate de incluir:\n- Plazo determinado (máx 5 años).\n- Cláusula de penalidad por mora.\n- Descripción detallada del bien inmueble.\n- Garantía (usualmente 1 mes de renta).";
        } else {
          responseContent = "Puedo asistirte en la redacción de compraventas, comodatos o arrendamientos. Tengo indexados modelos actualizados del Código Civil. ¿Deseas generar un borrador?";
        }
      } else {
        responseContent = "Entendido. Estoy procesando tu consulta basándome en mi base de conocimientos legal. ¿Podrías darme más detalles sobre el caso?";
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
      {/* Header del Chat Contextual */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-purple-100 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{bot.name}</h3>
            <p className="text-xs text-slate-500">Bot Especializado • {bot.docs} Docs</p>
          </div>
        </div>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
              msg.role === 'ai' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {msg.role === 'ai' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'ai' 
                ? 'bg-white text-slate-800 border border-slate-100' 
                : 'bg-purple-600 text-white'
            }`}>
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className="mb-1 last:mb-0 whitespace-pre-wrap">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center">
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
            placeholder={`Pregunta a ${bot.name} sobre su especialidad...`}
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            className="absolute right-3 top-3 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Este bot responde basándose únicamente en sus {bot.docs} documentos entrenados.
        </p>
      </div>
    </div>
  );
};

export default BotChat;