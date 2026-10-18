import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    sourcemap: false
  },
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false
    }
  },
  server: {
    port: 5173,
    host: true,
    // In development the React app calls /api; Laravel (php artisan serve) answers it.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true }
    }
  }
})
