import type {
  InitApplicationParameters,
  SelfApplication,
} from "miroir-core";

import {
  appForTestInitialApplicationVersion,
  selfApplicationAppForTest,
  selfApplicationModelBranchAppForTestMasterBranch,
} from "miroir-test-app_deployment-appForTest";

import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

export const appForTestTestbedInitParams: InitApplicationParameters = {
  dataStoreType: "app",
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationAppForTest as SelfApplication,
  applicationModelBranch: selfApplicationModelBranchAppForTestMasterBranch,
  applicationVersion: appForTestInitialApplicationVersion,
};
