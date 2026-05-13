// src/App.jsx
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import CaseLibrary from './components/CaseLibrary';
import FloatingChat from './components/FloatingChat';
import ManagerBot from './components/ManagerBot';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import ElPeruano from './components/ElPeruano';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanding, setIsLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'library': return <CaseLibrary />;
      case 'ai-chat': return <ManagerBot />;
      case 'elperuano': return <ElPeruano />;
      case 'settings': return <Settings />;
      default: return <div className="p-8 font-serif italic text-brand-accent">Sección en construcción</div>;
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (isLanding) {
    return <LandingPage onGetStarted={() => setIsLanding(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onBack={() => setIsLanding(true)} />;
  }

  return (
    <div className="flex h-screen bg-brand-black text-brand-ivory relative selection:bg-brand-gold/20 overflow-hidden font-sans">
      {/* Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-50"></div>
      
      {/* Mobile Menu Toggle */}
      <div className="md:hidden absolute top-6 left-6 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Mobile Background Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[-1] md:hidden w-screen h-screen" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
        <div className="h-full bg-brand-black border-r border-white/[0.05]">
          <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onHome={() => setIsLanding(true)} />
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative z-10 bg-brand-black">
        <div className="h-full w-full pt-16 md:pt-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {renderContent()}
          </div>
        </div>
        {activeTab === 'library' && <FloatingChat />}
      </main>
    </div>
  );
}

export default App;