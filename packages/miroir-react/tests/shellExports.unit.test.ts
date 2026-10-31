/**
 * #633 D7: every symbol of the app shell that a client uses is exported from the miroir-react entry, so a
 * client builds its shell from the package (the standalone app and the sandbox import nothing else).
 * Not reachable through MiroirTest: the export surface of the package, not a model element.
 */
import { describe, expect, it } from "vitest";

import * as entry from "../src/index.js";

const shellSymbols = [
  // client services and load timings (slice 1)
  "fetchMiroirAndAppConfigurations",
  "useConfigurationService",
  "markPageConfigurationsLoaded",
  "usePageConfiguration",
  "loadTimingMark",
  "setLoadTimingMarkSink",
  // host slots, runners, login (slices 2 and 3)
  "mcpToolUnavailable",
  "MiroirShellHostProvider",
  "useMiroirShellHost",
  "requestLoginTokenOverHttp",
  "fetchAuthenticationEnabledOverHttp",
  "LoginPage",
  "RunnerView",
  "StoredRunnerView",
  "RunnerList",
  "runnerConfigs",
  "resolveMcpToolAction",
  "applicationNameForMcpRunner",
  "SequenceEditor",
  // pages (slices 4 and 5)
  "RunnersPage",
  "HomePage",
  "SettingsPage",
  "SearchPage",
  "TransformerBuilderPage",
  "CheckPage",
  "MiroirEventsPage",
  "ErrorLogsPageDEFUNCT",
  "EventTimelineContainer",
  "InstanceEditorOutline",
  "ModelDiagramPage",
  // shell (slice 6)
  "PageDispatcher",
  "reportPageParamsFromSearchParams",
  "RootComponent",
  "AppBar",
  "FeedbackGlowAppBarButton",
  "readMiroirAiBackend",
  "writeMiroirAiBackend",
  "subscribeMiroirAiBackend",
  "MIROIR_AI_BACKEND_STORAGE_KEY",
  "agentBackendLabel",
  "agentRequestProperties",
  // already in the package, used by every client
  "ErrorPage",
  "defaultReportSectionRenderers",
  "ReportSectionRenderersProvider",
];

describe("miroir-react shell exports (#633)", () => {
  it("exports every symbol of the app shell", () => {
    const missing = shellSymbols.filter((name) => (entry as Record<string, unknown>)[name] === undefined);
    expect(missing).toEqual([]);
  });
});
