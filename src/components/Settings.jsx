// src/components/Settings.jsx
import { useState } from 'react';
import { Building2, Bot, Users, Plug, Save } from 'lucide-react';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('firm');

  const sections = [
    { id: 'firm', label: 'Perfil de Firma', icon: Building2 },
    { id: 'ai', label: 'Nodos de IA', icon: Bot },
    { id: 'users', label: 'Equipo', icon: Users },
    { id: 'integrations', label: 'Conexiones', icon: Plug },
  ];

  return (
    <div className="p-8 md:p-12 min-h-screen bg-brand-black">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="space-y-2">
          <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory flex items-center gap-4">
            Preferencias del Sistema
          </h2>
          <p className="text-brand-accent/60 font-light text-sm tracking-wide">Personaliza los parámetros operativos de tu entorno legal digital.</p>
        </header>

        {/* Navegación de Secciones */}
        <div className="flex flex-wrap gap-3">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all text-sm font-medium tracking-tight ${
                activeSection === section.id
                  ? 'bg-brand-ivory text-brand-black border-brand-ivory shadow-lg'
                  : 'bg-white/[0.02] text-brand-accent/60 border-white/[0.05] hover:bg-white/[0.05]'
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="glass-card p-10 rounded-3xl border border-white/[0.05] bg-white/[0.01]">
          {activeSection === 'firm' && <FirmProfile />}
          {activeSection === 'ai' && <AIPreferences />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'integrations' && <Integrations />}
        </div>
      </div>
    </div>
  );
};

const FirmProfile = () => (
  <div className="space-y-10">
    <h3 className="text-2xl font-serif font-medium text-brand-ivory">Información de la Firma</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Nombre Legal</label>
        <input type="text" defaultValue="J&N Asesoría Legal y Consultoría S.A.C." className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40" readOnly />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">RUC</label>
        <input type="text" defaultValue="20XXXXXXXXX" className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none" readOnly />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Canal de Comunicación</label>
        <input type="email" defaultValue="jynconsultoress@gmail.com" className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Contacto Directo</label>
        <input type="tel" defaultValue="945088014" className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40" />
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Sede Principal</label>
        <input type="text" defaultValue="Calle Grau 227 - Chincha Alta" className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40" />
      </div>
    </div>
    <div className="pt-6">
      <button className="flex items-center gap-3 px-8 py-4 bg-brand-ivory text-brand-black rounded-xl hover:bg-white transition-all font-bold tracking-tight">
        <Save className="w-4 h-4" /> Consolidar Cambios
      </button>
    </div>
  </div>
);

const AIPreferences = () => (
  <div className="space-y-10">
    <h3 className="text-2xl font-serif font-medium text-brand-ivory">Parámetros de Inteligencia</h3>
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Tono de Interacción</label>
        <select className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40 appearance-none">
          <option className="bg-brand-dark">Profesional y Analítico</option>
          <option className="bg-brand-dark">Sintético y Directo</option>
          <option className="bg-brand-dark">Consultivo Explicativo</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Especialización de Nodos</label>
        <select className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40 appearance-none">
          <option className="bg-brand-dark">Derecho Laboral</option>
          <option className="bg-brand-dark">Derecho Civil</option>
          <option className="bg-brand-dark">Derecho Corporativo</option>
        </select>
      </div>
      <div className="flex items-center gap-4 group cursor-pointer">
        <input type="checkbox" id="autoIndex" defaultChecked className="w-5 h-5 bg-white/[0.02] border-white/[0.1] rounded text-brand-gold focus:ring-brand-gold" />
        <label htmlFor="autoIndex" className="text-sm text-brand-accent/60 font-light group-hover:text-brand-ivory transition-colors">Indexación automática de nuevos activos documentales</label>
      </div>
      <div className="flex items-center gap-4 group cursor-pointer">
        <input type="checkbox" id="aiDisclaimer" defaultChecked className="w-5 h-5 bg-white/[0.02] border-white/[0.1] rounded text-brand-gold focus:ring-brand-gold" />
        <label htmlFor="aiDisclaimer" className="text-sm text-brand-accent/60 font-light group-hover:text-brand-ivory transition-colors">Incluir protocolo de descargo en respuestas generativas</label>
      </div>
    </div>
    <div className="pt-6">
      <button className="flex items-center gap-3 px-8 py-4 bg-brand-ivory text-brand-black rounded-xl hover:bg-white transition-all font-bold tracking-tight">
        <Save className="w-4 h-4" /> Guardar Preferencias
      </button>
    </div>
  </div>
);

