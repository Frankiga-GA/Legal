// src/App.jsx
import { useEffect, useState } from 'react';
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
import { getCurrentSession, onAuthStateChange, signOut } from './services/authService';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanding, setIsLanding] = useState(true);
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getCurrentSession()
      .then((currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        if (currentSession) setIsLanding(false);
      })
      .catch(() => {
        if (isMounted) setSession(null);
      })
      .finally(() => {
        if (isMounted) setIsAuthLoading(false);
      });

    const subscription = onAuthStateChange((nextSession) => {
      setSession(nextSession);
      if (nextSession) setIsLanding(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (nextSession) => {
    setSession(nextSession);
    setIsLanding(false);
  };

  const handleLogout = async () => {
    await signOut();
    setSession(null);
    setActiveTab('dashboard');
    setIsLanding(false);
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

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-black text-brand-ivory">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 rounded-full border border-brand-gold/30 border-t-brand-gold animate-spin"></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent/50">Cargando LUSTI</p>
        </div>
      </div>
    );
  }

  if (isLanding && !session) {
    return <LandingPage onGetStarted={() => setIsLanding(false)} />;
  }

  if (!session) {
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
          <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onHome={() => setIsLanding(true)} onLogout={handleLogout} userEmail={session.user?.email} />
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
