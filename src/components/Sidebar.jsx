// src/components/Sidebar.jsx
import {
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
    { id: 'dashboard', label: 'Inicio operativo', icon: LayoutDashboard },
    { id: 'library', label: 'Crear expediente', icon: FileText },
    ...(showDrive ? [{ id: 'drive', label: 'Conectar documentos', icon: HardDrive }] : []),
    { id: 'ai-chat', label: 'Preguntar a IA', icon: MessageSquare },
  ];

  const secondaryItems = [
    { id: 'monitor', label: 'Monitor judicial', icon: FileSearch },
    { id: 'elperuano', label: 'Registros oficiales', icon: Newspaper },
    { id: 'settings', label: 'Preferencias', icon: Settings },
  ];

  return (
    <div className={`relative z-20 flex h-screen flex-col p-4 transition-all duration-200 ${collapsed ? 'w-[88px]' : 'w-[272px] p-8'}`}>
      <div className={`mb-8 flex items-start justify-between gap-3 ${collapsed ? 'flex-col' : ''}`}>
        <div
          onClick={onHome}
          className={`group flex cursor-pointer items-center gap-4 transition-opacity hover:opacity-90 ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="rounded-lg bg-brand-gold p-3">
            <Scale className="h-5 w-5 text-brand-black" />
          </div>
          {!collapsed ? (
            <div>
              <h1 className="text-xl font-serif font-bold tracking-tight text-brand-ivory">LUSTI</h1>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-gold">Legal IA</p>
            </div>
          ) : null}
        </div>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 text-brand-accent/50 transition-colors hover:text-brand-ivory"
            aria-label={collapsed ? 'Expandir sidebar' : 'Compactar sidebar'}
          >
            <LayoutDashboard className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6">
        <MenuGroup
          title="Flujo principal"
          items={primaryItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
          strong
        />

        <MenuGroup
          title="Herramientas"
          items={secondaryItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
        />
      </nav>

      <div className="mt-auto space-y-3 border-t border-white/[0.05] pt-6">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
          <div className="mb-1 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
            {!collapsed ? <span className="text-[10px] font-semibold text-brand-accent/70">Sesion activa</span> : null}
          </div>
          {!collapsed ? <p className="truncate text-xs font-light text-brand-accent/50">{userEmail || 'Usuario autenticado'}</p> : null}
        </div>
        <button
          onClick={onLogout}
          className={`flex w-full items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs font-semibold text-brand-accent/55 transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300 ${collapsed ? 'px-3 py-4' : 'px-4 py-3'}`}
        >
          {!collapsed ? 'Cerrar sesion' : null}
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const MenuGroup = ({ title, items, activeTab, setActiveTab, collapsed, strong = false }) => (
  <div className="space-y-2">
    {!collapsed ? (
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent/35">{title}</p>
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
                ? 'border border-white/[0.08] bg-white/[0.045] text-brand-ivory'
                : strong
                  ? 'text-brand-ivory/70 hover:bg-white/[0.025] hover:text-brand-ivory'
                  : 'text-brand-accent/55 hover:bg-white/[0.02] hover:text-brand-ivory'
            }`}
            title={collapsed ? item.label : undefined}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-gold"></div>
            )}

            <div className={`flex w-full items-center gap-4 overflow-hidden ${collapsed ? 'justify-center px-3 py-4' : 'px-4 py-3.5'}`}>
              <item.icon className={`h-4 w-4 transition-colors duration-200 ${
                isActive ? 'text-brand-gold' : strong ? 'text-brand-gold/70 group-hover:text-brand-gold' : 'text-brand-accent/40 group-hover:text-brand-gold/60'
              }`} />
              {!collapsed ? (
                <span className={`text-[12px] font-semibold ${
                  isActive ? 'text-brand-ivory opacity-100' : strong ? 'opacity-85 group-hover:opacity-100' : 'opacity-60 group-hover:opacity-90'
                }`}>
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
