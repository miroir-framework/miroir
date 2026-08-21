import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
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
  splitting: false,
  clean: true,
  // rollup-plugin-dts (tsup `dts: true`) cannot emit `.d.ts.map` files, which are
  // required for Go to Definition to jump from consumers into `src/`. Emit
  // declarations + declaration maps with tsc in onSuccess instead.
  dts: false,
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
    // Node builtins — only used by Node-only subpath entries
    'node:fs',
    'node:path',
    'node:fs/promises',
    'fs/promises',
    'path',
  ],
  onSuccess: async () => {
    execSync(
      'tsc --emitDeclarationOnly --declaration --declarationMap -p tsconfig.declarations.json',
      { stdio: 'inherit' },
    )
    // Keep the package.json exports subpath types entry stable.
    writeFileSync(
      'dist/model-validation-fs.d.ts',
      "export * from './5_tests/ModelValidationToolsFilesystem.js';\n",
    )
  },
})
