import { defineConfig } from "tsup";

// #672: one output module per source module, as @miroir-framework/react (#592). The sandbox and the app register
// the renderer through `./report-section`; the modules of an integ run, the fixture applications and testing-library
// stay behind the runtime's dynamic imports, so they load when a run starts. With "sideEffects": false, the modules an
// app does not use are dropped.
export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.d.ts"],
  format: ["esm"],
  bundle: true,
  splitting: true,
  clean: true,
  dts: {
    entry: {
      index: "src/index.ts",
      reportSection: "src/reportSection.ts",
    },
  },
  sourcemap: true,
  minify: true,
  // dependencies and peerDependencies stay external (tsup's default); the Node stores are optional peers (D10)
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
