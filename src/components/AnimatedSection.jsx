// =============================================================================
// src/components/AnimatedSection.jsx
// =============================================================================
// Envoltorio que aplica un fade-in + slide-up cuando entra al viewport.
// =============================================================================

import { useInView } from '../hooks/useInView';

const AnimatedSection = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  as: Tag = 'div',
}) => {
  const { ref, inView } = useInView({ threshold: 0.12 });

  const transform =
    !inView && direction === 'up' ? 'translateY(24px)' :
    !inView && direction === 'down' ? 'translateY(-24px)' :
    !inView && direction === 'left' ? 'translateX(24px)' :
    !inView && direction === 'right' ? 'translateX(-24px)' :
    'translate(0,0)';

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform,
        transition: `opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
};

export default AnimatedSection;
