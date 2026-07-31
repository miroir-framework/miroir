import type { ApplicationDeploymentMap, Uuid } from "miroir-core";
import { noValue } from "miroir-core";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

/**
 * Default application for a report input picker: page URL application when set,
 * otherwise Miroir (scaffolding reports open under Miroir).
 */
export function resolveReportInputApplicationDefault(
  pageApplication: string | undefined,
): Uuid {
  if (
    pageApplication &&
    pageApplication !== noValue.uuid &&
    pageApplication !== "NO_APPLICATION"
  ) {
    return pageApplication;
  }
  return selfApplicationMiroir.uuid;
}

/**
 * Overlay pageParams.application onto any inputReportSection formik buckets that
 * declare an `application` field (e.g. Versioning `versioningInput`).
 */
export function seedReportInputApplicationFromPageParams(
  reportSectionsData: Record<string, any>,
  section: any,
  pageApplication: string | undefined,
): Record<string, any> {
  const application = resolveReportInputApplicationDefault(pageApplication);
  const result = { ...reportSectionsData };
  const visit = (s: any) => {
    if (!s) return;
    if (s.type === "list" && Array.isArray(s.definition)) {
      s.definition.forEach(visit);
      return;
    }
    if (s.type !== "inputReportSection") return;
    const prefix = s.definition?.inputPrefix;
    const schemaDef = s.definition?.inputMLSchema?.definition;
    if (!prefix || !schemaDef || !("application" in schemaDef)) return;
    result[prefix] = {
      ...(result[prefix] ?? {}),
      application,
    };
  };
  visit(section);
  return result;
}

/**
 * Report page `applicationSection` for opening a Miroir scaffolding report
 * (e.g. Versioning) under a given SelfApplication.
 *
 * Miroir: Versioning lives in the data-section report list (not metaModelReports).
 * Other apps: Miroir reports are exposed via the model-section mapping.
 */
export function resolveScaffoldingReportApplicationSection(
  application: Uuid,
): "model" | "data" {
  return application === selfApplicationMiroir.uuid ? "data" : "model";
}

/**
 * Build a report URL that keeps the same report/instance but switches
 * the page application (and matching deployment + scaffolding section).
 */
export function buildReportApplicationSwitchUrl(params: {
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  reportUuid: string;
  instanceUuid?: string;
  /** Ignored when switching — section is derived for scaffolding reports. */
  applicationSection?: string;
  reportUrl: (
    application: string,
    deploymentUuid: string,
    applicationSection: string,
    reportUuid: string,
    instanceUuid?: string,
  ) => string;
}): string | undefined {
  if (!params.application || params.application === noValue.uuid) {
    return undefined;
  }
  const deploymentUuid = params.applicationDeploymentMap[params.application];
  if (!deploymentUuid) {
    return undefined;
  }
  return params.reportUrl(
    params.application,
    deploymentUuid,
    resolveScaffoldingReportApplicationSection(params.application),
    params.reportUuid,
    params.instanceUuid,
  );
}
