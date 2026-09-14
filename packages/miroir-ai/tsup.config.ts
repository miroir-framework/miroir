import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  dts: true,
  clean: true,
  sourcemap: true,
  // @ag-ui/proto imports @bufbuild/protobuf/wire (protobuf-es v2). @cursor/sdk
  // needs protobuf 1.10 nested under miroir-ai. Bundling node_modules into dist
  // made that 1.10 instance shadow v2 and crash server startup
  // (ERR_PACKAGE_PATH_NOT_EXPORTED ./wire).
  skipNodeModulesBundle: true,
});
