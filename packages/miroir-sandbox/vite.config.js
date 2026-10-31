import { defineConfig } from "vite";
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  // Serve from src/ so that index.html and assets are resolved correctly
  root: 'src',
  // GitHub Pages sub-path: set to '/' for root deployment or '/miroir-demo/' for sub-path
  base: process.env.VITE_BASE_URL ?? '/',
  build: {
    outDir: '../dist',
    target: 'esnext',
    // Smaller bundle for GitHub Pages; disable for local debugging
    sourcemap: process.env.VITE_SOURCEMAP === 'true',
  },
  define: {
    // Lets standalone-app code branch on static-demo mode (e.g. hide server-only UI)
    'import.meta.env.MIROIR_IS_SANDBOX': JSON.stringify('true'),
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
      include: /\.(t|j)sx$/,
    }),
    // plugin-react 6 no longer runs babel itself: @emotion/babel-plugin goes through @rolldown/plugin-babel
    babel({
      include: /\.(t|j)sx$/,
      plugins: ['@emotion/babel-plugin'],
    }),
  ],
  // No server proxy – the demo runs fully client-side with bundled stores
});
