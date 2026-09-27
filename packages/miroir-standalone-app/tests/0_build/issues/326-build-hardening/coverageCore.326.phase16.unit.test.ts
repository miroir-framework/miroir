/**
 * Issue #326 Slice 16: the arithmetic of the coverage tour (vite/coverageCore.js), on a real
 * esbuild bundle with its source map and the real V8 block coverage of running it in this process.
 *
 * Not reachable through MiroirTest: it tests the build tooling. Needs no build:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- coverageCore.326.phase16
 * ```
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { Session } from "node:inspector/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInThisContext } from "node:vm";

import { build } from "esbuild";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  addChunkCoverage,
  buildCoverageReport,
  executedMask,
  sourceIndexByOffset,
} from "../../../../vite/coverageCore.js";

describe("coverageCore.326.phase16: executed code and its sources", () => {
  it("lets a block that did not run override the function that did", () => {
    const functions = [
      { ranges: [{ startOffset: 60, endOffset: 90, count: 3 }, { startOffset: 70, endOffset: 80, count: 0 }] },
      { ranges: [{ startOffset: 10, endOffset: 50, count: 0 }] },
      { ranges: [{ startOffset: 0, endOffset: 100, count: 1 }] },
    ];
    const mask = executedMask(100, functions);
    expect(mask.reduce((total, value) => total + value, 0)).toBe(50);
    expect([mask[5], mask[20], mask[65], mask[75], mask[85]]).toEqual([1, 0, 1, 0, 1]);
  });

  it("maps each generated offset to its source, line by line, -1 where a segment has no source", () => {
    // Line 1: column 0 from source 0, column 1 from source 1; line 2: a segment without source.
    expect([...sourceIndexByOffset("ab\ncd", "AAAA,CCAA;A")]).toEqual([0, 1, 1, -1, -1]);
  });

  it("names Vite's virtual modules as the bundle report does", () => {
    const totals = new Map();
    addChunkCoverage(totals, {
      code: "abcdef",
      // One character from each source, then two from the app.
      map: {
        sources: [
          "../../__vite-browser-external",
          "../../__vite-optional-peer-dep:kerberos:mongodb:true",
          "../../../../node_modules/react/index.js",
          "../../src/index.tsx",
        ],
        mappings: "AAAA,CCAA,CCAA,CCAA",
      },
      mapDir: "/repo/packages/demo-app/dist/assets",
      context: { root: "/repo", app: "demo-app", workspaces: [{ dir: "packages/demo-app", name: "demo-app" }] },
    });
    expect(Object.fromEntries([...totals.values()].map((entry) => [entry.name, [entry.kind, entry.shippedChars]]))).toEqual({
      "(node built-ins emptied for the browser)": ["virtual", 1],
      "(bundler runtime)": ["virtual", 1],
      react: ["npm", 1],
      "demo-app": ["app", 3],
    });
  });
});

describe("coverageCore.326.phase16: a bundle run under V8 coverage", () => {
  const root = mkdtempSync(join(tmpdir(), "coverage-core-"));
  const assets = join(root, "packages/demo-app/dist/assets");
  const context = {
    root,
    app: "demo-app",
    workspaces: [{ dir: "packages/demo-app", name: "demo-app" }],
  };
  let report: ReturnType<typeof buildCoverageReport>;

  beforeAll(async () => {
    const write = (path: string, content: string) => {
      mkdirSync(join(root, path, ".."), { recursive: true });
      writeFileSync(join(root, path), content);
    };
    write(
      "node_modules/used-lib/index.js",
      "export function used(n) { return n * 2; }\n" +
        "export function unused(list) { let total = 0; for (const item of list) { if (item > 3) { total += item * item; } else { total -= item; } } return total + String(list).length; }\n",
    );
    write("node_modules/never-run/index.js", "export function neverRun(a, b) { const sum = a + b; return [sum, sum * a, sum * b].join('/'); }\n");
    write(
      "packages/demo-app/src/app.js",
      'import { used, unused } from "used-lib";\nimport { neverRun } from "never-run";\n' +
        "globalThis.__coverageDemo = { result: used(21), later: [unused, neverRun] };\n",
    );
    const bundle = await build({
      absWorkingDir: root,
      entryPoints: ["packages/demo-app/src/app.js"],
      outfile: join(assets, "app.js"),
      bundle: true,
      minify: true,
      format: "iife",
      sourcemap: "external",
      write: false,
      logLevel: "silent",
    });
    const code = bundle.outputFiles.find((file) => file.path.endsWith(".js"))!.text;
    const map = JSON.parse(bundle.outputFiles.find((file) => file.path.endsWith(".map"))!.text);

    const session = new Session();
    session.connect();
    await session.post("Profiler.enable");
    await session.post("Profiler.startPreciseCoverage", { callCount: true, detailed: true });
    const url = `file://${join(assets, "app.js")}`;
    runInThisContext(code, { filename: url });
    const { result } = await session.post("Profiler.takePreciseCoverage");
    await session.post("Profiler.stopPreciseCoverage");
    session.disconnect();
    const coverage = result.find((script) => script.url === url)!;

    const totals = new Map();
    addChunkCoverage(totals, { code, map, mapDir: assets, executed: executedMask(code.length, coverage.functions), context });
    addChunkCoverage(totals, { code, map, mapDir: assets, context }); // the same chunk again, never loaded
    report = buildCoverageReport({ app: "demo-app", tour: [], totals });
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const entry = (name: string) => report.packages.find((candidate) => candidate.name === name)!;

  it("runs the app's own code", () => {
    expect((globalThis as any).__coverageDemo.result).toBe(42);
    expect(entry("demo-app").executedChars).toBeGreaterThan(0);
  });

  it("counts a package partly run, and one only loaded", () => {
    const usedLib = entry("used-lib");
    expect(usedLib.executedChars).toBeGreaterThan(0);
    expect(usedLib.executedChars).toBeLessThan(usedLib.loadedChars / 2);
    const neverRun = entry("never-run");
    expect([neverRun.kind, neverRun.chunksLoaded, neverRun.executedChars]).toEqual(["npm", 1, 0]);
  });

  it("counts a chunk the tour did not load as shipped only", () => {
    const usedLib = entry("used-lib");
    expect(usedLib.shippedChars).toBe(2 * usedLib.loadedChars);
    expect([usedLib.chunksShipped, usedLib.chunksLoaded]).toEqual([2, 1]);
  });

  it("lists first the packages with the most loaded code that never ran", () => {
    expect(report.packages[0].name).toBe("used-lib");
    expect(report.totals.shippedChars).toBe(2 * report.totals.loadedChars);
  });
});
