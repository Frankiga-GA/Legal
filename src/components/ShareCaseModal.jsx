import { useEffect, useState } from 'react';
import { X, Users, Trash2, Mail } from 'lucide-react';
import { shareCase, unshareCase, getCaseShares } from '../services/sharingService';
import toast from 'react-hot-toast';

const ShareCaseModal = ({ caseId, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('lector');
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadShares();
  }, [caseId]);

  const loadShares = async () => {
    setLoading(true);
    const { shares, error } = await getCaseShares(caseId);
    if (!error) {
      setShares(shares);
    }
    setLoading(false);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email) return;

    setInviting(true);
    const { error } = await shareCase(caseId, email, role);
    setInviting(false);

    if (error) {
      toast.error('Error al compartir. Verifica el correo.');
    } else {
      toast.success('Expediente compartido correctamente.');
      setEmail('');
      loadShares();
    }
  };

  const handleRemove = async (emailToRemove) => {
    const { error } = await unshareCase(caseId, emailToRemove);
    if (error) {
      toast.error('Error al quitar acceso.');
    } else {
      toast.success('Acceso revocado.');
      loadShares();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-brand-dark p-6 shadow-2xl animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-ivory">
            <Users className="h-5 w-5 text-brand-gold" />
            <h2 className="text-lg font-serif font-medium">Compartir Expediente</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-brand-accent hover:bg-white/[0.05] hover:text-brand-ivory"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleShare} className="mb-6 flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-accent">
              Invitar por correo
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-accent/50" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-lg border border-white/[0.08] bg-brand-black py-2 pl-9 pr-3 text-sm text-brand-ivory focus:border-brand-gold focus:outline-none"
              />
            </div>
          </div>
          <div className="w-28">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-brand-black px-3 py-2 text-sm text-brand-ivory focus:border-brand-gold focus:outline-none"
            >
              <option value="lector">Lector</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting || !email}
            className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-bold text-brand-black hover:bg-brand-ivory disabled:opacity-50"
          >
            {inviting ? '...' : 'Invitar'}
          </button>
        </form>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-accent">
            Personas con acceso
          </h3>
          {loading ? (
            <p className="text-sm text-brand-accent/50">Cargando...</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-brand-accent/50">Solo tú tienes acceso a este expediente.</p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-brand-ivory">{share.shared_with_email}</p>
                    <p className="text-xs text-brand-accent/70 capitalize">{share.role}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(share.shared_with_email)}
                    className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    title="Quitar acceso"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareCaseModal;
