// src/components/ManagerBot.jsx
import React, { useState } from 'react';
import { Plus, Bot, Trash2, MessageSquare, Upload, Brain, Sparkles } from 'lucide-react';
import BotChat from './BotChat'; // <-- Importamos el nuevo chat

const ManagerBot = () => {
  const [bots, setBots] = useState([
    { id: 1, name: 'Experto Laboral', description: 'Especializado en despidos, CTS y beneficios sociales.', docs: 12, color: 'blue' },
    { id: 2, name: 'Contratos Civiles', description: 'Alquileres, compraventas y comodatos.', docs: 8, color: 'green' },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', description: '', files: [] });
  
  // Estado para controlar qué bot está activo (null = lista de bots, objeto = chat abierto)
  const [activeBot, setActiveBot] = useState(null);

  const handleCreateBot = (e) => {
    e.preventDefault();
    if (!newBot.name) return;
    
    const bot = {
      id: Date.now(),
      name: newBot.name,
      description: newBot.description || 'Bot generalista',
      docs: newBot.files.length || 0,
      color: 'purple'
    };
    
    setBots([...bots, bot]);
    setNewBot({ name: '', description: '', files: [] });
    setIsCreating(false);
  };

  const deleteBot = (id) => {
    setBots(bots.filter(b => b.id !== id));
  };

  // Si hay un bot activo, mostramos el chat en lugar de la lista
  if (activeBot) {
    return <BotChat bot={activeBot} onBack={() => setActiveBot(null)} />;
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600" />
              ManagerBot AI
            </h2>
            <p className="text-slate-500 mt-1">Crea, entrena y gestiona tus asistentes legales especializados.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md font-medium"
          >
            <Plus className="w-5 h-5" />
            Nuevo Bot
          </button>
        </header>

        {/* Grid de Bots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div key={bot.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full bg-${bot.color}-500`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg bg-${bot.color}-50 text-${bot.color}-600`}>
                  <Bot className="w-6 h-6" />
                </div>
                <button onClick={() => deleteBot(bot.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2">{bot.name}</h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{bot.description}</p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {bot.docs} Docs Entrenados
                </span>
                {/* Al hacer clic, activamos este bot */}
                <button 
                  onClick={() => setActiveBot(bot)}
                  className="text-purple-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Chatear <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Creación de Bot (Igual que antes) */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-300">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Entrenar Nuevo Bot
              </h3>
              <form onSubmit={handleCreateBot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Bot</label>
                  <input 
                    type="text" 
                    value={newBot.name}
                    onChange={(e) => setNewBot({...newBot, name: e.target.value})}
                    placeholder="Ej: Bot Penalista, Bot de Familia..." 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Especialidad / Contexto</label>
                  <textarea 
                    value={newBot.description}
                    onChange={(e) => setNewBot({...newBot, description: e.target.value})}
                    placeholder="¿En qué áreas legales se especializará?" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Base de Conocimiento</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Sube PDFs, Word o textos legales</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">Crear Bot</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerBot;