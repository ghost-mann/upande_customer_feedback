import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import proxyOptions from './proxyOptions.js';

// Single build entry: the feedback portal. Output →
// upande_customer_feedback/public/frontend/, served by Frappe at
// /assets/upande_customer_feedback/frontend/. scripts/build-html.mjs then writes
// the www/customer-feedback.html template (the /customer-feedback route).
const AREAS = ['feedback'];

export default defineConfig({
  plugins: [react()],
  base: '/assets/upande_customer_feedback/frontend/',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../upande_customer_feedback/public/frontend'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: Object.fromEntries(
        AREAS.map((a) => [a, path.resolve(__dirname, a, 'index.html')]),
      ),
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 8080,
    fs: { allow: [__dirname] },
    proxy: proxyOptions('/assets/upande_customer_feedback/frontend/'),
  },
});
