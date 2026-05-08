// src/App.jsx
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import CaseLibrary from './components/CaseLibrary';
import Chat from './components/Chat'; 
import FloatingChat from './components/FloatingChat';
import ManagerBot from './components/ManagerBot';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import ElPeruano from './components/ElPeruano'; // <-- NUEVO IMPORT

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'library': return <CaseLibrary />;
      case 'ai-chat': return <ManagerBot />;
      case 'elperuano': return <ElPeruano />; // <-- NUEVA RUTA
      case 'settings': return <Settings />;
      default: return <div className="p-8">Sección en construcción</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
        {activeTab === 'library' && <FloatingChat />}
      </main>
    </div>
  );
}

export default App;