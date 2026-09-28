import type {
  EntityInstance,
  IntegrationTestHostMode,
  IntegrationTestSessionKind,
  MiroirActivityTrackerInterface,
  MiroirEventService,
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
  /**
   * Required by a suite of `reportTest` leaves (#330): registers the report test runner over the
   * app's component test sandbox, for the tracker and event service of the run's session, and
   * returns the function that releases it.
   */
  prepareReportTests?: (session: UiIntegrationReportTestSession) => Promise<() => void>;
  /**
   * The Miroir Reports loaded in the app (#330). The session of a suite of `reportTest` leaves
   * holds the bootstrap Miroir Reports only: its runner creates the others before each leaf.
   */
  miroirReports?: () => readonly EntityInstance[];
};

/** What the report test runner takes from the run (#330): its session, and the app's Miroir Reports. */
export type UiIntegrationReportTestSession = {
  miroirActivityTracker: MiroirActivityTrackerInterface;
  miroirEventService: MiroirEventService;
  miroirReports?: () => readonly EntityInstance[];
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
