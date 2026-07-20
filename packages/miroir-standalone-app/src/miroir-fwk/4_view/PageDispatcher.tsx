/**
 * PageDispatcher — shared page routing component.
 *
 * Dispatches to the correct page component based on the `?page=` query
 * parameter.  Used by both the standalone/electron app and the demo app as
 * the catch-all child route under RootComponent.
 *
 * Primary navigation format (query-param based):
 *   ?page=home
 *   ?page=settings
 *   ?page=report&application=X&deploymentUuid=X&applicationSection=X&reportUuid=X[&instanceUuid=X]
 *   ?page=events[&eventId=X]
 *   ?page=model
 *   ?page=search
 *   ...
 *
 * Fallback: plain path segments in the wildcard param (e.g. coming from a
 * legacy navigate("/settings") call) are still handled for backward
 * compatibility, but all new navigation should use the query-param helpers
 * exported from navigation.ts.
 */
import React, { Suspense, useEffect } from "react";
import { Navigate, type Params, useParams, useSearchParams } from "react-router-dom";

import { type ApplicationSection } from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import { PageContainer } from "./components/Page/PageContainer.js";
import { CenteredSpinner } from "./components/CenteredSpinner.js";

// All page components are lazy-loaded so they are excluded from the main
// bundle and downloaded in the background after the shell renders.
const CheckPage            = React.lazy(() => import("./routes/Check.js").then(m => ({ default: m.CheckPage })));
const HomePage             = React.lazy(() => import("./routes/HomePage.js").then(m => ({ default: m.HomePage })));
const ModelDiagramPage     = React.lazy(() => import("./routes/ModelDiagramPage.js").then(m => ({ default: m.ModelDiagramPage })));
const ReportDisplay        = React.lazy(() => import("./routes/ReportDisplay.js").then(m => ({ default: m.ReportDisplay })));
const RunnersPage          = React.lazy(() => import("./routes/Runners.js").then(m => ({ default: m.RunnersPage })));
const SearchPage           = React.lazy(() => import("./routes/SearchPage.js").then(m => ({ default: m.SearchPage })));
const SettingsPage         = React.lazy(() => import("./routes/SettingsPage.js").then(m => ({ default: m.SettingsPage })));
const TransformerBuilderPage = React.lazy(() => import("./routes/TransformerBuilderPage.js").then(m => ({ default: m.TransformerBuilderPage })));
const MiroirEventsPage     = React.lazy(() => import("./pages/MiroirEventsPage.js").then(m => ({ default: m.MiroirEventsPage })));
const ErrorLogsPageDEFUNCT = React.lazy(() => import("./ErrorLogsPageDEFUNCT.js").then(m => ({ default: m.ErrorLogsPageDEFUNCT })));
import type { ReportUrlParamKeys } from "../../constants.js";
import { usePageConfiguration } from "./services/index.js";

// ---------------------------------------------------------------------------
// ReportWrapper
// Sets context deployment/section and delegates to ReportDisplay.
// ---------------------------------------------------------------------------
function ReportWrapper({ pageParams }: { pageParams: Params<ReportUrlParamKeys> }) {
  const context = useMiroirContextService();

  // Ensure configurations are loaded (mirrors the old ReportPage behavior).
  // The module-level flag in usePageConfiguration prevents duplicate fetches
  // when HomePage already loaded them, so this is safe to call here.
  usePageConfiguration({ autoFetchOnMount: true });

  useEffect(() => {
    context.setDeploymentUuid(pageParams.deploymentUuid ?? "");
  }, [pageParams.deploymentUuid]);

  useEffect(() => {
    context.setApplicationSection((pageParams.applicationSection as ApplicationSection) ?? "data");
  }, [pageParams.applicationSection]);

  return (
    <PageContainer withSidebar={true} withDocumentOutline={false}>
      <ReportDisplay pageParams={pageParams} />
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// PageDispatcher
// ---------------------------------------------------------------------------
// Inner resolver — returns the correct page element for the current URL.
// Kept separate so PageDispatcher can wrap it in a single <Suspense>.
// ---------------------------------------------------------------------------
function PageContent(): React.JSX.Element {
  const { "*": wildcardPath = "" } = useParams();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page");

  console.log("[PageDispatcher] render: wildcardPath=", wildcardPath, "page=", page, "search=", searchParams.toString());

  // ── Primary: query-param mode ─────────────────────────────────────────
  if (page) {
    switch (page) {
      case "home":
        return <HomePage />;

      case "report": {
        const pageParams: Params<ReportUrlParamKeys> = {
          application:        searchParams.get("application")        ?? "",
          deploymentUuid:     searchParams.get("deploymentUuid")     ?? "",
          applicationSection: searchParams.get("applicationSection") ?? "data",
          reportUuid:         searchParams.get("reportUuid")         ?? "",
          instanceUuid:       searchParams.get("instanceUuid")       ?? undefined,
        };
        return <ReportWrapper pageParams={pageParams} />;
      }

      case "transformerBuilder":
        return <TransformerBuilderPage />;

      case "runners":
        return <RunnersPage />;

      case "check":
        return <CheckPage />;

      case "error-logs":
        return <ErrorLogsPageDEFUNCT />;

      case "events":
        return <MiroirEventsPage />;

      case "settings":
        return <SettingsPage />;

      case "search":
        return <SearchPage />;

      case "model":
        return <ModelDiagramPage />;

      default:
        return <Navigate to="/?page=home" replace />;
    }
  }

  // ── Fallback: legacy path-segment mode ───────────────────────────────
  const segments = wildcardPath.split("/").filter(Boolean);
  const pathPage = segments[0] ?? "home";

  switch (pathPage) {
    case "home":
      return <HomePage />;

    case "report": {
      const pageParams: Params<ReportUrlParamKeys> = {
        application:        segments[1] ?? "",
        deploymentUuid:     segments[2] ?? "",
        applicationSection: segments[3] ?? "data",
        reportUuid:         segments[4] ?? "",
        instanceUuid:       segments[5] ?? undefined,
      };
      return <ReportWrapper pageParams={pageParams} />;
    }

    case "transformerBuilder":
      return <TransformerBuilderPage />;

    case "runners":
      return <RunnersPage />;

    case "check":
      return <CheckPage />;

    case "error-logs":
      return <ErrorLogsPageDEFUNCT />;

    case "events":
      return <MiroirEventsPage />;

    case "settings":
      return <SettingsPage />;

    case "search":
      return <SearchPage />;

    case "model":
      return <ModelDiagramPage />;

    case "ai":
      return <HomePage />;

    default:
      return <HomePage />;
  }
}

// ---------------------------------------------------------------------------
export function PageDispatcher(): React.JSX.Element {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <PageContent />
    </Suspense>
  );
}
