import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Extract Recharts into a shared chunk so multiple pages can reuse it
          'recharts': ['recharts'],
        },
      },
    },
  },
  server: {
    port: 3132,
    host: true,
    proxy: {
      '/api/openf1': {
        target: 'https://api.openf1.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/openf1/, '/v1'),
      },
      '/api/jolpica': {
        target: 'https://api.jolpi.ca',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/jolpica/, '/ergast/f1'),
      },
    },
  },
});