import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

// One output module per source module (#592): Vite sees separate modules and puts each one in the
// chunk that uses it, so components only lazy routes use stay out of the entry chunk.
// With "sideEffects": false in package.json, modules the app does not use are dropped.
export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.d.ts"],
  format: ["esm"],
  bundle: true,
  splitting: true,
  clean: true,
  // #652 (D3): the local cache (a private workspace package) is bundled, its declarations inlined. `local-cache`: its
  // implementation without the UI, for Node test setups (`@miroir-framework/react/local-cache`).
  noExternal: ["miroir-localcache-redux"],
  dts: {
    entry: { index: "src/index.ts", "local-cache": "src/miroir-localcache-imports.ts" },
    // tsup's own `resolve` goes through node_modules, where the local cache's relative re-exports count as external
    // library imports: a path to its declarations inlines them, the relative ones included.
    compilerOptions: {
      paths: { "miroir-localcache-redux": [fileURLToPath(new URL("../miroir-localcache-redux/dist/index.d.ts", import.meta.url))] },
    },
  },
  sourcemap: true,
  minify: true,
  external: [
    "react",
    "react-dom",
    "@mui/material",
    "@emotion/react",
    "@emotion/styled",
    "@codemirror/state",
    "@codemirror/view",
    "@codemirror/lang-javascript",
    "@uiw/react-codemirror",
  ],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
