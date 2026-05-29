import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  Globe,
  Lock,
  Mail,
  Scale,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../services/authService';

const LoginPage = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (isRegistering && password !== confirmPassword) {
      setError('Las claves no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La clave debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const result = await signUpWithEmail({ email, password });

        if (result.session) {
          onLogin(result.session);
          return;
        }

        setNotice('Cuenta creada. Revisa tu correo si Supabase solicita confirmacion antes de ingresar.');
        setMode('login');
        setConfirmPassword('');
      } else {
        const session = await signInWithEmail({ email, password });
        onLogin(session);
      }
    } catch (authError) {
      setError(getFriendlyAuthError(authError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      setNotice('Abriendo Google para continuar con el acceso.');
    } catch (authError) {
      setError(getFriendlyAuthError(authError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-brand-black font-sans text-brand-ivory">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative flex flex-col justify-center border-r border-white/[0.06] bg-brand-black px-6 py-8 sm:px-10 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            <button
              onClick={onBack}
              className="group mb-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em] text-brand-accent/45 transition-colors hover:text-brand-gold"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Volver al inicio
            </button>

            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-lg bg-brand-gold p-3 text-brand-black">
                {isRegistering ? <UserPlus className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-serif text-2xl font-bold tracking-tight">LUSTI</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Portal seguro</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory">
                {isRegistering ? 'Crea tu espacio legal' : 'Accede a tu estudio'}
              </h2>
              <p className="mt-4 text-sm font-light leading-6 text-brand-accent/65">
                {isRegistering
                  ? 'Activa una cuenta para probar expedientes, documentos e IA contextual.'
                  : 'Ingresa para continuar con expedientes, documentos, plazos y asistentes IA.'}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
              <ModeButton active={mode === 'login'} onClick={() => switchMode('login', setMode, setError, setNotice)}>
                Iniciar sesion
              </ModeButton>
              <ModeButton active={mode === 'register'} onClick={() => switchMode('register', setMode, setError, setNotice)}>
                Crear cuenta
              </ModeButton>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="mb-6 flex w-full items-center justify-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] py-4 font-bold tracking-tight text-brand-ivory transition-all hover:border-brand-gold/30 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Globe className="h-5 w-5 text-brand-gold" />
              Continuar con Google
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.08]"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-accent/35">o con correo</span>
              <div className="h-px flex-1 bg-white/[0.08]"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field
                icon={Mail}
                label="Correo profesional"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="usuario@firma.com"
              />

              <Field
                icon={Lock}
                label="Clave de acceso"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="********"
              />

              {isRegistering && (
                <Field
                  icon={Lock}
                  label="Confirmar clave"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="********"
                />
              )}

              {notice && (
                <div className="flex gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-[12px] leading-5 text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {notice}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-[12px] font-medium text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full items-center justify-center gap-3 rounded-lg bg-brand-gold py-5 font-bold tracking-tight text-brand-black transition-colors hover:bg-brand-ivory active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Procesando...'
                  : isRegistering
                    ? 'Crear cuenta'
                    : 'Entrar al workspace'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-8 rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-xs leading-6 text-brand-accent/55">
                {isRegistering
                  ? 'La cuenta queda lista para conectarse luego a una firma, roles y permisos por organizacion.'
                  : 'Acceso conectado a Supabase Auth. La sesion abre el panel privado de LUSTI.'}
              </p>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden lg:block">
          <img
            src="/Lega2.jpeg"
            alt="Firma legal usando LUSTI"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/65 to-brand-black/25"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-brand-black/25"></div>

          <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-3 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-4 py-2">
                <Scale className="h-4 w-4 text-brand-gold" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-gold">Legal Intelligence</span>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                Workspace activo
              </span>
            </div>

            <div className="max-w-2xl">
              <h3 className="text-5xl font-serif font-medium leading-tight text-white">
                Expedientes, documentos y plazos listos para decidir mejor.
              </h3>
              <p className="mt-5 max-w-xl text-base font-light leading-7 text-brand-accent/75">
                La primera impresion debe sentirse como una herramienta que un estudio legal podria usar manana: clara, sobria y orientada a resultados.
              </p>
            </div>

            <div className="grid max-w-3xl grid-cols-3 gap-4">
              <Signal icon={FileText} label="Documentos" value="Lectura asistida" />
              <Signal icon={Bot} label="IA legal" value="Contexto por caso" />
              <Signal icon={ShieldCheck} label="Control" value="Datos privados" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const ModeButton = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] transition-all ${
      active
        ? 'bg-brand-ivory text-brand-black'
        : 'text-brand-accent/45 hover:bg-white/[0.04] hover:text-brand-ivory'
    }`}
  >
    {children}
  </button>
);

const Field = ({ icon: Icon, label, type, value, onChange, placeholder }) => (
  <div className="space-y-3">
    <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">{label}</label>
    <div className="group relative">
      <Icon className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/25 transition-all group-focus-within:text-brand-gold" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.025] py-4 pl-14 pr-5 font-light text-brand-ivory transition-all placeholder:text-brand-accent/18 focus:border-brand-gold/40 focus:bg-white/[0.045] focus:outline-none"
        placeholder={placeholder}
        required
      />
    </div>
  </div>
);

const Signal = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-white/[0.08] bg-brand-black/60 p-4">
    <Icon className="mb-4 h-5 w-5 text-brand-gold" />
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/45">{label}</p>
    <p className="mt-2 text-sm font-semibold text-brand-ivory">{value}</p>
  </div>
);

const switchMode = (nextMode, setMode, setError, setNotice) => {
  setMode(nextMode);
  setError('');
  setNotice('');
};

const getFriendlyAuthError = (message = '') => {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Correo o clave incorrectos.';
  }

  if (normalized.includes('already registered') || normalized.includes('user already registered')) {
    return 'Este correo ya tiene una cuenta. Intenta iniciar sesion.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesion.';
  }

  return message || 'No se pudo completar la operacion.';
};

export default LoginPage;
