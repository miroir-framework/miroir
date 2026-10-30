import { lazy } from "react";

import type { ReportSectionRenderers } from "miroir-react";

// ################################################################################################
// The report section kinds that miroir-react leaves to the application (#13 Q3-a): d3, the class
// diagram, MCP runners and the MiroirTest runtime stay in this app. Lazy, so that providing the
// registry at the root does not load them with the page.
export const appReportSectionRenderers: ReportSectionRenderers = {
  graphReportSection: lazy(() => import("./components/Graph/GraphReportSectionView.js")),
  modelDiagramReportSection: lazy(async () => ({
    default: (await import("./components/Reports/ModelDiagramReportSectionView.js"))
      .ModelDiagramReportSectionView,
  })),
  storedRunner: lazy(async () => ({
    default: (await import("./components/Runners/RunnerView.js")).StoredRunnerView,
  })),
  miroirTestReportSection: lazy(async () => ({
    default: (await import("./components/Reports/ReportSectionMiroirTest.js")).ReportSectionMiroirTest,
  })),
};
