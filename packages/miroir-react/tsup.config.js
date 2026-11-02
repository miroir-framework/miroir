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
  // #652 (D3): the local caches (private workspace packages) are bundled, their declarations inlined. #656 (D9):
  // `local-cache-redux` and `local-cache-zustand` (`@miroir-framework/react/local-cache/redux`, `/zustand`) hold one
  // each, with its React binding; the root holds the selectors only, from the redux package's selector modules.
  noExternal: ["miroir-localcache-redux", "miroir-localcache-zustand"],
  dts: {
    entry: {
      index: "src/index.ts",
      "local-cache-redux": "src/local-cache-redux.ts",
      "local-cache-zustand": "src/local-cache-zustand.ts",
    },
    // tsup's own `resolve` goes through node_modules, where the local cache's relative re-exports count as external
    // library imports: a path to its declarations inlines them, the relative ones included.
    compilerOptions: {
      paths: {
        "miroir-localcache-redux/node": [fileURLToPath(new URL("../miroir-localcache-redux/dist/node.d.ts", import.meta.url))],
        "miroir-localcache-redux/selectors": [fileURLToPath(new URL("../miroir-localcache-redux/dist/selectors.d.ts", import.meta.url))],
        "miroir-localcache-zustand": [fileURLToPath(new URL("../miroir-localcache-zustand/dist/index.d.ts", import.meta.url))],
      },
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
