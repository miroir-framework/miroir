/**
 * Coverage tour (#326 D12, D26): opens the production build in Chromium, walks through the pages
 * below, and reports per package the code the build ships, the code the tour loaded and the part
 * of it that ran. Packages that load but never run are the candidates for removal or lazy
 * loading. On demand only: it needs a production build, the server and a browser.
 *
 * Writes `dist/.vite/coverage-report.json` and prints its table. The arithmetic is in
 * `vite/coverageCore.js`; packages are named as in the bundle report (`vite/bundleReportCore.js`).
 *
 * Run, after `npm run build -w miroir-standalone-app` and `npm run build:release -w miroir-server`:
 *   npm run coverageTour -w miroir-standalone-app -- --serve
 * Options:
 *   --serve            copy dist/ into the server release, start it on https://localhost:3080
 *                      (production mode, authentication off, 127.0.0.1 only, the repository's
 *                      certs/ or a self-signed certificate, the selected environment as for
 *                      `npm run miroir-env -- show`) and stop it at the end
 *   --url <url>        the app, served by a server already running (default https://localhost:3080)
 *   --browser <path>   Chromium or Chrome executable (default: env MIROIR_TOUR_BROWSER, then the
 *                      browser playwright-core installs, then the installed Chrome)
 *   --out <file>       report file (default dist/.vite/coverage-report.json)
 *   --headed           show the browser
 * Exits 1 when a page of the tour could not be reached (the report is written anyway), 2 when the
 * tour cannot run.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { readWorkspaces } from "../vite/bundleReportPlugin.js";
import { addChunkCoverage, buildCoverageReport, executedMask } from "../vite/coverageCore.js";
import { distDir, fail, launchBrowser, requireProductionBuild, root, ScriptError, startServer } from "./serveBuiltClient.mjs";

const APP = "miroir-standalone-app";
const assetsDir = path.join(distDir, "assets");
const STEP_TIMEOUT = 30_000;

const MIROIR_TESTS_REPORT =
  "/?page=report&application=360fcf1f-f0d4-4f8a-9262-07886e70fa15&deploymentUuid=10ff36f2-50a3-48d8-b80f-e48e5d13af8e" +
  "&applicationSection=data&reportUuid=58dc6706-0473-468c-90ee-61b54b157140";

/**
 * The pages of D26, in order; each step fails when its page does not show what it should.
 * Steps after the home page navigate inside the loaded app (history API or clicks), so the app
 * keeps its state and every chunk is loaded once.
 * @type {{ page: string, run: (page: import("playwright-core").Page, url: string) => Promise<string | void> }[]}
 */
const TOUR = [
  {
    page: "home page",
    run: async (page, url) => {
      await page.goto(`${url}/?page=home`);
      await page.getByLabel("Fetch configurations").first().click({ timeout: STEP_TIMEOUT });
      await page.getByRole("combobox").first().click({ timeout: STEP_TIMEOUT });
      await page.getByRole("option", { name: /Library/ }).first().click({ timeout: STEP_TIMEOUT });
    },
  },
  {
    page: "Library report with a grid",
    run: async (page) => {
      await page.getByText("Library Books").first().click({ timeout: STEP_TIMEOUT });
      await page.getByRole("row").nth(2).waitFor({ timeout: STEP_TIMEOUT });
      return `${await page.getByRole("row").count()} grid rows`;
    },
  },
  {
    page: "instance editor",
    run: async (page) => {
      await page.getByRole("row").nth(2).getByRole("button").first().click({ timeout: STEP_TIMEOUT });
      await page.getByRole("dialog").getByText("Book details").first().waitFor({ timeout: STEP_TIMEOUT });
      await page.keyboard.press("Escape");
    },
  },
  {
    page: "Runners",
    run: async (page) => {
      await navigate(page, "/?page=runners");
      await page.getByRole("heading", { name: "Runners" }).first().waitFor({ timeout: STEP_TIMEOUT });
    },
  },
  {
    page: "MiroirTest page",
    run: async (page) => {
      await navigate(page, MIROIR_TESTS_REPORT);
      await page.getByText("Miroir Tests Available").first().waitFor({ timeout: STEP_TIMEOUT });
    },
  },
  {
    page: "model diagram",
    run: async (page) => {
      await navigate(page, "/?page=model");
      await page.getByText("Model Diagram").first().waitFor({ timeout: STEP_TIMEOUT });
      await page.locator("main svg").first().waitFor({ timeout: STEP_TIMEOUT });
    },
  },
  {
    page: "Copilot sidebar",
    run: async (page) => {
      await page.getByLabel("AI Assistant").first().click({ timeout: STEP_TIMEOUT });
      await page.getByText("Miroir AI Assistant").first().waitFor({ timeout: STEP_TIMEOUT });
    },
  },
];

