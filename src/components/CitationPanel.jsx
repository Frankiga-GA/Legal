// =============================================================================
// src/components/CitationPanel.jsx
// =============================================================================
// Drawer lateral con todas las citas unicas de la conversacion actual.
// Las agrupa por tipo y permite copiarlas individualmente o en bloque.
// =============================================================================

import { useState } from 'react';
import { BookOpen, Check, Copy, Gavel, Library, Scale, ScrollText, X } from 'lucide-react';
import CitationBadge from './CitationBadge';

const ICON_BY_TYPE = {
  constitution: ScrollText,
  law: BookOpen,
  decree: Scale,
  jurisprudence: Gavel,
  resolution: Gavel,
};

const TYPE_ORDER = ['constitution', 'jurisprudence', 'decree', 'law', 'resolution'];

const groupByType = (citations) => {
  const groups = new Map();
  citations.forEach((citation) => {
    if (!groups.has(citation.type)) groups.set(citation.type, []);
    groups.get(citation.type).push(citation);
  });
  return TYPE_ORDER
    .filter((type) => groups.has(type))
    .map((type) => ({ type, items: groups.get(type) }));
};

const CitationPanel = ({ open, onClose, citations = [] }) => {
  const [copyAll, setCopyAll] = useState(false);

  if (!open) return null;

  const groups = groupByType(citations);
  const total = citations.length;

  const handleCopyAll = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      const text = citations.map((c) => c.full).join('\n');
      await navigator.clipboard.writeText(text);
      setCopyAll(true);
      window.setTimeout(() => setCopyAll(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-amber-300" />
            <h2 className="text-sm font-semibold text-white">Fuentes citadas</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
              {total}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {total > 0 && (
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 transition-colors hover:bg-white/10"
                title="Copiar todas las referencias"
              >
                {copyAll ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copiar todas
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {total === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <Library className="mb-3 h-8 w-8 opacity-50" />
              <p className="text-sm">Todavia no hay citas en esta conversacion.</p>
              <p className="mt-1 text-xs text-slate-600">
                Preguntale a la IA sobre una norma o caso juridico y apareceran aca.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => {
                const Icon = ICON_BY_TYPE[group.type] || BookOpen;
                return (
                  <section key={group.type}>
                    <header className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <Icon className="h-3 w-3" />
                      {group.type === 'constitution' && 'Constitucion'}
                      {group.type === 'jurisprudence' && 'Jurisprudencia'}
                      {group.type === 'decree' && 'Leyes y decretos'}
                      {group.type === 'law' && 'Codigos y articulos'}
                      {group.type === 'resolution' && 'Resoluciones'}
                    </header>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((citation) => (
                        <CitationBadge key={`${citation.type}-${citation.label}`} citation={citation} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default CitationPanel;
