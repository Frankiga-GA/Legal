import { useState, useEffect } from 'react';
import { Mail, Send, X, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendDeadlineEmailAlert } from '../services/documentBackendService';

export default function EmailAlertModal({
  isOpen,
  onClose,
  initialData = {},
}) {
  const [toEmail, setToEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setToEmail(initialData.clientEmail || initialData.email || '');
      setClientName(initialData.clientName || 'Estimado(a) Cliente');
      setCustomMessage('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toEmail.trim() || !toEmail.includes('@')) {
      toast.error('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsSending(true);
    const toastId = toast.loading('Enviando notificación por Gmail...');

    try {
      await sendDeadlineEmailAlert({
        toEmail: toEmail.trim(),
        clientName: clientName.trim(),
        caseId: initialData.caseId || 'Sin número',
        caseTitle: initialData.caseTitle || '',
        deadlineTitle: initialData.title || initialData.deadlineTitle || 'Vencimiento de plazo procesal',
        deadlineDate: initialData.date || initialData.deadlineDate || 'Fecha por confirmar',
        priority: initialData.priority || 'Alta',
        customMessage: customMessage.trim(),
      });

      toast.success(`Alerta enviada con éxito a ${toEmail.trim()}`, { id: toastId });
      onClose();
    } catch (error) {
      console.error('Error al enviar alerta por correo:', error);
      toast.error(error.message || 'No se pudo enviar la alerta por correo.', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-brand-dark p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-ivory">Notificar al Cliente por Gmail</h3>
              <p className="text-xs text-brand-accent">Envío oficial de alerta procesal desde el estudio</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="rounded-lg p-1.5 text-brand-accent hover:bg-white/[0.04] hover:text-brand-ivory transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumen del plazo */}
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 text-xs">
          <div className="flex items-center justify-between font-semibold text-brand-ivory mb-2">
            <span className="flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {initialData.title || initialData.deadlineTitle || 'Plazo procesal'}
            </span>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] uppercase font-bold text-amber-200">
              {initialData.priority || 'Alta'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-brand-accent mt-2">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-brand-accent/60">Expediente:</span>
              <span className="font-medium text-brand-ivory">{initialData.caseId || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-brand-accent/60">Fecha Límite:</span>
              <span className="font-medium text-amber-300 flex items-center gap-1">
                <Clock className="h-3 w-3 inline" />
                {initialData.date || initialData.deadlineDate || 'Pendiente'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-accent uppercase tracking-wider mb-1.5">
              Correo Electrónico del Cliente <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="cliente@ejemplo.com"
              required
              className="w-full rounded-lg border border-white/[0.08] bg-brand-black px-3.5 py-2.5 text-sm text-brand-ivory outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-accent uppercase tracking-wider mb-1.5">
              Nombre del Cliente
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full rounded-lg border border-white/[0.08] bg-brand-black px-3.5 py-2.5 text-sm text-brand-ivory outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-accent uppercase tracking-wider mb-1.5">
              Indicaciones o Mensaje Adicional (Opcional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              placeholder="Ej. Se requiere la firma del documento antes del mediodía..."
              className="w-full rounded-lg border border-white/[0.08] bg-brand-black px-3.5 py-2.5 text-sm text-brand-ivory outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-semibold text-brand-accent hover:bg-white/[0.04] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-5 py-2 text-xs font-bold text-brand-black shadow-md hover:bg-brand-ivory transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {isSending ? 'Enviando...' : 'Enviar Alerta por Gmail'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
