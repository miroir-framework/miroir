/**
 * Sandbox smoke test (#672): runs MiroirTest suites in the built sandbox, in a headless browser,
 * through the Miroir Tests report, as a user would.
 *
 * It serves dist/ with `vite preview`, opens the MiroirTestDetails report of each suite, clicks its
 * Run button and waits for the result the page shows (`data-miroir-test-status`). An integration
 * run must leave the sandbox's own IndexedDB databases (sandbox-admin*) unchanged.
 *
 *   npm run build -w miroir-sandbox && npm run smoke -w miroir-sandbox
 *   npm run smoke -w miroir-sandbox -- --suite unit:<uuid> --suite integ:<uuid> [--headed] [--browser <path>]
 *
 * Exit code: 0 when every suite passed, 1 when a suite failed, 2 when the smoke test could not run
 * (no build, no browser, page did not load).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(packageDir, "../..");
const distDir = path.join(packageDir, "dist");

// The sandbox's deployment of the Miroir application, and the MiroirTestDetails report (#672)
const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const MIROIR_DEPLOYMENT_UUID = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const MIROIR_TEST_DETAILS_REPORT_UUID = "0ad63f27-c4df-4fb8-9a79-cb257c7a2958";

/** One suite of each kind the sandbox must run (#672 ACs). */
export const DEFAULT_SUITES = [
  { mode: "unit", uuid: "bdf83d4d-f4dd-42c9-b2d6-41311d979083", label: "fn.mustache.extractDoubleBracePatterns" },
  { mode: "unit", uuid: "33f60ac8-6511-43b1-b153-6b86e3177532", label: "tr.core" },
  { mode: "unit", uuid: "3995a071-b8ae-48d3-a488-6d1fc828b725", label: "ui.mlElementEditor.literal" },
  { mode: "integ", uuid: "c8e2a104-5b6d-4f91-a2c3-9d0e1f2a3b4c", label: "action.domainController.dataCrud" },
];

const SANDBOX_DATABASE_PREFIX = "sandbox-admin";

class ScriptError extends Error {}

function parseArgs(argv) {
  const options = { suites: [], headed: false, browser: process.env.MIROIR_SMOKE_BROWSER, port: 4179, timeoutMs: 300_000 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--headed") options.headed = true;
    else if (arg === "--browser") options.browser = argv[++i];
    else if (arg === "--port") options.port = Number(argv[++i]);
    else if (arg === "--timeout") options.timeoutMs = Number(argv[++i]) * 1000;
    else if (arg === "--suite") {
      const [mode, uuid] = String(argv[++i]).split(":");
      if (!["unit", "integ"].includes(mode) || !uuid) {
        throw new ScriptError(`--suite takes unit:<uuid> or integ:<uuid>, got ${argv[i]}`);
      }
      options.suites.push({ mode, uuid, label: uuid });
    } else throw new ScriptError(`unknown argument ${arg}`);
  }
  if (options.suites.length === 0) options.suites = DEFAULT_SUITES;
  return options;
}

async function launchBrowser(executablePath, headed) {
  const launchOptions = {
    headless: !headed,
    args: [...(process.getuid?.() === 0 ? ["--no-sandbox"] : []), "--disable-dev-shm-usage"],
  };
  if (executablePath) return chromium.launch({ ...launchOptions, executablePath });
  for (const extra of [{}, { channel: "chrome" }]) {
    try {
      return await chromium.launch({ ...launchOptions, ...extra });
    } catch {
      // next candidate
    }
  }
  throw new ScriptError(
    "no browser found: pass --browser <chromium or chrome executable> (or MIROIR_SMOKE_BROWSER), " +
      "or install the one playwright-core expects with: npx playwright-core install chromium",
  );
}

function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() > deadline) reject(new ScriptError(`vite preview did not answer at ${url}`));
          else setTimeout(attempt, 250);
        });
    };
    attempt();
  });
}

/** Serves dist/ with vite preview; returns its url and the function that stops it. */
async function startPreview(port) {
  const vite = path.join(root, "node_modules/vite/bin/vite.js");
  const child = spawn(process.execPath, [vite, "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], {
    cwd: packageDir,
    stdio: ["ignore", "inherit", "inherit"],
  });
  const base = process.env.VITE_BASE_URL ?? "/";
  const url = `http://127.0.0.1:${port}${base}`;
  await waitForHttp(url, 30_000);
  return {
    url,
    stop: () =>
      new Promise((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.once("exit", () => resolve());
        child.kill();
      }),
  };
}

