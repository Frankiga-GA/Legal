// src/App.jsx
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

import Sidebar from './components/Sidebar';
import CaseLibrary from './components/CaseLibrary';
import CaseWorkspace from './components/CaseWorkspace';
import ManagerBot from './components/ManagerBot';
import GlobalChat from './components/GlobalChat';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import ElPeruano from './components/ElPeruano';
import LegalMonitor from './components/LegalMonitor';
import DriveVault from './components/DriveVault';
import LegalPage from './components/LegalPage';
import { getCurrentSession, onAuthStateChange, signOut } from './services/authService';
import { getStoredDriveToken, onDriveTokenChange, onDriveTokenMessage } from './services/googleDriveService';
import { setPendingAiInput, setActiveAssistant } from './services/aiBridge';
import { getCases } from './services/caseStore';
import { loadAllPreferences } from './services/userPreferencesStore';
import { checkDeadlinesAndNotify } from './services/notificationService';

// Simple Error Boundary to catch render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (<div className="p-8 text-red-600">Se produjo un error inesperado. Recarga la página.</div>);
    }
    return this.props.children;
  }
}

function App() {
  const publicPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const [activeTab, setActiveTab] = useState('library');
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanding, setIsLanding] = useState(true);
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDriveConnected, setIsDriveConnected] = useState(() => Boolean(getStoredDriveToken()?.access_token));

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

  useEffect(() => {
    const syncDriveState = () => {
      setIsDriveConnected(Boolean(getStoredDriveToken()?.access_token));
    };

    syncDriveState();

    const onStorage = (event) => {
      if (!event.key || event.key === 'lusti-google-drive-token') {
        syncDriveState();
      }
    };

    const unsubscribeDriveToken = onDriveTokenMessage(() => {
      syncDriveState();
    });
    const unsubscribeDriveChange = onDriveTokenChange(() => {
      syncDriveState();
    });

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', syncDriveState);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', syncDriveState);
      unsubscribeDriveToken();
      unsubscribeDriveChange();
    };
  }, []);

  // Revisa plazos criticos y dispara notificaciones cuando hay sesion activa.
  // Se ejecuta al login, al volver de background y cada 5 minutos.
  useEffect(() => {
    if (!session?.user?.id) return undefined;
    const userId = session.user.id;

    const runCheck = () => {
      const prefs = loadAllPreferences(userId);
      const deadlineAlerts = prefs?.notifications?.deadlineAlerts !== false;
      if (!deadlineAlerts) return;
      const cases = getCases();
      checkDeadlinesAndNotify(cases, userId, { deadlineAlerts: true });
    };

    runCheck();
    const onFocus = () => runCheck();
    const interval = window.setInterval(runCheck, 5 * 60 * 1000);
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [session?.user?.id]);

  const handleLogin = (nextSession) => {
    setSession(nextSession);
    setIsLanding(false);
  };

  const handleLogout = async () => {
    await signOut();
    setSession(null);
    setActiveTab('library');
    setIsLanding(false);
  };

  const openGlobalChat = async ({ pendingInput = null, assistant = null } = {}) => {
    if (pendingInput) setPendingAiInput(pendingInput);
    if (assistant) setActiveAssistant(assistant);
    setActiveTab('global-chat');
    setIsSidebarCollapsed(true);
    return true;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'case-workspace': return <CaseWorkspace caseId={activeCaseId} onClose={() => setActiveTab('library')} />;
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} isDriveConnected={isDriveConnected} />;
      case 'library': return <CaseLibrary setActiveTab={setActiveTab} onOpenCase={(id) => { setActiveCaseId(id); setActiveTab('case-workspace'); }} userId={session?.user?.id} />;
      case 'monitor': return <LegalMonitor setActiveTab={setActiveTab} />;
      case 'drive': return <DriveVault />;
      case 'ai-chat': return <ManagerBot onUseInChat={openGlobalChat} />;
      case 'global-chat': return <GlobalChat onBack={() => setActiveTab('ai-chat')} />;
      case 'elperuano': return <ElPeruano />;
      case 'settings': return <Settings session={session} />;
      default: return <div className="p-8 font-serif italic text-slate-400">Sección en construcción</div>;
    }
  };

  function SafeRender() {
    try {
      return renderContent();
    } catch (e) {
      console.error('Render error:', e);
      return <div className="p-8 text-red-500">Error al cargar la sección. Por favor recarga la página.</div>;
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsSidebarCollapsed(tab === 'ai-chat' || tab === 'case-workspace' || tab === 'global-chat');
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!isDriveConnected && activeTab === 'drive') {
      setActiveTab('library');
    }
  }, [activeTab, isDriveConnected]);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 rounded-full border border-zinc-800 border-t-zinc-900 animate-spin"></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Cargando LUSTI</p>
        </div>
      </div>
    );
  }

  if (publicPath === '/privacy') {
    return <LegalPage type="privacy" />;
  }

  if (publicPath === '/terms') {
    return <LegalPage type="terms" />;
  }

  if (isLanding && !session) {
    return <LandingPage onGetStarted={() => setIsLanding(false)} />;
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} onBack={() => setIsLanding(true)} />;
  }

  return (
    <ErrorBoundary>
    <div className="flex h-screen bg-brand-black text-brand-ivory relative selection:bg-brand-gold/30 overflow-hidden font-sans">
      {/* Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-50"></div>
      
      {/* Mobile Menu Toggle */}
      <div className="md:hidden absolute top-6 left-6 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg border border-white/[0.08] bg-brand-dark p-3 text-brand-ivory shadow-sm"
        >
            {isMobileMenuOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* Sidebar Container */}
      {activeTab !== 'case-workspace' && (
        <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Mobile Background Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 z-[-1] h-screen w-screen bg-black/80 backdrop-blur-sm" 
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}
          <div className="h-full bg-brand-dark border-r border-white/[0.08]">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              onHome={() => setIsLanding(true)}
              onLogout={handleLogout}
              userEmail={session.user?.email}
              collapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
              showDrive={isDriveConnected}
            />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden relative z-10 bg-brand-black">
        <div className="h-full w-full pt-16 md:pt-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div key={activeTab} className={`h-full ${activeTab === 'case-workspace' ? 'animate-fade-in-up' : 'animate-fade-in'}`}>
              {SafeRender()}
            </div>
          </div>
        </div>
      </main>
        {/* Contenedor de toast */}
        <Toaster />
    </div>
    </ErrorBoundary>
  );
}

export default App;
