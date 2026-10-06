/**
 * selfTestMain.ts — the `--self-test` mode of the Electron main process (#487), free of any
 * `electron` import so that tests run it in Node.
 *
 *   electron packages/miroir-standalone-app-electron --self-test[=<tags>] [--self-test-timeout=<s>]
 *
 * The main process boots its environment as usual, gives the renderer a client configuration whose
 * `selfTest` is enabled, loads the built client in a hidden window, waits for the result the
 * renderer sends on `miroir-self-test-result`, prints the report and exits 0 (passed), 1 (failed)
 * or 2 (could not run). The report is `{ renderer }`, so that the main-process checks of #486 add a
 * `main` key without changing its shape.
 */
import type { MiroirConfigClient } from "miroir-core";

/** The IPC channel the renderer sends its final self-test result on (preload `reportSelfTestResult`). */
export const SELF_TEST_RESULT_CHANNEL = "miroir-self-test-result";

export const DEFAULT_ELECTRON_SELF_TEST_TIMEOUT_SECONDS = 900;

export type ElectronSelfTestOptions = { enabled: true; tags: string[]; timeoutSeconds: number };

/** Why the self-test ended: the renderer's verdict, or what kept it from giving one. */
export type ElectronSelfTestEnd =
  | { kind: "result"; result: { verdict: string; [key: string]: unknown } }
  | { kind: "timeout" }
  | { kind: "render-process-gone"; reason: string }
  | { kind: "did-fail-load"; errorDescription: string }
  | { kind: "main-error"; error: string };

/** `undefined` when `--self-test` is absent: the app starts as usual. */
export function parseSelfTestArgs(argv: string[]): ElectronSelfTestOptions | undefined {
  const flag = argv.find((arg) => arg === "--self-test" || arg.startsWith("--self-test="));
  if (!flag) {
    return undefined;
  }
  const tagList = flag.includes("=") ? flag.slice(flag.indexOf("=") + 1) : "";
  const tags = tagList.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  const timeoutFlag = argv.find((arg) => arg.startsWith("--self-test-timeout="));
  const timeoutSeconds = timeoutFlag
    ? Number(timeoutFlag.slice("--self-test-timeout=".length))
    : DEFAULT_ELECTRON_SELF_TEST_TIMEOUT_SECONDS;
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
    throw new Error(`--self-test-timeout takes a number of seconds, got "${timeoutFlag}"`);
  }
  return { enabled: true, tags: tags.length > 0 ? tags : ["unit"], timeoutSeconds };
}

/** The renderer's configuration: the environment's, with the self-test the command line asks for. */
export function withSelfTest(
  clientConfig: MiroirConfigClient,
  options: ElectronSelfTestOptions | undefined,
): MiroirConfigClient {
  if (!options) {
    return clientConfig;
  }
  return { ...clientConfig, selfTest: { enabled: true, tags: options.tags } };
}

/** The exit code and the printed report of a self-test that ended. */
export function selfTestExit(end: ElectronSelfTestEnd): { exitCode: 0 | 1 | 2; report: { renderer: unknown } } {
  switch (end.kind) {
    case "result":
      return {
        exitCode: end.result.verdict === "passed" ? 0 : end.result.verdict === "failed" ? 1 : 2,
        report: { renderer: { ...end.result, exitReason: "result" } },
      };
    case "timeout":
      return { exitCode: 2, report: { renderer: { verdict: "failed", exitReason: "timeout" } } };
    case "render-process-gone":
      return { exitCode: 2, report: { renderer: { verdict: "failed", exitReason: end.kind, error: end.reason } } };
    case "did-fail-load":
      return { exitCode: 2, report: { renderer: { verdict: "failed", exitReason: end.kind, error: end.errorDescription } } };
    case "main-error":
      return { exitCode: 2, report: { renderer: { verdict: "failed", exitReason: end.kind, error: end.error } } };
  }
}

/**
 * The URL the window loads: the Vite dev server in development (`--dev`, or not packaged), else the
 * built client (`app://`). A self-test always loads the built client: it checks a build.
 */
export function rendererLoadUrl(params: { isDev: boolean; selfTest: boolean; devServerScheme: string }): string {
  return params.isDev && !params.selfTest ? `${params.devServerScheme}://localhost:5173/home` : "app://miroir/home";
}
