/**
 * #647: the devData Reports are Miroir's, listed under the devData section of every
 * application (D16), and opened from the "Dev data" group of the Miroir menu.
 *
 * A vitest case and not a MiroirTest `functionCallTest`: `getReportsAndEntitiesForDeploymentUuid`
 * takes two whole MetaModels, which a MiroirTest JSON fixture would have to copy.
 */
import { describe, expect, it } from "vitest";

import { defaultMiroirMetaModel, menuDefaultMiroir, selfApplicationMiroir } from "miroir-app-miroir";
import { defaultLibraryAppModel, selfApplicationLibrary } from "miroir-example-library";

import type { MetaModel, Report } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { getReportsAndEntitiesForDeploymentUuid, metaModelDevDataReports } from "../../src/1_core/Model";

const DEV_DATA_REPORTS = [
  "e8c6faa5-a117-4afd-b7ae-4a40c6111f95", // BundleSizeHistory
  "85077493-0fea-4969-96c8-b994272de284", // BundleSizeMeasurementDetails
  "02dd2ead-7b8d-4160-99c9-9f4e9a1c051b", // PageLoadHistory
  "193c3dea-792d-471a-88a0-546e4b5e81cf", // PageLoadMeasurementDetails
  "7a695632-338e-4c33-8b39-dba7f6d4c988", // AgentRunHistory
  "49a3c09a-c7cd-4438-9730-c691c70741af", // AgentRunMeasurementDetails
];
const DEV_DATA_ENTITIES = [
  "90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b", // BundleSizeMeasurement
  "0266c0b8-4dc8-4a14-bcef-239a85a5de2d", // PageLoadMeasurement
  "954de789-6350-4f54-a809-5f2b8b91d067", // AgentRunMeasurement
];

const metaModel = defaultMiroirMetaModel as unknown as MetaModel;
const reportUuids = (reports: Report[] | undefined) => (reports ?? []).map((report) => report.uuid).sort();

describe("devData Reports per section (#647 D16)", () => {
  it("lists the 6 Reports in Miroir's meta-model", () => {
    expect([...metaModelDevDataReports].sort()).toEqual([...DEV_DATA_REPORTS].sort());
    expect(reportUuids(metaModel.reports)).toEqual(expect.arrayContaining(DEV_DATA_REPORTS));
  });

  it("gives another application a devData section with the 6 Reports and the 3 Entities", () => {
    const sections = getReportsAndEntitiesForDeploymentUuid(
      selfApplicationLibrary.uuid,
      metaModel,
      defaultLibraryAppModel as unknown as MetaModel,
    );
    expect(reportUuids(sections.devData?.availableReports)).toEqual([...DEV_DATA_REPORTS].sort());
    expect(sections.devData?.entities.map((entity) => entity.uuid)).toEqual(expect.arrayContaining(DEV_DATA_ENTITIES));
  });

  it("lists them under Miroir's devData section, not its data section", () => {
    const sections = getReportsAndEntitiesForDeploymentUuid(selfApplicationMiroir.uuid, metaModel, metaModel);
    expect(reportUuids(sections.devData?.availableReports)).toEqual([...DEV_DATA_REPORTS].sort());
    expect(reportUuids(sections.data.availableReports)).not.toEqual(expect.arrayContaining([DEV_DATA_REPORTS[0]]));
  });
});

describe("Dev data menu group (#647)", () => {
  it("opens the 3 history Reports on Miroir's devData section", () => {
    const groups = (menuDefaultMiroir as any).definition.definition as { title: string; items: any[] }[];
    const devData = groups.find((group) => group.title === "Dev data");
    expect(devData, "the Dev data group").toBeDefined();
    expect(
      devData!.items.map((item) => [item.section, item.selfApplication, item.reportUuid]),
    ).toEqual([
      ["devData", selfApplicationMiroir.uuid, "e8c6faa5-a117-4afd-b7ae-4a40c6111f95"],
      ["devData", selfApplicationMiroir.uuid, "02dd2ead-7b8d-4160-99c9-9f4e9a1c051b"],
      ["devData", selfApplicationMiroir.uuid, "7a695632-338e-4c33-8b39-dba7f6d4c988"],
    ]);
  });
});
