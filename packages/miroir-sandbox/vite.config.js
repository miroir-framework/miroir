import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';
import { fileURLToPath } from 'url';

const __viteFilename = fileURLToPath(import.meta.url);
const __viteDirname = path.dirname(__viteFilename);

// miroir-standalone-app source root – aliased as @miroir-app
const standaloneAppSrc = path.resolve(__viteDirname, '../miroir-standalone-app/src');

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
    'import.meta.env.VITE_STATIC_DEMO': JSON.stringify('true'),
  },
  resolve: {
    alias: [
      // @miroir-app/* → miroir-standalone-app/src/*
      // Allows demo code to import standalone-app components without copying them.
      { find: '@miroir-app', replacement: standaloneAppSrc },
    ],
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
      // Process all TSX/JSX files, including those pulled in from miroir-standalone-app
      include: /\.(t|j)sx$/,
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
  // No server proxy – the demo runs fully client-side with bundled stores
});
