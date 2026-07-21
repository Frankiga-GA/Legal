// src/components/Settings.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Bot,
  Plug,
  Save,
  RefreshCcw,
  Unplug,
  CheckCircle2,
  Database,
  Bell,
  AlertTriangle,
  Moon,
  Sun,
  Loader2,
  X,
  Eye,
} from 'lucide-react';
import {
  clearStoredDriveToken,
  connectGoogleDrive,
  getStoredDriveToken,
  isGoogleDriveConfigured,
  onDriveTokenMessage,
  listDriveFiles,
  listDriveFolders,
} from '../services/googleDriveService';
import { isSupabaseConfigured, supabase } from '../utils/supabase';
import { useTheme } from '../hooks/useTheme';
import {
  loadAllPreferencesAsync,
  saveAiPreferencesAsync,
  saveFirmProfileAsync,
  saveNotificationPreferencesAsync,
} from '../services/userPreferencesStore';

const TONE_OPTIONS = [
  { value: 'profesional', label: 'Profesional y analitico' },
  { value: 'directo',     label: 'Sintetico y directo' },
  { value: 'consultivo',  label: 'Consultivo explicativo' },
];

const URGENCY_OPTIONS = ['Baja', 'Media', 'Alta'];

const Settings = ({ session }) => {
  const [activeSection, setActiveSection] = useState('firm');
  const userId = session?.user?.id || null;
  const userEmail = session?.user?.email || '';

  return (
    <div className="min-h-screen bg-brand-black p-8 md:p-12">
      <div className="mx-auto max-w-5xl space-y-12">
        <header className="space-y-2">
          <h2 className="flex items-center gap-4 text-4xl font-serif font-medium tracking-tight text-brand-ivory">
            Preferencias del Sistema
          </h2>
          <p className="text-sm font-light tracking-wide text-brand-accent/60">
            Sesion activa: <span className="text-brand-ivory">{userEmail || 'Sin sesion'}</span>
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 rounded-full border px-6 py-3 text-sm font-medium tracking-tight transition-all ${
                activeSection === section.id
                  ? 'border-brand-ivory bg-brand-ivory text-brand-black'
                  : 'border-white/[0.05] bg-white/[0.02] text-brand-accent/60 hover:bg-white/[0.05]'
              }`}
            >
              <section.icon className="h-4 w-4" />
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-8 md:p-10">
          {activeSection === 'firm' && <FirmProfile userId={userId} userEmail={userEmail} />}
          {activeSection === 'ai' && <AIPreferences userId={userId} />}
          {activeSection === 'notifications' && <NotificationPreferences userId={userId} />}
          {activeSection === 'integrations' && <Integrations userEmail={userEmail} />}
        </div>
      </div>
    </div>
  );
};

const sections = [
  { id: 'firm', label: 'Perfil de Firma', icon: Building2 },
  { id: 'ai', label: 'Preferencias de IA', icon: Bot },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'integrations', label: 'Conexiones', icon: Plug },
];

// Helper for compressing images before converting to base64
const compressImage = (file, maxWidth = 1200) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        let width = img.width;
        let height = img.height;
        
        if (scaleSize < 1) {
          width = maxWidth;
          height = img.height * scaleSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to 80% quality JPEG (much smaller than PNG base64)
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

const FirmProfile = ({ userId, userEmail }) => {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [editorHeaderHeight, setEditorHeaderHeight] = useState(90);
  const [editorFooterHeight, setEditorFooterHeight] = useState(70);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      const prefs = await loadAllPreferencesAsync(userId);
      setProfile(prefs.firm);
      setIsLoading(false);
    };
    loadProfile();
  }, [userId]);

  const update = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleOpenVisualEditor = () => {
    setEditorHeaderHeight(profile.headerHeight || 90);
    setEditorFooterHeight(profile.footerHeight || 70);
    setShowVisualEditor(true);
  };

  const handleSaveVisualEditor = () => {
    update('headerHeight', editorHeaderHeight);
    update('footerHeight', editorFooterHeight);
    setShowVisualEditor(false);
  };

  const handleSave = async () => {
    const success = await saveFirmProfileAsync(userId, profile);
    if (success) {
      setSaved(true);
      toast.success('Perfil guardado exitosamente en la nube');
      window.setTimeout(() => setSaved(false), 2500);
    } else {
      toast.error('Error al guardar. Verifica tu conexión o sesión.');
    }
  };

  if (isLoading || !profile) {
    return <div className="p-10 flex justify-center text-brand-accent/50"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  const handleImageUpload = async (field, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Si la imagen es muy grande (más de 500kb), la comprimimos
    if (file.size > 500 * 1024) {
      toast('Comprimiendo imagen...', { icon: '🔄' });
      const compressedBase64 = await compressImage(file);
      update(field, compressedBase64);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        update(field, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-2xl font-serif font-medium text-brand-ivory">Informacion de la Firma</h3>
        <p className="mt-2 text-sm text-brand-accent/50">
          Estos datos se usan para identificar al estudio en los escritos y reportes. Se guardan localmente y solo tu los ves.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Field label="Nombre del Estudio" value={profile.firmName} onChange={(v) => update('firmName', v)} placeholder="Estudio Juridico Garcia & Asociados" />
        <Field label="Abogado a cargo" value={profile.lawyerName} onChange={(v) => update('lawyerName', v)} placeholder="Juan Perez Garcia" />
        <Field label="N° de Colegiatura (CAL)" value={profile.calNumber} onChange={(v) => update('calNumber', v)} placeholder="CAL 12345" />
        <Field label="Ciudad" value={profile.city} onChange={(v) => update('city', v)} placeholder="Lima" />
        <Field label="Direccion" value={profile.address} onChange={(v) => update('address', v)} placeholder="Av. Javier Prado 123, San Isidro" />
        <Field label="Telefono" value={profile.phone} onChange={(v) => update('phone', v)} placeholder="+51 999 888 777" />
        <Field label="Email de contacto" value={profile.contactEmail || userEmail} onChange={(v) => update('contactEmail', v)} placeholder="contacto@estudio.com" />
      </div>

      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-t border-white/[0.05] pt-8">
          <h4 className="text-lg font-serif font-medium text-brand-ivory">Identidad Visual (Membretes)</h4>
          <button
            onClick={handleOpenVisualEditor}
            className="mt-3 md:mt-0 inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-3 py-1.5 text-xs font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
          >
            <Eye className="h-4 w-4" />
            Ajustar Tamaño Visualmente
          </button>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold tracking-wide text-brand-accent/80 uppercase">Membrete Superior (Header)</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload('headerBase64', e)} className="block w-full text-sm text-brand-accent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-gold file:text-brand-black hover:file:bg-brand-ivory cursor-pointer" />
            {profile.headerBase64 && <img src={profile.headerBase64} alt="Header" className="mt-4 h-16 w-full object-contain bg-white rounded-lg p-2" />}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold tracking-wide text-brand-accent/80 uppercase">Pie de Página (Footer)</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload('footerBase64', e)} className="block w-full text-sm text-brand-accent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-gold file:text-brand-black hover:file:bg-brand-ivory cursor-pointer" />
            {profile.footerBase64 && <img src={profile.footerBase64} alt="Footer" className="mt-4 h-12 w-full object-contain bg-white rounded-lg p-2" />}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-3 rounded-xl bg-brand-ivory px-8 py-4 font-bold tracking-tight text-brand-black transition-all hover:bg-white"
        >
          <Save className="h-4 w-4" />
          Guardar perfil
        </button>
        {saved && (
          <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Guardado
          </span>
        )}
      </div>

      {/* MODAL EDITOR VISUAL */}
      {showVisualEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-white/[0.08] bg-brand-dark p-6 shadow-2xl flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-hidden">
            {/* Controles */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-medium text-brand-ivory">Editor Visual de Membretes</h3>
                <button onClick={() => setShowVisualEditor(false)} className="rounded-full p-2 text-brand-accent/40 hover:bg-white/[0.05]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-brand-accent">Ajusta la altura de los membretes. La vista previa representa una hoja A4 real y se aplicará a tus PDFs.</p>
              
              <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-accent mb-2 flex justify-between">
                    <span>Altura Header</span>
                    <span className="text-brand-gold">{editorHeaderHeight}px</span>
                  </label>
                  <input type="range" min="30" max="250" value={editorHeaderHeight} onChange={(e) => setEditorHeaderHeight(Number(e.target.value))} className="w-full accent-brand-gold" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-accent mb-2 flex justify-between">
                    <span>Altura Footer</span>
                    <span className="text-brand-gold">{editorFooterHeight}px</span>
                  </label>
                  <input type="range" min="30" max="250" value={editorFooterHeight} onChange={(e) => setEditorFooterHeight(Number(e.target.value))} className="w-full accent-brand-gold" />
                </div>
              </div>
              
              <div className="pt-6">
                <button onClick={handleSaveVisualEditor} className="w-full flex justify-center items-center gap-2 rounded-xl bg-brand-gold px-6 py-3 font-bold text-brand-black hover:bg-brand-ivory transition-colors">
                  Aplicar y Cerrar
                </button>
              </div>
            </div>

            {/* Vista Previa A4 */}
            <div className="flex-1 flex justify-center items-center bg-black/40 rounded-xl p-4 overflow-hidden">
              <div className="relative bg-white shadow-2xl w-full max-w-[320px] aspect-[1/1.414] overflow-hidden">
                {profile?.headerBase64 ? (
                  <img src={profile.headerBase64} alt="Header Preview" style={{ height: `${editorHeaderHeight * 0.5}px` }} className="w-full object-contain object-top absolute top-0 left-0 right-0" />
                ) : (
                  <div style={{ height: `${editorHeaderHeight * 0.5}px` }} className="w-full absolute top-0 bg-gray-200 border-b border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-500">Header</div>
                )}
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-20 pointer-events-none">
                  <div className="w-full h-2 bg-gray-400 mb-2 rounded"></div>
                  <div className="w-full h-2 bg-gray-400 mb-2 rounded"></div>
                  <div className="w-3/4 h-2 bg-gray-400 mb-2 rounded self-start"></div>
                  <div className="w-full h-2 bg-gray-400 mb-2 rounded mt-4"></div>
                  <div className="w-full h-2 bg-gray-400 mb-2 rounded"></div>
                  <div className="w-5/6 h-2 bg-gray-400 mb-2 rounded self-start"></div>
                </div>

                {profile?.footerBase64 ? (
                  <img src={profile.footerBase64} alt="Footer Preview" style={{ height: `${editorFooterHeight * 0.5}px` }} className="w-full object-contain object-bottom absolute bottom-0 left-0 right-0" />
                ) : (
                  <div style={{ height: `${editorFooterHeight * 0.5}px` }} className="w-full absolute bottom-0 bg-gray-200 border-t border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-500">Footer</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Preferencias de IA
// ============================================================================
const AIPreferences = ({ userId }) => {
  const [prefs, setPrefs] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      const allPrefs = await loadAllPreferencesAsync(userId);
      setPrefs(allPrefs.ai);
      setIsLoading(false);
    };
    loadProfile();
  }, [userId]);

  const update = (field, value) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const success = await saveAiPreferencesAsync(userId, prefs);
    if (success) {
      setSaved(true);
      toast.success('Preferencias de IA guardadas');
      window.setTimeout(() => setSaved(false), 2500);
    } else {
      toast.error('Error al guardar. Verifica tu conexión.');
    }
  };

  if (isLoading || !prefs) {
    return <div className="p-10 flex justify-center text-brand-accent/50"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-2xl font-serif font-medium text-brand-ivory">Apariencia</h3>
        <p className="mt-2 text-sm text-brand-accent/50">
          Cambia entre el tema oscuro (por defecto) o claro para reducir el cansancio visual.
        </p>
      </div>

      <div className="max-w-2xl">
        <AppearanceCard />
      </div>

      <div>
        <h3 className="text-2xl font-serif font-medium text-brand-ivory">Preferencias de Inteligencia Artificial</h3>
        <p className="mt-2 text-sm text-brand-accent/50">
          Define como se comporta la IA por defecto en tus expedientes.
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        <SelectField
          label="Tono de las respuestas"
          value={prefs.tone}
          onChange={(v) => update('tone', v)}
          options={TONE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <SelectField
          label="Urgencia por defecto al crear un expediente"
          value={prefs.defaultUrgency}
          onChange={(v) => update('defaultUrgency', v)}
          options={URGENCY_OPTIONS.map((o) => ({ value: o, label: o }))}
        />
        <ToggleField
          label="Analisis IA automatico al cargar PDFs"
          description="La IA extrae resumen, plazos y enlaces de audiencia de cada PDF."
          checked={prefs.autoIndexDocuments}
          onChange={(v) => update('autoIndexDocuments', v)}
        />
        <ToggleField
          label="Analisis IA automatico del Radar Normativo"
          description="Al cargar El Peruano, las 3-4 normas mas relevantes se analizan solas en background."
          checked={prefs.autoAnalyzeNewNorms}
          onChange={(v) => update('autoAnalyzeNewNorms', v)}
        />
        <ToggleField
          label="Guardar historial de chat por expediente"
          description="Las conversaciones con la IA se persisten en Supabase y reaparecen al reabrir el caso."
          checked={prefs.saveChatHistory}
          onChange={(v) => update('saveChatHistory', v)}
        />
      </div>

      <div className="rounded-lg border border-white/[0.05] bg-black/20 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Proveedor actual</p>
        <p className="mt-2 text-sm text-brand-ivory/80">
          Groq &middot; modelo <span className="font-mono text-brand-gold">llama-3.3-70b-versatile</span>
        </p>
        <p className="mt-1 text-xs text-brand-accent/45">
          El cambio de modelo o proveedor se hace desde variables de entorno del backend (.env).
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-3 rounded-xl bg-brand-ivory px-8 py-4 font-bold tracking-tight text-brand-black transition-all hover:bg-white"
        >
          <Save className="h-4 w-4" />
          Guardar preferencias
        </button>
        {saved && (
          <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Guardado
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Notificaciones
// ============================================================================
const NotificationPreferences = ({ userId }) => {
  const [prefs, setPrefs] = useState(null);
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      const allPrefs = await loadAllPreferencesAsync(userId);
      setPrefs(allPrefs.notifications);
      setIsLoading(false);
    };
    loadProfile();
  }, [userId]);

  const update = async (field, value) => {
    const next = { ...prefs, [field]: value };
    setPrefs(next);
    setSaved(false);
    const success = await saveNotificationPreferencesAsync(userId, next);
    if (success) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } else {
      toast.error('Error al guardar notificaciones. Verifica tu conexión.');
    }
  };

  if (isLoading || !prefs) {
    return <div className="p-10 flex justify-center text-brand-accent/50"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-2xl font-serif font-medium text-brand-ivory">Notificaciones</h3>
        <p className="mt-2 text-sm text-brand-accent/50">
          Controla como LUSTI te avisa cuando hay algo importante.
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        {permission === 'unsupported' ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            Tu navegador no soporta notificaciones del sistema.
          </div>
        ) : (
          <div className="rounded-lg border border-white/[0.05] bg-black/20 p-5">
            <p className="text-sm text-brand-ivory/80">
              Estado del permiso:{' '}
              <span className={`font-bold ${permission === 'granted' ? 'text-emerald-400' : 'text-amber-300'}`}>
                {permission === 'granted' ? 'Concedido' : permission === 'denied' ? 'Bloqueado' : 'Pendiente'}
              </span>
            </p>
            {permission === 'default' && (
              <button
                onClick={requestPermission}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-gold transition-colors hover:bg-brand-gold/15"
              >
                Solicitar permiso
              </button>
            )}
            {permission === 'denied' && (
              <p className="mt-2 text-xs text-brand-accent/60">
                Para reactivar las notificaciones, desbloquealas desde la configuracion de tu navegador.
              </p>
            )}
          </div>
        )}

        <ToggleField
          label="Avisarme 24h antes de un plazo critico"
          description="Para expedientes con fechas pendientes. Las notificaciones salen cuando abris la app o volves a la pestaña."
          checked={prefs.deadlineAlerts}
          onChange={(v) => update('deadlineAlerts', v)}
        />

        <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] p-4">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-4 w-4 text-brand-accent" />
            <div>
              <p className="text-sm font-medium text-brand-ivory/80">Radar Normativo</p>
              <p className="mt-1 text-xs text-brand-accent/60">
                Proximamente: avisos automaticos cuando aparezcan normas relevantes para tus expedientes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {saved ? (
        <p className="inline-flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Guardado
        </p>
      ) : null}
    </div>
  );
};

// ============================================================================
// Conexiones (solo Supabase y Google Drive)
// ============================================================================
const Integrations = ({ userEmail }) => {
  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-2xl font-serif font-medium text-brand-ivory">Conexiones</h3>
        <p className="mt-2 text-sm text-brand-accent/50">
          Servicios externos vinculados a tu cuenta.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SupabaseCard userEmail={userEmail} />
        <DriveIntegrationCard />
      </div>
    </div>
  );
};

const SupabaseCard = ({ userEmail }) => {
  const [info, setInfo] = useState({ status: 'checking', detail: '' });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (!cancelled) setInfo({ status: 'local', detail: 'Supabase no esta configurado en este entorno.' });
        return;
      }
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error || !data?.user) {
          setInfo({ status: 'desconectado', detail: error?.message || 'Sin sesion activa.' });
        } else {
          setInfo({ status: 'conectado', detail: data.user.email || 'Sesion activa' });
        }
      } catch (err) {
        if (!cancelled) setInfo({ status: 'desconectado', detail: err?.message || 'Error de conexion.' });
      }
    };
    run();
    return () => { cancelled = true; };
  }, [userEmail]);

  const tone =
    info.status === 'conectado'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
      : info.status === 'local'
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
        : 'border-red-400/20 bg-red-500/10 text-red-300';

  return (
    <div className="group rounded-lg border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.03]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h4 className="flex items-center gap-2 text-xl font-serif font-medium text-brand-ivory">
            <Database className="h-5 w-5 text-brand-gold" />
            Supabase
          </h4>
          <p className="mt-2 text-sm font-light leading-relaxed text-brand-accent/40">
            Autenticacion, base de datos y sincronizacion de expedientes.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${tone}`}>
          {info.status === 'checking' ? 'Verificando' : info.status === 'conectado' ? 'Conectado' : info.status === 'local' ? 'Local' : 'Desconectado'}
        </span>
      </div>
      <p className="text-sm text-brand-accent/60">{info.detail || 'Sondeando sesion...'}</p>
    </div>
  );
};

