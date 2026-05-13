import { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

const LoginPage = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('admin@jynlegal.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'admin@jynlegal.com' && password === 'admin123') {
      onLogin();
    } else {
      setError('Credenciales no autorizadas. Verifique los parámetros de acceso.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex overflow-hidden font-sans">
      
      {/* Left Side: Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center p-8 md:p-16 lg:p-24 relative z-10 bg-brand-black">
        {/* Background Orbs for the form side */}
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-md w-full mx-auto">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="group mb-12 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-brand-accent/40 hover:text-brand-gold transition-colors font-bold"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Regresar al Portal
          </button>

          <div className="mb-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 mb-8 shadow-2xl">
              <ShieldCheck className="w-7 h-7 text-brand-gold" />
            </div>
            <h2 className="text-4xl font-serif font-medium text-brand-ivory tracking-tight mb-4">Portal de Acceso</h2>
            <p className="text-brand-accent/40 font-bold text-[10px] uppercase tracking-[0.4em]">Soberanía de Datos &bull; Legal KMS</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold ml-1">Identificador Profesional</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/20 group-focus-within:text-brand-gold transition-all" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl focus:outline-none focus:border-brand-gold/40 focus:bg-white/[0.04] transition-all text-brand-ivory placeholder:text-brand-accent/10 font-light"
                  placeholder="admin@jynlegal.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold">Clave de Encriptación</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/20 group-focus-within:text-brand-gold transition-all" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl focus:outline-none focus:border-brand-gold/40 focus:bg-white/[0.04] transition-all text-brand-ivory placeholder:text-brand-accent/10 font-light"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px] font-medium text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-brand-gold text-brand-black rounded-2xl hover:bg-brand-ivory transition-all font-bold tracking-tight shadow-[0_20px_40px_rgba(197,160,89,0.15)] flex items-center justify-center gap-3 group active:scale-[0.98]"
            >
              Inicializar Sesión
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-24 border-t border-white/[0.05] pt-10">
            <p className="text-[9px] uppercase tracking-[0.3em] text-brand-accent/20 font-bold mb-6">
              Sistemas de Inteligencia v4.2 &bull; 2026
            </p>
            <div className="flex gap-8 text-[9px] uppercase tracking-widest text-brand-accent/40 font-bold">
              <button className="hover:text-brand-gold transition-colors">Seguridad</button>
              <button className="hover:text-brand-gold transition-colors">Privacidad</button>
              <button className="hover:text-brand-gold transition-colors">Soporte</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Hero Image */}
      <div className="hidden lg:flex relative flex-1 items-center justify-center p-20">
        <img 
          src="/Legal1.jpeg" 
          alt="Legal Authority" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-brand-gold/10 mix-blend-overlay"></div>
        
        {/* Subtle Decorative Elements on image */}
        <div className="relative z-10 max-w-sm text-center">
          <div className="w-12 h-px bg-brand-gold mb-8 mx-auto"></div>
          <h3 className="text-4xl font-serif text-brand-ivory leading-tight mb-6 italic opacity-90 text-shadow-lg">"La justicia es la constante y perpetua voluntad de dar a cada uno su derecho."</h3>
          <p className="text-[11px] uppercase tracking-[0.5em] text-brand-gold font-bold">Harvey Jurisprudence</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