const UserManagement = () => (
  <div className="space-y-10">
    <h3 className="text-2xl font-serif font-medium text-brand-ivory">Equipo Operativo</h3>
    <div className="rounded-2xl border border-white/[0.05] overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-white/[0.02] border-b border-white/[0.05]">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold text-brand-accent/40 uppercase tracking-widest">Usuario</th>
            <th className="px-6 py-4 text-[10px] font-bold text-brand-accent/40 uppercase tracking-widest">Nivel de Acceso</th>
            <th className="px-6 py-4 text-[10px] font-bold text-brand-accent/40 uppercase tracking-widest">Estado</th>
            <th className="px-6 py-4 text-[10px] font-bold text-brand-accent/40 uppercase tracking-widest text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {[
            { name: 'Admin J&N', email: 'admin@jynlegal.com', role: 'Administrador', status: 'Activo' },
            { name: 'Abogado Juan', email: 'juan@jynlegal.com', role: 'Abogado', status: 'Activo' },
            { name: 'Asistente María', email: 'maria@jynlegal.com', role: 'Asistente', status: 'Activo' }
          ].map((user, i) => (
            <tr key={i} className="hover:bg-white/[0.01] transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-brand-ivory/80 text-sm">{user.name}</div>
                <div className="text-[10px] text-brand-accent/20 uppercase tracking-wider">{user.email}</div>
              </td>
              <td className="px-6 py-4"><span className="text-[11px] font-medium text-brand-accent/60 tracking-tight">{user.role}</span></td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                  <span className="text-xs font-light text-brand-accent/60">{user.status}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right"><button className="text-brand-gold hover:text-brand-ivory text-xs font-semibold uppercase tracking-widest transition-colors">Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="pt-6">
      <button className="px-8 py-4 bg-brand-ivory text-brand-black rounded-xl hover:bg-white transition-all font-bold tracking-tight">
        + Invocar Nuevo Integrante
      </button>
    </div>
  </div>
);

const Integrations = () => (
  <div className="space-y-10">
    <h3 className="text-2xl font-serif font-medium text-brand-ivory">Conexiones de Red</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <IntegrationCard title="Supabase" description="Infraestructura de datos y autenticación" status="Conectado" />
      <IntegrationCard title="Google Drive" description="Bóveda de activos documentales externa" status="Desconectado" />
      <IntegrationCard title="WhatsApp API" description="Protocolo de notificaciones automatizadas" status="Desconectado" />
      <IntegrationCard title="RENIEC / SUNAT" description="Validación de identidades soberanas" status="Próximamente" />
    </div>
  </div>
);

const IntegrationCard = ({ title, description, status }) => (
  <div className="p-8 rounded-3xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
    <div className="flex justify-between items-start mb-6">
      <h4 className="text-xl font-serif font-medium text-brand-ivory">{title}</h4>
      <span className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
        status === 'Conectado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
        status === 'Desconectado' ? 'bg-white/5 text-brand-accent/40 border border-white/10' :
        'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
      }`}>
        {status}
      </span>
    </div>
    <p className="text-brand-accent/40 text-sm font-light leading-relaxed mb-8">{description}</p>
    <button className={`text-xs font-bold uppercase tracking-widest transition-colors ${
      status === 'Conectado' ? 'text-red-500/60 hover:text-red-500' : 'text-brand-gold hover:text-brand-ivory'
    }`}>
      {status === 'Conectado' ? 'Terminar Conexión' : 'Inicializar Enlace'}
    </button>
  </div>
);

export default Settings;