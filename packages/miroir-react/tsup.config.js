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
  dts: { entry: "src/index.ts" },
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
