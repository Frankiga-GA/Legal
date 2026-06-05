// =============================================================================
// src/components/StickyCTA.jsx
// =============================================================================
// Boton flotante que aparece cuando el usuario hace scroll. CTA siempre
// visible para que no se pierda la conversion.
// =============================================================================

import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useInView } from '../hooks/useInView';

const StickyCTA = ({ onClick, threshold = 0.3 }) => {
  const [visible, setVisible] = useState(false);
  const { ref } = useInView({ threshold });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <>
      {/* Sentinel invisible usado como referencia para detectar scroll */}
      <div ref={ref} className="h-px w-px" aria-hidden="true" />
      <button
        type="button"
        onClick={onClick}
        className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-brand-gold px-5 py-3 text-sm font-bold text-brand-black shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-brand-ivory ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0'
        }`}
      >
        Entrar a la plataforma
        <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
};

export default StickyCTA;
