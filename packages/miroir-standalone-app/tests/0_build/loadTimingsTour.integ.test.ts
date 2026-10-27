/**
 * The load timings tour (scripts/load-timings.mjs, #580) on the real production build, served by the
 * real server release on the selected environment (dev: the Meta app is installed), in a real browser:
 * the page measures its initial load, its first report display and its first model page display, and
 * records them in the Meta app.
 *
 * Not reachable through MiroirTest: it needs the browser's timing APIs on the production build. On
 * demand: skipped unless MIROIR_LOAD_TIMINGS_TOUR=1. Needs the production build, the server release,
 * port 3080 free, and a Chromium (MIROIR_TOUR_BROWSER when playwright-core's own is not installed):
 * ```bash
 * npm run build -w miroir-standalone-app && npm run build:release -w miroir-server
 * MIROIR_LOAD_TIMINGS_TOUR=1 MIROIR_TOUR_BROWSER=/opt/pw-browsers/chromium \
 *   npm run testByFile -w miroir-standalone-app -- loadTimingsTour.integ
 * ```
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TOUR_TIMEOUT = 600_000;

describe.skipIf(process.env.MIROIR_LOAD_TIMINGS_TOUR !== "1")("loadTimingsTour", () => {
  let work: string;
  let run: ReturnType<typeof spawnSync>;
  let steps: any[];

  beforeAll(() => {
    work = mkdtempSync(join(tmpdir(), "load-timings-test-"));
    const out = join(work, "steps.json");
    run = spawnSync(process.execPath, ["scripts/load-timings.mjs", "--serve", "--clean", "--out", out], {
      cwd: packageDir,
      encoding: "utf-8",
      timeout: TOUR_TIMEOUT,
    });
    steps = JSON.parse(readFileSync(out, "utf-8"));
  }, TOUR_TIMEOUT);

  afterAll(() => rmSync(work, { recursive: true, force: true }));

  const step = (name: string) => steps.find((candidate) => candidate.step === name);

  it("measures the initial load, the first report display and the first model page display, settled", () => {
    expect(steps.map((candidate) => [candidate.step, candidate.settled])).toEqual([
      ["initialLoad", true],
      ["route:report", true],
      ["route:model", true],
    ]);
  });

  it("takes the initial load milestones in startup order", () => {
    const { entryScript, configReady, platformReady, firstRender } = step("initialLoad").milestones;
    expect(entryScript).toBeLessThanOrEqual(configReady);
    expect(configReady).toBeLessThanOrEqual(platformReady);
    expect(platformReady).toBeLessThanOrEqual(firstRender);
    expect(firstRender).toBeLessThanOrEqual(step("initialLoad").durationMs);
  });

  it("lists the files fetched with the page and by the report page", () => {
    expect(step("initialLoad").chunks.some((chunk: any) => /\/assets\/index-.*\.js$/.test(chunk.file))).toBe(true);
    expect(step("route:report").chunkCount).toBeGreaterThan(0);
  });

  it("records every step in the Meta app", () => {
    expect(run.stdout).toMatch(/recorded in the Meta app: 3 of 3 steps/);
    expect(run.status).toBe(0);
  });
});
