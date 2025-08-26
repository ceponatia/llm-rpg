import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite configuration
 * @type {import('vite').UserConfigExport}
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@rpg/types': path.resolve(__dirname, '../types/src')
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
