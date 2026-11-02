import { defineConfig } from 'tsup';

// #636 (G3): the server library takes a running domain controller and never opens a store itself, so
// it imports no store package, no database driver, and none of the binary's own dependencies.
// Checked on what the bundle really imports (external ones included), after tsup has marked every
// declared dependency external: an onResolve hook would not see those.
const FORBIDDEN_IMPORTS = [
  /^(@miroir-framework\/store-|miroir-store-)/,
  /^pg($|\/|-)/, // pg, pg-pool, pg-native, pg-hstore, pg-cursor, …
  /^@?sequelize($|\/)/,
  /^mongodb($|\/)/,
  /^([a-z-]+-)?level($|\/)/, // level, browser-level, classic-level, abstract-level, memory-level, …
  /^(@miroir-framework\/env|miroir-env)($|\/)/,
  /^miroir-ai($|\/)/,
  /^@copilotkit\//,
];

/** The package a bundled input file comes from: a sibling workspace package or a node_modules one. */
function inputPackage(inputPath) {
  const inNodeModules = inputPath.lastIndexOf('node_modules/');
  if (inNodeModules >= 0) {
    const [scopeOrName, name] = inputPath.slice(inNodeModules + 'node_modules/'.length).split('/');
    return scopeOrName.startsWith('@') ? `${scopeOrName}/${name}` : scopeOrName;
  }
  const sibling = inputPath.match(/^\.\.\/([^/]+)\//);
  return sibling ? sibling[1] : undefined;
}

const isForbidden = (specifier) => !!specifier && FORBIDDEN_IMPORTS.some((pattern) => pattern.test(specifier));

export const forbiddenImportsPlugin = {
  name: 'miroir-server-library-forbidden-imports',
  setup(build) {
    build.onEnd((result) => {
      const outputs = result.metafile?.outputs ?? {};
      const found = Object.entries(outputs).flatMap(([output, { imports, inputs }]) => [
        // left as imports: declared dependencies, which tsup marks external
        ...imports.filter((imported) => isForbidden(imported.path)).map((imported) => `${output} imports ${imported.path}`),
        // bundled in: everything else
        ...Object.keys(inputs ?? {})
          .filter((input) => isForbidden(inputPackage(input)))
          .map((input) => `${output} bundles ${input}`),
      ]);
      if (found.length > 0) {
        throw new Error(
          `miroir-server-library must not import stores, drivers, miroir-env, miroir-ai or CopilotKit (#636):\n  ${found.join('\n  ')}`,
        );
      }
    });
  },
};

// MIROIR_SERVER_LIBRARY_PROBE=<folder>: builds a probe importing a store into <folder> instead of dist/,
// to prove the guard fails the build (scripts/tests/test_server_library_boundaries.py).
// MIROIR_SERVER_LIBRARY_PROBE_EXTERNAL=1 leaves the store external, as a declared dependency would be.
const probeOutDir = process.env.MIROIR_SERVER_LIBRARY_PROBE;
const probeExternal = probeOutDir && process.env.MIROIR_SERVER_LIBRARY_PROBE_EXTERNAL === '1' ? ['@miroir-framework/store-filesystem'] : [];

export default defineConfig({
  entry: probeOutDir ? { probe: 'tests/support/forbiddenImportProbe.ts' } : { index: 'src/index.ts' },
  outDir: probeOutDir ?? 'dist',
  splitting: false,
  format: ['esm'],
  target: 'node20',
  bundle: true,
  dts: !probeOutDir,
  sourcemap: true,
  treeshake: true,
  minify: false,
  metafile: true,
  external: ['@miroir-framework/core', '@miroir-framework/mcp', ...probeExternal],
  esbuildPlugins: [forbiddenImportsPlugin],
});
