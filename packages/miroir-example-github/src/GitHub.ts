import {
  getMiroirFundamentalSchemaForDeployment,
  type EndpointDefinition,
  type EntityInstance,
  type Menu,
  type MetaModel,
  type MiroirModelEnvironment,
  type Query,
  type Report,
  type SelfApplication,
} from "miroir-core";

import reportGitHubRepositoriesJson from "../assets/github_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/9bd8a57a-19e4-4911-b4ae-d1bbebbde338.json" with { type: "json" };
import queryGitHubListMyRepositoriesJson from "../assets/github_model/e4320b9e-ab45-4abe-85d8-359604b3c62f/ae2b3612-b960-43f1-9e7a-17ef61ef725b.json" with { type: "json" };
import githubServiceEndpointJson from "../assets/github_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0c642e2a-3922-4ce7-99a6-88f91f6a103f.json" with { type: "json" };
import selfApplicationGitHubJson from "../assets/github_model/a659d350-dd97-4da9-91de-524fa01745dc/6c4edcb2-e165-407a-b728-fbf8a18b6bf7.json" with { type: "json" };
import menuDefaultGitHubJson from "../assets/github_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/065c33ce-5590-41f6-af63-f0d57d2e49ae.json" with { type: "json" };
import selfApplicationModelBranchGitHubMasterBranchJson from "../assets/github_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/1625a4bc-bf32-40b3-b3ef-243a6a0dd637.json" with { type: "json" };

export const selfApplicationGitHub = selfApplicationGitHubJson as SelfApplication;
export const selfApplicationModelBranchGitHubMasterBranch =
  selfApplicationModelBranchGitHubMasterBranchJson;
export const menuDefaultGitHub = menuDefaultGitHubJson as Menu;
export const githubServiceEndpoint = githubServiceEndpointJson as EndpointDefinition;
export const reportGitHubRepositories = reportGitHubRepositoriesJson as Report;
export const queryGitHubListMyRepositories = queryGitHubListMyRepositoriesJson;

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
  endpoints: [githubServiceEndpoint],
  menus: [menuDefaultGitHub],
  reports: [reportGitHubRepositories],
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
  storedQueries: [queryGitHubListMyRepositories as Query],
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
