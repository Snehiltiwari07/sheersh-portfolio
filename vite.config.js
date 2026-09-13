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
        // Chunk by package, explicitly: the previous list named only
        // 'react' and 'react-dom', so react/jsx-runtime — which every JSX file
        // needs — was bundled into the framer-motion chunk. The initial chunk
        // therefore imported framer-motion (122 KB) statically and waited on it
        // before the first render. With the runtime pinned to react-vendor,
        // framer-motion is reachable only through the lazy below-the-fold
        // chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion')) return 'framer-motion';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor';
          return undefined;
        },
      },
    },
  },
  // Automatically strip all console.log and debugger statements from production JS
  esbuild: {
    drop: ['console', 'debugger'],
  },
});