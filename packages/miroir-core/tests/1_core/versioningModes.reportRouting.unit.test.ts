/**
 * Miroir Entity Versions / Application Versions reports read from modelVersion, not model.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  reportApplicationVersionList,
  reportApplicationVersionDetails,
  reportEntityDefinitionList,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import { getReportsAndEntitiesForDeploymentUuid } from "../../src/1_core/Model.js";
import { defaultMiroirMetaModel } from "../../src/1_core/defaultMiroirMetaModel.js";
import { REPO_ROOT } from "./versioningModes.testData.js";

const MIROIR_MENU = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json",
);
const ENTITY_VERSION_LIST_REPORT = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json",
);
const MIROIR_DEPLOYMENT_ADMIN = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json",
);

const APPLICATION_VERSION_DETAILS_REPORT = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/17e78252-2540-4003-9305-d85c0c02d7ba.json",
);

describe("Miroir Version History report routing", () => {
  it("Miroir deployment StoreUnitConfiguration includes modelVersion filesystem section", () => {
    const deployment = JSON.parse(readFileSync(MIROIR_DEPLOYMENT_ADMIN, "utf8"));
    expect(deployment.uuid).toBe(deployment_Miroir.uuid);
    expect(deployment.configuration.modelVersion).toEqual({
      emulatedServerType: "filesystem",
      directory: "miroir-test-app_deployment-miroir/assets/miroir_modelVersion",
    });
  });

  it("Miroir menu links Entity Versions and Application Versions to modelVersion section", () => {
    const menu = JSON.parse(readFileSync(MIROIR_MENU, "utf8"));
    const items = menu.definition.definition[0].items;
    const entityVersionsLink = items.find(
      (item: { reportUuid?: string }) =>
        item.reportUuid === reportEntityDefinitionList.uuid,
    );
    const appVersionsLink = items.find(
      (item: { reportUuid?: string }) =>
        item.reportUuid === reportApplicationVersionList.uuid,
    );
    expect(entityVersionsLink?.section).toBe("modelVersion");
    expect(appVersionsLink?.section).toBe("modelVersion");
  });

  it("EntityVersionList report extractor uses modelVersion applicationSection", () => {
    const report = JSON.parse(readFileSync(ENTITY_VERSION_LIST_REPORT, "utf8"));
    expect(report.definition.extractorTemplates.entityDefinitions.applicationSection).toBe(
      "modelVersion",
    );
  });

  it("ApplicationVersionDetails report extractor uses modelVersion applicationSection", () => {
    const report = JSON.parse(readFileSync(APPLICATION_VERSION_DETAILS_REPORT, "utf8"));
    expect(report.definition.extractorTemplates.applicationVersion.applicationSection).toBe(
      "modelVersion",
    );
  });

  it("getReportsAndEntitiesForDeploymentUuid exposes Version History reports under modelVersion", () => {
    const mapping = getReportsAndEntitiesForDeploymentUuid(
      selfApplicationMiroir.uuid!,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
    );
    const modelVersionReportUuids =
      mapping.modelVersion?.availableReports.map((r) => r.uuid) ?? [];
    expect(modelVersionReportUuids).toContain(reportEntityDefinitionList.uuid);
    expect(modelVersionReportUuids).toContain(reportApplicationVersionList.uuid);
    expect(modelVersionReportUuids).toContain(reportApplicationVersionDetails.uuid);
    expect(mapping.model?.availableReports.map((r) => r.uuid)).not.toContain(
      reportEntityDefinitionList.uuid,
    );
    expect(mapping.model?.availableReports.map((r) => r.uuid)).not.toContain(
      reportApplicationVersionDetails.uuid,
    );
  });
});
