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
  external: ['miroir-core', 'miroir-app-miroir', 'miroir-app-admin'],
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
