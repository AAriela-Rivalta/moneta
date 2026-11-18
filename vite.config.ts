/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
  react(),
  tailwindcss(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Moneta - Finanzas personales',
      short_name: 'Moneta',
      description: 'Organizá tus ingresos, gastos, presupuestos y objetivos financieros.',
      theme_color: '#172c3c',
      background_color: '#f7f4ee',
      display: 'standalone',
      start_url: '/app',
      scope: '/',
      icons: [
  {
    src: '/pwa-192x192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: '/pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any',
  },
],
    },
  }),
],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          charts: ['recharts'],
        },
      },
    },
  },
  test: {
    // Las pruebas cubren la lógica pura (domain/, lib/ y el reducer): no necesitan navegador.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
