import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const backendProxy = {
  '/api': { target: 'http://localhost:3000', changeOrigin: true },
  '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: [
    'localhost',
    '127.0.0.1',
    'www.mukuyure.com',
    'db0a7792d686.ngrok-free.app',
    '102.222.88.49:3000',
    '102.222.88.49',
    '192.168.110.149',
    'mukuyure.com', // Adicione isso também se acessar sem "www"
    'https://app.mukuyure.com',
    'localhost:3000',
    'app.mukuyure.com',
    ],
    cors: true, // garante que CORS esteja habilitado
    proxy: backendProxy,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self), payment=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'ngrok-skip-browser-warning': 'true',
    },
  },
  preview: {
    allowedHosts: true,
    proxy: backendProxy,
  },
});
