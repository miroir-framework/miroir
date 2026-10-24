/**
 * Self-test driver (#487): opens the production build of a self-test environment in Chromium,
 * waits for the verdict the page publishes on `<html data-miroir-self-test>`, prints the result
 * (`window.__MIROIR_SELF_TEST_RESULT__`) as JSON then a summary, and exits 0 (passed), 1 (failed)
 * or 2 (could not run: no build, no server, no browser, or no verdict before the timeout).
 *
 * The client and the server must both run the self-test environment, so set MIROIR_ENV for the
 * build and for this script (which starts the server with --serve):
 *   MIROIR_ENV=self-test npm run build -w miroir-standalone-app
 *   npm run build:release -w miroir-server
 *   MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve
 * Options:
 *   --serve            copy dist/ into the server release, start it on https://localhost:3080
 *                      (production mode, authentication off, 127.0.0.1 only) and stop it at the end
 *   --url <url>        the app, served by a server already running (default https://localhost:3080)
 *   --browser <path>   Chromium or Chrome executable (default: env MIROIR_TOUR_BROWSER, then the
 *                      browser playwright-core installs, then the installed Chrome)
 *   --timeout <s>      seconds to wait for the verdict (default 600)
 *   --out <file>       also write the result JSON to this file
 *   --headed           show the browser
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { fail, launchBrowser, requireProductionBuild, ScriptError, startServer } from "./serveBuiltClient.mjs";
import { parseSelfTestDriverArgs, SELF_TEST_EXIT, selfTestExitCode, selfTestSummaryLines } from "./selfTestDriverCore.mjs";

const APP = "miroir-standalone-app";

try {
  process.exitCode = await main(parseSelfTestDriverArgs(process.argv.slice(2), process.env));
} catch (error) {
  if (!(error instanceof ScriptError)) {
    throw error;
  }
  console.error(`self-test: ${error.message}`);
  process.exitCode = SELF_TEST_EXIT.couldNotRun;
}

async function main(options) {
  requireProductionBuild(APP);
  const stopServer = options.serve ? await startServer({ url: options.url, name: "self-test" }) : undefined;
  try {
    const { result, pageErrors } = await runPage(options);
    if (result) {
      const json = JSON.stringify(result, null, 2);
      console.log(json);
      if (options.out) {
        mkdirSync(path.dirname(path.resolve(options.out)), { recursive: true });
        writeFileSync(options.out, `${json}\n`);
      }
    }
    for (const line of selfTestSummaryLines(result)) {
      console.log(line);
    }
    const exitCode = selfTestExitCode(result);
    if (exitCode === SELF_TEST_EXIT.couldNotRun) {
      console.error(
        `self-test: no verdict within ${options.timeoutSeconds}s; check that the client was built and the server ` +
          "started with MIROIR_ENV naming an environment whose client.selfTest is enabled (self-test)",
      );
      for (const pageError of pageErrors) {
        console.error(`  page error: ${pageError}`);
      }
    }
    return exitCode;
  } finally {
    stopServer?.();
  }
}

/** @returns {Promise<{ result: any, pageErrors: string[] }>} the last result the page published */
async function runPage({ url, browser: executablePath, headed, timeoutSeconds }) {
  const browser = await launchBrowser(executablePath, headed);
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error).split("\n")[0]));
    await page.goto(url).catch((error) => fail(`cannot open ${url}: ${String(error).split("\n")[0]}`));
    // Waits for the verdict, printing the page's progress line when it changes.
    const deadline = Date.now() + timeoutSeconds * 1000;
    let progress = "";
    while (Date.now() < deadline) {
      const state = await page
        .evaluate(() => ({
          verdict: document.documentElement.dataset.miroirSelfTest,
          line: document.querySelector('[data-testid="miroir-self-test-verdict"]')?.textContent ?? "",
        }))
        .catch((error) => fail(`the page crashed or closed before its verdict: ${String(error).split("\n")[0]}`));
      if (state.verdict === "passed" || state.verdict === "failed") {
        break;
      }
      if (state.line && state.line !== progress) {
        progress = state.line;
        console.error(`  ${progress}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    const result = await page
      .evaluate(() => window.__MIROIR_SELF_TEST_RESULT__)
      .catch((error) => fail(`the page crashed or closed before its verdict: ${String(error).split("\n")[0]}`));
    return { result, pageErrors };
  } finally {
    await browser.close();
  }
}
