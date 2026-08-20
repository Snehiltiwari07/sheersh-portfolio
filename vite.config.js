import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    // Pre-compress build assets into Brotli (.br) and Gzip (.gz)
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
    compression({ algorithm: 'gzip', ext: '.gz' }),
  ],
  server: { port: 5173 },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Separate heavy vendor scripts to maximize browser caching
        manualChunks: {
          'framer-motion': ['framer-motion'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  // Automatically strip all console.log and debugger statements from production JS
  esbuild: {
    drop: ['console', 'debugger'],
  },
});