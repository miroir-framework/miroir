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
import React, { Suspense, useEffect, useMemo } from "react";
import { Navigate, type Params, useParams, useSearchParams } from "react-router-dom";

import { isUsableBearerToken, LoggerInterface, MiroirLoggerFactory, nextPageWhenAccessDenied, nextPageWhenAuthGate, type ApplicationSection } from "miroir-core";
import { useMiroirContextService } from "miroir-react";
import { getAuthenticationEnabled, getAuthToken } from "./auth/authSession.js";
import { useApplicationAccess } from "./auth/useApplicationAccess.js";

import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";
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
const LoginPage            = React.lazy(() => import("./routes/LoginPage.js").then(m => ({ default: m.LoginPage })));
const SecretsPage          = React.lazy(() => import("./routes/SecretsPage.js").then(m => ({ default: m.SecretsPage })));
const TransformerBuilderPage = React.lazy(() => import("./routes/TransformerBuilderPage.js").then(m => ({ default: m.TransformerBuilderPage })));
const MiroirEventsPage     = React.lazy(() => import("./pages/MiroirEventsPage.js").then(m => ({ default: m.MiroirEventsPage })));
const ErrorLogsPageDEFUNCT = React.lazy(() => import("./ErrorLogsPageDEFUNCT.js").then(m => ({ default: m.ErrorLogsPageDEFUNCT })));
import type { ReportUrlParamKeys } from "../../constants.js";
import { usePageConfiguration } from "./services/index.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PageDispatcher");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => { log = logger; });

const REPORT_URL_KNOWN_PARAM_KEYS = new Set([
  "application",
  "deploymentUuid",
  "applicationSection",
  "reportUuid",
  "instanceUuid",
]);

/** Maps report-page search params to typed report page params; unknown keys are forwarded (D8). */
export function reportPageParamsFromSearchParams(
  searchParams: URLSearchParams,
): Params<ReportUrlParamKeys> | undefined {
  const page = searchParams.get("page");
  if (page !== "report") {
    return undefined;
  }
  // Params<> is readonly (and an index signature once ReportUrlParamKeys is
  // widened); build a mutable bag then return it as the route-params type.
  const params: Record<string, string | undefined> = {
    application: searchParams.get("application") ?? "",
    deploymentUuid: searchParams.get("deploymentUuid") ?? "",
    applicationSection: searchParams.get("applicationSection") ?? "data",
    reportUuid: searchParams.get("reportUuid") ?? "",
    instanceUuid: searchParams.get("instanceUuid") ?? undefined,
  };
  for (const [key, value] of searchParams.entries()) {
    if (key === "page" || REPORT_URL_KNOWN_PARAM_KEYS.has(key)) {
      continue;
    }
    params[key] = value;
  }
  return params as Params<ReportUrlParamKeys>;
}

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
  const access = useApplicationAccess();
  const page = searchParams.get("page");
  const application = searchParams.get("application") ?? "";
  const deploymentUuid = searchParams.get("deploymentUuid") ?? "";
  const applicationSection = searchParams.get("applicationSection") ?? "data";
  const reportUuid = searchParams.get("reportUuid") ?? "";
  const instanceUuid = searchParams.get("instanceUuid") ?? undefined;

  const reportPageParams = useMemo(
    () => reportPageParamsFromSearchParams(searchParams),
    [searchParams],
  );

  log.debug("[PageDispatcher] render: wildcardPath=", wildcardPath, "page=", page, "search=", searchParams.toString());

  const intended = `/?${searchParams.toString()}` || "/?page=home";
  const hasToken = isUsableBearerToken(getAuthToken());
  if (page === "login" && getAuthenticationEnabled() && hasToken) {
    return <Navigate to={searchParams.get("return") || "/?page=home"} replace />;
  }
  if (page !== "login") {
    const gated = nextPageWhenAuthGate({
      enabled: getAuthenticationEnabled(),
      hasToken,
      intended,
    });
    if (gated !== intended) {
      return <Navigate to={gated} replace />;
    }
    const applicationUuid =
      application || wildcardPath.split("/").filter(Boolean)[1] || "";
    const accessPage = nextPageWhenAccessDenied({
      enabled: access.filterEnabled,
      hasAccess: access.canAccessApplication(applicationUuid),
      intended,
    });
    if (accessPage !== intended) {
      return <Navigate to={accessPage} replace />;
    }
  }

  // ── Primary: query-param mode ─────────────────────────────────────────
  if (page) {
    switch (page) {
      case "login":
        return <LoginPage />;

      case "secrets":
        return <SecretsPage />;

      case "home":
        return <HomePage />;

      case "report": {
        return <ReportWrapper pageParams={reportPageParams!} />;
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
    case "login":
      return <LoginPage />;

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
