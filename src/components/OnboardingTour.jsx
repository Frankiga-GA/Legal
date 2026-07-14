// =============================================================================
// src/components/OnboardingTour.jsx
// =============================================================================
// Tour guiado de 4 pasos que se muestra al primer login. Skippable.
// Persistencia por usuario en localStorage.
// =============================================================================

import { useState } from 'react';
import { Check, ChevronRight, FileText, Sparkles, X, Lightbulb, Settings } from 'lucide-react';
import { markOnboardingComplete } from '../services/authService';

const STEPS = [
  {
    icon: Sparkles,
    title: 'Bienvenido a LUSTI',
    body: 'Tu escritorio legal digital. Aquí gestionas tus casos, consultas normas y redactas escritos con ayuda de inteligencia artificial.',
    accent: 'Sin instalación, sin configuraciones. Todo listo para trabajar.',
  },
  {
    icon: FileText,
    title: 'Crea tu primer expediente',
    body: 'Empieza agregando tu primer caso real o de prueba. Podrás adjuntar documentos y el asistente los leerá por ti.',
    accent: 'Ve a "Mis Expedientes" y haz clic en "Crear expediente".',
    actionTab: 'library',
  },
  {
    icon: Settings,
    title: 'Configura tu estudio',
    body: 'Sube tu logo y tu membrete para que los escritos y documentos generados por el asistente salgan listos para firmar.',
    accent: 'Ve a "Ajustes" para personalizar tu perfil.',
    actionTab: 'settings',
  },
];

const OnboardingTour = ({ userId, onComplete, onNavigate }) => {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const handleSkip = () => {
    markOnboardingComplete(userId);
    onComplete();
  };

  const handleNext = () => {
    if (current.actionTab && onNavigate) {
      onNavigate(current.actionTab);
    }
    if (isLast) {
      markOnboardingComplete(userId);
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-brand-dark shadow-2xl">
        <button
          type="button"
          onClick={handleSkip}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-brand-accent/60 transition-colors hover:bg-white/[0.06] hover:text-brand-ivory"
          aria-label="Cerrar tour"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative h-1.5 w-full bg-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-brand-gold to-amber-400 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
            <span>Paso {step + 1} de {STEPS.length}</span>
          </div>

          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
            <Icon className="h-8 w-8" />
          </div>

          <h2 className="font-serif text-2xl font-medium text-brand-ivory">
            {current.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-brand-accent/75">
            {current.body}
          </p>

          <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              <Lightbulb className="h-3.5 w-3.5" />
              Ejemplo
            </p>
            <p className="mt-1 text-[11px] text-brand-accent/80">{current.accent}</p>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-[11px] text-brand-accent/55 transition-colors hover:text-brand-ivory"
            >
              Saltar
            </button>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {STEPS.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === step ? 'w-6 bg-brand-gold' : 'w-1.5 bg-white/[0.12]'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-xs font-bold text-brand-black transition-all hover:scale-[1.02] hover:bg-brand-ivory"
              >
                {isLast ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Comenzar
                  </>
                ) : (
                  <>
                    Siguiente <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
