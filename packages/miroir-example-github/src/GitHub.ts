import {
  getMiroirFundamentalSchemaForDeployment,
  type EndpointDefinition,
  type EntityInstance,
  type Menu,
  type MetaModel,
  type MiroirModelEnvironment,
  type SelfApplication,
} from "miroir-core";

import selfApplicationGitHubJson from "../assets/github_model/a659d350-dd97-4da9-91de-524fa01745dc/6c4edcb2-e165-407a-b728-fbf8a18b6bf7.json" with { type: "json" };
import menuDefaultGitHubJson from "../assets/github_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/065c33ce-5590-41f6-af63-f0d57d2e49ae.json" with { type: "json" };
import selfApplicationModelBranchGitHubMasterBranchJson from "../assets/github_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/1625a4bc-bf32-40b3-b3ef-243a6a0dd637.json" with { type: "json" };

export const selfApplicationGitHub = selfApplicationGitHubJson as SelfApplication;
export const selfApplicationModelBranchGitHubMasterBranch =
  selfApplicationModelBranchGitHubMasterBranchJson;
export const menuDefaultGitHub = menuDefaultGitHubJson as Menu;

/** Init-only ApplicationVersion for unversioned GitHub (not shipped as a model asset). */
export const githubInitApplicationVersion: EntityInstance = {
  uuid: "038d25c5-e43e-4d1b-8df2-41a809de7fe1",
  parentName: "ApplicationVersion",
  parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
  name: "Initial",
  previousVersion: "",
  modelStructureMigration: [],
  modelCUDMigration: [],
  selfApplication: selfApplicationGitHub.uuid,
  branch: selfApplicationModelBranchGitHubMasterBranch.uuid,
  description: "Synthetic init-only ApplicationVersion for unversioned GitHub",
} as EntityInstance;

export const defaultGitHubAppModel: MetaModel = {
  applicationUuid: selfApplicationGitHub.uuid,
  applicationName: selfApplicationGitHub.name,
  applications: [selfApplicationGitHub],
  entities: [],
  entityVersions: [],
  endpoints: [],
  menus: [menuDefaultGitHub],
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

export function getDefaultGitHubModelEnvironment(
  defaultMiroirMetaModelParam: MetaModel,
  githubDeploymentUuid: string,
): MiroirModelEnvironment {
  if (typeof githubDeploymentUuid !== "string" || githubDeploymentUuid.length === 0) {
    throw new Error(
      `getDefaultGitHubModelEnvironment: githubDeploymentUuid must be a deployment uuid string, got ${typeof githubDeploymentUuid}`,
    );
  }

  return {
    miroirFundamentalMlSchema: getMiroirFundamentalSchemaForDeployment(
      githubDeploymentUuid,
      defaultGitHubAppModel,
    ),
    miroirMetaModel: defaultMiroirMetaModelParam,
    endpointsByUuid: defaultGitHubAppModel.endpoints.reduce(
      (acc, endpoint) => {
        acc[endpoint.uuid] = endpoint;
        return acc;
      },
      {} as Record<string, EndpointDefinition>,
    ),
    deploymentUuid: githubDeploymentUuid,
    currentModel: defaultGitHubAppModel,
  };
}
