import {
  getMiroirFundamentalSchemaForDeployment,
  type EndpointDefinition,
  type Entity,
  type EntityInstance,
  type Menu,
  type MetaModel,
  type MiroirModelEnvironment,
  type Report,
  type SelfApplication,
} from "miroir-core";

import entitySpotifyPlaylistJson from "../assets/spotify_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/56166585-b6fd-42c6-95d3-32a80c3304f7.json" with { type: "json" };
import reportSpotifyPlaylistJson from "../assets/spotify_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/10ce3252-7840-4041-a769-9a0e2d5ee10b.json" with { type: "json" };
import spotifyServiceEndpointJson from "../assets/spotify_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0e5cb172-12ea-4467-8598-5889338ae454.json" with { type: "json" };
import querySpotifyGetPlaylistJson from "../assets/spotify_model/e4320b9e-ab45-4abe-85d8-359604b3c62f/371aed0c-05bb-4b77-8cf1-2c82407555c1.json" with { type: "json" };
import selfApplicationSpotifyJson from "../assets/spotify_model/a659d350-dd97-4da9-91de-524fa01745dc/00514586-bf72-4de3-beea-0a627c821404.json" with { type: "json" };
import menuDefaultSpotifyJson from "../assets/spotify_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/1b4b181d-4616-4391-a41f-33bbee4fd356.json" with { type: "json" };
import selfApplicationModelBranchSpotifyMasterBranchJson from "../assets/spotify_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/cddedb5a-2789-45b2-be93-d6f52ae3f6eb.json" with { type: "json" };
import type { QueryWithExtractorCombinerTransformer } from "../../miroir-core/dist/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export const selfApplicationSpotify = selfApplicationSpotifyJson as SelfApplication;
export const selfApplicationModelBranchSpotifyMasterBranch =
  selfApplicationModelBranchSpotifyMasterBranchJson;
export const entitySpotifyPlaylist = entitySpotifyPlaylistJson as Entity;
export const reportSpotifyPlaylist = reportSpotifyPlaylistJson as Report;
export const querySpotifyGetPlaylist = querySpotifyGetPlaylistJson;
export const spotifyServiceEndpoint = spotifyServiceEndpointJson as EndpointDefinition;
export const menuDefaultSpotify = menuDefaultSpotifyJson as Menu;

/** Init-only ApplicationVersion for unversioned Spotify (not shipped as a model asset). */
export const spotifyInitApplicationVersion: EntityInstance = {
  uuid: "7e2c9a14-6b5f-4d83-a1e0-3c8f9b2d4e71",
  parentName: "ApplicationVersion",
  parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
  name: "Initial",
  previousVersion: "",
  modelStructureMigration: [],
  modelCUDMigration: [],
  selfApplication: selfApplicationSpotify.uuid,
  branch: selfApplicationModelBranchSpotifyMasterBranch.uuid,
  description: "Synthetic init-only ApplicationVersion for unversioned Spotify",
} as EntityInstance;

export const defaultSpotifyAppModel: MetaModel = {
  applicationUuid: selfApplicationSpotify.uuid,
  applicationName: selfApplicationSpotify.name,
  applications: [selfApplicationSpotify],
  entities: [entitySpotifyPlaylist],
  entityVersions: [],
  endpoints: [spotifyServiceEndpoint],
  menus: [menuDefaultSpotify],
  reports: [reportSpotifyPlaylist],
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
  storedQueries: [querySpotifyGetPlaylist as QueryWithExtractorCombinerTransformer],
  jzodSchemas: [],
  applicationVersions: [],
};

export function getDefaultSpotifyModelEnvironment(
  defaultMiroirMetaModelParam: MetaModel,
  spotifyDeploymentUuid: string,
): MiroirModelEnvironment {
  if (typeof spotifyDeploymentUuid !== "string" || spotifyDeploymentUuid.length === 0) {
    throw new Error(
      `getDefaultSpotifyModelEnvironment: spotifyDeploymentUuid must be a deployment uuid string, got ${typeof spotifyDeploymentUuid}`,
    );
  }

  return {
    miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(
      spotifyDeploymentUuid,
      defaultSpotifyAppModel,
    ),
    miroirMetaModel: defaultMiroirMetaModelParam,
    endpointsByUuid: defaultSpotifyAppModel.endpoints.reduce(
      (acc, endpoint) => {
        acc[endpoint.uuid] = endpoint;
        return acc;
      },
      {} as Record<string, EndpointDefinition>,
    ),
    deploymentUuid: spotifyDeploymentUuid,
    currentModel: defaultSpotifyAppModel,
  };
}