const DriveIntegrationCard = () => {
  const [token, setToken] = useState(() => getStoredDriveToken());
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const nextToken = token || getStoredDriveToken();
        if (!nextToken) {
          if (!cancelled) { setFolders([]); setFiles([]); }
          return;
        }
        const [nextFolders, nextFiles] = await Promise.all([
          listDriveFolders(nextToken),
          listDriveFiles(nextToken),
        ]);
        if (!cancelled) {
          setFolders(nextFolders);
          setFiles(nextFiles);
        }
      } catch (driveError) {
        if (!cancelled) setError(driveError.message || 'No se pudo leer Drive.');
        console.warn(driveError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    const unsubscribe = onDriveTokenMessage((nextToken) => { if (!cancelled) setToken(nextToken); });
    return () => { cancelled = true; unsubscribe(); };
  }, [token]);

  const connect = async () => {
    setError('');
    setLoading(true);
    try {
      const nextToken = await connectGoogleDrive();
      setToken(nextToken);
      const [nextFolders, nextFiles] = await Promise.all([listDriveFolders(nextToken), listDriveFiles(nextToken)]);
      setFolders(nextFolders);
      setFiles(nextFiles);
    } catch (driveError) {
      setError(driveError.message || 'No se pudo conectar Drive.');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    clearStoredDriveToken();
    setToken(null);
    setFolders([]);
    setFiles([]);
    setError('');
  };

  return (
    <div className="group rounded-lg border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.03]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h4 className="flex items-center gap-2 text-xl font-serif font-medium text-brand-ivory">
            <span>Conectar con Google</span>
            <span className="text-base" title="Google Drive">📁</span>
            <span className="text-base" title="Google Calendar">📅</span>
          </h4>
          <p className="mt-2 text-sm font-light leading-relaxed text-brand-accent/40">
            Acceso a Google Drive y Google Calendar
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${
          token ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-brand-accent/40'
        }`}>
          {token ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      <div className="mb-6 space-y-2 text-sm text-brand-accent/45">
        <p>{isGoogleDriveConfigured ? 'La cuenta puede autorizarse para acceder a Drive y Calendar.' : 'Falta configurar VITE_GOOGLE_OAUTH_CLIENT_ID.'}</p>
      </div>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={connect}
          disabled={loading || !isGoogleDriveConfigured}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gold px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-black transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className="h-4 w-4" />
          {token ? 'Reconectar' : 'Conectar Google'}
        </button>
        <button
          type="button"
          onClick={disconnect}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30"
        >
          <Unplug className="h-4 w-4" />
          Desconectar
        </button>
      </div>
    </div>
  );
};

const DriveList = ({ title, items }) => (
  <div className="rounded-lg border border-white/[0.05] bg-black/20 p-4">
    <div className="mb-4 flex items-center justify-between">
      <h5 className="text-sm font-bold uppercase tracking-widest text-brand-gold">{title}</h5>
      <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">{items.length}</span>
    </div>
    <div className="max-h-72 space-y-2 overflow-y-auto">
      {items.length ? items.map((item) => (
        <a
          key={item.id}
          href={item.webViewLink || '#'}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:border-brand-gold/30 hover:bg-white/[0.04]"
        >
          <div className="text-sm text-brand-ivory">{item.name}</div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-brand-accent/35">{item.mimeType || 'Google Drive'}</div>
        </a>
      )) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center text-sm text-brand-accent/35">
          Nada conectado aun.
        </div>
      )}
    </div>
  </div>
);

// ============================================================================
// Helpers
// ============================================================================
const Field = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">{label}</label>
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none placeholder:text-brand-accent/25 focus:border-brand-gold/40"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none focus:border-brand-gold/40"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-brand-dark">
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const ToggleField = ({ label, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-start gap-4">
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 h-5 w-5 rounded border-white/[0.1] bg-white/[0.02] text-brand-gold focus:ring-brand-gold"
    />
    <span className="flex-1">
      <span className="block text-sm font-light text-brand-ivory transition-colors">{label}</span>
      {description && (
        <span className="mt-1 block text-xs text-brand-accent/45">{description}</span>
      )}
    </span>
  </label>
);

const AppearanceCard = () => {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: 'dark', label: 'Oscuro', icon: Moon, hint: 'Fondo negro, ideal para uso prolongado.' },
    { value: 'light', label: 'Claro', icon: Sun, hint: 'Fondo blanco, menor cansancio en ambientes iluminados.' },
  ];
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">
        Tema del sistema
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                isActive
                  ? 'border-brand-gold/60 bg-brand-gold/10'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-gold' : 'text-brand-ivory'}`} />
                <span className="text-sm font-semibold text-brand-ivory">{opt.label}</span>
                {isActive && (
                  <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-gold">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-brand-accent/60">{opt.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
