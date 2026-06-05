// =============================================================================
// src/components/AnimatedProductPreview.jsx
// =============================================================================
// Vista previa del producto con micro-animaciones: cursor parpadeando, una
// barra de progreso que se llena sola, y un pequeno "tick" que aparece.
// Reemplaza al ProductPreview estatico.
// =============================================================================

import { useEffect, useState } from 'react';
import { Check, FileText, Sparkles } from 'lucide-react';

const AnimatedProductPreview = () => {
  const [step, setStep] = useState(0);
  // step: 0 = buscando, 1 = extrayendo, 2 = completado

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((current) => (current + 1) % 3);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative w-full">
      {/* glow de fondo */}
      <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-brand-gold/15 via-blue-500/8 to-transparent blur-2xl" aria-hidden="true" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-brand-dark p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            Expediente EXP-2026-003
          </div>
          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-accent/70">
            IA activo
          </span>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-ivory">Resolucion 04 - Admisibilidad</p>
                <p className="text-[10px] text-brand-accent/60">Procesado hace {step === 0 ? 'ahora' : 'instantes'}</p>
              </div>
              {step === 2 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 animate-fade-in">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-gold to-amber-400 transition-all duration-700"
                style={{ width: step === 0 ? '38%' : step === 1 ? '76%' : '100%' }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/[0.04] p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 text-amber-400" />
              <p className="text-[11px] leading-relaxed text-brand-ivory/90">
                La IA detecto: <strong className="text-brand-gold">3 plazos</strong> y
                un <strong className="text-brand-gold">enlace de audiencia</strong> en el documento.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-accent transition-colors hover:bg-white/[0.04]"
            >
              Ver plazos
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-accent transition-colors hover:bg-white/[0.04]"
            >
              Resumir caso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedProductPreview;
