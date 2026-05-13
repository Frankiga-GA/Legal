// src/components/CaseDetailDrawer.jsx
import { useState } from 'react';
import { X, FileText, Calendar, User, Upload } from 'lucide-react';

const CaseDetailDrawer = ({ caseData, onClose }) => {
  const [uploadedDocs, setUploadedDocs] = useState([]);

  if (!caseData) return null;

  const allDocuments = [...caseData.documents, ...uploadedDocs];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newDoc = {
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        type: file.type,
      };
      setUploadedDocs(prev => [...prev, newDoc]);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-brand-dark shadow-2xl transform transition-transform duration-500 ease-out z-50 flex flex-col border-l border-white/[0.05] animate-in slide-in-from-right">
      
      {/* Header */}
      <div className="p-10 border-b border-white/[0.05] flex justify-between items-start bg-white/[0.01]">
        <div>
          <h3 className="text-3xl font-serif font-medium text-brand-ivory tracking-tight">{caseData.id}</h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent/40 font-bold mt-2">Expediente Operativo</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-full transition-colors text-brand-accent/40">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
        
        {/* Info Básica */}
        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center gap-2 text-brand-accent/20 text-[9px] uppercase tracking-widest mb-2 font-bold">
              <User className="w-3 h-3" /> Titular
            </div>
            <p className="text-sm font-medium text-brand-ivory/80">{caseData.clientName}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center gap-2 text-brand-accent/20 text-[9px] uppercase tracking-widest mb-2 font-bold">
              <Calendar className="w-3 h-3" /> Actualización
            </div>
            <p className="text-sm font-medium text-brand-ivory/80">{caseData.lastUpdate}</p>
          </div>
        </div>

        {/* Resumen */}
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-accent/40 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-brand-gold" /> Análisis de Materia
          </h4>
          <div className="text-brand-ivory/70 text-sm leading-relaxed font-light bg-white/[0.01] p-6 rounded-2xl border border-white/[0.05]">
            {caseData.summary}
          </div>
        </div>

        {/* Documentos */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-accent/40 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-brand-gold" /> Acervo Probatorio ({allDocuments.length})
            </h4>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-ivory text-brand-black text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-white transition-all shadow-lg">
              <Upload className="w-3 h-3" />
              Vincular
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.jpg,.png" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>
          
          <div className="space-y-2">
            {allDocuments.length > 0 ? (
              allDocuments.map((doc, idx) => (
                <div key={idx} className="group flex justify-between items-center p-4 hover:bg-white/[0.03] rounded-xl border border-white/[0.05] transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-brand-accent/20 group-hover:text-brand-gold transition-colors">
                       <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-brand-ivory/60 font-light truncate max-w-[200px]">{doc.name}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-brand-accent/20 font-bold">{doc.date}</span>
                </div>
              ))
            ) : (
              <p className="text-brand-accent/20 text-xs italic text-center py-8">No se han vinculado archivos al expediente.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 bg-white/[0.01] border-t border-white/[0.05] text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent/20 font-bold">
          Conexión Segura de Datos &bull; Legal KMS
        </p>
      </div>
    </div>
  );
};

export default CaseDetailDrawer;