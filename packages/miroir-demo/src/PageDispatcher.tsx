/**
 * PageDispatcher
 *
 * Catches all unmatched routes (path: "*") under the RootComponent layout and
 * dispatches to the correct page component.
 *
 * Two navigation modes are supported:
 *
 * 1. PATH-BASED (used by AppBar, EntityInstanceLink, ReportInstanceLink inside
 *    the standalone-app components that are imported unchanged via @miroir-app):
 *      /#/home
 *      /#/settings
 *      /#/report/<app>/<deployment>/<section>/<reportUuid>[/<instanceUuid>]
 *      /#/instance/<deployment>/<section>/<entity>/<instanceUuid>
 *
 * 2. QUERY-PARAM-BASED (useful for external/shareable deep-links):
 *      /#?page=home
 *      /#?page=settings
 *      /#?page=report&app=…&deployment=…&section=…&report=…[&instance=…]
 *    Query-param URLs are immediately redirected to their path-based equivalents.
 */
import React, { useEffect } from "react";
import { Navigate, Params, useParams, useSearchParams } from "react-router-dom";

import { ApplicationSection } from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import { PageContainer } from "@miroir-app/miroir-fwk/4_view/components/Page/PageContainer.js";
import { CheckPage } from "@miroir-app/miroir-fwk/4_view/routes/Check.js";
import { HomePage } from "@miroir-app/miroir-fwk/4_view/routes/HomePage.js";
import { ModelDiagramPage } from "@miroir-app/miroir-fwk/4_view/routes/ModelDiagramPage.js";
import { ReportDisplay } from "@miroir-app/miroir-fwk/4_view/routes/ReportDisplay.js";
import { RunnersPage } from "@miroir-app/miroir-fwk/4_view/routes/Runners.js";
import { SearchPage } from "@miroir-app/miroir-fwk/4_view/routes/SearchPage.js";
import { SettingsPage } from "@miroir-app/miroir-fwk/4_view/routes/SettingsPage.js";
import { TransformerBuilderPage } from "@miroir-app/miroir-fwk/4_view/routes/TransformerBuilderPage.js";
import { MiroirEventsPage } from "@miroir-app/miroir-fwk/4_view/pages/MiroirEventsPage.js";

import type { ReportUrlParamKeys } from "@miroir-app/constants.js";

// ---------------------------------------------------------------------------
// DemoReportWrapper
// Wraps ReportDisplay and replicates the context setup that standalone-app's
// ReportPage does via useParams.  Receives pre-parsed pageParams instead.
// ---------------------------------------------------------------------------
function DemoReportWrapper({ pageParams }: { pageParams: Params<ReportUrlParamKeys> }) {
  const context = useMiroirContextService();

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
  // wildcardPath is the unmatched portion of the URL after the layout route "/"
  const { "*": wildcardPath = "" } = useParams();
  const [searchParams] = useSearchParams();

  const pageFromQuery = searchParams.get("page");

  // ── Query-param mode ────────────────────────────────────────────────────
  // Convert ?page= URLs to path-based hash routes so the path-handling branch
  // below drives everything in a uniform way.
  if (pageFromQuery) {
    if (pageFromQuery === "report") {
      const app        = searchParams.get("app")        ?? "";
      const deployment = searchParams.get("deployment") ?? "";
      const section    = searchParams.get("section")    ?? "data";
      const report     = searchParams.get("report")     ?? "";
      const instance   = searchParams.get("instance");
      const target = instance
        ? `/report/${app}/${deployment}/${section}/${report}/${instance}`
        : `/report/${app}/${deployment}/${section}/${report}`;
      return <Navigate to={target} replace />;
    }
    // All other pages: ?page=settings → /settings
    return <Navigate to={`/${pageFromQuery}`} replace />;
  }

  // ── Path-based mode ─────────────────────────────────────────────────────
  // AppBar calls navigate("/pageName"); hash router presents it as wildcardPath.
  const segments = wildcardPath.split("/").filter(Boolean);
  const page = segments[0] ?? "home";

  switch (page) {
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
      return <DemoReportWrapper pageParams={pageParams} />;
    }

    case "transformerBuilder":
      return <TransformerBuilderPage />;

    case "runners":
      return <RunnersPage />;

    case "check":
      return <CheckPage />;

    case "events":
      return <MiroirEventsPage />;

    case "settings":
      return <SettingsPage />;

    case "search":
      return <SearchPage />;

    case "model":
      return <ModelDiagramPage />;

    default:
      return <Navigate to="/home" replace />;
  }
}
