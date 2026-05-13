// src/components/ElPeruano.jsx
import { useState, useEffect } from 'react';
import { ExternalLink, FileText, Gavel, RefreshCw, Bot } from 'lucide-react';
import { mockElPeruanoNews } from '../data/mockElPeruano';

const ElPeruano = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastScrape, setLastScrape] = useState("Hace 10 minutos");
  const [filter, setFilter] = useState('Todas');

  const simulateScraping = async () => {
    setLoading(true);
    setTimeout(() => {
      setNews(mockElPeruanoNews);
      setLastScrape("Justo ahora");
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    const fetchData = async () => {
      await simulateScraping();
    };
    fetchData();
  }, []);

  const filteredNews = filter === 'Todas' 
    ? news 
    : news.filter(item => item.type === filter || item.category === filter);

  return (
    <div className="p-8 md:p-12 min-h-screen bg-brand-black">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory flex items-center gap-4">
              Monitor Legal
            </h2>
            <p className="text-brand-accent/60 font-light text-sm tracking-wide">Extracción automatizada de normas y jurisprudencia del Diario Oficial.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] px-5 py-2.5 rounded-full backdrop-blur-md">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-brand-gold animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}></div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-accent/60">
              {loading ? 'Escaneando...' : `Última extracción: ${lastScrape}`}
            </span>
            <button 
              onClick={simulateScraping}
              disabled={loading}
              className="ml-2 text-brand-accent/40 hover:text-brand-gold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          {['Todas', 'Norma Legal', 'Jurisprudencia', 'Resolución'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-widest transition-all ${
                filter === type
                  ? 'bg-brand-ivory text-brand-black shadow-lg scale-105'
                  : 'bg-white/[0.02] border border-white/[0.05] text-brand-accent/60 hover:bg-white/[0.05]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Lista de Noticias */}
        <div className="space-y-6">
          {loading && news.length === 0 ? (
             <div className="space-y-4">
               {[1,2,3].map(i => (
                 <div key={i} className="h-40 rounded-3xl bg-white/[0.01] border border-white/[0.05] animate-pulse"></div>
               ))}
             </div>
          ) : (
            filteredNews.map((item) => {
              const Icon = item.type === 'Jurisprudencia' ? Gavel : FileText;
              
              return (
                <div key={item.id} className="glass-card p-8 rounded-3xl group relative overflow-hidden border border-white/[0.05] hover:bg-white/[0.02] transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/[0.03] rounded-lg text-brand-gold">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-accent/40">
                        {item.type}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-brand-accent/20 font-bold">
                      {item.scrapedAt}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-serif font-medium text-brand-ivory mb-4 group-hover:text-brand-gold transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-brand-accent/60 text-sm font-light leading-relaxed mb-8 max-w-3xl">
                    {item.summary}
                  </p>
                  
                  <div className="flex justify-between items-center pt-6 border-t border-white/[0.03]">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-brand-gold hover:text-brand-ivory text-xs font-semibold uppercase tracking-widest transition-colors"
                    >
                      Ver Fuente Original <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <span className="text-[10px] uppercase tracking-widest text-brand-accent/20 font-bold">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-12 border-t border-white/[0.05] flex items-center justify-center gap-4">
          <Bot className="w-4 h-4 text-brand-accent/20" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent/20 font-bold">
            Motor de Inteligencia v1.0 &bull; Diario Oficial El Peruano
          </p>
        </div>
      </div>
    </div>
  );
};

export default ElPeruano;