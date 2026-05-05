// src/components/CreateCaseModal.jsx
import React, { useState } from 'react';
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

  // Estado para los archivos seleccionados
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar selección de archivos
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

  // Eliminar un archivo de la lista
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.dni) return;
    
    // Generar ID automático si está vacío
    let finalId = formData.id;
    if (!finalId) {
      finalId = `EXP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    }

    const newCase = {
      ...formData,
      id: finalId,
      documents: selectedFiles // Guardamos los archivos simulados en el caso
    };

    onSave(newCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Crear Nuevo Expediente
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Formulario Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código (Opcional)</label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  placeholder="Autogenerado si vacías"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Caso</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option>Laboral</option>
                  <option>Civil</option>
                  <option>Penal</option>
                  <option>Corporativo</option>
                </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente *</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="Juan Pérez o Empresa S.A.C."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DNI / RUC *</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="12345678 o 20123456789"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Resumen del Caso</label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows="2"
              placeholder="Descripción breve..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            ></textarea>
          </div>

          {/* SECCIÓN DE SUBIDA DE DOCUMENTOS INICIALES */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-600" />
              Documentos Iniciales (Opcional)
            </label>
            
            {/* Zona de Drop Simulada */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                multiple 
                onChange={handleFileSelect} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Arrastra archivos aquí o haz clic para seleccionar</p>
              <p className="text-[10px] text-slate-400 mt-1">PDF, Word, Imágenes</p>
            </div>

            {/* Lista de archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {selectedFiles.map((file, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span className="text-slate-700 truncate max-w-[200px]">{file.name}</span>
                      <span className="text-slate-400">({file.size})</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-red-500 hover:text-red-700 font-bold px-1"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </form>

        {/* Footer Fijo */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md text-sm"
          >
            Guardar Expediente
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCaseModal;