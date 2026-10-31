import { lazy } from "react";

import type { MiroirShellHost, ReportSectionRenderers } from "miroir-react";

// ################################################################################################
// The report section kinds that miroir-react leaves to the application (#13 Q3-a): d3, the class
// diagram and the MiroirTest runtime stay in this app. Lazy, so that providing the registry at the
// root does not load them with the page. The stored runner is a miroir-react default (#633 D8).
export const appReportSectionRenderers: ReportSectionRenderers = {
  graphReportSection: lazy(() => import("./components/Graph/GraphReportSectionView.js")),
  modelDiagramReportSection: lazy(async () => ({
    default: (await import("./components/Reports/ModelDiagramReportSectionView.js"))
      .ModelDiagramReportSectionView,
  })),
  miroirTestReportSection: lazy(async () => ({
    default: (await import("./components/Reports/ReportSectionMiroirTest.js")).ReportSectionMiroirTest,
  })),
};

// The app's features of the shell (#633 D2): the MCP tool call needs miroir-mcp/client, loaded on the
// first call.
export const appShellHost: MiroirShellHost = {
  runMcpTool: async (runner, args, serverUrl, capabilities) =>
    (await import("./components/Runners/runMcpToolRunner.js")).runMcpToolRunner(runner, args, serverUrl, capabilities),
};
