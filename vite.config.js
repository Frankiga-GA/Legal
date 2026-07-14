import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const documentBackendUrl = process.env.VITE_DOCUMENT_BACKEND_URL || 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    // Polyfill 'global' for packages that use Node.js globals (e.g. react-pdf)
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Make sure 'buffer' resolves to the browser-compatible version
      buffer: 'buffer',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: documentBackendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@react-pdf/renderer')) {
            return 'react-pdf';
          }
        }
      }
    }
  }
})
