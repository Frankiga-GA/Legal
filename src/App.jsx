// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
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
import DeadlineCalculator from './components/DeadlineCalculator';
import CalendarView from './components/CalendarView';
import OnboardingTour from './components/OnboardingTour';
import LegalPage from './components/LegalPage';
import { getCurrentSession, onAuthStateChange, signOut, hasCompletedOnboarding } from './services/authService';
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDriveConnected, setIsDriveConnected] = useState(() => Boolean(getStoredDriveToken()?.access_token));
  const [showAlreadyLoggedIn, setShowAlreadyLoggedIn] = useState(false);
  const [showTakeOverMessage, setShowTakeOverMessage] = useState(false);
  const [closeFailed, setCloseFailed] = useState(false);

  const tabId = useRef(`tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).current;
  const channelRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // Sincroniza el inicio de sesion entre pestanas para evitar que el
    // magic link deje dos sesiones abiertas a la vez.
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('lusti_auth_sync');
      channelRef.current = channel;
      channel.onmessage = (event) => {
        if (!isMounted) return;
        if (event.data?.type === 'AUTH_COMPLETE' && event.data.tabId !== tabId) {
          // Si el usuario ya confirmo que quiere usar esta ventana,
          // no le volvamos a mostrar el overlay.
          let dismissed = false;
          try {
            dismissed = window.sessionStorage.getItem('lusti_overlay_dismissed') === '1';
          } catch {
            /* noop */
          }
          if (!dismissed) {
            setShowAlreadyLoggedIn(true);
          }
        }
        if (event.data?.type === 'TAKE_OVER' && event.data.fromTabId !== tabId) {
          // Otra pestana tomo el control. Esta pestana debe cerrarse.
          setShowTakeOverMessage(true);
        }
      };
    }

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
      if (!isMounted) return;
      setSession(nextSession);
      if (!nextSession) return;

      setIsLanding(false);

      // Detecta si esta pestana es la que abrio el magic link
      // (la URL trae los tokens en el hash o en el query).
      const hasTokensInUrl =
        (window.location.hash && window.location.hash.includes('access_token')) ||
        (window.location.search && window.location.search.includes('access_token'));

      if (hasTokensInUrl) {
        // Pestana principal: limpia los tokens de la URL para que no
        // queden en el historial ni en la barra de direcciones, y avisa
        // a las demas pestanas.
        try {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          );
        } catch {
          /* noop */
        }
        if (channel) {
          channel.postMessage({ type: 'AUTH_COMPLETE', tabId });
        }
      } else {
        // Pestana secundaria: detecta si el SIGNED_IN lo disparo esta
        // misma pestana (login con password) o si vino por sync desde
        // otra pestana (magic link abierto en una ventana nueva).
        let selfTriggered = false;
        try {
          selfTriggered = window.sessionStorage.getItem('lusti_self_auth') === '1';
          if (selfTriggered) {
            window.sessionStorage.removeItem('lusti_self_auth');
          }
        } catch {
          /* noop */
        }
        if (!selfTriggered) {
          setShowAlreadyLoggedIn(true);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
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
    if (nextSession?.user?.id && !hasCompletedOnboarding(nextSession.user.id)) {
      setShowOnboarding(true);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setSession(null);
    setActiveTab('library');
    setIsLanding(true);
  };

  // Bloquea el boton "Atras" del navegador para que no saque al usuario
  // del sistema y lo mande a la landing. La navegacion interna se hace
  // por el sidebar.
  useEffect(() => {
    if (!session) return undefined;
    if (typeof window === 'undefined') return undefined;

    const APP_STATE = { app: true };
    const pushAppState = () => {
      try {
        window.history.pushState(APP_STATE, '', window.location.pathname);
      } catch {
        /* noop */
      }
    };

    pushAppState();

    const onPopState = () => {
      if (!window.history.state?.app) {
        pushAppState();
      } else {
        // Vuelve a empujar el estado para evitar que el siguiente back
        // salga de la app
        pushAppState();
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [session]);

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
      case 'deadlines': return <DeadlineCalculator />;
      case 'calendar': return (
        <CalendarView
          onOpenCase={(id) => { setActiveCaseId(id); setActiveTab('case-workspace'); }}
        />
      );
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

      {showOnboarding && session?.user?.id && (
        <OnboardingTour
          userId={session.user.id}
          onComplete={() => setShowOnboarding(false)}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setShowOnboarding(false);
          }}
        />
      )}

      {showAlreadyLoggedIn && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-brand-dark p-8 shadow-2xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/10 border border-brand-gold/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-gold">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-brand-ivory mb-2">Tu sesion ya se inicio</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              LUSTI se abrio en otra ventana cuando hiciste clic en el enlace magico. Para evitar duplicados, te recomendamos cerrar esta pestana y volver a la original.
            </p>
            {closeFailed && (
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-300">
                No pude cerrar la pestana automaticamente. Usa la <span className="font-semibold">X</span> del navegador para cerrarla.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    window.sessionStorage.setItem('lusti_closing', '1');
                  } catch {
                    /* noop */
                  }
                  window.close();
                  // Si window.close() no funciona, el navegador no permite
                  // cerrar pestanas abiertas manualmente. Detectamos el caso
                  // y avisamos al usuario.
                  setTimeout(() => {
                    try {
                      const stillHere = window.sessionStorage.getItem('lusti_closing') === '1';
                      if (stillHere) {
                        window.sessionStorage.removeItem('lusti_closing');
                        setCloseFailed(true);
                      }
                    } catch {
                      /* noop */
                    }
                  }, 300);
                }}
                className="w-full rounded-lg bg-brand-gold px-4 py-3 text-sm font-semibold text-brand-black hover:bg-brand-gold/90 transition-colors"
              >
                Cerrar esta pestana
              </button>
              <button
                type="button"
                onClick={() => {
                  // Marca esta ventana como la principal y avisa a las
                  // demas para que se cierren. Asi no vuelve a aparecer
                  // el overlay aunque Supabase sincronice el estado.
                  try {
                    window.sessionStorage.setItem('lusti_overlay_dismissed', '1');
                  } catch {
                    /* noop */
                  }
                  if (channelRef.current) {
                    channelRef.current.postMessage({ type: 'TAKE_OVER', fromTabId: tabId });
                  }
                  setShowAlreadyLoggedIn(false);
                }}
                className="w-full rounded-lg border border-white/[0.08] bg-transparent px-4 py-3 text-sm font-medium text-brand-ivory hover:bg-white/[0.04] transition-colors"
              >
                Usar esta ventana de todas formas
              </button>
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Sesion activa en otra pestana
            </p>
          </div>
        </div>
      )}

      {showTakeOverMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-brand-dark p-8 shadow-2xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-brand-ivory mb-2">Cierra esta ventana</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Abriste LUSTI en otra ventana. Para evitar duplicados, por favor cierra esta pestana con la <span className="font-semibold text-brand-ivory">X</span> del navegador.
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Otra ventana tomo el control
            </p>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

export default App;
