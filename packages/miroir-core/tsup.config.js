import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    // Node-only: filesystem model-validation helpers (node:fs). Not part of the
    // browser-facing main entry — Vite cannot resolve existsSync from fs stubs.
    'model-validation-fs': 'src/5_tests/ModelValidationToolsFilesystem.ts',
  },
  format: ['esm'],
  bundle: true,
  clean: true,
  dts: true,
  sourcemap: true,
  treeshake: true,
  minify: true,
  // The Rollup treeShakingPlugin second pass collapseSourcemaps failed because
  // workspace symlink packages (miroir-test-app_deployment-*) were being bundled
  // with their dist/index.js.map included. Those stale maps embed an older version
  // of getMiroirFundamentalJzodSchemaHelpers.ts, conflicting with the current
  // esbuild transform of the same file. Making them explicit externals prevents
  // esbuild from following the symlinks and reading their stale sourcemaps.
  external: [
    'miroir-test-app_deployment-admin',
    'miroir-test-app_deployment-miroir',
    'miroir-test-app_deployment-library',
    // json-diff → @ewoudenberg/difflib uses dynamic require('assert'); must stay external for ncc/ESM consumers
    'json-diff',
    // Node builtins — only used by model-validation-fs entry
    'node:fs',
    'node:path',
  ],
});
