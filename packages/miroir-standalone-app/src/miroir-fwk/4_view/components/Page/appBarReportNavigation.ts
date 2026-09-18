import type { ReportLink } from "miroir-core";
import { pageUrl, reportUrl } from "../../navigation.js";

/**
 * Resolve which SelfApplication uuid an AppBar report link should navigate with.
 *
 * Versioning (#225) is a Miroir scaffolding report: always open it under the
 * report's static selfApplication (Miroir). Target-app filtering is done inside
 * the report via inputReportSection (and the freeze Runner's own application field).
 */
export function resolveAppBarReportLinkApplication(params: {
  reportUuid: string;
  itemSelfApplication: string;
  versioningReportUuid: string;
  applicationSelector?: string | undefined;
}): string {
  void params.reportUuid;
  void params.versioningReportUuid;
  void params.applicationSelector;
  return params.itemSelfApplication;
}

/**
 * Resolve the URL for the AppBar Home icon.
 *
 * When a user application is selected in the sidebar and that SelfApplication
 * defines `homePageUrl`, navigate there. Otherwise fall back to the Miroir
 * platform home (`/?page=home`).
 */
export function resolveAppBarHomeNavigationUrl(params: {
  applicationSelector?: string | undefined;
  noValueUuid?: string | undefined;
  homePageUrl?: string | ReportLink | undefined;
  applicationDeploymentMap: Record<string, string>;
}): string {
  const selector = params.applicationSelector;
  const hasSelectedApplication =
    !!selector && selector !== params.noValueUuid;
  if (!hasSelectedApplication || !params.homePageUrl) {
    return pageUrl("home");
  }
  const homePageUrl = params.homePageUrl;
  if (typeof homePageUrl === "string") {
    return homePageUrl;
  }
  return reportUrl(
    homePageUrl.selfApplication,
    params.applicationDeploymentMap[homePageUrl.selfApplication] ?? "",
    homePageUrl.section,
    homePageUrl.reportUuid ?? "",
    homePageUrl.instanceUuid ?? "xxxxxx",
  );
}
