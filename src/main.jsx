// Polyfill Buffer for browser (required by @react-pdf/renderer for image processing)
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  globalThis.Buffer = Buffer;
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Aplica el tema antes del primer render para evitar el "flash" de fondo.
try {
  const stored = window.localStorage.getItem('lusti-theme')
  if (stored === 'light') {
    document.documentElement.classList.add('theme-light')
  }
} catch {
  /* noop */
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
