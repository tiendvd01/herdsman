import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    watch: { ignored: ['**/src-tauri/**', '**/sidecar/**', '**/specs/**'] },
  },
  worker: { format: 'es' },
  build: { target: 'safari15', chunkSizeWarningLimit: 4000 },
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.{ts,tsx}'], globals: true },
});
