/**
 * Issue #326 Slice 16: the coverage tour (scripts/coverage-tour.mjs) on the real production build,
 * served by the real server release, in a real browser.
 *
 * Not reachable through MiroirTest: it tests the build tooling. On demand (D12): skipped unless
 * MIROIR_COVERAGE_TOUR=1. Needs the production build, the server release, port 3080 free, and a
 * Chromium (MIROIR_TOUR_BROWSER when playwright-core's own is not installed):
 * ```bash
 * npm run build -w miroir-standalone-app && npm run build:release -w miroir-server
 * MIROIR_COVERAGE_TOUR=1 MIROIR_TOUR_BROWSER=/opt/pw-browsers/chromium \
 *   npm run testByFile -w miroir-standalone-app -- coverageTour.326.phase16
 * ```
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const TOUR_TIMEOUT = 600_000;

describe.skipIf(process.env.MIROIR_COVERAGE_TOUR !== "1")("coverageTour.326.phase16", () => {
  let work: string;
  let run: ReturnType<typeof spawnSync>;
  let report: any;

  beforeAll(() => {
    work = mkdtempSync(join(tmpdir(), "coverage-tour-test-"));
    const out = join(work, "coverage-report.json");
    run = spawnSync(process.execPath, ["scripts/coverage-tour.mjs", "--serve", "--out", out], {
      cwd: packageDir,
      encoding: "utf-8",
      timeout: TOUR_TIMEOUT,
    });
    report = JSON.parse(readFileSync(out, "utf-8"));
  }, TOUR_TIMEOUT);

  afterAll(() => rmSync(work, { recursive: true, force: true }));

  const entry = (name: string) => report.packages.find((candidate: any) => candidate.name === name);

  it("visits every page of the tour", () => {
    expect(report.tour.map((step: any) => [step.page, step.visited])).toEqual(
      [
        "home page",
        "Library report with a grid",
        "instance editor",
        "Runners",
        "MiroirTest page",
        "model diagram",
        "Copilot sidebar",
      ].map((page) => [page, true]),
    );
    expect(run.status, `${run.stdout}\n${run.stderr}`).toBe(0);
  });

  it("measures the part of a loaded package that ran", () => {
    const reactDom = entry("react-dom");
    expect(reactDom.executedChars).toBeGreaterThan(0);
    expect(reactDom.executedChars).toBeLessThan(reactDom.loadedChars);
  });

  it("shows a package the browser build ships and never runs", () => {
    const mongodb = entry("mongodb");
    expect(mongodb.shippedChars).toBeGreaterThan(0);
    expect(mongodb.executedChars).toBe(0);
  });
});
