import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  target: "es2022",
  format: ["esm"],
  clean: true,
  // the meta-model is core's own subpath, shared with core's other entries
  external: ["@miroir-framework/core", "@miroir-framework/core/meta-model"],
});
