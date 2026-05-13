// src/components/Sidebar.jsx
import { Scale, LayoutDashboard, FileText, MessageSquare, Settings, Newspaper } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onHome }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Control', icon: LayoutDashboard },
    { id: 'library', label: 'Bóveda', icon: FileText },
    { id: 'ai-chat', label: 'Asistente', icon: MessageSquare },
    { id: 'elperuano', label: 'Registros Oficiales', icon: Newspaper },
    { id: 'settings', label: 'Preferencias', icon: Settings },
  ];

  return (
    <div className="w-[280px] h-screen flex flex-col p-10 relative z-20">
      
      {/* Header Logo */}
      <div 
        onClick={onHome}
        className="flex items-center gap-4 mb-20 cursor-pointer hover:opacity-80 transition-opacity group"
      >
        <div className="p-3 bg-brand-gold rounded-xl shadow-[0_0_20px_rgba(197,160,89,0.2)] group-hover:scale-105 transition-transform">
          <Scale className="w-5 h-5 text-brand-black" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-bold tracking-tight text-brand-ivory">Harvey</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold mt-0.5">Soberanía</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 relative group overflow-hidden ${
                isActive 
                  ? 'text-brand-ivory bg-white/[0.04] border border-white/[0.08] shadow-2xl shadow-brand-gold/5' 
                  : 'text-brand-accent/60 hover:text-brand-ivory hover:bg-white/[0.02]'
              }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-gold rounded-r-full shadow-[0_0_15px_rgba(197,160,89,0.8)]"></div>
              )}
              
              <item.icon className={`w-4 h-4 transition-colors duration-500 ${
                isActive ? 'text-brand-gold' : 'text-brand-accent/40 group-hover:text-brand-gold/60'
              }`} />
              <span className={`text-[13px] tracking-wide uppercase font-bold text-[10px] ${isActive ? 'text-brand-ivory opacity-100' : 'opacity-40 group-hover:opacity-80'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="mt-auto pt-10 border-t border-white/[0.05]">
        <div className="bg-brand-gold/5 rounded-2xl p-5 border border-brand-gold/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></div>
            <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">Protocolo Activo</span>
          </div>
          <p className="text-[10px] text-brand-accent/40 font-light italic">Encriptación de grado militar habilitada</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;