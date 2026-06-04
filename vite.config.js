import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const documentBackendUrl = process.env.VITE_DOCUMENT_BACKEND_URL || 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: documentBackendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
