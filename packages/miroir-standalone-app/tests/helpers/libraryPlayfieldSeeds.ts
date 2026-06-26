import type { InitApplicationParameters, SelfApplication } from "miroir-core";
import { defaultMiroirMetaModel } from "miroir-core";
import {
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-test-app_deployment-library";

export const libraryPlayfieldSeedInitParams: InitApplicationParameters = {
  dataStoreType: "app",
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationLibrary as SelfApplication,
  applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
  applicationVersion: selfApplicationVersionLibraryInitialVersion,
};
