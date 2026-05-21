import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  // Serve from src/ so that index.html and assets are resolved correctly
  root: 'src',
  // GitHub Pages sub-path: set to '/' for root deployment or '/miroir/' for sub-path
  base: '/',
  build: {
    outDir: '../dist',
    target: 'esnext',
    sourcemap: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', '@mui/material'],
  },
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material/Tooltip',
    ],
  },
  plugins: [
    nodePolyfills({
      include: ['crypto'],
      exclude: ['process'],
    }),
    react({
      jsxImportSource: '@emotion/react',
      include: '../src/**/*.{jsx,tsx}',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
  // No server proxy – the demo runs fully client-side with bundled stores
});
