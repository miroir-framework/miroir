/**
 * Every chunk of the standalone build has a sourcemap that lists its sources, vendor chunks
 * included (#326), so the bundle report and the #286 guard can see what each chunk holds.
 *
 * Not reachable through MiroirTest: it reads the production build output. Run after the build:
 * ```bash
 * npm run build -w miroir-standalone-app
 * npm run testByFile -w miroir-standalone-app -- bundleSourcemaps.unit
 * ```
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type Manifest = Record<string, { file: string; name?: string }>;

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const distDirectory = join(packageRoot, "dist");
const manifestPath = join(distDirectory, ".vite", "manifest.json");
const chunkLoggerPath = join(packageRoot, "vite", "chunkLoadLoggerPlugin.js");

function readManifest(): Manifest {
  if (!existsSync(manifestPath)) {
    throw new Error(`${manifestPath} is missing: run \`npm run build -w miroir-standalone-app\` first`);
  }
  if (statSync(chunkLoggerPath).mtimeMs > statSync(manifestPath).mtimeMs) {
    throw new Error(`the build is older than ${chunkLoggerPath}: run \`npm run build -w miroir-standalone-app\` first`);
  }
  return JSON.parse(readFileSync(manifestPath, "utf-8"));
}

function sourcesOf(chunkFile: string): string[] {
  const mapPath = join(distDirectory, `${chunkFile}.map`);
  return existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, "utf-8")).sources ?? [] : [];
}

describe("bundleSourcemaps", () => {
  it("every JavaScript chunk has a sourcemap listing at least one source", () => {
    const chunks = [...new Set(Object.values(readManifest()).map((chunk) => chunk.file))].filter((file) =>
      file.endsWith(".js"),
    );
    const withoutSources = chunks.filter((file) => sourcesOf(file).length === 0);
    expect(withoutSources).toEqual([]);
  });

  it("the vendor-mui map lists @mui/material sources", () => {
    const [mui] = Object.values(readManifest()).filter((chunk) => chunk.name === "vendor-mui");
    expect(sourcesOf(mui.file).some((source) => source.includes("node_modules/@mui/material/"))).toBe(true);
  });
});
