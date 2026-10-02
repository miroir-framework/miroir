/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// import { babelImport } from 'vite-plugin-babel-import';
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { miroirBundleReport } from "./vite/bundleReportPlugin.js";
import { miroirManualChunkLoadLogger } from "./vite/chunkLoadLoggerPlugin.js";
import { MIROIR_TEST_CLIENT_CONFIGS, webClientEnvironment, webTestClientConfigs } from "./vite/environmentConfig.js";
import { resolveManualChunk } from "./vite/manualChunks.js";
import { miroirTestTimingConfig } from "../../scripts/vitest/timing.mjs";

// Resolve certificate paths (same defaults as miroir-server)
const __viteFilename = fileURLToPath(import.meta.url);
const __viteDirname = path.dirname(__viteFilename);
const defaultCertsDir = path.resolve(__viteDirname, '../../certs');
const certFile = process.env.MIROIR_TLS_CERT ?? path.join(defaultCertsDir, 'localhost.pem');
const keyFile  = process.env.MIROIR_TLS_KEY  ?? path.join(defaultCertsDir, 'localhost-key.pem');
const certsReady = fs.existsSync(certFile) && fs.existsSync(keyFile);

const viteRoot = path.resolve(__viteDirname, "src");

/**
 * #321: the client served or built calls the server of the selected environment (MIROIR_ENV, then
 * environments/local.json, then dev). vitest runs (mode "test") skip it: tests select their own
 * environment.
 */
function selectedWebClientEnvironment(command, mode) {
  if (mode === "test") {
    return undefined;
  }
  if (!certsReady) {
    console.warn(
      '[vite] TLS certificate files not found — serving over HTTP.\n' +
      '  Run  scripts/setup-https.sh  (bash) or  scripts/setup-https.ps1  (PowerShell)' +
      ' to enable HTTPS.'
    );
  }
  const web = webClientEnvironment({ cwd: __viteDirname, env: process.env, command, tls: certsReady });
  console.log(`[vite] environment ${web.name} (${web.source}): the web client calls the server at ${web.rootApiUrl}`);
  web.warnings.forEach((warning) => console.warn(`[vite] warning: ${warning}`));
  return web;
}

/**
 * #321: the realServer-* profiles of in-app test runs open the stores of the test environments; a
 * served client seeds the missing copies. vitest runs get the same configurations, with the URLs of
 * the environments.
 */
function realServerTestClientConfigs(command, mode) {
  const served = command === "serve" && mode !== "test";
  const configs = webTestClientConfigs({ cwd: __viteDirname, httpOnly: served && !certsReady, seed: served });
  return { [MIROIR_TEST_CLIENT_CONFIGS]: JSON.stringify(configs) };
}

const NODE_STORE_PACKAGES = ["miroir-store-filesystem", "miroir-store-postgres", "miroir-store-mongodb"];
const nodeStoreAliases = NODE_STORE_PACKAGES.map((name) => ({
  find: new RegExp(`^${name}$`),
  replacement: path.resolve(__viteDirname, "vite/nodeStoreStub.js"),
}));

