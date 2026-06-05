// =============================================================================
// src/hooks/useCountUp.js
// =============================================================================
// Anima un numero desde 0 hasta el target cuando se vuelve visible. Usado
// en los metrics del hero.
// =============================================================================

import { useEffect, useRef, useState } from 'react';

export const useCountUp = (target, { duration = 1400, start = false } = {}) => {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;
    const numeric = Number(String(target).replace(/[^0-9.]/g, '')) || 0;
    const startTime = performance.now();
    let frame = 0;
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic para una sensacion suave al final
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(numeric * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setValue(numeric);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);

  return value;
};
