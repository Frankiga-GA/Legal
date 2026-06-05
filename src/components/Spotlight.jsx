// =============================================================================
// src/components/Spotlight.jsx
// =============================================================================
// Haz de luz que sigue al cursor en el contenedor padre. Da sensacion de
// profundidad al fondo.
// =============================================================================

import { useRef } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';

const Spotlight = ({ children, className = '', size = 480, intensity = 0.12 }) => {
  const containerRef = useRef(null);
  const { x, y } = useMousePosition(containerRef);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        aria-hidden="true"
        style={{
          background: `radial-gradient(${size}px circle at ${x * 100}% ${y * 100}%, rgba(228, 228, 231, ${intensity}), transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
};

export default Spotlight;
