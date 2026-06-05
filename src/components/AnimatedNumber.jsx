// =============================================================================
// src/components/AnimatedNumber.jsx
// =============================================================================
// Contador que se anima de 0 al target cuando entra en viewport.
// =============================================================================

import { useInView } from '../hooks/useInView';
import { useCountUp } from '../hooks/useCountUp';

const AnimatedNumber = ({ value, duration = 1400, className = '', prefix = '', suffix = '' }) => {
  const { ref, inView } = useInView({ threshold: 0.5 });
  const current = useCountUp(value, { duration, start: inView });
  const display = String(value).match(/[A-Za-z]/) ? value : current;

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

export default AnimatedNumber;
