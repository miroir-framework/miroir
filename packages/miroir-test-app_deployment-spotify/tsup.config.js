import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: false,
  minify: false,
  external: ['miroir-core', 'miroir-test-app_deployment-miroir', 'miroir-test-app_deployment-admin', 'json-diff'],
  noExternal: [],
  loader: {
    '.json': 'copy',
  },
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      '.json': 'json',
    };
  },
});
