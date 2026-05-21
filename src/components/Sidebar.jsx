// src/components/Sidebar.jsx
import {
  FileText,
  FileSearch,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Scale,
  Settings,
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onHome, onLogout, userEmail }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Control', icon: LayoutDashboard },
    { id: 'library', label: 'Boveda', icon: FileText },
    { id: 'monitor', label: 'Monitor Judicial', icon: FileSearch },
    { id: 'ai-chat', label: 'Asistente', icon: MessageSquare },
    { id: 'elperuano', label: 'Registros Oficiales', icon: Newspaper },
    { id: 'settings', label: 'Preferencias', icon: Settings },
  ];

  return (
    <div className="relative z-20 flex h-screen w-[280px] flex-col p-10">
      <div
        onClick={onHome}
        className="group mb-20 flex cursor-pointer items-center gap-4 transition-opacity hover:opacity-80"
      >
        <div className="rounded-xl bg-brand-gold p-3 shadow-[0_0_20px_rgba(197,160,89,0.2)] transition-transform group-hover:scale-105">
          <Scale className="h-5 w-5 text-brand-black" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-bold tracking-tight text-brand-ivory">LUSTI</h1>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold">Legal IA</p>
        </div>
      </div>

      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 transition-all duration-500 ${
                isActive
                  ? 'border border-white/[0.08] bg-white/[0.04] text-brand-ivory shadow-2xl shadow-brand-gold/5'
                  : 'text-brand-accent/60 hover:bg-white/[0.02] hover:text-brand-ivory'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-gold shadow-[0_0_15px_rgba(197,160,89,0.8)]"></div>
              )}

              <item.icon className={`h-4 w-4 transition-colors duration-500 ${
                isActive ? 'text-brand-gold' : 'text-brand-accent/40 group-hover:text-brand-gold/60'
              }`} />
              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                isActive ? 'text-brand-ivory opacity-100' : 'opacity-40 group-hover:opacity-80'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 border-t border-white/[0.05] pt-10">
        <div className="rounded-2xl border border-brand-gold/10 bg-brand-gold/5 p-5">
          <div className="mb-1 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-gold animate-pulse"></div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-gold">Sesion Activa</span>
          </div>
          <p className="truncate text-[10px] font-light text-brand-accent/50">{userEmail || 'Usuario autenticado'}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-accent/50 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
        >
          Cerrar sesion
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
