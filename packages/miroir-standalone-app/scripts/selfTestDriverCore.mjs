/**
 * The arithmetic of the self-test driver (scripts/self-test.mjs, #487), apart from the browser and
 * the server so that it is unit-tested.
 */
import { parseArgs } from "node:util";

/** Exit codes of the driver, as for Electron's `--self-test` (#487 D9). */
export const SELF_TEST_EXIT = { passed: 0, failed: 1, couldNotRun: 2 };

/** Ten minutes: the unit MiroirTests take about one in a cloud container. */
export const DEFAULT_SELF_TEST_TIMEOUT_SECONDS = 600;

/**
 * @param {string[]} args the command line after the script
 * @param {Record<string, string | undefined>} env
 */
export function parseSelfTestDriverArgs(args, env) {
  const { values } = parseArgs({
    args,
    options: {
      serve: { type: "boolean", default: false },
      url: { type: "string", default: "https://localhost:3080" },
      browser: { type: "string", default: env.MIROIR_TOUR_BROWSER },
      timeout: { type: "string", default: String(DEFAULT_SELF_TEST_TIMEOUT_SECONDS) },
      headed: { type: "boolean", default: false },
      out: { type: "string" },
    },
  });
  const timeoutSeconds = Number(values.timeout);
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
    throw new Error(`--timeout takes a number of seconds, got "${values.timeout}"`);
  }
  return { serve: values.serve, url: values.url, browser: values.browser, timeoutSeconds, headed: values.headed, out: values.out };
}

/**
 * @param {{ verdict: string } | undefined} result what the page published, `undefined` when it
 *   published nothing before the timeout
 */
export function selfTestExitCode(result) {
  switch (result?.verdict) {
    case "passed":
      return SELF_TEST_EXIT.passed;
    case "failed":
      return SELF_TEST_EXIT.failed;
    default:
      return SELF_TEST_EXIT.couldNotRun;
  }
}

/** The console summary that follows the JSON result. */
export function selfTestSummaryLines(result) {
  if (!result) {
    return ["self-test: the page published no result"];
  }
  const counts = result.counts
    ? `${result.counts.passed} passed, ${result.counts.failed} failed, ${result.counts.skipped} skipped in ${result.counts.suites} suite(s)`
    : "no test ran";
  const lines = [`self-test ${result.verdict} on ${result.environment ?? "?"} (tags ${result.tags.join(", ")}): ${counts}`];
  if (result.error) {
    lines.push(`  error: ${result.error}`);
  }
  for (const failure of result.failures ?? []) {
    lines.push(`  FAILED ${failure.suiteKey} > ${failure.testPath.join(" > ")}`);
    for (const assertion of failure.failedAssertions) {
      lines.push(`    ${assertion}`);
    }
  }
  return lines;
}
