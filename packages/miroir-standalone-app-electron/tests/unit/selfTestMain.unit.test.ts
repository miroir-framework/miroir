// #487: the `--self-test` mode of the Electron main process. vitest, not MiroirTest:
// main-process wiring, in src/selfTestMain.ts with no `electron` import. The run in Electron itself
// is the Electron job of .github/workflows/self-test.yml.
import type { MiroirConfigClient } from "miroir-core";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_ELECTRON_SELF_TEST_TIMEOUT_SECONDS,
  parseSelfTestArgs,
  rendererLoadUrl,
  selfTestExit,
  withSelfTest,
} from "../../src/selfTestMain";

const clientConfig = {
  client: { emulateServer: false, serverConfig: { rootApiUrl: "http://127.0.0.1:3080" } },
} as unknown as MiroirConfigClient;

describe("Electron --self-test (#487)", () => {
  it("parses --self-test, its tags and its timeout", () => {
    expect(parseSelfTestArgs(["electron", "."])).toBeUndefined();
    expect(parseSelfTestArgs(["electron", ".", "--self-test"])).toEqual({
      enabled: true,
      tags: ["unit"],
      timeoutSeconds: DEFAULT_ELECTRON_SELF_TEST_TIMEOUT_SECONDS,
    });
    expect(parseSelfTestArgs(["--self-test=unit,integ", "--self-test-timeout=60"])).toEqual({
      enabled: true,
      tags: ["unit", "integ"],
      timeoutSeconds: 60,
    });
    expect(() => parseSelfTestArgs(["--self-test", "--self-test-timeout=never"])).toThrow(/--self-test-timeout/);
  });

  it("gives the renderer a configuration whose self-test is on", () => {
    expect(withSelfTest(clientConfig, undefined)).toBe(clientConfig);
    expect(withSelfTest(clientConfig, parseSelfTestArgs(["--self-test=integ"]))).toEqual({
      ...clientConfig,
      selfTest: { enabled: true, tags: ["integ"] },
    });
  });

  it("exits 0 when passed, 1 when failed, 2 when the renderer gave no verdict", () => {
    const passed = { verdict: "passed", environment: "self-test", tags: ["unit"] };
    expect(selfTestExit({ kind: "result", result: passed })).toEqual({
      exitCode: 0,
      report: { renderer: { ...passed, exitReason: "result" } },
    });
    expect(selfTestExit({ kind: "result", result: { ...passed, verdict: "failed" } }).exitCode).toBe(1);
    expect(selfTestExit({ kind: "timeout" })).toEqual({
      exitCode: 2,
      report: { renderer: { verdict: "failed", exitReason: "timeout" } },
    });
    expect(selfTestExit({ kind: "render-process-gone", reason: "crashed" })).toEqual({
      exitCode: 2,
      report: { renderer: { verdict: "failed", exitReason: "render-process-gone", error: "crashed" } },
    });
    expect(selfTestExit({ kind: "did-fail-load", errorDescription: "ERR_FILE_NOT_FOUND" }).exitCode).toBe(2);
    expect(selfTestExit({ kind: "main-error", error: "no store" }).exitCode).toBe(2);
  });

  it("loads the built client in a self-test, even in development", () => {
    expect(rendererLoadUrl({ isDev: true, selfTest: true, devServerScheme: "https" })).toBe("app://miroir/home");
    expect(rendererLoadUrl({ isDev: false, selfTest: false, devServerScheme: "https" })).toBe("app://miroir/home");
    expect(rendererLoadUrl({ isDev: true, selfTest: false, devServerScheme: "https" })).toBe("https://localhost:5173/home");
  });
});
