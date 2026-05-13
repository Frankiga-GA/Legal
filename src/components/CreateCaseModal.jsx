// src/components/CreateCaseModal.jsx
import { useState } from 'react';
import { X, FileText, User, Upload, Paperclip } from 'lucide-react';

const CreateCaseModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    clientName: '',
    dni: '',
    type: 'Laboral',
    status: 'Activo',
    summary: '',
    lastUpdate: new Date().toISOString().split('T')[0]
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type,
        date: new Date().toISOString().split('T')[0]
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.dni) return;
    
    let finalId = formData.id;
    if (!finalId) {
      finalId = `EXP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    }

    const newCase = {
      ...formData,
      id: finalId,
      documents: selectedFiles
    };

    onSave(newCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-brand-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
      <div className="bg-brand-dark border border-white/[0.05] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-500 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/[0.05] flex justify-between items-center">
          <h3 className="text-3xl font-serif font-medium text-brand-ivory flex items-center gap-4">
            Apertura de Expediente
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-full transition-colors text-brand-accent/40">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Identificador</label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  placeholder="ID Automático"
                  className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40 transition-all placeholder:text-brand-accent/10"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Materia Legal</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40 appearance-none"
                >
                  <option className="bg-brand-dark">Laboral</option>
                  <option className="bg-brand-dark">Civil</option>
                  <option className="bg-brand-dark">Penal</option>
                  <option className="bg-brand-dark">Corporativo</option>
                </select>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Titular / Cliente</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/20" />
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="Nombre completo o Razón Social"
                className="w-full pl-14 pr-6 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40 transition-all placeholder:text-brand-accent/10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Identificación (DNI / RUC)</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="Ingrese el número de identificación"
              className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40 transition-all placeholder:text-brand-accent/10"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold">Resumen Operativo</label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows="3"
              placeholder="Descripción detallada de la materia..."
              className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-brand-ivory outline-none focus:border-brand-gold/40 resize-none transition-all placeholder:text-brand-accent/10"
            ></textarea>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-semibold flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5 text-brand-gold" />
              Activos Documentales
            </label>
            
            <div className="border border-dashed border-white/[0.1] rounded-2xl p-8 text-center hover:bg-white/[0.02] transition-all cursor-pointer relative group">
              <input 
                type="file" 
                multiple 
                onChange={handleFileSelect} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <Upload className="w-8 h-8 text-brand-accent/10 mx-auto mb-4 group-hover:text-brand-gold transition-colors" />
              <p className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-bold">Vincular Archivos</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-brand-accent/40" />
                      <span className="text-xs text-brand-ivory/60 truncate max-w-[240px] font-light">{file.name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-brand-accent/20 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>

        {/* Footer */}
        <div className="p-10 border-t border-white/[0.05] flex gap-4 bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-8 py-4 border border-white/[0.1] text-brand-accent/60 rounded-xl hover:bg-white/[0.05] transition-all font-semibold tracking-tight"
          >
            Anular
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-8 py-4 bg-brand-ivory text-brand-black rounded-xl hover:bg-white transition-all font-bold tracking-tight shadow-lg"
          >
            Registrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCaseModal;