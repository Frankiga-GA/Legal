import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import CaseLibrary from './components/CaseLibrary';
import Chat from './components/Chat'; // Importación corregida

// Componente Dashboard simple para completar la navegación
const Dashboard = () => (
  <div className="p-8 bg-slate-50 min-h-screen">
    <h2 className="text-3xl font-bold text-slate-800 mb-6">Panel General</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-slate-500 text-sm font-medium">Casos Activos</h3>
        <p className="text-4xl font-bold text-slate-800 mt-2">12</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-slate-500 text-sm font-medium">Documentos Procesados</h3>
        <p className="text-4xl font-bold text-blue-600 mt-2">145</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-slate-500 text-sm font-medium">Ahorro de Tiempo</h3>
        <p className="text-4xl font-bold text-green-600 mt-2">32h</p>
      </div>
    </div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'library': return <CaseLibrary />;
      case 'ai-chat': return <Chat />; // Uso del componente renombrado
      default: return <div className="p-8">Sección en construcción</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;