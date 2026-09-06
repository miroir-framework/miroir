import type {
  IntegrationTestHostMode,
  IntegrationTestSessionKind,
  MiroirTestRunFilter,
  MiroirTestSuite,
  Runner,
  TestbedUuids,
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
  /**
   * Runner uuid → instance for `runnerRef` lookup.
   * UI: selected application's loaded Runners. CLI: folder-derived index.
   */
  runnerUuidIndex?: Record<string, Runner>;
};

export type UiIntegrationTestRunInspectorSnapshot = {
  profileName: string;
  sessionKind: IntegrationTestSessionKind;
  runTarget: TestbedUuids;
  runTargetMode: UiIntegrationTestRunTargetMode;
  hostMode: IntegrationTestHostMode;
  paramBankKeys: string[];
};

/** Result contract for `runUiIntegrationTestSuite` (implemented in B3). */
export type UiIntegrationTestRunResult = {
  suiteKey: string;
  sessionKind: IntegrationTestSessionKind;
  runTarget: TestbedUuids;
  runTargetMode: UiIntegrationTestRunTargetMode;
  profileName: string;
  hostMode: IntegrationTestHostMode;
  success: boolean;
  inspector: UiIntegrationTestRunInspectorSnapshot;
  /** Dedicated integ tracker results for UI report panels (B5). */
  testSuiteResults?: TestSuiteResult;
};
