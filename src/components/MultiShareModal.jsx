import { useState } from 'react';
import { X, Users, Mail } from 'lucide-react';
import { shareMultipleCases } from '../services/sharingService';
import toast from 'react-hot-toast';

const MultiShareModal = ({ caseIds, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('lector');
  const [inviting, setInviting] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email || !caseIds || caseIds.length === 0) return;

    setInviting(true);
    const { error } = await shareMultipleCases(caseIds, email, role);
    setInviting(false);

    if (error) {
      toast.error('Error al compartir los expedientes. Verifica el correo.');
    } else {
      toast.success(`${caseIds.length} expedientes compartidos con ${email}.`);
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-brand-dark p-6 shadow-2xl animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-ivory">
            <Users className="h-5 w-5 text-brand-gold" />
            <h2 className="text-lg font-serif font-medium">
              Compartir {caseIds.length} expedientes
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-brand-accent hover:bg-white/[0.05] hover:text-brand-ivory"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-6 text-sm text-brand-accent">
          Ingresa el correo del colaborador o cliente. Se le enviará una invitación y tendrá acceso a los {caseIds.length} expedientes seleccionados.
        </p>

        <form onSubmit={handleShare} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-brand-accent">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@firma.com"
                required
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-2.5 pl-10 pr-4 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/30 focus:border-brand-gold/50 focus:bg-white/[0.05]"
              />
            </div>
          </div>
          
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-brand-accent">
              Nivel de acceso
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-brand-black px-4 py-2.5 text-sm text-brand-ivory outline-none focus:border-brand-gold/50"
            >
              <option value="lector">Lector (Solo ver)</option>
              <option value="editor">Editor (Subir docs, notas)</option>
            </select>
          </div>

          <div className="mt-4 flex gap-3 border-t border-white/[0.05] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/[0.1] px-4 py-2 text-sm font-semibold text-brand-accent transition-colors hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={inviting || !email}
              className="flex-1 rounded-lg bg-brand-gold px-4 py-2 text-sm font-bold text-brand-black transition-colors hover:bg-brand-ivory disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inviting ? 'Enviando...' : 'Compartir lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MultiShareModal;
