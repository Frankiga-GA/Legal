// src/components/ElPeruano.jsx
import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Calendar, FileText, Gavel, RefreshCw, Bot } from 'lucide-react';
import { mockElPeruanoNews } from '../data/mockElPeruano';

const ElPeruano = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastScrape, setLastScrape] = useState("Hace 10 minutos");
  const [filter, setFilter] = useState('Todas');

  // Función que simula el proceso de Scraping
  const simulateScraping = async () => {
    setLoading(true);
    
    // Simulamos un retraso de red como si estuviera leyendo la web
    setTimeout(() => {
      // En un caso real, aquí llamarías a tu backend: 
      // const data = await fetch('/api/scrape-elperuano').then(res => res.json());
      
      setNews(mockElPeruanoNews);
      setLastScrape("Justo ahora");
      setLoading(false);
    }, 1500); // 1.5 segundos de "lectura"
  };

  useEffect(() => {
    simulateScraping();
  }, []);

  const filteredNews = filter === 'Todas' 
    ? news 
    : news.filter(item => item.type === filter || item.category === filter);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        {/* Header con Estado del Scraper */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Newspaper className="w-8 h-8 text-red-600" />
              El Peruano - Monitor Legal
            </h2>
            <p className="text-slate-500 mt-1">Extracción automática de normas y jurisprudencia mediante Web Scraper.</p>
          </div>
          
          {/* Indicador de Actividad del Scraper */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <Bot className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-green-600'}`} />
            <span className="text-xs font-medium text-slate-600">
              {loading ? 'Escaneando fuentes...' : `Última extracción: ${lastScrape}`}
            </span>
            <button 
              onClick={simulateScraping}
              disabled={loading}
              className="ml-2 p-1 hover:bg-slate-100 rounded-full transition-colors text-blue-600"
              title="Forzar actualización de datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['Todas', 'Norma Legal', 'Jurisprudencia', 'Resolución'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Lista de Noticias Extraídas */}
        <div className="space-y-4">
          {loading && news.length === 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-32"></div>
               ))}
             </div>
          ) : (
            filteredNews.map((item) => {
              const Icon = item.type === 'Jurisprudencia' ? Gavel : FileText;
              const colorClass = item.type === 'Norma Legal' ? 'blue' : item.type === 'Jurisprudencia' ? 'purple' : 'green';
              
              return (
                <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
                  {/* Barra lateral de color según tipo */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${colorClass}-500`}></div>
                  
                  <div className="flex justify-between items-start mb-3 pl-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${colorClass}-50 text-${colorClass}-700 border border-${colorClass}-100`}>
                      <Icon className="w-3 h-3" /> {item.type}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                      Extraído: {item.scrapedAt}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-2 pl-3 group-hover:text-red-600 transition-colors">{item.title}</h3>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed pl-3">{item.summary}</p>
                  
                  <div className="pl-3 flex justify-between items-center">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                    >
                      Ver Fuente Original <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                      Categoría: {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Técnico */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500 flex justify-center items-center gap-2">
          <Bot className="w-3 h-3" />
          Motor de Scraping v1.0 | Fuentes: Diario Oficial El Peruano | Indexado automáticamente en KMS
        </div>
      </div>
    </div>
  );
};

export default ElPeruano;