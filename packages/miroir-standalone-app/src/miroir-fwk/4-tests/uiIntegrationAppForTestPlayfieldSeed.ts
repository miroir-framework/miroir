import type {
  InitApplicationParameters,
  SelfApplication,
} from "@miroir-framework/core";

import {
  appForTestInitialApplicationVersion,
  selfApplicationAppForTest,
  selfApplicationModelBranchAppForTestMasterBranch,
} from "miroir-fixture-appForTest";

import { defaultMiroirMetaModel } from "@miroir-framework/core/meta-model";

export const appForTestTestbedInitParams: InitApplicationParameters = {
  dataStoreType: "app",
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationAppForTest as SelfApplication,
  applicationModelBranch: selfApplicationModelBranchAppForTestMasterBranch,
  applicationVersion: appForTestInitialApplicationVersion,
};
