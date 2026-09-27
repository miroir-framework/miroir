/**
 * Bundle attribution report (#326): after a production build, prints which packages each chunk
 * holds and the import chain that brings each one in, then writes
 * - `dist/.vite/bundle-report.json`: every chunk with its load kind (entry, eager, lazy), raw and
 *   gzip sizes and packages, plus findings (Node built-ins emptied for the browser, dynamic
 *   imports that split nothing off). `scripts/check_bundle_policy.py` reads it.
 * - `dist/.vite/bundle-report.html`: a treemap of the same build (rollup-plugin-visualizer).
 *
 * The attribution itself is in bundleReportCore.js. See docs/internals/code-splitting.md.
 *
 * Disable at build time: VITE_MIROIR_BUNDLE_REPORT=false
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { isBuiltin } from "node:module";
import path from "node:path";
import { gzipSync } from "node:zlib";

import { visualizer } from "rollup-plugin-visualizer";

import { attributeModule, BROWSER_EXTERNAL_ID, buildBundleReport, condensedChain } from "./bundleReportCore.js";

export const BUNDLE_REPORT_FILE = ".vite/bundle-report.json";
const TREEMAP_FILE = ".vite/bundle-report.html";

/**
 * The workspace packages of the repository, from the root `package.json` `workspaces` globs
 * (`packages/*`).
 * @param {string} root
 * @returns {import("./bundleReportCore.js").Workspace[]}
 */