export default defineConfig(({ command, mode }) => {
  const web = selectedWebClientEnvironment(command, mode);
  const apiBase = web?.rootApiUrl ?? (certsReady ? 'https://localhost:3080' : 'http://localhost:3080');
  return {
    define: { ...(web?.define ?? {}), ...realServerTestClientConfigs(command, mode) },
    // Absolute path so `root` does not depend on process cwd (npm -w, CI, or
    // an editor launching Vite from the repo root). On Windows only, normalize
    // drive-letter case: Vite's html-proxy cache compares root to HTML module
    // ids, and `c:` vs `C:` misses the inline-CSS entry.
    root:
      process.platform === "win32"
        ? viteRoot.replace(/\\/g, "/").replace(/^([a-zA-Z]):/, (_, drive) => `${drive.toUpperCase()}:`)
        : viteRoot,
    build: {
      // Relative to the root
      outDir: '../dist',
      target: 'esnext',
      sourcemap: true,
      // dist/.vite/manifest.json: read by the #286 bundle guard (componentTestChunk.286.phase4),
      // which checks that @testing-library stays out of the chunks the entry loads statically.
      manifest: true,
      rollupOptions: {
        output: {
          // Pin heavy vendor libraries to stable named chunks so the browser
          // can cache them independently of app code changes.
          manualChunks: resolveManualChunk,
        },
      },
    },
    resolve: {
      dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', '@mui/material'],
      // #337: the web build ships no Node store driver (sequelize, mongodb, …); vitest keeps the real ones.
      alias: command === "build" && mode !== "test" ? nodeStoreAliases : [],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@emotion/react', 
        '@emotion/styled', 
        '@mui/material/Tooltip',
        // Named prebundle entries help dev chunk-load tracing (chunkLoadTrace.ts URL matching).
        '@mui/material',
        '@mui/icons-material',
        '@copilotkit/react-core',
        '@copilotkit/react-ui',
        'ag-grid-community',
        'ag-grid-react',
        'd3',
      ],
      // Node-only store drivers — pulled via dynamic import from IntegrationTestSession
      // for CLI/Vitest. Must not be prebundled into the webApp (MongoDB driver crashes
      // in-browser: "Class extends value undefined is not a constructor").
      exclude: [
        'miroir-store-filesystem',
        'miroir-store-mongodb',
        'miroir-store-postgres',
        'mongodb',
        'pg',
      ],
    },
    plugins: [
      miroirManualChunkLoadLogger(),
      // #326: prints which packages each chunk holds and why; writes dist/.vite/bundle-report.json
      miroirBundleReport({ root: path.resolve(__viteDirname, "../.."), app: "miroir-standalone-app" }),
      // Browser builds only: vitest runs on Node, and since 0.28 the plugin also shims `process` there, which
      // hides `process.versions.node` from getClientEnvironment ("window is not defined").
      ...(mode === "test"
        ? []
        : [
            nodePolyfills({
              include: [ "crypto" ],
              // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
              exclude: [
                "process"
              ],
            }),
          ]),
      react({
        jsxImportSource: '@emotion/react',
        // Use React plugin in all *.jsx and *.tsx files
        include: '../src/**/*.{jsx,tsx}',
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
    ],
    server: {
      // Enable HTTPS when certs are available (generated by scripts/setup-https.sh/.ps1).
      // Falls back to HTTP automatically when cert files are absent.
      https: certsReady
        ? { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }
        : undefined,
      proxy: {
        // Proxy API requests to the server; secure:false accepts self-signed/local-CA certs
        '/queryTemplate': { target: apiBase, secure: false },
        '/query':         { target: apiBase, secure: false },
        '/action':        { target: apiBase, secure: false },
        '/CRUD':          { target: apiBase, secure: false },
        '/api/copilotkit': { target: apiBase, secure: false },
        '/mcp':            { target: apiBase, secure: false },
        '/auth':           { target: apiBase, secure: false },
        '/capabilities':   { target: apiBase, secure: false },
      }
    },
    test: {
      // #318: timing runner only when MIROIR_TEST_TIMING=1 (run-nonreg.py --timings)
      ...miroirTestTimingConfig(),
      root: "tests",
      globals: true,
      watch: false,
      environment: 'happy-dom',
      hookTimeout: 30000,
      testTimeout: 180000, // 3 minutes for complex tests
      setupFiles: ['./setup.ts'],
      // #330: svg-toolbelt's `main` is a CommonJS file in a `"type": "module"` package, which Node
      // cannot load; its ESM build is loaded instead (miroir-diagram-class imports it, and the
      // Report pages load miroir-diagram-class).
      alias: [
        {
          find: /^svg-toolbelt$/,
          replacement: path.resolve(__viteDirname, '../../node_modules/svg-toolbelt/dist/svg-toolbelt.esm.js'),
        },
      ],
      env: {
        VITE_TEST_MODE: 'true',
        MIROIR_AUTH_ENABLED: process.env.MIROIR_AUTH_ENABLED ?? '0',
      },
      // Configure React Testing Library act warnings
      pool: 'threads',
      maxWorkers: 1,
      // Configure environment for React Testing Library
      environmentOptions: {
        happyDOM: {
          settings: {
            // Enable React 18 features
            disableJavaScriptFileLoading: false,
            disableJavaScriptEvaluation: false,
            enableFileSystemHttpRequests: false
          }
        }
      }
    },
  };
});
