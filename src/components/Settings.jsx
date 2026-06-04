import { useEffect, useState } from 'react';
import { Building2, Bot, Plug, Save, RefreshCcw, Unplug } from 'lucide-react';
import {
  clearStoredDriveToken,
  connectGoogleDrive,
  getStoredDriveToken,
  isGoogleDriveConfigured,
  onDriveTokenMessage,
  listDriveFiles,
  listDriveFolders,
} from '../services/googleDriveService';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('firm');

  return (
    <div className="min-h-screen bg-brand-black p-8 md:p-12">
      <div className="mx-auto max-w-5xl space-y-12">
        <header className="space-y-2">
          <h2 className="flex items-center gap-4 text-4xl font-serif font-medium tracking-tight text-brand-ivory">
            Preferencias del Sistema
          </h2>
          <p className="text-sm font-light tracking-wide text-brand-accent/60">Personaliza los parametros operativos de tu entorno legal digital.</p>
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
          {activeSection === 'firm' && <FirmProfile />}
          {activeSection === 'ai' && <AIPreferences />}
          {activeSection === 'integrations' && <Integrations />}
        </div>
      </div>
    </div>
  );
};

const sections = [
  { id: 'firm', label: 'Perfil de Firma', icon: Building2 },
  { id: 'ai', label: 'Nodos de IA', icon: Bot },
  { id: 'integrations', label: 'Conexiones', icon: Plug },
];

const FirmProfile = () => (
  <div className="space-y-10">
    <h3 className="text-2xl font-serif font-medium text-brand-ivory">Informacion de la Firma</h3>
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <ReadOnlyField label="Nombre Legal" value="J&N Asesoria Legal y Consultoria S.A.C." />
      <ReadOnlyField label="RUC" value="20XXXXXXXXX" />
      <EditableField label="Canal de Comunicacion" value="jynconsultoress@gmail.com" />
      <EditableField label="Contacto Directo" value="945088014" />
      <div className="space-y-2 md:col-span-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">Sede Principal</label>
        <input className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none focus:border-brand-gold/40" defaultValue="Calle Grau 227 - Chincha Alta" />
      </div>
    </div>
    <button className="flex items-center gap-3 rounded-xl bg-brand-ivory px-8 py-4 font-bold tracking-tight text-brand-black transition-all hover:bg-white">
      <Save className="h-4 w-4" /> Consolidar Cambios
    </button>
  </div>
);

const AIPreferences = () => (
  <div className="space-y-10">
    <h3 className="text-2xl font-serif font-medium text-brand-ivory">Parametros de Inteligencia</h3>
    <div className="max-w-2xl space-y-8">
      <SelectField label="Tono de Interaccion" options={['Profesional y Analitico', 'Sintetico y Directo', 'Consultivo Explicativo']} />
      <SelectField label="Especializacion de Nodos" options={['Derecho Laboral', 'Derecho Civil', 'Derecho Corporativo']} />
      <ToggleField label="Indexacion automatica de nuevos activos documentales" defaultChecked />
      <ToggleField label="Incluir protocolo de descargo en respuestas generativas" defaultChecked />
    </div>
    <button className="flex items-center gap-3 rounded-xl bg-brand-ivory px-8 py-4 font-bold tracking-tight text-brand-black transition-all hover:bg-white">
      <Save className="h-4 w-4" /> Guardar Preferencias
    </button>
  </div>
);

const Integrations = () => (
  <div className="space-y-10">
    <h3 className="text-2xl font-serif font-medium text-brand-ivory">Conexiones de Red</h3>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <IntegrationCard title="Supabase" description="Infraestructura de datos y autenticacion" status="Conectado" />
      <DriveIntegrationCard />
      <IntegrationCard title="WhatsApp API" description="Protocolo de notificaciones automatizadas" status="Desconectado" />
      <IntegrationCard title="RENIEC / SUNAT" description="Validacion de identidades soberanas" status="Proximamente" />
    </div>
  </div>
);

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
          if (!cancelled) {
            setFolders([]);
            setFiles([]);
          }
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
        if (!cancelled) {
          setError(driveError.message || 'No se pudo leer Drive.');
        }
        console.warn(driveError);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    const unsubscribe = onDriveTokenMessage((nextToken) => {
      if (cancelled) return;
      setToken(nextToken);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [token]);

  useEffect(() => {
    const refresh = () => {
      const nextToken = token || getStoredDriveToken();
      if (nextToken) {
        setToken(nextToken);
      }
    };

    const intervalId = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
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
          <h4 className="text-xl font-serif font-medium text-brand-ivory">Google Drive</h4>
          <p className="mt-2 text-sm font-light leading-relaxed text-brand-accent/40">Boveda de activos documentales externa</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${
          token ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-brand-accent/40'
        }`}>
          {token ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      <div className="mb-6 space-y-2 text-sm text-brand-accent/45">
        <p>{isGoogleDriveConfigured ? 'La cuenta puede autorizarse para leer Drive.' : 'Falta configurar VITE_GOOGLE_OAUTH_CLIENT_ID.'}</p>
        <p>{loading ? 'Sincronizando carpetas y archivos...' : `${folders.length} carpetas y ${files.length} archivos visibles.`}</p>
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
          {token ? 'Reconectar' : 'Conectar Drive'}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <DriveList title="Carpetas" items={folders} />
        <DriveList title="Archivos" items={files} />
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-widest text-brand-accent/35">
        Se sincroniza automaticamente cada 60 segundos y al volver a enfocar la ventana.
      </p>
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

const IntegrationCard = ({ title, description, status }) => (
  <div className="group rounded-lg border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.03]">
    <div className="mb-6 flex items-start justify-between">
      <h4 className="text-xl font-serif font-medium text-brand-ivory">{title}</h4>
      <span
        className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${
          status === 'Conectado'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : status === 'Desconectado'
              ? 'border-white/10 bg-white/5 text-brand-accent/40'
              : 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold'
        }`}
      >
        {status}
      </span>
    </div>
    <p className="mb-8 text-sm font-light leading-relaxed text-brand-accent/40">{description}</p>
    <button className="text-xs font-bold uppercase tracking-widest text-brand-gold transition-colors hover:text-brand-ivory">
      {status === 'Conectado' ? 'Terminar Conexion' : 'Inicializar Enlace'}
    </button>
  </div>
);

const ReadOnlyField = ({ label, value }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">{label}</label>
    <input className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none" value={value} readOnly />
  </div>
);

const EditableField = ({ label, value }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">{label}</label>
    <input className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none focus:border-brand-gold/40" defaultValue={value} />
  </div>
);

const SelectField = ({ label, options }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/40">{label}</label>
    <select className="w-full appearance-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-brand-ivory outline-none focus:border-brand-gold/40">
      {options.map((option) => (
        <option key={option} className="bg-brand-dark">{option}</option>
      ))}
    </select>
  </div>
);

const ToggleField = ({ label, defaultChecked }) => (
  <label className="flex cursor-pointer items-center gap-4">
    <input type="checkbox" defaultChecked={defaultChecked} className="h-5 w-5 rounded border-white/[0.1] bg-white/[0.02] text-brand-gold focus:ring-brand-gold" />
    <span className="text-sm font-light text-brand-accent/60 transition-colors hover:text-brand-ivory">{label}</span>
  </label>
);

export default Settings;
