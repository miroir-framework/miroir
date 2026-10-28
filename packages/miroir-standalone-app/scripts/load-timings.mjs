/**
 * Load timings tour (#580): opens the production build in Chromium with the load timing
 * measurement on (`?loadTimings=on`), waits for the initial load to settle, then opens a Library
 * report and the model page inside the app, and prints the steps the page measured
 * (`window.__miroirLoadTimings`): duration, milestones, files fetched. With the Meta app installed
 * in the server's environment (dev), it also waits for the steps to be recorded there.
 *
 * Run, after `npm run build -w miroir-standalone-app` and `npm run build:release -w miroir-server`:
 *   npm run loadTimings -w miroir-standalone-app -- --serve
 * Options:
 *   --serve              copy dist/ into the server release, start it on https://localhost:3080 (see
 *                        serveBuiltClient.mjs) and stop it at the end
 *   --url <url>          the app, served by a server already running (default https://localhost:3080)
 *   --browser <path>     Chromium or Chrome executable (default: env MIROIR_TOUR_BROWSER, then the
 *                        browser playwright-core installs, then the installed Chrome)
 *   --meta-folder <dir>  where the server's environment stores PageLoadMeasurement instances
 *                        (default: the Meta package's data folder, as in the dev environment);
 *                        "none" skips the check
 *   --clean              remove the instances this run recorded, once checked
 *   --out <file>         also write the steps as JSON to this file
 *   --headed             show the browser
 * Exits 0 when every step was measured and settled (and recorded, when checked), 1 otherwise,
 * 2 when the tour cannot run.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { fail, launchBrowser, requireProductionBuild, root, ScriptError, startServer } from "./serveBuiltClient.mjs";

const APP = "miroir-standalone-app";
const STEP_TIMEOUT = 60_000;
const ENTITY_PAGE_LOAD_MEASUREMENT = "0266c0b8-4dc8-4a14-bcef-239a85a5de2d";

const LIBRARY_BOOKS_REPORT =
  "/?page=report&application=5af03c98-fe5e-490b-b08f-e1230971c57f&deploymentUuid=f714bb2f-a12d-4e71-a03b-74dcedea6eb4" +
  "&applicationSection=data&reportUuid=74b010b6-afee-44e7-8590-5f0849e4a5c9";

/** The steps of the tour: the first opens the page, the others navigate inside it. */
const TOUR = [
  { step: "initialLoad", target: "/?page=home" },
  { step: "route:report", target: LIBRARY_BOOKS_REPORT },
  { step: "route:model", target: "/?page=model" },
];

const { values: options } = parseArgs({
  options: {
    serve: { type: "boolean", default: false },
    url: { type: "string", default: "https://localhost:3080" },
    browser: { type: "string", default: process.env.MIROIR_TOUR_BROWSER },
    "meta-folder": {
      type: "string",
      default: path.join(root, "packages/miroir-app-meta/assets/meta_data", ENTITY_PAGE_LOAD_MEASUREMENT),
    },
    clean: { type: "boolean", default: false },
    out: { type: "string" },
    headed: { type: "boolean", default: false },
  },
});

try {
  process.exitCode = await main();
} catch (error) {
  if (!(error instanceof ScriptError)) {
    throw error;
  }
  console.error(`load-timings: ${error.message}`);
  process.exitCode = 2;
}

async function main() {
  requireProductionBuild(APP);
  const stopServer = options.serve ? await startServer({ url: options.url, name: "load-timings" }) : undefined;
  try {
    const { steps, recorded } = await runTour();
    for (const line of stepLines(steps)) {
      console.log(line);
    }
    if (options.out) {
      mkdirSync(path.dirname(path.resolve(options.out)), { recursive: true });
      writeFileSync(options.out, `${JSON.stringify(steps, null, 2)}\n`);
    }
    const missing = TOUR.filter(({ step }) => !steps.some((measured) => measured.step === step && measured.settled));
    for (const { step } of missing) {
      console.error(`load-timings: step ${step} was not measured, or did not settle`);
    }
    return missing.length === 0 && recorded ? 0 : 1;
  } finally {
    stopServer?.();
  }
}

/** @returns {Promise<{ steps: any[], recorded: boolean }>} the steps the page measured, and whether they were recorded */
async function runTour() {
  const browser = await launchBrowser(options.browser, options.headed);
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    // The recorder's own console lines: a failed write says why there.
    page.on("console", (message) => {
      if (message.text().includes("[miroir-load-timing]") && message.type() !== "info") {
        console.error(`  page: ${message.text()}`);
      }
    });
    const [first, ...others] = TOUR;
    await page
      .goto(`${options.url}${first.target}&loadTimings=on`)
      .catch((error) => fail(`cannot open ${options.url}: ${String(error).split("\n")[0]}`));
    await waitForStep(page, first.step);
    for (const { step, target } of others) {
      // Client-side navigation, as the app's own links do: no new page load.
      await page.evaluate((destination) => {
        window.history.pushState({}, "", destination);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, target);
      await waitForStep(page, step);
    }
    const steps = await page.evaluate(() => window.__miroirLoadTimings ?? []);
    // The page writes its steps once it is idle: keep it open until they are recorded.
    const recorded = await checkRecorded(steps);
    return { steps, recorded };
  } finally {
    await browser.close();
  }
}

async function waitForStep(page, step) {
  await page
    .waitForFunction((name) => (window.__miroirLoadTimings ?? []).some((measured) => measured.step === name), step, {
      timeout: STEP_TIMEOUT,
      polling: 250,
    })
    .catch(() => console.error(`load-timings: no ${step} step within ${STEP_TIMEOUT / 1000}s`));
}

/** Waits until the steps of this page load are in the Meta folder; true when they are, or when not checked. */
async function checkRecorded(steps) {
  const folder = options["meta-folder"];
  if (folder === "none" || steps.length === 0) {
    return true;
  }
  const pageLoad = steps[0].pageLoad;
  const ours = () =>
    existsSync(folder)
      ? readdirSync(folder)
          .filter((file) => file.endsWith(".json"))
          .filter((file) => JSON.parse(readFileSync(path.join(folder, file), "utf-8")).pageLoad === pageLoad)
      : [];
  let files = ours();
  for (const start = Date.now(); files.length < steps.length && Date.now() - start < 20_000; files = ours()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.log(`  recorded in the Meta app: ${files.length} of ${steps.length} steps (${path.relative(root, folder)})`);
  if (options.clean) {
    files.forEach((file) => rmSync(path.join(folder, file)));
  }
  return files.length === steps.length;
}

/** @returns {string[]} one line per step, then one line per file fetched */
function stepLines(steps) {
  const lines = [];
  for (const step of steps) {
    const milestones = Object.entries(step.milestones ?? {})
      .map(([name, ms]) => `${name} ${ms}`)
      .join(", ");
    lines.push(
      `${step.step.padEnd(22)} ${String(step.durationMs).padStart(6)} ms  ${step.settled ? "settled" : "NOT SETTLED"}` +
        `  ${step.chunkCount} files, ${Math.round(step.chunkTransferBytes / 1024)} kB transferred, ${step.dataRequestCount} data requests` +
        (step.overlapsWrite ? "  (overlaps a write)" : ""),
    );
    if (milestones) {
      lines.push(`    milestones (ms): ${milestones}`);
    }
    for (const chunk of step.chunks) {
      lines.push(
        `    ${String(chunk.startMs).padStart(6)} +${String(chunk.durationMs).padStart(5)} ms  ${String(Math.round(chunk.transferBytes / 1024)).padStart(5)} kB  ${chunk.file}`,
      );
    }
  }
  return lines;
}
