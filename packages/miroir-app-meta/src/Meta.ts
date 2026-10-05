import {
  getMiroirFundamentalSchemaForDeployment,
  type EntityInstance,
  type Menu,
  type MetaModel,
  type MiroirModelEnvironment,
  type SelfApplication,
} from "miroir-core";

import selfApplicationMetaJson from "../assets/meta_model/a659d350-dd97-4da9-91de-524fa01745dc/9ff432a9-89a1-460b-a263-1672d084a9e0.json" with { type: "json" };
import menuDefaultMetaJson from "../assets/meta_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/c95bfb70-62bd-4f40-ac2b-04857124f133.json" with { type: "json" };
import selfApplicationModelBranchMetaMasterBranchJson from "../assets/meta_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/4408382d-daee-41d0-a53d-80a44c0f79e6.json" with { type: "json" };

export const selfApplicationMeta = selfApplicationMetaJson as SelfApplication;
export const selfApplicationModelBranchMetaMasterBranch = selfApplicationModelBranchMetaMasterBranchJson;
export const menuDefaultMeta = menuDefaultMetaJson as Menu;

/** Init-only ApplicationVersion for unversioned Meta (not shipped as a model asset). */
export const metaInitApplicationVersion: EntityInstance = {
  uuid: "a43fee5b-3430-4540-85c6-70131104727b",
  parentName: "ApplicationVersion",
  parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
  name: "Initial",
  previousVersion: "",
  modelStructureMigration: [],
  modelCUDMigration: [],
  selfApplication: selfApplicationMeta.uuid,
  branch: selfApplicationModelBranchMetaMasterBranch.uuid,
  description: "Synthetic init-only ApplicationVersion for unversioned Meta",
} as EntityInstance;

export const defaultMetaAppModel: MetaModel = {
  applicationUuid: selfApplicationMeta.uuid,
  applicationName: selfApplicationMeta.name,
  applications: [selfApplicationMeta],
  entities: [],
  entityVersions: [],
  endpoints: [],
  menus: [menuDefaultMeta],
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
  mlSchemas: [],
  applicationVersions: [],
};

export function getDefaultMetaModelEnvironment(
  defaultMiroirMetaModelParam: MetaModel,
  metaDeploymentUuid: string,
): MiroirModelEnvironment {
  if (typeof metaDeploymentUuid !== "string" || metaDeploymentUuid.length === 0) {
    throw new Error(
      `getDefaultMetaModelEnvironment: metaDeploymentUuid must be a deployment uuid string, got ${typeof metaDeploymentUuid}`,
    );
  }

  return {
    miroirFundamentalMlSchema: getMiroirFundamentalSchemaForDeployment(metaDeploymentUuid, defaultMetaAppModel),
    miroirMetaModel: defaultMiroirMetaModelParam,
    endpointsByUuid: {},
    deploymentUuid: metaDeploymentUuid,
    currentModel: defaultMetaAppModel,
  };
}
