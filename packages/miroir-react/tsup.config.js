import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  bundle: true,
  dts: true,
  sourcemap: true,
  treeshake: true,
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
