import { ArrowRight, Shield, Zap, Database, Search } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-brand-black text-brand-ivory selection:bg-brand-gold/30 overflow-x-hidden relative">
      {/* Mesh Background & Grid */}
      <div className="fixed inset-0 mesh-gradient opacity-40 pointer-events-none z-0"></div>
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none z-0"></div>
      
      {/* Floating Decorative Shapes */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[120px] animate-pulse-slow z-0"></div>
      <div className="fixed bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-float z-0"></div>

      {/* Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-50"></div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-4 animate-fade-in shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse shadow-[0_0_10px_rgba(197,160,89,1)]"></span>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-accent">Sistemas de Inteligencia Legal v4.2</span>
          </div>

          <h1 className="text-6xl md:text-9xl font-serif font-medium leading-[1] tracking-tighter premium-gradient-text">
            IA Profesional <br />
            <span className="italic font-light opacity-80">para el Derecho.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-2xl text-brand-accent/60 font-light leading-relaxed">
            Automatización de alto nivel diseñada para firmas de élite.
            Indexa bibliotecas extensas y obtén respuestas con precisión jurisprudencial.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-10">
            <button
              onClick={onGetStarted}
              className="group relative px-10 py-5 bg-brand-ivory text-brand-black rounded-full font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-white/20"
            >
              Comenzar Ahora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 rounded-full border border-white/10 hover:bg-white/5 transition-all font-bold text-brand-ivory/80 hover:text-white backdrop-blur-sm">
              Ver Documentación
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 opacity-30">
          <span className="text-[10px] uppercase tracking-[0.5em] font-bold">Explorar</span>
          <div className="w-[1px] h-20 bg-gradient-to-b from-brand-gold via-brand-gold/50 to-transparent"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-40 px-6 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-brand-gold" />}
            title="Asistente Cognitivo"
            description="Interfaz de IA generativa con razonamiento jurídico avanzado y citas automáticas de fuentes oficiales."
          />
          <FeatureCard
            icon={<Database className="w-8 h-8 text-brand-gold" />}
            title="Bóveda de Datos"
            description="Indexación semántica de todo tu historial documental para una recuperación instantánea de precedentes."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-brand-gold" />}
            title="Soberanía Total"
            description="Infraestructura privada alineada con los estándares de seguridad SOC 2 para la máxima confidencialidad."
          />
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-40 px-6 relative overflow-hidden">
        {/* Background Decorative Shapes */}
        <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute left-[10%] bottom-0 w-64 h-64 border border-brand-gold/10 rounded-full animate-rotate-slow pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24 relative z-10">
          <div className="flex-1 space-y-10">
            <div className="w-16 h-px bg-brand-gold"></div>
            <h2 className="text-5xl md:text-7xl font-serif font-medium leading-tight">
              Experiencia en <br /> <span className="italic">Dominios Críticos.</span>
            </h2>
            <p className="text-xl md:text-2xl text-brand-accent/50 font-light leading-relaxed">
              Nuestros modelos están calibrados con jurisprudencia de alto impacto, asegurando resultados que cumplen con los estándares procesales más exigentes.
            </p>
            <ul className="space-y-6">
              {[
                { icon: Search, text: "Investigación multijurisdiccional en tiempo real." },
                { icon: Shield, text: "Protocolos de cifrado de grado militar." },
                { icon: Database, text: "Integración nativa con sistemas de gestión legal." }
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-6 group">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-brand-gold/50 transition-colors">
                    <item.icon className="w-6 h-6 text-brand-gold" />
                  </div>
                  <span className="text-lg text-brand-ivory/70 group-hover:text-brand-ivory transition-colors font-light">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 relative group">
            <div className="absolute inset-[-20px] bg-brand-gold/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            {/* Abstract Geometric Decoration behind image */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-brand-gold/5 rounded-full animate-pulse-slow"></div>
            <div className="absolute -bottom-10 -right-10 w-60 h-60 border border-white/5 rounded-full"></div>

            <div className="relative p-2 bg-gradient-to-br from-white/10 to-transparent rounded-[2.5rem] shadow-2xl backdrop-blur-3xl">
              <img
                src="/Lega2.jpeg"
                alt="Assistant Visualization"
                className="rounded-[2rem] w-full shadow-2xl transition-all duration-1000 group-hover:scale-[1.01] grayscale-[0.2] group-hover:grayscale-0"
              />
            </div>
            
            {/* Floating UI Elements over image */}
            <div className="absolute -top-10 -right-10 p-6 glass-card rounded-2xl animate-float hidden md:block">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-accent">Análisis Completado</p>
                  <p className="text-sm font-bold">Precisión: 99.8%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Trust Section */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Casos Procesados", value: "2M+" },
            { label: "Precisión Legal", value: "99.9%" },
            { label: "Seguridad Bancaria", value: "AES-256" },
            { label: "Ahorro de Tiempo", value: "85%" }
          ].map((stat, idx) => (
            <div key={idx} className="space-y-2">
              <p className="text-3xl md:text-5xl font-serif text-brand-gold">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent/40 font-bold">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 border-t border-white/5 text-center relative z-10">
        <div className="mb-10 flex justify-center gap-8 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <span className="text-2xl font-serif">HARVEY</span>
          <span className="text-2xl font-serif">LEXIS</span>
          <span className="text-2xl font-serif">WESTLAW</span>
        </div>
        <p className="text-brand-accent/20 text-[10px] uppercase tracking-[0.5em] font-bold">
          &copy; 2026 Legal KMS &bull; Excelencia en Inteligencia Computacional
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="glass-card p-10 rounded-3xl group relative overflow-hidden">
    {/* Abstract background shape in card */}
    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-brand-gold/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
    
    <div className="relative z-10">
      <div className="mb-8 p-4 rounded-2xl bg-white/5 inline-block group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h3 className="text-2xl font-serif font-medium mb-4">{title}</h3>
      <p className="text-brand-accent/70 leading-relaxed font-light">
        {description}
      </p>
    </div>
  </div>
);

export default LandingPage;
