/**
 * The load timings tour (scripts/load-timings.mjs, #580) on the real production build, served by the
 * real server release on the selected environment (dev: the Meta app is installed), in a real browser:
 * the page measures its initial load, its first report display and its first model page display, and
 * records them in the Meta app. With --dev (#583), the same tour on the Vite dev client.
 *
 * Not reachable through MiroirTest: it needs the browser's timing APIs on a served client. On demand,
 * one tour per run (both use port 3080): MIROIR_LOAD_TIMINGS_TOUR=1 runs the production tour, which
 * needs the production build; MIROIR_LOAD_TIMINGS_TOUR_DEV=1 runs the dev tour, which needs ports
 * 3080 and 5173 free. Both need the server release and a Chromium (MIROIR_TOUR_BROWSER when
 * playwright-core's own is not installed):
 * ```bash
 * npm run build -w miroir-standalone-app && npm run build:release -w miroir-server
 * MIROIR_LOAD_TIMINGS_TOUR=1 MIROIR_TOUR_BROWSER=/opt/pw-browsers/chromium \
 *   npm run testByFile -w miroir-standalone-app -- loadTimingsTour.integ
 * MIROIR_LOAD_TIMINGS_TOUR_DEV=1 MIROIR_TOUR_BROWSER=/opt/pw-browsers/chromium \
 *   npm run testByFile -w miroir-standalone-app -- loadTimingsTour.integ
 * ```
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TOUR_TIMEOUT = 600_000;

/** Runs the tour with `args`, and returns the process and the steps it wrote. */
function runTour(args: string[]): { run: ReturnType<typeof spawnSync>; steps: any[]; work: string } {
  const work = mkdtempSync(join(tmpdir(), "load-timings-test-"));
  const out = join(work, "steps.json");
  const run = spawnSync(process.execPath, ["scripts/load-timings.mjs", ...args, "--serve", "--clean", "--out", out], {
    cwd: packageDir,
    encoding: "utf-8",
    timeout: TOUR_TIMEOUT,
  });
  if (!existsSync(out)) {
    throw new Error(`the tour wrote no steps (exit ${run.status}):\n${run.stdout}\n${run.stderr}`);
  }
  return { run, steps: JSON.parse(readFileSync(out, "utf-8")), work };
}


describe.skipIf(process.env.MIROIR_LOAD_TIMINGS_TOUR !== "1")("loadTimingsTour", () => {
  let work: string;
  let run: ReturnType<typeof spawnSync>;
  let steps: any[];

  beforeAll(() => {
    ({ run, steps, work } = runTour([]));
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

  it("says it measured the production build", () => {
    expect(run.stdout).toMatch(/^build mode: production, client: webApp /m);
  });

  it("records every step in the Meta app", () => {
    expect(run.stdout).toMatch(/recorded in the Meta app: 3 of 3 steps/);
    expect(run.status).toBe(0);
  });
});

describe.skipIf(process.env.MIROIR_LOAD_TIMINGS_TOUR_DEV !== "1")("loadTimingsTour --dev", () => {
  let work: string;
  let run: ReturnType<typeof spawnSync>;
  let steps: any[];

  beforeAll(() => {
    ({ run, steps, work } = runTour(["--dev"]));
  }, TOUR_TIMEOUT);

  afterAll(() => rmSync(work, { recursive: true, force: true }));

  const step = (name: string) => steps.find((candidate) => candidate.step === name);

  it("measures the same steps on the Vite dev client, settled", () => {
    expect(
      steps.map((candidate) => [candidate.step, candidate.settled]),
      `durations (ms): ${steps.map((candidate) => `${candidate.step} ${candidate.durationMs}`).join(", ")}`,
    ).toEqual([
      ["initialLoad", true],
      ["route:report", true],
      ["route:model", true],
    ]);
  });

  it("records the development build mode on every step, and says so", () => {
    expect(steps.map((candidate) => candidate.buildMode)).toEqual(["development", "development", "development"]);
    expect(run.stdout).toMatch(/^build mode: development, client: webApp /m);
  });

  it("lists every unbundled source module fetched with the page", () => {
    // Vite's root is src/: the module URLs have no /src/ prefix. More than 250 files: the default
    // resource timing buffer, which index.html raises before the entry module loads.
    expect(step("initialLoad").chunks.some((chunk: any) => /\.tsx$/.test(chunk.file))).toBe(true);
    expect(step("initialLoad").chunkCount).toBeGreaterThan(250);
  });

  it("records every step in the Meta app", () => {
    expect(run.stdout).toMatch(/recorded in the Meta app: 3 of 3 steps/);
    expect(run.status).toBe(0);
  });
});
