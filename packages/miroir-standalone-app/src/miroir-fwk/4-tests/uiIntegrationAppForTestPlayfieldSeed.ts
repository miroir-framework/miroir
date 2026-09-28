import type {
  InitApplicationParameters,
  SelfApplication,
} from "miroir-core";

import {
  appForTestInitialApplicationVersion,
  selfApplicationAppForTest,
  selfApplicationModelBranchAppForTestMasterBranch,
} from "miroir-fixture-appForTest";

import { defaultMiroirMetaModel } from "miroir-app-miroir";

export const appForTestTestbedInitParams: InitApplicationParameters = {
  dataStoreType: "app",
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationAppForTest as SelfApplication,
  applicationModelBranch: selfApplicationModelBranchAppForTestMasterBranch,
  applicationVersion: appForTestInitialApplicationVersion,
};
