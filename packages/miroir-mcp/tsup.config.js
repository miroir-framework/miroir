import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  bundle: true,
  dts: true,
  sourcemap: true,
  treeshake: true,
  minify: false, // Keep unminified for better debugging in MCP context
  external: [
    'miroir-core',
    'miroir-localcache-redux',
    'miroir-store-filesystem',
    'miroir-store-indexedDb', 
    'miroir-store-postgres'
  ],
});
