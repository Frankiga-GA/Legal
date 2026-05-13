import { FileText, Database, Zap, BrainCircuit, ArrowRight, MessageSquare } from 'lucide-react';

const Dashboard = ({ setActiveTab }) => {
  const stats = [
    { title: "Casos Activos", value: "12", icon: FileText },
    { title: "Docs Indexados", value: "145", icon: Database },
    { title: "Eficiencia", value: "32%", icon: Zap },
    { title: "Instancias IA", value: "03", icon: BrainCircuit }
  ];

  const recentActivity = [
    { id: 1, title: 'Análisis completo: Caso #2026-04', time: 'hace 2h' },
    { id: 2, title: 'Nueva fuente añadida a la Bóveda', time: 'hace 4h' },
    { id: 3, title: 'Borrador de contrato generado', time: 'hace 6h' },
  ];

  return (
    <div className="p-8 md:p-12 min-h-screen relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.05] pb-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 rounded-full border border-brand-gold/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span>
              <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">Workspace Sincronizado</span>
            </div>
            <h1 className="text-5xl font-serif font-medium tracking-tight text-brand-ivory">Centro de Mando</h1>
            <p className="text-brand-accent/40 font-light text-sm tracking-wide">Monitoreo heurístico y gestión operativa de alta precisión.</p>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-gold bg-brand-gold/5 px-6 py-3 rounded-xl border border-brand-gold/10">
            Mayo 2026
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="glass-card p-10 rounded-3xl group cursor-pointer border border-white/[0.05] hover:border-brand-gold/30 transition-all bg-white/[0.01]">
              <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-brand-gold/10 rounded-xl group-hover:bg-brand-gold transition-all">
                  <stat.icon className="w-6 h-6 text-brand-gold group-hover:text-brand-black transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl font-serif font-medium text-brand-ivory tracking-tighter">{stat.value}</h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent/40 font-bold">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
          
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-medium text-brand-ivory">Log de Operaciones</h3>
              <button className="text-[10px] uppercase tracking-widest text-brand-gold font-bold hover:text-brand-ivory transition-colors">Ver Historial Completo</button>
            </div>
            
            <div className="space-y-px rounded-3xl overflow-hidden border border-white/[0.05] bg-white/[0.01]">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-all group cursor-pointer border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-5">
                    <div className="w-2 h-2 rounded-full bg-brand-gold opacity-20 group-hover:opacity-100 group-hover:shadow-[0_0_8px_rgba(197,160,89,0.8)] transition-all"></div>
                    <span className="text-sm font-light text-brand-ivory/70 group-hover:text-brand-ivory transition-colors">{activity.title}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-brand-accent/20 font-bold">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-10">
            <h3 className="text-2xl font-serif font-medium text-brand-ivory">Ejecución</h3>
            <div className="space-y-4">
              <button 
                onClick={() => setActiveTab('library')}
                className="w-full flex items-center justify-between p-6 bg-brand-ivory text-brand-black rounded-2xl hover:bg-white transition-all group shadow-xl"
              >
                <span className="text-xs uppercase tracking-widest font-bold">Desplegar Bóveda</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setActiveTab('ai-chat')}
                className="w-full flex items-center justify-between p-6 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold rounded-2xl hover:bg-brand-gold hover:text-brand-black transition-all group"
              >
                <span className="text-xs uppercase tracking-widest font-bold">Sincronizar IA</span>
                <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            <div className="p-8 rounded-3xl border border-white/[0.05] bg-white/[0.01] space-y-4 overflow-hidden relative">
               <div className="absolute inset-0 bg-brand-gold/5"></div>
               <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div>
                   <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-accent/40">Soberanía de Datos</span>
                 </div>
                 <p className="text-[12px] text-brand-accent/60 leading-relaxed font-light italic">
                   "La integridad de los datos legales está garantizada bajo el protocolo de encriptación J&N-V4."
                 </p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;