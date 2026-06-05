// =============================================================================
// src/components/CitationBadge.jsx
// =============================================================================
// Chip visual de una cita legal. Muestra el tipo (icono), la referencia
// completa y un boton de copiar al portapapeles.
// =============================================================================

import { useState } from 'react';
import { BookOpen, Check, Copy, Gavel, Scale, ScrollText } from 'lucide-react';

const ICONS = {
  constitution: ScrollText,
  law: BookOpen,
  decree: Scale,
  jurisprudence: Gavel,
  resolution: Gavel,
};

const TONES = {
  constitution: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  law: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  decree: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  jurisprudence: 'border-purple-500/30 bg-purple-500/10 text-purple-200',
  resolution: 'border-purple-500/30 bg-purple-500/10 text-purple-200',
};

const TYPE_LABELS = {
  constitution: 'Constitucion',
  law: 'Ley',
  decree: 'Norma',
  jurisprudence: 'Jurisprudencia',
  resolution: 'Resolucion',
};

const CitationBadge = ({ citation, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const Icon = ICONS[citation.type] || BookOpen;
  const tone = TONES[citation.type] || TONES.law;

  const handleCopy = async (event) => {
    event?.stopPropagation();
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(citation.full);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${tone}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate">
        {compact ? citation.label : (
          <>
            <span className="text-[10px] uppercase tracking-wider opacity-70">
              {TYPE_LABELS[citation.type] || 'Cita'}:
            </span>{' '}
            {citation.label}
          </>
        )}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/15"
        aria-label={`Copiar ${citation.label}`}
        title="Copiar"
      >
        {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
      </button>
    </span>
  );
};

export default CitationBadge;
