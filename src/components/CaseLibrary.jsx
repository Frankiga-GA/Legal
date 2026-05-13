// src/components/CaseLibrary.jsx
import { useState } from 'react';
import { Search, FileText, Plus, ChevronRight } from 'lucide-react';
import { mockCases } from '../data/mockData';
import CaseDetailDrawer from './CaseDetailDrawer';
import CreateCaseModal from './CreateCaseModal';

const CaseLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSaveNewCase = (newCase) => {
    alert(`✅ Expediente ${newCase.id} creado exitosamente!`);
  };

  const filteredCases = mockCases.filter(caso => 
    caso.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caso.dni.includes(searchTerm) ||
    caso.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 md:p-12 min-h-screen bg-brand-black">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-serif font-medium tracking-tight text-brand-ivory">Bóveda de Expedientes</h2>
            <p className="text-brand-accent/60 font-light text-sm tracking-wide">Gestión documental de alta precisión e indexación inteligente.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-ivory text-brand-black rounded-full hover:bg-white transition-all font-semibold tracking-tight shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuevo Registro
          </button>
        </header>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/40 group-focus-within:text-brand-gold transition-colors" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o identificación..."
              className="w-full pl-14 pr-6 py-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl focus:outline-none focus:border-brand-gold/40 focus:bg-white/[0.04] transition-all text-brand-ivory placeholder:text-brand-accent/20 font-light"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Results Info */}
        <div className="text-[10px] uppercase tracking-[0.2em] text-brand-accent/40 font-semibold px-2">
          Indexando <span className="text-brand-ivory">{filteredCases.length}</span> registros activos
        </div>

        {/* Table Container */}
        <div className="rounded-3xl border border-white/[0.05] overflow-hidden bg-white/[0.01]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-bold text-brand-accent/60 uppercase tracking-widest">Identificador</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-brand-accent/60 uppercase tracking-widest">Cliente</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-brand-accent/60 uppercase tracking-widest">Materia</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-brand-accent/60 uppercase tracking-widest">Estado</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-brand-accent/60 uppercase tracking-widest text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredCases.length > 0 ? (
                  filteredCases.map((caso) => (
                    <tr key={caso.id} className="hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={() => setSelectedCase(caso)}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-white/[0.03] rounded-lg group-hover:bg-brand-gold/10 transition-colors">
                            <FileText className="w-4 h-4 text-brand-accent group-hover:text-brand-gold transition-colors" />
                          </div>
                          <span className="font-serif font-medium text-brand-ivory">{caso.id}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-brand-ivory/80 text-sm font-medium">{caso.clientName}</div>
                        <div className="text-brand-accent/40 text-[10px] uppercase tracking-wider mt-1">{caso.dni}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[11px] font-medium text-brand-accent/60 tracking-tight">
                          {caso.type}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            caso.status === 'Activo' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                            caso.status === 'Pendiente' ? 'bg-brand-gold shadow-[0_0_8px_rgba(197,160,89,0.4)]' :
                            'bg-brand-accent/40'
                          }`}></div>
                          <span className="text-xs font-light text-brand-accent/80">{caso.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="text-brand-accent/20 group-hover:text-brand-gold transition-colors">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Search className="w-10 h-10 text-brand-accent/10" />
                        <p className="text-sm font-light text-brand-accent/40">Sin resultados en la base de datos actual.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Overlays */}
      {selectedCase && (
        <>
          <div 
            className="fixed inset-0 bg-brand-black/80 z-40 backdrop-blur-md transition-opacity" 
            onClick={() => setSelectedCase(null)}
          ></div>
          <CaseDetailDrawer 
            caseData={selectedCase} 
            onClose={() => setSelectedCase(null)} 
          />
        </>
      )}

      {isCreateModalOpen && (
        <CreateCaseModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSave={handleSaveNewCase} 
        />
      )}
    </div>
  );
};

export default CaseLibrary;