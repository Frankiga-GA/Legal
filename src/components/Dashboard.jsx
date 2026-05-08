// src/components/Dashboard.jsx
import React from 'react';
import { FileText, Clock, BrainCircuit, TrendingUp, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const Dashboard = ({ setActiveTab }) => {
  // Definimos los datos de las tarjetas según la imagen
  const stats = [
    { 
      title: "Casos Activos", 
      value: "12", 
      icon: FileText, 
      color: "blue", 
      trend: "Gestión centralizada",
      bgGradient: "from-blue-50/80 to-white",
      border: "border-blue-200",
      text: "text-blue-600",
      iconBg: "bg-blue-100",
      glowColor: "bg-blue-400"
    },
    { 
      title: "Docs Indexados", 
      value: "145", 
      icon: FileText, 
      color: "indigo", 
      trend: "Meta: 100+ (Cumplido)",
      bgGradient: "from-indigo-50/80 to-white",
      border: "border-indigo-200",
      text: "text-indigo-600",
      iconBg: "bg-indigo-100",
      glowColor: "bg-indigo-400"
    },
    { 
      title: "Ahorro de Tiempo", 
      value: "32h", 
      icon: Clock, 
      color: "emerald", 
      trend: "Este mes",
      bgGradient: "from-emerald-50/80 to-white",
      border: "border-emerald-200",
      text: "text-emerald-600",
      iconBg: "bg-emerald-100",
      glowColor: "bg-emerald-400"
    },
    { 
      title: "Bots IA Activos", 
      value: "3", 
      icon: BrainCircuit, 
      color: "purple", 
      trend: "Asistencia automatizada",
      bgGradient: "from-purple-50/80 to-white",
      border: "border-purple-200",
      text: "text-purple-600",
      iconBg: "bg-purple-100",
      glowColor: "bg-purple-400"
    }
  ];

  const recentActivity = [
    { id: 1, type: 'case', title: 'Nuevo caso creado: EXP-2026-004', user: 'Juan Pérez', time: 'Hace 2 horas' },
    { id: 2, type: 'bot', title: 'Bot "Experto Laboral" entrenado con 5 nuevos docs', user: 'Admin', time: 'Hace 4 horas' },
    { id: 3, type: 'doc', title: 'Documento subido: Contrato_Alquiler_MariaGomez.pdf', user: 'María Gómez', time: 'Hace 6 horas' },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-slate-800">Panel General</h1>
          <p className="text-slate-500 mt-1">Resumen de productividad legal y estado del sistema J&N.</p>
        </header>

        {/* TARJETAS ESTILO IMAGEN REFERENCIA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <FuturisticCard key={index} stat={stat} />
          ))}
        </div>

        {/* Sección Inferior: Actividades + Acciones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Actividades Recientes */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Actividad Reciente
            </h3>
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.type === 'case' ? 'bg-blue-500' :
                    activity.type === 'bot' ? 'bg-purple-500' :
                    activity.type === 'doc' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                    <p className="text-xs text-slate-500">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" /> Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <QuickActionBtn label="Crear Nuevo Caso" icon={FileText} color="blue" onClick={() => setActiveTab('library')} />
              <QuickActionBtn label="Entrenar Nuevo Bot" icon={BrainCircuit} color="purple" onClick={() => setActiveTab('ai-chat')} />
              <QuickActionBtn label="Ver Casos Pendientes" icon={AlertCircle} color="yellow" onClick={() => setActiveTab('library')} />
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Estado del Sistema</h4>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Todos los servicios operativos
              </div>
              <p className="text-[10px] text-slate-400 mt-1">J&N Asesoría Legal - v1.0.0</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Componente de Tarjeta Estilo "Futurista/Glassmorphism" (Réplica de la imagen)
const FuturisticCard = ({ stat }) => {
  const Icon = stat.icon;
  
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.bgGradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 group`}>
      
      {/* Línea de brillo superior (efecto glass) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-60"></div>
      
      {/* Contenido Principal */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{stat.title}</p>
          <h2 className={`text-4xl font-extrabold mt-2 ${stat.text}`}>{stat.value}</h2>
        </div>
        <div className={`p-3 rounded-xl ${stat.iconBg} ${stat.text} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Indicador de tendencia */}
      <div className="flex items-center gap-2 mt-4 relative z-10">
        <div className={`h-1.5 w-1.5 rounded-full ${stat.text.replace('text-', 'bg-')}`}></div>
        <p className="text-xs font-medium text-slate-600">{stat.trend}</p>
      </div>

      {/* Decoración de fondo: Círculo difuminado (Glow Effect) */}
      <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full ${stat.glowColor} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-300`}></div>
      
      {/* Decoración adicional: Pequeño círculo secundario */}
      <div className={`absolute top-1/2 -left-4 w-16 h-16 rounded-full ${stat.glowColor} opacity-5 blur-2xl`}></div>
    </div>
  );
};

const QuickActionBtn = ({ label, icon: Icon, color, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 hover:border-${color}-500 hover:bg-${color}-50 transition-all group`}>
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 text-${color}-600 group-hover:scale-110 transition-transform`} />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-${color}-600" />
  </button>
);

export default Dashboard;