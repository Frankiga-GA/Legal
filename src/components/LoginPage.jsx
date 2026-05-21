import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../services/authService';

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

  return (
    <div className="flex min-h-screen overflow-hidden bg-brand-black font-sans text-brand-ivory">
      <div className="relative z-10 flex w-full flex-col justify-center bg-brand-black p-8 md:p-16 lg:w-[45%] lg:p-24">
        <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[400px] w-[400px] rounded-full bg-brand-gold/5 blur-[100px]"></div>

        <div className="mx-auto w-full max-w-md">
          <button
            onClick={onBack}
            className="group mb-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent/40 transition-colors hover:text-brand-gold"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Regresar al Portal
          </button>

          <div className="mb-10">
            <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-gold/20 bg-brand-gold/10 shadow-2xl">
              {isRegistering ? <UserPlus className="h-7 w-7 text-brand-gold" /> : <ShieldCheck className="h-7 w-7 text-brand-gold" />}
            </div>
            <h2 className="mb-4 text-4xl font-serif font-medium tracking-tight text-brand-ivory">
              {isRegistering ? 'Crear cuenta' : 'Portal de Acceso'}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-brand-accent/40">
              Supabase Auth • LUSTI
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            <ModeButton active={mode === 'login'} onClick={() => switchMode('login', setMode, setError, setNotice)}>
              Iniciar sesion
            </ModeButton>
            <ModeButton active={mode === 'register'} onClick={() => switchMode('register', setMode, setError, setNotice)}>
              Crear cuenta
            </ModeButton>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="••••••••"
            />

            {isRegistering && (
              <Field
                icon={Lock}
                label="Confirmar clave"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
              />
            )}

            {notice && (
              <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-[12px] leading-5 text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {notice}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-[12px] font-medium text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-gold py-5 font-bold tracking-tight text-brand-black shadow-[0_20px_40px_rgba(197,160,89,0.15)] transition-all hover:bg-brand-ivory active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Procesando...'
                : isRegistering
                  ? 'Crear cuenta'
                  : 'Inicializar sesion'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-10 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-xs leading-6 text-brand-accent/55">
              {isRegistering
                ? 'Tu cuenta queda lista para conectarse luego a expedientes por usuario y permisos por firma.'
                : 'Ingresa con una cuenta creada en Supabase Auth o crea una nueva desde esta pantalla.'}
            </p>
          </div>
        </div>
      </div>

      <div className="relative hidden flex-1 items-center justify-center p-20 lg:flex">
        <img
          src="/Legal1.jpeg"
          alt="Legal Authority"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-brand-gold/10 mix-blend-overlay"></div>

        <div className="relative z-10 max-w-sm text-center">
          <div className="mx-auto mb-8 h-px w-12 bg-brand-gold"></div>
          <h3 className="mb-6 text-4xl font-serif italic leading-tight text-brand-ivory opacity-90">
            "La justicia es la constante y perpetua voluntad de dar a cada uno su derecho."
          </h3>
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-brand-gold">LUSTI Intelligence</p>
        </div>
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
      <Icon className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/20 transition-all group-focus-within:text-brand-gold" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/[0.05] bg-white/[0.02] py-5 pl-16 pr-6 font-light text-brand-ivory transition-all placeholder:text-brand-accent/10 focus:border-brand-gold/40 focus:bg-white/[0.04] focus:outline-none"
        placeholder={placeholder}
        required
      />
    </div>
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