/** Client-side navigation, as the app's own links do: no reload. */
async function navigate(page, pathAndQuery) {
  await page.evaluate((target) => {
    window.history.pushState({}, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, pathAndQuery);
}

const { values: options } = parseArgs({
  options: {
    serve: { type: "boolean", default: false },
    url: { type: "string", default: "https://localhost:3080" },
    browser: { type: "string", default: process.env.MIROIR_TOUR_BROWSER },
    out: { type: "string", default: path.join(distDir, ".vite/coverage-report.json") },
    headed: { type: "boolean", default: false },
  },
});

try {
  await main();
} catch (error) {
  if (!(error instanceof ScriptError)) {
    throw error;
  }
  console.error(`coverage-tour: ${error.message}`);
  process.exitCode = 2;
}

async function main() {
  requireProductionBuild(APP);
  const stopServer = options.serve ? await startServer({ url: options.url, name: "coverage-tour" }) : undefined;
  try {
    const { tour, coverage } = await runTour(options);
    const report = coverageReport(tour, coverage);
    mkdirSync(path.dirname(options.out), { recursive: true });
    writeFileSync(options.out, `${JSON.stringify(report, null, 2)}\n`);
    for (const line of coverageReportLines(report, options.out)) {
      console.log(line);
    }
    process.exitCode = tour.every((step) => step.visited) ? 0 : 1;
  } finally {
    stopServer?.();
  }
}

/**
 * @returns {Promise<{ tour: { page: string, visited: boolean, detail?: string }[],
 *   coverage: Awaited<ReturnType<import("playwright-core").Coverage["stopJSCoverage"]>> }>}
 */
async function runTour({ url, browser: executablePath, headed, out }) {
  const browser = await launchBrowser(executablePath, headed);
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    const tour = [];
    for (const step of TOUR) {
      if (tour.length > 0 && !tour[0].visited) {
        tour.push({ page: step.page, visited: false, detail: "not tried: the home page did not load" });
        continue;
      }
      try {
        const detail = await step.run(page, url);
        await page.waitForLoadState("networkidle");
        tour.push({ page: step.page, visited: true, ...(detail ? { detail } : {}) });
        console.log(`  visited: ${step.page}${detail ? ` (${detail})` : ""}`);
      } catch (error) {
        const screenshot = path.join(path.dirname(out), `coverage-tour-${step.page.replace(/\W+/g, "-")}.png`);
        mkdirSync(path.dirname(screenshot), { recursive: true });
        await page.screenshot({ path: screenshot }).catch(() => undefined);
        const detail = `${String(error).split("\n")[0]}; screenshot ${path.relative(process.cwd(), screenshot)}`;
        tour.push({ page: step.page, visited: false, detail });
        console.log(`  NOT visited: ${step.page}: ${detail}`);
      }
    }
    return { tour, coverage: await page.coverage.stopJSCoverage() };
  } finally {
    await browser.close();
  }
}

/**
 * Per package totals over every chunk of `dist/assets`: the chunks the tour loaded with their
 * executed code, the others as shipped only. A chunk the server served must be this build's.
 */
function coverageReport(tour, coverage) {
  /** @type {Map<string, Uint8Array>} */
  const masks = new Map();
  for (const script of coverage) {
    const file = script.url.match(/\/assets\/([^/?#]+\.js)(?:[?#]|$)/)?.[1];
    if (!file) {
      continue;
    }
    const localPath = path.join(assetsDir, file);
    if (!existsSync(localPath) || readFileSync(localPath, "utf-8") !== script.source) {
      fail(
        `the server serves ${file}, which is not this build's (${path.relative(process.cwd(), assetsDir)}): ` +
          "run with --serve, or npm run copy:client -w miroir-server and restart the server",
      );
    }
    const mask = executedMask(script.source.length, script.functions);
    const previous = masks.get(file);
    masks.set(file, previous ? previous.map((value, offset) => value | mask[offset]) : mask);
  }

  const context = { root, app: APP, workspaces: readWorkspaces(root) };
  const totals = new Map();
  const chunks = readdirSync(assetsDir).filter((file) => file.endsWith(".js")).sort();
  for (const file of chunks) {
    const mapPath = path.join(assetsDir, `${file}.map`);
    if (!existsSync(mapPath)) {
      fail(`${file} has no source map: the build must keep its source maps (#326 D21)`);
    }
    addChunkCoverage(totals, {
      code: readFileSync(path.join(assetsDir, file), "utf-8"),
      map: JSON.parse(readFileSync(mapPath, "utf-8")),
      mapDir: assetsDir,
      executed: masks.get(file),
      context,
    });
  }
  return {
    ...buildCoverageReport({ app: APP, tour, totals }),
    chunks: { shipped: chunks.length, loaded: [...masks.keys()].sort() },
  };
}

function kB(chars) {
  return `${(chars / 1000).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kB`;
}

function share(part, whole) {
  return whole ? `${Math.round((100 * part) / whole)}%` : "-";
}

/** The console table: the tour, the totals, the packages with the most loaded code that never ran. */
function coverageReportLines(report, out, packagesShown = 25) {
  const { totals } = report;
  const loaded = report.packages.filter((entry) => entry.loadedChars > 0);
  const shown = loaded.slice(0, packagesShown);
  const width = Math.max(...shown.map((entry) => entry.name.length), "package".length);
  const visited = report.tour.filter((step) => step.visited).length;
  const lines = [
    "",
    `Coverage tour (#326): ${path.relative(process.cwd(), out)}`,
    `  pages visited: ${visited} of ${report.tour.length}${visited < report.tour.length ? ` (missing: ${report.tour.filter((step) => !step.visited).map((step) => step.page).join(", ")})` : ""}`,
    `  loaded by the tour: ${report.chunks.loaded.length} of ${report.chunks.shipped} chunks, ${kB(totals.loadedChars)}, of which ${kB(totals.executedChars)} ran (${share(totals.executedChars, totals.loadedChars)}); whole build ${kB(totals.shippedChars)}`,
  ];
  if (shown.length === 0) {
    return [...lines, ""];
  }
  lines.push(
    "  Sizes are characters of minified code. Packages with the most loaded code that never ran:",
    `    ${"package".padEnd(width)}  ${"loaded".padStart(11)}  ${"ran".padStart(11)}  ${"share".padStart(5)}  ${"shipped".padStart(11)}`,
  );
  for (const entry of shown) {
    lines.push(
      `    ${entry.name.padEnd(width)}  ${kB(entry.loadedChars).padStart(11)}  ${kB(entry.executedChars).padStart(11)}  ${share(entry.executedChars, entry.loadedChars).padStart(5)}  ${kB(entry.shippedChars).padStart(11)}`,
    );
  }
  if (loaded.length > packagesShown) {
    lines.push(`    + ${loaded.length - packagesShown} more loaded packages`);
  }
  const neverRan = loaded.filter((entry) => entry.executedChars === 0);
  if (neverRan.length > 0) {
    lines.push("", `  Loaded, never ran (${neverRan.length}): ${neverRan.map((entry) => entry.name).join(", ")}`);
  }
  lines.push("");
  return lines;
}
