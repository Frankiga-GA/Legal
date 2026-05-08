// src/components/Settings.jsx
import React, { useState } from 'react';
import { Building2, Bot, Users, Plug, Save, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('firm');

  const sections = [
    { id: 'firm', label: 'Perfil de la Firma', icon: Building2 },
    { id: 'ai', label: 'Preferencias de IA', icon: Bot },
    { id: 'users', label: 'Gestión de Usuarios', icon: Users },
    { id: 'integrations', label: 'Integraciones', icon: Plug },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Configuración del Sistema
          </h2>
          <p className="text-slate-500 mt-1">Personaliza tu experiencia legal digital.</p>
        </header>

        {/* Navegación de Secciones */}
        <div className="flex flex-wrap gap-2 mb-8">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido de la Sección Activa */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          {activeSection === 'firm' && <FirmProfile />}
          {activeSection === 'ai' && <AIPreferences />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'integrations' && <Integrations />}
        </div>
      </div>
    </div>
  );
};

// --- Subcomponentes ---

const FirmProfile = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-slate-800 mb-4">Información de la Firma</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Firma</label>
        <input type="text" defaultValue="J&N Asesoría Legal y Consultoría S.A.C." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" readOnly />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">RUC</label>
        <input type="text" defaultValue="20XXXXXXXXX" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" readOnly />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Mail className="w-4 h-4" /> Correo Electrónico</label>
        <input type="email" defaultValue="jynconsultoress@gmail.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Phone className="w-4 h-4" /> Teléfono</label>
        <input type="tel" defaultValue="945088014" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><MapPin className="w-4 h-4" /> Dirección</label>
        <input type="text" defaultValue="Calle Grau 227 - Chincha Alta" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
    </div>
    <div className="pt-4">
      <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
        <Save className="w-4 h-4" /> Guardar Cambios
      </button>
    </div>
  </div>
);

const AIPreferences = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-slate-800 mb-4">Preferencias de Inteligencia Artificial</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tono de Respuesta de la IA</label>
        <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          <option>Profesional y Formal</option>
          <option>Claro y Directo</option>
          <option>Amigable y Cercano</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Especialidad Predeterminada de Nuevos Bots</label>
        <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          <option>Derecho Laboral</option>
          <option>Derecho Civil</option>
          <option>Derecho Corporativo</option>
          <option>Sin Especialidad (General)</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="autoIndex" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
        <label htmlFor="autoIndex" className="text-sm text-slate-700">Indexar automáticamente nuevos documentos subidos</label>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="aiDisclaimer" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
        <label htmlFor="aiDisclaimer" className="text-sm text-slate-700">Mostrar descargo de responsabilidad en respuestas de IA</label>
      </div>
    </div>
    <div className="pt-4">
      <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
        <Save className="w-4 h-4" /> Guardar Preferencias
      </button>
    </div>
  </div>
);

const UserManagement = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-slate-800 mb-4">Gestión de Usuarios y Permisos</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Usuario</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rol</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="px-4 py-3">
              <div className="font-medium text-slate-900">Admin J&N</div>
              <div className="text-xs text-slate-500">admin@jynlegal.com</div>
            </td>
            <td className="px-4 py-3"><span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Administrador</span></td>
            <td className="px-4 py-3"><span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span></td>
            <td className="px-4 py-3"><button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button></td>
          </tr>
          <tr>
            <td className="px-4 py-3">
              <div className="font-medium text-slate-900">Abogado Juan</div>
              <div className="text-xs text-slate-500">juan@jynlegal.com</div>
            </td>
            <td className="px-4 py-3"><span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Abogado</span></td>
            <td className="px-4 py-3"><span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span></td>
            <td className="px-4 py-3"><button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button></td>
          </tr>
          <tr>
            <td className="px-4 py-3">
              <div className="font-medium text-slate-900">Asistente María</div>
              <div className="text-xs text-slate-500">maria@jynlegal.com</div>
            </td>
            <td className="px-4 py-3"><span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Asistente</span></td>
            <td className="px-4 py-3"><span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span></td>
            <td className="px-4 py-3"><button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="pt-4">
      <button className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
        + Invitar Nuevo Usuario
      </button>
    </div>
  </div>
);

const Integrations = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-slate-800 mb-4">Integraciones con Servicios Externos</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <IntegrationCard title="Supabase" description="Base de datos y autenticación" status="Conectado" color="green" />
      <IntegrationCard title="Google Drive" description="Almacenamiento de documentos" status="Desconectado" color="gray" />
      <IntegrationCard title="WhatsApp Business API" description="Notificaciones a clientes" status="Desconectado" color="gray" />
      <IntegrationCard title="Sunat / RENIEC" description="Validación de RUC/DNI" status="Próximamente" color="yellow" />
    </div>
    <div className="pt-4">
      <p className="text-sm text-slate-500">Las integraciones permiten sincronizar datos y automatizar flujos de trabajo.</p>
    </div>
  </div>
);

const IntegrationCard = ({ title, description, status, color }) => (
  <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold text-slate-800">{title}</h4>
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === 'Conectado' ? 'bg-green-100 text-green-800' :
        status === 'Desconectado' ? 'bg-gray-100 text-gray-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {status}
      </span>
    </div>
    <p className="text-sm text-slate-500 mb-3">{description}</p>
    <button className={`text-sm font-medium ${
      status === 'Conectado' ? 'text-red-600 hover:text-red-800' : 'text-blue-600 hover:text-blue-800'
    }`}>
      {status === 'Conectado' ? 'Desconectar' : 'Conectar'}
    </button>
  </div>
);

export default Settings;