import type { Entity, EntityInstance, MetaModel, SelfApplication } from "miroir-core";

import entityPublisher from "../assets/appForTest_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json" with { type: "json" };
import entityCountry from "../assets/appForTest_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json" with { type: "json" };
import selfApplicationAppForTest from "../assets/appForTest_model/a659d350-dd97-4da9-91de-524fa01745dc/eef01001-0001-4000-8000-000000000001.json" with { type: "json" };
import selfApplicationModelBranchAppForTestMasterBranch from "../assets/appForTest_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/eef01001-0004-4000-8000-000000000004.json" with { type: "json" };
import appForTestInitialApplicationVersion from "../assets/appForTest_modelVersion/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/eef01001-0005-4000-8000-000000000005.json" with { type: "json" };

export { appForTestInitialApplicationVersion };

export const defaultAppForTestModel: MetaModel = {
  applicationUuid: selfApplicationAppForTest.uuid,
  applicationName: selfApplicationAppForTest.name,
  applications: [selfApplicationAppForTest as SelfApplication],
  entities: [entityPublisher as Entity, entityCountry as Entity],
  entityVersions: [],
  endpoints: [],
  menus: [],
  reports: [],
  runners: [],
  tests: [],
  themes: [],
  transformerDefinitions: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applicationVersionCrossRunnerVersion: [],
  runnerVersions: [],
  applicationVersionCrossThemeVersion: [],
  themeVersions: [],
  applicationVersionCrossTransformerDefinitionVersion: [],
  transformerDefinitionVersions: [],
  storedQueries: [],
  jzodSchemas: [],
  applicationVersions: [appForTestInitialApplicationVersion as EntityInstance],
};
