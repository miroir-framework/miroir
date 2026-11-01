import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
  },
  splitting: false,
  format: ['esm'],
  target: 'node20',
  bundle: true,
  dts: true,
  sourcemap: true,
  treeshake: true,
  minify: false, // Keep unminified for better debugging in MCP context
  external: [
    '@miroir-framework/core',
    'miroir-localcache-redux',
    '@miroir-framework/store-filesystem',
    '@miroir-framework/store-indexeddb', 
    '@miroir-framework/store-postgres'
  ],
});
