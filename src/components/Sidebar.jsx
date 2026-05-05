import React from 'react';
import { Scale, LayoutDashboard, MessageSquare, FileText, Settings } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Biblioteca de Casos', icon: FileText },
    { id: 'ai-chat', label: 'ManagerIA', icon: MessageSquare },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Scale className="w-8 h-8 text-blue-400" />
        <h1 className="text-xl font-bold tracking-tight">LegalKMS AI</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        v1.0.0 - ProInnovate
      </div>
    </div>
  );
};

export default Sidebar;