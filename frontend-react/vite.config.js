import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/services': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/orders': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/receipts': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/bookings': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/categories': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/notifications': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/places': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/reviews': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
