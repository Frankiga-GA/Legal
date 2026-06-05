// =============================================================================
// src/components/ThemeToggle.jsx
// =============================================================================
// Boton que alterna entre tema claro y oscuro. Usa el hook useTheme.
// =============================================================================

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = ({ size = 'md', label = false }) => {
  const { theme, toggleTheme, isLight } = useTheme();
  const sizeClasses = size === 'sm'
    ? 'h-8 w-8'
    : size === 'lg'
      ? 'h-11 w-11'
      : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      title={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      data-theme={theme}
      className={`relative inline-flex ${sizeClasses} items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-brand-ivory transition-colors hover:border-brand-gold/40 hover:bg-white/[0.08] ${label ? 'w-auto gap-2 px-3' : ''}`}
    >
      {isLight ? (
        <Moon className={iconSize} />
      ) : (
        <Sun className={iconSize} />
      )}
      {label && (
        <span className="text-xs font-medium">
          {isLight ? 'Tema oscuro' : 'Tema claro'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
