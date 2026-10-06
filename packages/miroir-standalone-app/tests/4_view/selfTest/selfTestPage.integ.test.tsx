/**
 * #487: in self-test mode the page runs the self-test on load, shows the run then its
 * results on `SelfTestPage`, and publishes the result on `<html data-miroir-self-test>` and
 * `window.__MIROIR_SELF_TEST_RESULT__`. Rendered with `createRoot` into jsdom, on the real
 * platform of `selfTestPlatform.ts`, as `index.tsx` does.
 *
 * Run:
 *   npm run testByFile -w miroir-standalone-app -- selfTestPage.integ
 */
import React from "react";
import { act } from "@testing-library/react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { MiroirContext, type MiroirConfigClient } from "miroir-core";
import { LocalCacheProvider, MiroirContextReactProvider } from "miroir-react";

import { startSelfTest } from "../../../src/miroir-fwk/4-tests/selfTest/startSelfTest.js";
import {
  publishSelfTestResult,
  SELF_TEST_RESULT_GLOBAL,
  shouldStartSelfTest,
  type MiroirSelfTestResult,
} from "../../../src/miroir-fwk/4-tests/selfTest/selfTestResult.js";
import { bootSelfTestPlatform, miroirActivityTracker, miroirEventService } from "./selfTestPlatform.js";

describe("self-test page (#487)", () => {
  let container: HTMLDivElement;
  let root: Root;
  let result: MiroirSelfTestResult;
  const verdicts: (string | undefined)[] = [];

  beforeAll(async () => {
    const { domainController, miroirConfig } = await bootSelfTestPlatform();
    const miroirContext = new MiroirContext(miroirActivityTracker, miroirEventService, miroirConfig);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const run = startSelfTest({
      root,
      withProviders: (page) => (
        <LocalCacheProvider store={domainController.getLocalCache().getInnerStore()}>
          <MiroirContextReactProvider miroirContext={miroirContext} domainController={domainController}>
            {page}
          </MiroirContextReactProvider>
        </LocalCacheProvider>
      ),
      domainController,
      miroirConfig,
      tracker: miroirActivityTracker,
      authenticationEnabled: false,
    });
    verdicts.push(document.documentElement.dataset.miroirSelfTest);
    await act(async () => {
      result = await run;
    });
  }, 300000);

  afterAll(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("is running while the tests run", () => {
    expect(verdicts).toEqual(["running"]);
  });

  it("publishes the verdict on <html> and on window", () => {
    expect(result.verdict).toBe("passed");
    expect(document.documentElement.dataset.miroirSelfTest).toBe("passed");
    expect((window as any)[SELF_TEST_RESULT_GLOBAL]).toEqual(result);
  });

  it("shows the verdict, the environment and the results of every suite", () => {
    const verdict = container.querySelector('[data-testid="miroir-self-test-verdict"]');
    expect(verdict?.textContent).toMatch(/^passed: \d+ passed, 0 failed, \d+ skipped in \d+ suite\(s\)$/);
    expect(container.textContent).toContain("environment test-filesystem · tags unit");
    expect(container.textContent).toContain("tr.menuBuild");
    expect(container.textContent).toContain("PASSED");
  });

  it("renders no app shell", () => {
    expect(container.querySelector(".MuiAppBar-root")).toBeNull();
    expect(container.querySelector(".MuiDrawer-root")).toBeNull();
  });

  it("sends the final result to the Electron main process", () => {
    const sent: MiroirSelfTestResult[] = [];
    (window as any).electronAPI = { reportSelfTestResult: (sentResult: MiroirSelfTestResult) => sent.push(sentResult) };
    try {
      publishSelfTestResult({ ...result, verdict: "running" });
      publishSelfTestResult(result);
    } finally {
      delete (window as any).electronAPI;
    }
    expect(sent).toEqual([result]);
  });

  it("starts only when client.selfTest is enabled", () => {
    const base = { miroirConfigType: "client" } as MiroirConfigClient;
    expect(shouldStartSelfTest({ ...base, selfTest: { enabled: true } })).toBe(true);
    expect(shouldStartSelfTest({ ...base, selfTest: { enabled: false } })).toBe(false);
    expect(shouldStartSelfTest(base)).toBe(false);
    expect(shouldStartSelfTest(undefined)).toBe(false);
  });
});
