import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  bundle: true,
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
    // 'miroir-test-app_deployment-library', // no runtime/package dependency on miroir-test-app_deployment-library
    // json-diff → @ewoudenberg/difflib uses dynamic require('assert'); must stay external for ncc/ESM consumers
    'json-diff',
  ],
});
