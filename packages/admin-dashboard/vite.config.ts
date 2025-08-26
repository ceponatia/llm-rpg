import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const embed = process.env.EMBED_ADMIN === 'true';
const adminBase = embed ? (process.env.ADMIN_BUILD_BASE || '/admin/') : '/';

export default defineConfig({
  base: adminBase,
  plugins: [react()],
  build: {
    sourcemap: process.env.EMBED_ADMIN_SOURCEMAPS === 'true'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@rpg/types': path.resolve(__dirname, '../types/src'),
      '@rpg/utils': path.resolve(__dirname, '../utils/src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  }
});