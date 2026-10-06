/**
 * #487: what the client does on page load in self-test mode: runs the self-test, shows its progress
 * and results on `SelfTestPage`, and publishes the result for drivers: `data-miroir-self-test` on
 * `<html>`, `window.__MIROIR_SELF_TEST_RESULT__`, and the Electron main process over IPC.
 */
import type { ReactNode } from "react";
import type { Root } from "react-dom/client";

import type { DomainControllerInterface, MiroirActivityTrackerInterface, MiroirConfigClient } from "miroir-core";

import type { TestResultData } from "../../4_view/components/Buttons/testResultReport.js";
import { SelfTestPage } from "../../4_view/pages/SelfTestPage.js";
import { runSelfTest } from "./runSelfTest.js";
import { publishSelfTestResult, selfTestTags, type MiroirSelfTestResult } from "./selfTestResult.js";

export async function startSelfTest(params: {
  root: Root;
  /** Wraps the page in the providers the application uses. */
  withProviders: (page: ReactNode) => ReactNode;
  domainController: DomainControllerInterface;
  miroirConfig: MiroirConfigClient;
  tracker: MiroirActivityTrackerInterface;
  authenticationEnabled: boolean;
}): Promise<MiroirSelfTestResult> {
  const resultsBySuiteKey: Record<string, TestResultData[]> = {};
  const show = (result: MiroirSelfTestResult) =>
    params.root.render(
      params.withProviders(<SelfTestPage result={result} resultsBySuiteKey={{ ...resultsBySuiteKey }} />),
    );

  const running: MiroirSelfTestResult = {
    verdict: "running",
    environment: params.miroirConfig.environment?.name,
    tags: selfTestTags(params.miroirConfig),
    startedAt: new Date().toISOString(),
  };
  document.getElementById("miroir-bootstrap-spinner")?.remove();
  publishSelfTestResult(running);
  show(running);

  const result = await runSelfTest({
    domainController: params.domainController,
    miroirConfig: params.miroirConfig,
    tracker: params.tracker,
    authenticationEnabled: params.authenticationEnabled,
    onSuiteDone: (suiteKey, results) => {
      resultsBySuiteKey[suiteKey] = results;
      show(running);
    },
  });
  publishSelfTestResult(result);
  show(result);
  return result;
}
