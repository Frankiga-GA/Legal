// =============================================================================
// src/hooks/useMousePosition.js
// =============================================================================
// Rastrea la posicion del mouse normalizada al contenedor. Usado para el
// efecto de spotlight y parallax.
// =============================================================================

import { useEffect, useState } from 'react';

export const useMousePosition = (ref) => {
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const node = ref?.current;
    if (!node || typeof window === 'undefined') return;

    let frame = 0;
    const handleMove = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        setPosition({
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
        });
      });
    };

    const handleLeave = () => setPosition({ x: 0.5, y: 0.5 });
    node.addEventListener('mousemove', handleMove);
    node.addEventListener('mouseleave', handleLeave);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener('mousemove', handleMove);
      node.removeEventListener('mouseleave', handleLeave);
    };
  }, [ref]);

  return position;
};
