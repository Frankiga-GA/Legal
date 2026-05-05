// src/components/CaseDetailDrawer.jsx
import React, { useState } from 'react';
import { X, FileText, Calendar, User, Upload } from 'lucide-react';

const CaseDetailDrawer = ({ caseData, onClose }) => {
  if (!caseData) return null;

  // Estado local para simular subida de documentos durante la sesión
  const [uploadedDocs, setUploadedDocs] = useState([]);

  // Combinar documentos originales + los que subimos ahora
  const allDocuments = [...caseData.documents, ...uploadedDocs];

  // Función para simular la subida de un archivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newDoc = {
        name: file.name,
        date: new Date().toISOString().split('T')[0], // Fecha de hoy
        type: file.type,
      };
      setUploadedDocs(prev => [...prev, newDoc]);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-slate-200">
      
      {/* Header del Drawer */}
      <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{caseData.id}</h3>
          <p className="text-sm text-slate-500 mt-1">{caseData.clientName} • DNI: {caseData.dni}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenido Scrollable - SIN CHAT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Info Básica */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase mb-1 font-semibold">
              <User className="w-4 h-4" /> Cliente
            </div>
            <p className="font-medium text-slate-800">{caseData.clientName}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase mb-1 font-semibold">
              <Calendar className="w-4 h-4" /> Actualización
            </div>
            <p className="font-medium text-slate-800">{caseData.lastUpdate}</p>
          </div>
        </div>

        {/* Resumen */}
        <div>
          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Resumen del Caso
          </h4>
          <p className="text-slate-600 text-sm leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100">
            {caseData.summary}
          </p>
        </div>

        {/* Documentos */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Documentos ({allDocuments.length})
            </h4>
            {/* Input oculto para subir archivos */}
            <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <Upload className="w-3 h-3" />
              Subir Doc
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.jpg,.png" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>
          
          <ul className="space-y-2">
            {allDocuments.length > 0 ? (
              allDocuments.map((doc, idx) => (
                <li key={idx} className="group flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">📄</span>
                    <span className="text-sm text-slate-700 font-medium truncate max-w-[200px]">{doc.name}</span>
                  </div>
                  <span className="text-slate-400 text-xs">{doc.date}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 text-sm italic text-center py-4">No hay documentos adjuntos.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer opcional o espacio vacío */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
        Usa el asistente IA flotante (esquina inferior derecha) para preguntar sobre este caso.
      </div>
    </div>
  );
};

export default CaseDetailDrawer;