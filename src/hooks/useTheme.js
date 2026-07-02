// =============================================================================
// src/hooks/useTheme.js
// =============================================================================
// Maneja el tema (dark / light). Persiste en localStorage y aplica la clase
// `.theme-light` al elemento <html> para que las CSS variables en
// src/index.css hagan el swap.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lusti-theme';
const LIGHT_CLASS = 'theme-light';

const readInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* noop */
  }
  return 'light';
};

const applyThemeClass = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add(LIGHT_CLASS);
  } else {
    root.classList.remove(LIGHT_CLASS);
  }
};

export const useTheme = () => {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (next !== 'light' && next !== 'dark') return;
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, setTheme, toggleTheme, isLight: theme === 'light' };
};
