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