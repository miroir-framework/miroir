import {
  describeIntegrationTestSession,
  type IntegrationTestSessionDescriptor,
  type TestSuiteResult,
} from "miroir-core";

import { getIntegrationTestProfileCatalogEntry } from "./integrationTestProfileCatalog.js";
import type { UiIntegrationTestRunResult } from "./uiIntegrationTestLauncherTypes.js";

export type IntegrationTestAssertionSummaryEntry = {
  testLabel: string;
  testResult: "ok" | "error" | "skipped";
};

export type IntegrationTestRunInspectorModel = {
  suiteKey: string;
  profileName: string;
  profileDescription: string;
  sessionKind: UiIntegrationTestRunResult["sessionKind"];
  sessionDescriptor: IntegrationTestSessionDescriptor;
  hostMode: UiIntegrationTestRunResult["hostMode"];
  runTargetMode: UiIntegrationTestRunResult["runTargetMode"];
  runTarget: UiIntegrationTestRunResult["runTarget"];
  paramBankKeys: string[];
  success: boolean;
  assertionSummary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    recentFailures: IntegrationTestAssertionSummaryEntry[];
  };
};

const MAX_RECENT_FAILURES = 5;

function collectLeafAssertionEntries(
  suiteResult: TestSuiteResult | undefined,
  prefix = "",
): IntegrationTestAssertionSummaryEntry[] {
  if (!suiteResult) {
    return [];
  }

  const entries: IntegrationTestAssertionSummaryEntry[] = [];
  for (const [testLabel, testResult] of Object.entries(suiteResult.testsResults ?? {})) {
    entries.push({
      testLabel: prefix ? `${prefix} › ${testLabel}` : testLabel,
      testResult: testResult.testResult,
    });
  }
  for (const [nestedSuiteKey, nestedSuiteResult] of Object.entries(
    suiteResult.testsSuiteResults ?? {},
  )) {
    entries.push(
      ...collectLeafAssertionEntries(
        nestedSuiteResult,
        prefix ? `${prefix} › ${nestedSuiteKey}` : nestedSuiteKey,
      ),
    );
  }
  return entries;
}

function summarizeAssertions(
  testSuiteResults: TestSuiteResult | undefined,
): IntegrationTestRunInspectorModel["assertionSummary"] {
  const entries = collectLeafAssertionEntries(testSuiteResults);
  const passed = entries.filter((entry) => entry.testResult === "ok").length;
  const failed = entries.filter((entry) => entry.testResult === "error").length;
  const skipped = entries.filter((entry) => entry.testResult === "skipped").length;

  return {
    total: entries.length,
    passed,
    failed,
    skipped,
    recentFailures: entries
      .filter((entry) => entry.testResult === "error")
      .slice(0, MAX_RECENT_FAILURES),
  };
}

export function buildIntegrationTestRunInspectorModel(
  result: UiIntegrationTestRunResult,
): IntegrationTestRunInspectorModel {
  const profileEntry = getIntegrationTestProfileCatalogEntry(result.profileName);

  return {
    suiteKey: result.suiteKey,
    profileName: result.profileName,
    profileDescription: profileEntry?.description ?? "Unknown profile",
    sessionKind: result.sessionKind,
    sessionDescriptor: describeIntegrationTestSession(result.sessionKind),
    hostMode: result.hostMode,
    runTargetMode: result.runTargetMode,
    runTarget: result.runTarget,
    paramBankKeys: result.inspector.paramBankKeys,
    success: result.success,
    assertionSummary: summarizeAssertions(result.testSuiteResults),
  };
}
