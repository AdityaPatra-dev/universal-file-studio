import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdf-lib')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/jszip')) {
            return 'vendor-zip';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/html2canvas')) {
            return 'vendor-html2canvas';
          }
          if (id.includes('/data/catalog/')) {
            return 'tool-catalog';
          }
        },
      },
    },
  },
})
