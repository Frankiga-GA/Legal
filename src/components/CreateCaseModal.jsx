// src/components/CreateCaseModal.jsx
import { useState } from 'react';
import { X, User, Hash, Briefcase, FileText, Users, ChevronDown } from 'lucide-react';

const CASE_TYPES = [
  { value: 'Laboral',        label: 'Laboral' },
  { value: 'Penal',          label: 'Penal' },
  { value: 'Civil',          label: 'Civil' },
  { value: 'Familia',        label: 'Familia' },
  { value: 'Comercial',      label: 'Comercial' },
  { value: 'Tributario',     label: 'Tributario' },
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Notarial',       label: 'Notarial' },
];

const CreateCaseModal = ({ onClose, onSave }) => {
  const [clientName, setClientName] = useState('');
  const [dni, setDni] = useState('');
  const [type, setType] = useState('Laboral');
  const [counterparty, setCounterparty] = useState('');
  const [subject, setSubject] = useState('');
  const [judge, setJudge] = useState('');
  const [specialist, setSpecialist] = useState('');
  const [cuaderno, setCuaderno] = useState('');
  const [escritoNro, setEscritoNro] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const newCase = {
      id: '',
      clientName: clientName.trim(),
      dni: dni.trim(),
      type,
      counterparty: counterparty.trim(),
      judge: judge.trim(),
      specialist: specialist.trim(),
      cuaderno: cuaderno.trim(),
      escritoNro: escritoNro.trim(),
      status: 'Activo',
      summary: subject.trim(),
      lastUpdate: new Date().toISOString().split('T')[0],
      documents: [],
      notes: [],
      importantDates: [],
    };

    onSave(newCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/90 p-6">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-white/[0.05] bg-brand-dark">
        <div className="flex items-center justify-between border-b border-white/[0.05] p-8">
          <div>
            <h3 className="font-serif text-2xl font-medium text-brand-ivory">
              Nuevo expediente
            </h3>
            <p className="mt-1 text-xs text-brand-accent/60">
              5 datos basicos. La IA completara el resto al subir la primera resolucion.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-brand-accent/40 transition-colors hover:bg-white/[0.05]"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/70">
              Cliente
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/30" />
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre y apellido o razon social"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 pl-12 pr-5 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/30 focus:border-brand-gold/40"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/70">
              DNI o RUC <span className="text-brand-accent/40">(opcional)</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/30" />
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="12345678"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 pl-12 pr-5 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/30 focus:border-brand-gold/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/70">
              Tipo de caso
            </label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/30" />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 pl-12 pr-12 text-brand-ivory outline-none transition-all focus:border-brand-gold/40"
              >
                {CASE_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-brand-dark text-brand-ivory">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/50" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/70">
              Contraparte <span className="text-brand-accent/40">(opcional)</span>
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/30" />
              <input
                type="text"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="Demandado, denunciante, deudor, etc."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 pl-12 pr-5 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/30 focus:border-brand-gold/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/70">
              Juez <span className="text-brand-accent/40">(opcional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/30" />
              <input
                type="text"
                value={judge}
                onChange={(e) => setJudge(e.target.value)}
                placeholder="Nombre del Juez"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 pl-12 pr-5 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/30 focus:border-brand-gold/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/70">
              Especialista Legal <span className="text-brand-accent/40">(opcional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/30" />
              <input
                type="text"
                value={specialist}
                onChange={(e) => setSpecialist(e.target.value)}
                placeholder="Nombre del Especialista"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 pl-12 pr-5 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/30 focus:border-brand-gold/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/70">
              Cuaderno <span className="text-brand-accent/40">(opcional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/30" />
              <input
                type="text"
                value={cuaderno}
                onChange={(e) => setCuaderno(e.target.value)}
                placeholder="Principal"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 pl-12 pr-5 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/30 focus:border-brand-gold/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/70">
              Escrito N° <span className="text-brand-accent/40">(opcional)</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/30" />
              <input
                type="text"
                value={escritoNro}
                onChange={(e) => setEscritoNro(e.target.value)}
                placeholder="01"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 pl-12 pr-5 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/30 focus:border-brand-gold/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/70">
              Asunto o demanda <span className="text-brand-accent/40">(opcional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-3.5 h-4 w-4 text-brand-accent/30" />
              <textarea
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                rows={2}
                placeholder="Ej: Despido sin causa, demanda de alimentos..."
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 pl-12 pr-5 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/30 focus:border-brand-gold/40"
              />
            </div>
          </div>
        </form>

        <div className="flex gap-3 border-t border-white/[0.05] bg-white/[0.01] p-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.1] px-6 py-3 font-semibold text-brand-accent/60 transition-all hover:bg-white/[0.05]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-brand-ivory px-6 py-3 font-bold text-brand-black transition-colors hover:bg-white"
          >
            Crear expediente
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCaseModal;
