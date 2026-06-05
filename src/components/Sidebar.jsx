// src/components/Sidebar.jsx
import {
  Clock,
  FileText,
  FileSearch,
  HardDrive,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Scale,
  Settings,
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onHome, onLogout, userEmail, collapsed = false, onToggleCollapse, showDrive = false }) => {
  const primaryItems = [
    { id: 'library', label: 'Inventario', icon: FileText },
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    ...(showDrive ? [{ id: 'drive', label: 'Documentos', icon: HardDrive }] : []),
    { id: 'ai-chat', label: 'Consultar IA', icon: MessageSquare },
  ];

  const secondaryItems = [
    { id: 'monitor', label: 'Seguimiento', icon: FileSearch },
    { id: 'elperuano', label: 'Normas', icon: Newspaper },
    { id: 'deadlines', label: 'Plazos', icon: Clock },
    { id: 'settings', label: 'Configuracion', icon: Settings },
  ];

  return (
    <div className={`relative z-20 flex h-screen flex-col bg-brand-dark transition-all duration-200 ${collapsed ? 'w-[88px] p-4' : 'w-[272px] p-8'}`}>
      <div className={`mb-8 flex items-start justify-between gap-3 ${collapsed ? 'flex-col items-center' : ''}`}>
        <div
          onClick={onHome}
          className={`group flex cursor-pointer items-center gap-4 transition-opacity hover:opacity-80 ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="rounded-lg bg-brand-gold p-3 shadow-sm">
            <Scale className="h-5 w-5 text-brand-black" />
          </div>
          {!collapsed ? (
            <div>
              <h1 className="text-xl font-bold tracking-tight text-brand-ivory">LUSTI</h1>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent">Inventario legal</p>
            </div>
          ) : null}
        </div>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 text-brand-accent shadow-sm transition-colors hover:text-brand-ivory hover:bg-white/[0.05]"
            aria-label={collapsed ? 'Expandir sidebar' : 'Compactar sidebar'}
          >
            <LayoutDashboard className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6">
        <MenuGroup
          title="Trabajo diario"
          items={primaryItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
        />

        <MenuGroup
          title="Opciones"
          items={secondaryItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
        />
      </nav>

      <div className="mt-auto space-y-3 border-t border-white/[0.08] pt-6">
        <div className="rounded-lg border border-white/[0.08] bg-brand-black p-4">
          <div className="mb-1 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            {!collapsed ? <span className="text-[10px] font-semibold text-brand-accent">Sesion activa</span> : null}
          </div>
          {!collapsed ? <p className="truncate text-xs font-medium text-brand-ivory">{userEmail || 'Usuario autenticado'}</p> : null}
        </div>
        <button
          onClick={onLogout}
          className={`flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs font-semibold text-brand-accent shadow-sm transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 ${collapsed ? 'px-3 py-4' : 'px-4 py-3'}`}
        >
          {!collapsed ? 'Cerrar sesion' : null}
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const MenuGroup = ({ title, items, activeTab, setActiveTab, collapsed }) => (
  <div className="space-y-2">
    {!collapsed ? (
      <p className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/70">{title}</p>
    ) : null}
    <div className="space-y-2">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`group relative flex w-full items-center overflow-hidden rounded-lg transition-colors duration-200 ${
              isActive
                ? 'bg-brand-black text-brand-ivory font-bold border border-white/[0.08]'
                : 'text-brand-accent hover:bg-white/[0.02] hover:text-brand-ivory font-medium border border-transparent'
            }`}
            title={collapsed ? item.label : undefined}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-gold"></div>
            )}

            <div className={`flex w-full items-center gap-4 overflow-hidden ${collapsed ? 'justify-center px-3 py-4' : 'px-4 py-3.5'}`}>
              <item.icon className={`h-4 w-4 transition-colors duration-200 ${
                isActive ? 'text-brand-gold' : 'text-brand-accent group-hover:text-brand-ivory'
              }`} />
              {!collapsed ? (
                <span className={`text-[12px] ${isActive ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default Sidebar;
