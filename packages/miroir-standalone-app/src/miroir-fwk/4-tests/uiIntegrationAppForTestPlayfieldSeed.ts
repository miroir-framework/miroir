import type {
  ApplicationEntitiesAndInstances,
  ApplicationVersion,
  Entity,
  EntityInstance,
  InitApplicationParameters,
  MetaModel,
  SelfApplication,
} from "miroir-core";

import {
  Country1,
  Country2,
  Country3,
  appForTestInitialApplicationVersion,
  defaultAppForTestModel,
  entityCountry,
  entityPublisher,
  folio as publisher1,
  penguin as publisher2,
  selfApplicationAppForTest,
  selfApplicationModelBranchAppForTestMasterBranch,
  springer as publisher3,
} from "miroir-test-app_deployment-appForTest";

import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

export const appForTestTestbedInitParams: InitApplicationParameters = {
  dataStoreType: "app",
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationAppForTest as SelfApplication,
  applicationModelBranch: selfApplicationModelBranchAppForTestMasterBranch,
  applicationVersion: appForTestInitialApplicationVersion,
};

export const appForTestEntitiesAndInstancesPublisherAndCountry: ApplicationEntitiesAndInstances = [
  {
    entity: entityPublisher as Entity,
    instances: [
      publisher1 as EntityInstance,
      publisher2 as EntityInstance,
      publisher3 as EntityInstance,
    ],
  },
  {
    entity: entityCountry as Entity,
    instances: [
      Country1 as EntityInstance,
      Country2 as EntityInstance,
      Country3 as EntityInstance,
    ],
  },
];

export const appForTestPublisherAndCountryMetaModel: MetaModel = {
  applicationUuid: selfApplicationAppForTest.uuid,
  applicationName: selfApplicationAppForTest.name,
  entities: [entityPublisher as Entity, entityCountry as Entity],
  entityVersions: [],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  runners: [],
  themes: [],
  transformerDefinitions: [],
  applicationVersions: [appForTestInitialApplicationVersion as ApplicationVersion],
  reports: [],
  storedQueries: [],
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
  applications: [selfApplicationAppForTest as SelfApplication],
  tests: [],
};
