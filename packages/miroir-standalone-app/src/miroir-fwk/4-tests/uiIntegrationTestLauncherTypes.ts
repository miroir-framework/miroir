import type {
  IntegrationTestHostMode,
  IntegrationTestSessionKind,
  MiroirTestRunFilter,
  MiroirTestSuite,
  RunnerTestRunTarget,
  TestSuiteResult,
} from "miroir-core";

/** D2 — user toggle for runTarget resolution in the UI launcher. */
export type UiIntegrationTestRunTargetMode = "ephemeral" | "pinned";

export type UiIntegrationTestRunRequest = {
  suiteKey: string;
  suiteDefinition: MiroirTestSuite;
  profileName: string;
  filter?: MiroirTestRunFilter;
  runTargetMode: UiIntegrationTestRunTargetMode;
  /** Default `isolated` — data-isolated bootstrap (Gap A). */
  hostMode?: IntegrationTestHostMode;
};

export type UiIntegrationTestRunInspectorSnapshot = {
  profileName: string;
  sessionKind: IntegrationTestSessionKind;
  runTarget: RunnerTestRunTarget;
  runTargetMode: UiIntegrationTestRunTargetMode;
  hostMode: IntegrationTestHostMode;
};

/** Result contract for `runUiIntegrationTestSuite` (implemented in B3). */
export type UiIntegrationTestRunResult = {
  suiteKey: string;
  sessionKind: IntegrationTestSessionKind;
  runTarget: RunnerTestRunTarget;
  runTargetMode: UiIntegrationTestRunTargetMode;
  profileName: string;
  hostMode: IntegrationTestHostMode;
  success: boolean;
  inspector: UiIntegrationTestRunInspectorSnapshot;
  /** Dedicated integ tracker results for UI report panels (B5). */
  testSuiteResults?: TestSuiteResult;
};