export function readWorkspaces(root) {
  const patterns = JSON.parse(readFileSync(path.join(root, "package.json"), "utf-8")).workspaces ?? [];
  const workspaces = [];
  for (const pattern of patterns) {
    const directories = pattern.endsWith("/*")
      ? readdirSync(path.join(root, pattern.slice(0, -2)), { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => `${pattern.slice(0, -2)}/${entry.name}`)
      : [pattern];
    for (const dir of directories) {
      const manifest = path.join(root, dir, "package.json");
      if (existsSync(manifest)) {
        workspaces.push({ dir, name: JSON.parse(readFileSync(manifest, "utf-8")).name });
      }
    }
  }
  return workspaces;
}

/**
 * @param {{ root: string, app: string, lazyChunksShown?: number, packagesShown?: number }} options
 *   `root`: repository root; `app`: name of the workspace package being built
 * @returns {import("vite").PluginOption[]}
 */
export function miroirBundleReport({ root, app, lazyChunksShown = 15, packagesShown = 5 }) {
  if (process.env.VITE_MIROIR_BUNDLE_REPORT === "false") {
    return [];
  }
  /** @type {import("./bundleReportCore.js").ExternalizedImport[]} */
  const externalized = [];
  /** @type {import("vite").Logger | undefined} */
  let logger;

  /** @type {import("vite").Plugin} */
  const reportPlugin = {
    name: "miroir-bundle-report",
    apply: "build",
    // Before vite:resolve, so that the Node built-ins it empties for the browser are seen here.
    enforce: "pre",
    configResolved(config) {
      logger = config.logger;
    },
    async resolveId(source, importer, options) {
      if (!importer || !isBuiltin(source)) {
        return null;
      }
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (resolved?.id.startsWith(BROWSER_EXTERNAL_ID)) {
        externalized.push({ module: source.replace(/^node:/, ""), importer });
      }
      return resolved;
    },
    writeBundle(outputOptions, bundle) {
      const outDir = outputOptions.dir ?? path.dirname(outputOptions.file ?? "");
      const chunks = Object.values(bundle)
        .filter((output) => output.type === "chunk" && output.fileName.endsWith(".js"))
        .map((chunk) => {
          const code = readFileSync(path.join(outDir, chunk.fileName));
          return {
            file: chunk.fileName,
            name: chunk.name,
            isEntry: chunk.isEntry,
            imports: chunk.imports,
            modules: Object.fromEntries(
              Object.entries(chunk.modules).map(([id, module]) => [id, module.renderedLength]),
            ),
            rawBytes: code.length,
            gzipBytes: gzipSync(code).length,
          };
        });
      const graph = new Map();
      for (const id of this.getModuleIds()) {
        const info = this.getModuleInfo(id);
        graph.set(id, { importedIds: info?.importedIds ?? [], dynamicallyImportedIds: info?.dynamicallyImportedIds ?? [] });
      }
      const context = { root, app, workspaces: readWorkspaces(root) };
      const report = buildBundleReport({ chunks, graph, context, externalized });
      const reportPath = path.join(outDir, BUNDLE_REPORT_FILE);
      mkdirSync(path.dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      const print = (line) => (logger ? logger.info(line) : console.log(line));
      for (const line of reportLines(report, { context, outDir, lazyChunksShown, packagesShown })) {
        print(line);
      }
    },
  };

  return [
    reportPlugin,
    {
      ...visualizer({ filename: TREEMAP_FILE, emitFile: true, template: "treemap", title: `${app} bundle`, projectRoot: root }),
      apply: "build",
    },
  ];
}

const kB = (bytes) =>
  `${(bytes / 1000).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kB`;

/**
 * The console table: the chunks loaded with the page, then the largest lazy chunks, each with
 * its largest packages and the chain that brings them in; then the findings.
 */
function reportLines(report, { context, outDir, lazyChunksShown, packagesShown }) {
  const appDir = context.workspaces.find((workspace) => workspace.name === context.app)?.dir;
  const shortPath = (step) => (appDir && step.startsWith(`${appDir}/`) ? step.slice(appDir.length + 1) : step);
  const packageOfPath = (step) => attributeModule(step, context).name;
  const chainText = (chain) => condensedChain([shortPath(chain[0]), ...chain.slice(1)], packageOfPath);
  const relativeOut = path.relative(process.cwd(), outDir) || ".";
  const { totals } = report;
  const lines = [
    "",
    `Bundle report (#326): ${path.join(relativeOut, BUNDLE_REPORT_FILE)}, treemap ${path.join(relativeOut, TREEMAP_FILE)}`,
    `  loaded with the page: ${totals.eager.chunks} chunks, ${kB(totals.eager.rawBytes)}, gzip ${kB(totals.eager.gzipBytes)}; whole build: ${totals.chunks} chunks, ${kB(totals.rawBytes)}, gzip ${kB(totals.gzipBytes)}`,
    "  Per chunk: its largest packages, with their size before minification and the import chain from this app's code.",
  ];
  const lazy = report.chunks.filter((chunk) => chunk.loadKind === "lazy");
  const shown = [...report.chunks.filter((chunk) => chunk.loadKind !== "lazy"), ...lazy.slice(0, lazyChunksShown)];
  const packageWidth = Math.max(
    ...shown.flatMap((chunk) => chunk.packages.slice(0, packagesShown).map((entry) => entry.name.length)),
  );
  for (const chunk of shown) {
    lines.push("", `  ${chunk.loadKind.padEnd(5)}  ${chunk.file}  ${kB(chunk.rawBytes)}, gzip ${kB(chunk.gzipBytes)}`);
    for (const entry of chunk.packages.slice(0, packagesShown)) {
      const via = entry.kind === "app" ? "(this app)" : chainText(entry.chain);
      lines.push(`         ${entry.name.padEnd(packageWidth)}  ${kB(entry.renderedBytes).padStart(11)}  ${via}`);
    }
    if (chunk.packages.length > packagesShown) {
      const rest = chunk.packages.slice(packagesShown);
      const restBytes = rest.reduce((sum, entry) => sum + entry.renderedBytes, 0);
      lines.push(`         ${`+ ${rest.length} more packages`.padEnd(packageWidth)}  ${kB(restBytes).padStart(11)}`);
    }
  }
  const hidden = lazy.slice(lazyChunksShown);
  if (hidden.length > 0) {
    const raw = hidden.reduce((sum, chunk) => sum + chunk.rawBytes, 0);
    const gzip = hidden.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
    lines.push("", `  lazy   + ${hidden.length} smaller lazy chunks  ${kB(raw)}, gzip ${kB(gzip)}`);
  }

  const externalized = report.findings.filter((finding) => finding.kind === "externalized-node-module");
  if (externalized.length > 0) {
    lines.push("", "  Node built-ins emptied for the browser, by importing package (that code cannot work in the browser):");
    const byPackage = new Map();
    for (const finding of externalized) {
      byPackage.set(finding.importerPackage, [...(byPackage.get(finding.importerPackage) ?? []), finding]);
    }
    for (const [name, findings] of byPackage) {
      const modules = [...new Set(findings.map((finding) => finding.module))].sort().join(", ");
      const shipped = findings.find((finding) => finding.chunk);
      const via = shipped ? chainText(shipped.chain) : "(tree-shaken, not shipped)";
      lines.push(`    ${name}: ${modules}  ${via}`);
    }
  }
  const defeated = report.findings.filter((finding) => finding.kind === "defeated-dynamic-import");
  if (defeated.length > 0) {
    lines.push("", "  Dynamic imports that split nothing off (the module is also imported statically):");
    for (const finding of defeated) {
      lines.push(
        `    ${shortPath(finding.module)}: import() in ${finding.dynamicImporters.map(shortPath).join(", ")}; static import in ${finding.staticImporters.map(shortPath).join(", ")}`,
      );
    }
  }
  lines.push("");
  return lines;
}
