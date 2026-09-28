/**
 * The standalone build writes `dist/.vite/bundle-report.json`, which splits
 * every chunk into the packages it holds, with the import chain that brings each package in from
 * the app's own source, and lists leaked Node modules and defeated dynamic imports as findings
 * (#326 D11, D25). The build also prints the report as a table.
 *
 * Not reachable through MiroirTest: it reads the production build output. Run after the build:
 * ```bash
 * npm run build -w miroir-standalone-app
 * npm run testByFile -w miroir-standalone-app -- bundleReport.unit
 * ```
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type ReportPackage = { name: string; kind: string; renderedBytes: number; modules: number; chain: string[] };
type ReportChunk = {
  file: string;
  name: string;
  loadKind: "entry" | "eager" | "lazy";
  rawBytes: number;
  gzipBytes: number;
  renderedBytes: number;
  packages: ReportPackage[];
};
type Finding = {
  kind: "externalized-node-module" | "defeated-dynamic-import";
  module: string;
  importerPackage?: string;
  chain: string[];
};
type BundleReport = {
  chunks: ReportChunk[];
  totals: { eager: { chunks: number; rawBytes: number; gzipBytes: number } };
  findings: Finding[];
};
type Manifest = Record<string, { file: string; isEntry?: boolean; imports?: string[] }>;

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const distDirectory = join(packageRoot, "dist");
const reportPath = join(distDirectory, ".vite", "bundle-report.json");
const manifestPath = join(distDirectory, ".vite", "manifest.json");
const reportSources = ["bundleReportCore.js", "bundleReportPlugin.js"].map((file) => join(packageRoot, "vite", file));
const appSource = "packages/miroir-standalone-app/src/";

function readReport(): BundleReport {
  if (!existsSync(reportPath)) {
    throw new Error(`${reportPath} is missing: run \`npm run build -w miroir-standalone-app\` first`);
  }
  for (const source of reportSources) {
    if (existsSync(source) && statSync(source).mtimeMs > statSync(reportPath).mtimeMs) {
      throw new Error(`the build is older than ${source}: run \`npm run build -w miroir-standalone-app\` first`);
    }
  }
  return JSON.parse(readFileSync(reportPath, "utf-8"));
}

/** Files of the entry chunk and of every chunk it imports statically, transitively. */
function manifestEagerFiles(): Set<string> {
  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const files = new Set<string>();
  const pending = Object.keys(manifest).filter((key) => manifest[key].isEntry);
  const seen = new Set<string>();
  while (pending.length > 0) {
    const key = pending.pop()!;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    files.add(manifest[key].file);
    pending.push(...(manifest[key].imports ?? []));
  }
  return files;
}

function packageIn(chunk: ReportChunk, name: string): ReportPackage | undefined {
  return chunk.packages.find((entry) => entry.name === name);
}

describe("bundleReport", () => {
  const report = readReport();

  it("every chunk gives its file, load kind, sizes and packages, whose bytes add up to the chunk's", () => {
    expect(report.chunks.length).toBeGreaterThan(0);
    for (const chunk of report.chunks) {
      expect(chunk.file, JSON.stringify(chunk).slice(0, 200)).toMatch(/\.js$/);
      expect(["entry", "eager", "lazy"]).toContain(chunk.loadKind);
      expect(chunk.rawBytes).toBeGreaterThan(0);
      expect(chunk.gzipBytes).toBeGreaterThan(0);
      expect(chunk.packages.reduce((sum, entry) => sum + entry.renderedBytes, 0)).toBe(chunk.renderedBytes);
      for (const entry of chunk.packages) {
        expect(typeof entry.name).toBe("string");
        expect(Array.isArray(entry.chain)).toBe(true);
      }
    }
  });

  it("vendor-copilotkit is eager, and the chain of its zod or rxjs starts in the app's source", () => {
    const copilotkit = report.chunks.find((chunk) => chunk.name === "vendor-copilotkit")!;
    expect(copilotkit.loadKind).toBe("eager");
    const shared = packageIn(copilotkit, "zod") ?? packageIn(copilotkit, "rxjs");
    expect(shared, "zod or rxjs in vendor-copilotkit").toBeDefined();
    expect(shared!.chain[0]).toMatch(new RegExp(`^${appSource}`));
  });

  it("the mermaid-VLURNSYL chunk is mostly the Miroir meta-model deployment", () => {
    const chunk = report.chunks.find((candidate) => candidate.file.includes("/mermaid-VLURNSYL"))!;
    expect(chunk).toBeDefined();
    const deployment = packageIn(chunk, "miroir-app-miroir");
    expect((deployment?.renderedBytes ?? 0) / chunk.renderedBytes).toBeGreaterThan(0.9);
  });

  it("mongodb is only in lazy chunks, brought in through IntegrationTestSession.ts", () => {
    const withMongodb = report.chunks.filter((chunk) => packageIn(chunk, "mongodb"));
    expect(withMongodb.length).toBeGreaterThan(0);
    expect(withMongodb.map((chunk) => chunk.loadKind)).toEqual(withMongodb.map(() => "lazy"));
    expect(packageIn(withMongodb[0], "mongodb")!.chain.some((step) => step.includes("IntegrationTestSession.ts"))).toBe(
      true,
    );
  });

  it("findings name fs externalized from miroir-store-indexedDb and the defeated ReportDisplay.tsx import", () => {
    expect(
      report.findings.filter(
        (finding) =>
          finding.kind === "externalized-node-module" &&
          finding.module === "fs" &&
          finding.importerPackage === "miroir-store-indexedDb",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      report.findings.filter(
        (finding) => finding.kind === "defeated-dynamic-import" && finding.module.endsWith("/ReportDisplay.tsx"),
      ).length,
    ).toBe(1);
  });

  it("the entry and eager chunks are the manifest's static closure of the entry, with the same total size", () => {
    const eager = report.chunks.filter((chunk) => chunk.loadKind !== "lazy");
    const files = manifestEagerFiles();
    expect(new Set(eager.map((chunk) => chunk.file))).toEqual(files);
    const rawBytes = [...files].reduce((sum, file) => sum + statSync(join(distDirectory, file)).size, 0);
    expect(report.totals.eager.rawBytes).toBe(rawBytes);
    expect(report.totals.eager.chunks).toBe(files.size);
  });
});
