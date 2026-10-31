import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  splitting: false,
  format: ['esm'],
  target: 'node20',
  bundle: true,
  dts: true,
  sourcemap: true,
  treeshake: true,
  minify: false,
  external: ['miroir-core', 'miroir-mcp'],
});
