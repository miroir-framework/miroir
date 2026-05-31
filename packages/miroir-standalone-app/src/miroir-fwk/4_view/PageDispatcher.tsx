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
import React, { useEffect } from "react";
import { Navigate, type Params, useParams, useSearchParams } from "react-router-dom";

import { type ApplicationSection } from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import { PageContainer } from "./components/Page/PageContainer.js";
import { CheckPage } from "./routes/Check.js";
import { HomePage } from "./routes/HomePage.js";
import { ModelDiagramPage } from "./routes/ModelDiagramPage.js";
import { ReportDisplay } from "./routes/ReportDisplay.js";
import { RunnersPage } from "./routes/Runners.js";
import { SearchPage } from "./routes/SearchPage.js";
import { SettingsPage } from "./routes/SettingsPage.js";
import { TransformerBuilderPage } from "./routes/TransformerBuilderPage.js";
import { MiroirEventsPage } from "./pages/MiroirEventsPage.js";
import { ErrorLogsPageDEFUNCT } from "./ErrorLogsPageDEFUNCT.js";
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
export function PageDispatcher(): React.JSX.Element {
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
      return <AiAssistantPage />;

    default:
      return <HomePage />;
  }
}
