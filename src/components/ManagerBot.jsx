// src/components/ManagerBot.jsx
import { useState } from 'react';
import { Plus, Bot, Trash2, X, Upload, Sparkles } from 'lucide-react';
import BotChat from './BotChat';

const ManagerBot = () => {
  const [bots, setBots] = useState([
    { id: 1, name: 'Experto Laboral', description: 'Especializado en disputas laborales, liquidaciones y beneficios sociales.', docs: 12 },
    { id: 2, name: 'Contratos Civiles', description: 'Análisis de arrendamientos, compraventas y fianzas.', docs: 8 },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', description: '', files: [] });
  const [activeBot, setActiveBot] = useState(null);

  const handleCreateBot = (e) => {
    e.preventDefault();
    if (!newBot.name) return;
    
    const bot = {
      id: Date.now(),
      name: newBot.name,
      description: newBot.description || 'Asistente general',
      docs: newBot.files.length || 0
    };
    
    setBots([...bots, bot]);
    setNewBot({ name: '', description: '', files: [] });
    setIsCreating(false);
  };

  const deleteBot = (id) => {
    setBots(bots.filter(b => b.id !== id));
  };

  if (activeBot) {
    return <BotChat bot={activeBot} onBack={() => setActiveBot(null)} />;
  }

  return (
    <div className="p-8 md:p-12 min-h-screen bg-brand-black relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/[0.05] pb-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 rounded-full border border-brand-gold/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span>
              <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">Asistencia legal especializada</span>
            </div>
            <h2 className="text-5xl font-serif font-medium tracking-tight text-brand-ivory flex items-center gap-4">
              Asistentes legales
            </h2>
            <p className="text-brand-accent/40 font-light text-sm tracking-wide">Crea asistentes por materia para analizar documentos, preparar borradores y responder consultas del estudio.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-3 px-8 py-4 bg-brand-gold text-brand-black rounded-lg hover:bg-white transition-all font-bold tracking-tight shadow-[0_10px_30px_rgba(197,160,89,0.2)] group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Crear asistente
          </button>
        </header>

        {/* Grid de Bots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {bots.map((bot) => (
            <div key={bot.id} className="glass-card p-8 rounded-lg group relative flex flex-col h-full bg-white/[0.01] border border-white/[0.05] hover:border-brand-gold/30 transition-all shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 rounded-lg bg-brand-gold/10 text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-black transition-all">
                  <Bot className="w-6 h-6" />
                </div>
                <button onClick={() => deleteBot(bot.id)} className="text-brand-accent/20 hover:text-red-500/60 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-2xl font-serif font-medium text-brand-ivory mb-4 group-hover:text-brand-gold transition-colors">{bot.name}</h3>
              <p className="text-brand-accent/40 text-sm font-light leading-relaxed mb-10 flex-1">{bot.description}</p>
              
              <div className="flex items-center justify-between pt-8 border-t border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-brand-gold/5 rounded-lg">
                    <Sparkles className="w-3 h-3 text-brand-gold" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">{bot.docs} documentos</span>
                </div>
                <button 
                  onClick={() => setActiveBot(bot)}
                  className="px-6 py-3 rounded-lg bg-brand-ivory text-brand-black text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                >
                  Consultar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Creación */}
        {isCreating && (
          <div className="fixed inset-0 bg-brand-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="bg-brand-dark border border-white/[0.05] rounded-lg shadow-2xl w-full max-w-xl p-10 animate-in fade-in zoom-in duration-500">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-3xl font-serif font-medium text-brand-ivory flex items-center gap-3">
                  Crear asistente legal
                </h3>
                <button onClick={() => setIsCreating(false)} className="text-brand-accent/40 hover:text-brand-iv ivory transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateBot} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-accent/60 font-semibold">Nombre del asistente</label>
                  <input 
                    type="text" 
                    value={newBot.name}
                    onChange={(e) => setNewBot({...newBot, name: e.target.value})}
                    placeholder="ej. Experto Constitucional" 
                    className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory focus:border-brand-gold/40 focus:bg-white/[0.04] outline-none transition-all placeholder:text-brand-accent/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-accent/60 font-semibold">Especialidad y alcance</label>
                  <textarea 
                    value={newBot.description}
                    onChange={(e) => setNewBot({...newBot, description: e.target.value})}
                    placeholder="Define la materia legal, documentos de referencia y tipo de apoyo esperado..." 
                    className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory focus:border-brand-gold/40 focus:bg-white/[0.04] outline-none resize-none h-32 transition-all placeholder:text-brand-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-accent/60 font-semibold">Documentos de referencia</label>
                  <div className="border border-dashed border-white/[0.1] rounded-xl p-10 text-center hover:bg-white/[0.02] cursor-pointer transition-all group">
                    <Upload className="w-8 h-8 text-brand-accent/20 mx-auto mb-4 group-hover:text-brand-gold transition-colors" />
                    <p className="text-xs text-brand-accent/40 font-light">Sube documentos PDF o DOCX para que el asistente los use como contexto</p>
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-1 py-4 bg-brand-ivory text-brand-black rounded-lg hover:bg-white font-bold tracking-tight transition-all">Guardar asistente</button>
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
