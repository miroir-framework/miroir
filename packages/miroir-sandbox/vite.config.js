import { defineConfig } from "vite";
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from "node:path";
import { fileURLToPath } from "node:url";

import { miroirBundleReport } from "../miroir-standalone-app/vite/bundleReportPlugin.js";

const __viteDirname = path.dirname(fileURLToPath(import.meta.url));

// #672 D10: miroir-react-testing imports the Node stores dynamically, for vitest and the CLI; the
// sandbox runs its integration tests on IndexedDB and ships a stub instead.
const NODE_STORE_PACKAGES = ["@miroir-framework/store-filesystem", "@miroir-framework/store-postgres", "@miroir-framework/store-mongodb"];
const nodeStoreAliases = NODE_STORE_PACKAGES.map((name) => ({
  find: new RegExp(`^${name}$`),
  replacement: path.resolve(__viteDirname, "vite/nodeStoreStub.js"),
}));

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
    // #672: dist/.vite/manifest.json, read by the smoke test's lazy-loading check
    manifest: true,
  },
  define: {
    // Lets standalone-app code branch on static-demo mode (e.g. hide server-only UI)
    'import.meta.env.MIROIR_IS_SANDBOX': JSON.stringify('true'),
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', '@mui/material'],
    alias: nodeStoreAliases,
  },
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material/Tooltip',
    ],
    // #672: the Node store drivers must not be prebundled (the MongoDB driver crashes in a browser)
    exclude: [
      '@miroir-framework/store-filesystem',
      '@miroir-framework/store-mongodb',
      '@miroir-framework/store-postgres',
      'mongodb',
      'pg',
    ],
  },
  plugins: [
    // #672: prints which packages each chunk holds; writes dist/.vite/bundle-report.json
    miroirBundleReport({ root: path.resolve(__viteDirname, "../.."), app: "miroir-sandbox" }),
    nodePolyfills({
      // "stream": crypto-browserify's createHash needs it (#472), and the test runtime's SecretsService hashes
      include: ['crypto', 'stream'],
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
