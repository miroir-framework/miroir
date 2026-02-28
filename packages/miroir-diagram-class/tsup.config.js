import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  bundle: true,
  dts: true,
  sourcemap: true,
  treeshake: true,
  minify: true,
  external: ["react", "react-dom", "@mui/material", "@emotion/react", "@emotion/styled", "miroir-react"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
