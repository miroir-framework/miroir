import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
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

// #652 (D4): `dist/startup.d.ts`. tsup's declaration bundler resolves packages without their `exports` map, so it
// leaves `miroir-localcache-redux/node` (a private package, absent for a consumer) as an import. The local cache's own
// bundled declarations (`dist/node.d.ts`) import only declared dependencies: they are copied, exporting only what
// `src/startup.ts` re-exports.
export function writeStartupDeclarations(outDir = 'dist') {
  const require = createRequire(import.meta.url);
  const localCache = dirname(require.resolve('miroir-localcache-redux/package.json'));
  const declarations = readFileSync(join(localCache, 'dist/node.d.ts'), 'utf8');
  const startup = readFileSync('src/startup.ts', 'utf8');
  const exported = startup.match(/export\s*\{([^}]*)\}\s*from\s*["']miroir-localcache-redux\/node["']/);
  if (!exported) throw new Error('src/startup.ts: expected `export { … } from "miroir-localcache-redux/node"`');
  const names = exported[1].split(',').map((name) => name.trim()).filter(Boolean);
  const values = names.filter((name) => !name.startsWith('type '));
  const types = names.filter((name) => name.startsWith('type ')).map((name) => name.slice('type '.length).trim());
  const body = declarations
    .split('\n')
    // the re-exports go (replaced below), and the side-effect imports of packages the server library does not declare
    .filter((line) => !/^export (type )?\{/.test(line) && !/^import ['"][^'"]+['"];$/.test(line))
    .join('\n')
    .trimEnd();
  writeFileSync(
    join(outDir, 'startup.d.ts'),
    `${body}\n\nexport { ${values.join(', ')} };\nexport type { ${types.join(', ')} };\n`,
  );
}

export default defineConfig({
  // #652: `startup` bundles the local cache's Node entry (a private workspace package), `index` the HTTP app
  entry: probeOutDir ? { probe: 'tests/support/forbiddenImportProbe.ts' } : { index: 'src/index.ts', startup: 'src/startup.ts' },
  outDir: probeOutDir ?? 'dist',
  splitting: false,
  format: ['esm'],
  target: 'node20',
  bundle: true,
  dts: probeOutDir ? false : { entry: { index: 'src/index.ts' } },
  onSuccess: probeOutDir ? undefined : async () => writeStartupDeclarations(),
  sourcemap: true,
  treeshake: true,
  minify: false,
  metafile: true,
  external: ['@miroir-framework/core', '@miroir-framework/mcp', ...probeExternal],
  noExternal: ['miroir-localcache-redux'],
  esbuildPlugins: [forbiddenImportsPlugin],
});
