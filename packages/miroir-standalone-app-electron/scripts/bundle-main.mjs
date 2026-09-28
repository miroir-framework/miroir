/**
 * Builds the Electron main process and preload with esbuild (#326), so the package ships one
 * bundled `dist/src/main.js` and `dist/src/preload.js` plus the few packages that must stay in
 * `node_modules` (EXTERNALS), instead of every workspace package and its dependencies.
 *
 * Writes `dist/bundle-report.json` in the format of the standalone app's report and prints its
 * table; `scripts/check_bundle_policy.py` checks it against `bundle-policy.json`.
 *
 * Run: node scripts/bundle-main.mjs  (from this package; `npm run build` does it)
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { isBuiltin } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import { build } from "esbuild";

import {
  buildBundleReport,
  npmPackageOfId,
  reportInputFromEsbuildMetafile,
} from "../../miroir-standalone-app/vite/bundleReportCore.js";
import { bundleReportLines, readWorkspaces } from "../../miroir-standalone-app/vite/bundleReportPlugin.js";

/**
 * Packages left outside the bundle:
 * - `electron`: provided by the Electron runtime.
 * - `@cursor/sdk`: native binaries, imported dynamically by `miroir-ai` only when the `cursor`
 *   capability is on. Not in `dependencies`, so the package does not ship it: #275 keeps Cursor off
 *   in the packaged app, where `assertCursorSdkPackaged` fails loud if someone turns it on, and
 *   keeps the SDK a dependency of `miroir-ai` alone.
 * - `classic-level`: native module (the Node side of `miroir-store-indexedDb`, through `level`),
 *   found by `node-gyp-build` next to its own files; in `dependencies`, so electron-builder ships it.
 * - `pg`: sequelize loads its dialect driver with a computed `require("pg")`; in `dependencies`.
 * `electron-squirrel-startup` is not imported but required at run time by `main.ts`
 * (`createRequire`), so it is in `dependencies` too.
 */
export const EXTERNALS = ["electron", "@cursor/sdk", "classic-level", "pg"];

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(packageDir, "../..");
const outDir = path.join(packageDir, "dist");
const REPORT_FILE = "bundle-report.json";

// Bundled CommonJS code calls `require` and reads `__dirname`, which an ES module lacks.
const ESM_BANNER = [
  'import { createRequire as __bundleCreateRequire } from "node:module";',
  'import { fileURLToPath as __bundleFileURLToPath } from "node:url";',
  'import { dirname as __bundleDirname } from "node:path";',
  "const require = __bundleCreateRequire(import.meta.url);",
  "const __filename = __bundleFileURLToPath(import.meta.url);",
  "const __dirname = __bundleDirname(__filename);",
].join("\n");

const common = {
  absWorkingDir: packageDir,
  bundle: true,
  platform: "node",
  target: "node22",
  external: EXTERNALS,
  // Class and function names stay as written: esbuild renames clashing top-level names, and
  // some libraries read `constructor.name`.
  keepNames: true,
  sourcemap: true,
  metafile: true,
  logLevel: "warning",
};

rmSync(path.join(outDir), { recursive: true, force: true });
const main = await build({
  ...common,
  entryPoints: ["src/main.ts"],
  outfile: "dist/src/main.js",
  format: "esm",
  banner: { js: ESM_BANNER },
});
// A sandboxed preload script must be CommonJS.
const preload = await build({
  ...common,
  entryPoints: ["src/preload.ts"],
  outfile: "dist/src/preload.js",
  format: "cjs",
});

const metafile = {
  inputs: { ...main.metafile.inputs, ...preload.metafile.inputs },
  outputs: { ...main.metafile.outputs, ...preload.metafile.outputs },
};
const { chunks, graph, externals } = reportInputFromEsbuildMetafile(metafile, packageDir, outDir);
const context = { root, app: "miroir-standalone-app-electron", workspaces: readWorkspaces(root) };
const report = buildBundleReport({
  chunks: chunks.map((chunk) => {
    const code = readFileSync(path.join(outDir, chunk.file));
    return { ...chunk, rawBytes: code.length, gzipBytes: gzipSync(code).length };
  }),
  graph,
  context,
});
// EXTERNALS, plus the optional packages esbuild left out because they are not installed
// (`kerberos`, `snappy`, … for mongodb): a `require` of them fails and is caught at run time.
report.externals = [
  ...new Set([
    ...EXTERNALS,
    ...externals.filter((specifier) => !isBuiltin(specifier)).map((specifier) => npmPackageOfId(`node_modules/${specifier}`)),
  ]),
].sort();

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, REPORT_FILE), `${JSON.stringify(report, null, 2)}\n`);
for (const line of bundleReportLines(report, { context, outDir, reportFile: REPORT_FILE })) {
  console.log(line);
}
console.log(`  outside the bundle: ${report.externals.join(", ")}`);
