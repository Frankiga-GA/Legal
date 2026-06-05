// =============================================================================
// src/components/LoginPage.jsx
// =============================================================================
// Pagina de acceso con split layout. Mejoras:
//   - Show/hide password (icono de ojo)
//   - Password strength meter (modo registro)
//   - Checkbox "Recordarme"
//   - Magic link (login sin contrasena por email)
//   - "Olvide mi contrasena" (envia email de recuperacion)
// =============================================================================

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  sendPasswordReset,
} from '../services/authService';

const REMEMBER_KEY = 'lusti-remember-me';
const EMAIL_KEY = 'lusti-last-email';

const LoginPage = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'magic'
  const [email, setEmail] = useState(() => {
    try {
      return window.localStorage.getItem(EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return window.localStorage.getItem(REMEMBER_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === 'register';
  const isMagicLink = mode === 'magic';

  const passwordStrength = useMemo(() => {
    return evaluatePasswordStrength(password);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (isRegistering && password !== confirmPassword) {
      setError('Las claves no coinciden.');
      return;
    }

    if (!isMagicLink && password.length < 6) {
      setError('La clave debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isMagicLink) {
        await signInWithMagicLink({ email });
        setNotice('Te enviamos un link magico a tu correo. Hace click para entrar.');
        return;
      }

      // Marca que el auth se disparo desde esta pestana para que el
      // handler global de auth no muestre el overlay de "sesion duplicada".
      try {
        window.sessionStorage.setItem('lusti_self_auth', '1');
      } catch {
        /* noop */
      }

      if (isRegistering) {
        const result = await signUpWithEmail({ email, password });
        if (result.session) {
          persistSessionPrefs();
          onLogin(result.session);
          return;
        }
        setNotice('Cuenta creada. Revisa tu correo si Supabase solicita confirmacion antes de ingresar.');
        setMode('login');
        setConfirmPassword('');
      } else {
        const session = await signInWithEmail({ email, password });
        persistSessionPrefs();
        onLogin(session);
      }
    } catch (authError) {
      try {
        window.sessionStorage.removeItem('lusti_self_auth');
      } catch {
        /* noop */
      }
      setError(getFriendlyAuthError(authError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const persistSessionPrefs = () => {
    try {
      window.localStorage.setItem(REMEMBER_KEY, rememberMe ? '1' : '0');
      window.localStorage.setItem(EMAIL_KEY, email);
    } catch {
      /* noop */
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Ingresa tu correo para recuperar la clave.');
      return;
    }
    setError('');
    setNotice('');
    setIsSubmitting(true);
    try {
      await sendPasswordReset({ email });
      setNotice('Te enviamos un correo para restablecer tu clave.');
    } catch (authError) {
      setError(getFriendlyAuthError(authError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
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
                {isRegistering
                  ? 'Crea tu espacio legal'
                  : isMagicLink
                    ? 'Entra con un link magico'
                    : 'Accede a tu estudio'}
              </h2>
              <p className="mt-4 text-sm font-light leading-6 text-brand-accent/65">
                {isRegistering
                  ? 'Activa una cuenta para probar expedientes, documentos e IA contextual.'
                  : isMagicLink
                    ? 'Te enviamos un link al correo. Hace click y entras sin escribir clave.'
                    : 'Ingresa para continuar con expedientes, documentos, plazos y asistentes IA.'}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
              <ModeButton active={mode === 'login'} onClick={() => switchMode('login')}>
                Iniciar sesion
              </ModeButton>
              <ModeButton active={mode === 'register'} onClick={() => switchMode('register')}>
                Crear cuenta
              </ModeButton>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field
                icon={Mail}
                label="Correo profesional"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="usuario@firma.com"
                autoComplete="email"
              />

              {!isMagicLink && (
                <PasswordField
                  label="Clave de acceso"
                  value={password}
                  onChange={setPassword}
                  placeholder="********"
                  show={showPassword}
                  onToggleShow={() => setShowPassword((v) => !v)}
                  strength={isRegistering ? passwordStrength : null}
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                />
              )}

              {isRegistering && (
                <Field
                  icon={Lock}
                  label="Confirmar clave"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="********"
                  autoComplete="new-password"
                />
              )}

              {!isRegistering && !isMagicLink && (
                <div className="flex items-center justify-between text-[11px]">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-brand-accent/65">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/[0.15] bg-white/[0.02] text-brand-gold focus:ring-brand-gold focus:ring-offset-0"
                    />
                    Recordarme en este equipo
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isSubmitting}
                    className="text-brand-gold/80 transition-colors hover:text-brand-gold disabled:opacity-50"
                  >
                    Olvide mi clave
                  </button>
                </div>
              )}

              {notice && (
                <div className="flex gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-[12px] leading-5 text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {notice}
                </div>
              )}

              {error && (
                <div className="flex gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-[12px] leading-5 text-red-400">
                  <X className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full items-center justify-center gap-3 rounded-lg bg-brand-gold py-5 font-bold tracking-tight text-brand-black transition-colors hover:bg-brand-ivory active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Enviando...'
                  : isMagicLink
                    ? 'Enviar link al correo'
                    : isRegistering
                      ? 'Crear cuenta'
                      : 'Entrar al workspace'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              {!isMagicLink && (
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-brand-black px-3 text-brand-accent/45">o</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => switchMode(isMagicLink ? 'login' : 'magic')}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] py-3 text-xs font-semibold text-brand-ivory transition-colors hover:border-brand-gold/30 hover:bg-white/[0.04]"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                {isMagicLink ? 'Volver a clave' : 'Entrar con link magico'}
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
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/65 to-slate-950/25"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/25"></div>

          <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-3 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2">
                <Scale className="h-4 w-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-400">Legal Intelligence</span>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                Workspace activo
              </span>
            </div>

            <div className="max-w-2xl">
              <h3 className="text-5xl font-serif font-medium leading-tight text-white">
                Expedientes, documentos y plazos listos para decidir mejor.
              </h3>
              <p className="mt-5 max-w-xl text-base font-light leading-7 text-slate-300">
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

const Field = ({ icon: Icon, label, type, value, onChange, placeholder, autoComplete }) => (
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
        autoComplete={autoComplete}
        required
      />
    </div>
  </div>
);

const PasswordField = ({ label, value, onChange, placeholder, show, onToggleShow, strength, autoComplete }) => (
  <div className="space-y-3">
    <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">{label}</label>
    <div className="group relative">
      <Lock className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/25 transition-all group-focus-within:text-brand-gold" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.025] py-4 pl-14 pr-14 font-light text-brand-ivory transition-all placeholder:text-brand-accent/18 focus:border-brand-gold/40 focus:bg-white/[0.045] focus:outline-none"
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={onToggleShow}
        tabIndex={-1}
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-brand-accent/40 transition-colors hover:bg-white/[0.05] hover:text-brand-ivory"
        aria-label={show ? 'Ocultar clave' : 'Mostrar clave'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
    {strength && value.length > 0 && (
      <PasswordStrength strength={strength} />
    )}
  </div>
);

const PasswordStrength = ({ strength }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-brand-accent/50">Fuerza de la clave</span>
      <span className={`font-semibold ${strength.textClass}`}>{strength.label}</span>
    </div>
    <div className="flex h-1.5 gap-1">
      {[0, 1, 2, 3].map((idx) => (
        <div
          key={idx}
          className={`flex-1 rounded-full transition-colors ${
            idx < strength.score ? strength.barClass : 'bg-white/[0.06]'
          }`}
        />
      ))}
    </div>
    {strength.suggestions.length > 0 && (
      <ul className="space-y-0.5 pt-1 text-[10px] text-brand-accent/55">
        {strength.suggestions.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className={`h-1 w-1 rounded-full ${strength.dotClass}`} />
            {s}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const evaluatePasswordStrength = (pwd = '') => {
  if (!pwd) {
    return { score: 0, label: '', suggestions: [], barClass: '', textClass: '', dotClass: '' };
  }
  let score = 0;
  const suggestions = [];
  if (pwd.length >= 8) score += 1; else suggestions.push('Usa al menos 8 caracteres');
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1; else suggestions.push('Combina mayusculas y minusculas');
  if (/\d/.test(pwd)) score += 1; else suggestions.push('Incluye al menos un numero');
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1; else suggestions.push('Agrega un simbolo (!@#$, etc.)');

  const levels = [
    { label: 'Debil',  barClass: 'bg-red-500',    textClass: 'text-red-300',    dotClass: 'bg-red-400' },
    { label: 'Aceptable', barClass: 'bg-amber-500', textClass: 'text-amber-300', dotClass: 'bg-amber-400' },
    { label: 'Buena',  barClass: 'bg-sky-500',    textClass: 'text-sky-300',    dotClass: 'bg-sky-400' },
    { label: 'Fuerte', barClass: 'bg-emerald-500', textClass: 'text-emerald-300', dotClass: 'bg-emerald-400' },
  ];
  return { score, ...levels[Math.max(0, score - 1)] || levels[0], suggestions };
};

const Signal = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-white/[0.08] bg-brand-black/60 p-4">
    <Icon className="mb-4 h-5 w-5 text-brand-gold" />
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/45">{label}</p>
    <p className="mt-2 text-sm font-semibold text-brand-ivory">{value}</p>
  </div>
);

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
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Demasiados intentos. Espera unos minutos.';
  }
  if (normalized.includes('email rate limit')) {
    return 'Demasiados envios a este correo. Espera unos minutos.';
  }
  return message || 'No se pudo completar la operacion.';
};

export default LoginPage;
