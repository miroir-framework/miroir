import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  bundle: true,
  dts: true,
  sourcemap: true,
  // clean: true,
  // splitting: true,
  "treeshake": true,
  minify: true,
});