function suiteUrl(baseUrl, suiteUuid) {
  const query = new URLSearchParams({
    page: "report",
    application: MIROIR_APPLICATION_UUID,
    deploymentUuid: MIROIR_DEPLOYMENT_UUID,
    applicationSection: "data",
    reportUuid: MIROIR_TEST_DETAILS_REPORT_UUID,
    instanceUuid: suiteUuid,
  });
  return `${baseUrl}#/?${query}`;
}

/** The sandbox's own IndexedDB databases, with the record count of each object store. */
async function sandboxDatabasesSnapshot(page) {
  return page.evaluate(async (prefix) => {
    const names = (await indexedDB.databases()).map((d) => d.name).filter((n) => n?.startsWith(prefix)).sort();
    const snapshot = {};
    for (const name of names) {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const stores = {};
      for (const storeName of Array.from(db.objectStoreNames).sort()) {
        stores[storeName] = await new Promise((resolve, reject) => {
          const request = db.transaction(storeName, "readonly").objectStore(storeName).count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
      db.close();
      snapshot[name] = stores;
    }
    return snapshot;
  }, SANDBOX_DATABASE_PREFIX);
}

async function runSuite(page, baseUrl, suite, timeoutMs) {
  await page.goto(suiteUrl(baseUrl, suite.uuid));
  const display = page.locator(`[data-miroir-test-suite="${suite.uuid}"]`);
  try {
    await display.waitFor({ timeout: 120_000 });
  } catch {
    throw new ScriptError(`${suite.label}: the MiroirTest report did not show the suite (no renderer, or wrong uuid)`);
  }
  const button = display.locator(`[data-testid="miroir-test-run-${suite.mode}"]`);
  if ((await button.count()) === 0) {
    throw new ScriptError(`${suite.label}: no ${suite.mode} Run button`);
  }
  if (await button.isDisabled()) {
    throw new ScriptError(`${suite.label}: the ${suite.mode} Run button is disabled (${await button.getAttribute("title")})`);
  }
  const before = suite.mode === "integ" ? await sandboxDatabasesSnapshot(page) : undefined;
  const started = Date.now();
  await button.click();
  await page.waitForFunction(
    (uuid) => {
      const status = document.querySelector(`[data-miroir-test-suite="${uuid}"]`)?.getAttribute("data-miroir-test-status");
      return status === "passed" || status === "failed";
    },
    suite.uuid,
    { timeout: timeoutMs, polling: 500 },
  );
  const status = await display.getAttribute("data-miroir-test-status");
  const summary = await display.getAttribute("data-miroir-test-summary");
  const result = { ...suite, status, summary, seconds: Math.round((Date.now() - started) / 100) / 10 };
  if (status !== "passed") {
    // the results panel names the failed tests and their assertions
    result.details = (await display.innerText()).slice(0, 4000);
  }
  if (before) {
    const after = await sandboxDatabasesSnapshot(page);
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      result.status = "failed";
      result.summary = `${summary ?? ""} sandbox databases changed: before ${JSON.stringify(before)}, after ${JSON.stringify(after)}`;
    }
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(path.join(distDir, "index.html"))) {
    throw new ScriptError("no sandbox build in packages/miroir-sandbox/dist: run npm run build -w miroir-sandbox");
  }
  const preview = await startPreview(options.port);
  const browser = await launchBrowser(options.browser, options.headed).catch(async (error) => {
    await preview.stop();
    throw error;
  });
  const results = [];
  try {
    const page = await browser.newPage();
    page.on("pageerror", (error) => console.error(`[page error] ${error.message}`));
    // the page's console errors, shown for a failed suite
    let consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    for (const suite of options.suites) {
      consoleErrors = [];
      const result = await runSuite(page, preview.url, suite, options.timeoutMs);
      console.log(`${result.status === "passed" ? "PASS" : "FAIL"} ${suite.mode} ${suite.label} (${result.seconds}s) ${result.summary ?? ""}`);
      if (result.status !== "passed") {
        if (result.details) console.log(result.details.replace(/^/gm, "  | "));
        for (const text of consoleErrors.slice(0, 20)) console.log(`  [console error] ${text.slice(0, 2000)}`);
      }
      results.push(result);
    }
  } finally {
    await browser.close();
    await preview.stop();
  }
  const failed = results.filter((r) => r.status !== "passed");
  console.log(`sandbox smoke: ${results.length - failed.length}/${results.length} suites passed`);
  return failed.length === 0 ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error instanceof ScriptError ? `sandbox smoke: ${error.message}` : error);
    process.exit(2);
  },
);
