/**
 * The Electron main process and preload are bundled with esbuild (#326), and the
 * build writes `packages/miroir-standalone-app-electron/dist/bundle-report.json` in the format
 * of the standalone app's report, so the same guard checks what the Electron app ships (D14, D15).
 *
 * The package electron-builder makes leaves out the source maps and the reports, which
 * stay in the build output and the CI artifact (D21).
 *
 * Not reachable through MiroirTest: it reads the Electron build output and package.json. Run after the build:
 * ```bash
 * npm run build -w miroir-standalone-app-electron
 * npm run testByFile -w miroir-standalone-app -- electronBundle.unit
 * ```
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type ReportPackage = { name: string; kind: string; loadKind: string; via: string };
type ReportChunk = { file: string; loadKind: string; rawBytes: number; packages: ReportPackage[] };
type BundleReport = { app: string; chunks: ReportChunk[]; packages: ReportPackage[]; externals: string[] };

const electronRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../miroir-standalone-app-electron");
const reportPath = join(electronRoot, "dist", "bundle-report.json");
const bundlerPath = join(electronRoot, "scripts", "bundle-main.mjs");

function readReport(): BundleReport {
  if (!existsSync(reportPath)) {
    throw new Error(`${reportPath} is missing: run \`npm run build -w miroir-standalone-app-electron\` first`);
  }
  if (statSync(bundlerPath).mtimeMs > statSync(reportPath).mtimeMs) {
    throw new Error(`the build is older than ${bundlerPath}: run \`npm run build -w miroir-standalone-app-electron\``);
  }
  return JSON.parse(readFileSync(reportPath, "utf-8"));
}

describe("electronBundle", () => {
  const report = readReport();
  const names = new Set(report.packages.map((entry) => entry.name));

  it("reports the main process and the preload as the two entry chunks", () => {
    expect(report.app).toBe("miroir-standalone-app-electron");
    expect(
      report.chunks
        .filter((chunk) => chunk.loadKind === "entry")
        .map((chunk) => chunk.file)
        .sort(),
    ).toEqual(["src/main.js", "src/preload.js"]);
  });

  // #370: the main process imports the store packages, miroir-ai and miroir-mcp when it uses them.
  it("loads no MongoDB or PostgreSQL driver, miroir-ai or miroir-mcp at start: they are lazy chunks", () => {
    const atStart = report.chunks.filter((chunk) => chunk.loadKind !== "lazy");
    const onDemand = ["mongodb", "sequelize", "miroir-store-mongodb", "miroir-store-postgres", "miroir-ai", "miroir-mcp"];
    expect(
      atStart.flatMap((chunk) =>
        chunk.packages.filter((entry) => onDemand.includes(entry.name)).map((entry) => `${entry.name} in ${chunk.file}`),
      ),
    ).toEqual([]);
  });

  it("bundles the four stores and express into the main process", () => {
    for (const name of ["miroir-store-filesystem", "miroir-store-indexedDb", "miroir-store-mongodb", "miroir-store-postgres", "express"]) {
      expect(names.has(name), name).toBe(true);
    }
  });

  // #337: the main process imports "miroir-localcache-redux/node", which re-exports no react-redux.
  it("bundles no browser UI library, React included", () => {
    const ui = [...names].filter(
      (name) =>
        name.startsWith("@mui/") ||
        name.startsWith("@copilotkit/react-") ||
        name.startsWith("@testing-library/") ||
        name === "react-dom" ||
        name === "react-redux",
    );
    expect(ui.map((name) => `${name} (${report.packages.find((entry) => entry.name === name)!.via})`)).toEqual([]);
  });

  it("keeps Electron and the native modules outside the bundle", () => {
    expect(report.externals).toEqual(expect.arrayContaining(["electron", "classic-level", "pg", "@cursor/sdk", "@anthropic-ai/claude-agent-sdk"]));
    expect(names.has("classic-level")).toBe(false);
  });
});

type ElectronBuilderConfig = { files: string[]; extraResources: { from: string; filter: string[] }[] };

describe("electronPackage", () => {
  const build: ElectronBuilderConfig = JSON.parse(readFileSync(join(electronRoot, "package.json"), "utf-8")).build;

  it("leaves every source map, and the main process report, out of the package", () => {
    expect(build.files).toEqual(["dist/**/*", "!**/*.map", "!dist/bundle-report.json", "package.json"]);
  });

  it("leaves the standalone app's source maps and reports out of the package", () => {
    const standalone = build.extraResources.find((entry) => entry.from === "../miroir-standalone-app/dist")!;
    expect(standalone.filter).toEqual(["**/*", "!**/*.map", "!.vite/**"]);
  });
});
