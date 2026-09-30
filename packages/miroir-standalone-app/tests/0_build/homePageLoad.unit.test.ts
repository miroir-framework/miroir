/**
 * What the home page fetches (#337). The bundle guard counts only the chunks `index.html`
 * preloads; the home page also fetches its route chunk (`HomePage`) with everything it imports
 * statically, `ReportDisplay` included since the home page is a report. The home report has no list
 * section, so none of these chunks may hold a grid library.
 *
 * Not reachable through MiroirTest: it reads the production build's manifest and bundle report.
 * ```bash
 * npm run build -w miroir-standalone-app
 * npm run testByFile -w miroir-standalone-app -- homePageLoad
 * ```
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type Manifest = Record<string, { file: string; isEntry?: boolean; imports?: string[] }>;
type BundleReport = { chunks: { file: string; packages: { name: string }[] }[] };

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const viteDirectory = join(packageRoot, "dist", ".vite");
const homePageRoute = "miroir-fwk/4_view/routes/HomePage.tsx";

function readJson<T>(file: string): T {
  const path = join(viteDirectory, file);
  if (!existsSync(path)) {
    throw new Error(`${path} is missing: run \`npm run build -w miroir-standalone-app\` first`);
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

/** Files of the entry, of the home page's route chunk, and of every chunk they import statically. */
function homePageFiles(manifest: Manifest): Set<string> {
  expect(manifest[homePageRoute], `${homePageRoute} in the manifest`).toBeDefined();
  const roots = [...Object.keys(manifest).filter((key) => manifest[key].isEntry), homePageRoute];
  const files = new Set<string>();
  const seen = new Set<string>();
  const pending = [...roots];
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

describe("homePageLoad", () => {
  it("the home page fetches no grid library", () => {
    const files = homePageFiles(readJson<Manifest>("manifest.json"));
    const report = readJson<BundleReport>("bundle-report.json");
    const grids = report.chunks
      .filter((chunk) => files.has(chunk.file))
      .flatMap((chunk) =>
        chunk.packages
          .filter((entry) => entry.name.startsWith("ag-grid") || entry.name === "@glideapps/glide-data-grid")
          .map((entry) => `${entry.name} in ${chunk.file}`),
      );
    expect(grids).toEqual([]);
  });
});
