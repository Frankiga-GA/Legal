import React, { useState } from 'react';
import { Search, Filter, Eye } from 'lucide-react';
import { mockCases } from '../data/mockData';

const CaseLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrado inteligente en tiempo real
  const filteredCases = mockCases.filter(caso => 
    caso.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caso.dni.includes(searchTerm) ||
    caso.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Biblioteca de Expedientes</h2>
          <p className="text-slate-500 mt-1">Gestión digital y búsqueda inteligente de casos legales.</p>
        </header>

        {/* Barra de Búsqueda */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Código, Nombre o DNI..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Código</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Cliente / DNI</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length > 0 ? (
                filteredCases.map((caso) => (
                  <tr key={caso.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{caso.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-medium">{caso.clientName}</div>
                      <div className="text-slate-500 text-sm">{caso.dni}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{caso.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        caso.status === 'Activo' ? 'bg-green-100 text-green-800' :
                        caso.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {caso.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No se encontraron casos con esa búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaseLibrary;