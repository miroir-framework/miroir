/**
 * Opt-in live integration against the real Spotify Web API (D9).
 * Uses the OAuth2 Client Credentials flow: the endpoint exchanges the client id/secret for an
 * access token at accounts.spotify.com and caches it until expiry.
 * Skipped unless LIVE_SPOTIFY_CLIENT_ID and LIVE_SPOTIFY_CLIENT_SECRET are set.
 * Never part of nonreg / CI.
 *
 * Run:
 * ```bash
 * LIVE_SPOTIFY_CLIENT_ID=<id> LIVE_SPOTIFY_CLIENT_SECRET=<secret> \
 *   RUN_TEST=spotifyLive npm run testByFile -w miroir-standalone-app -- spotifyLive --profile emulatedServer-filesystem
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type {
  ApplicationDeploymentMap,
  Deployment,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
  clearSecrets,
  ConfigurationService,
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  DomainControllerInterface,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  registerSecrets,
  resetAndinitializeDeploymentCompositeAction,
  resetAndInitApplicationDeployment,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { deployment_Admin, deployment_Miroir } from "miroir-test-app_deployment-admin";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
import {
  defaultSpotifyAppModel,
  selfApplicationModelBranchSpotifyMasterBranch,
  selfApplicationSpotify,
  spotifyInitApplicationVersion,
  spotifyServiceEndpoint,
} from "miroir-test-app_deployment-spotify";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../../src/startup.js";
import { cleanLevel, packageName } from "../3_controllers/constants.js";
import { AppStackIntegrationTestSession } from "../helpers/IntegrationTestSession.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";

const LIVE_CLIENT_ID = process.env.LIVE_SPOTIFY_CLIENT_ID;
const LIVE_CLIENT_SECRET = process.env.LIVE_SPOTIFY_CLIENT_SECRET;
const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !!LIVE_CLIENT_ID &&
  !!LIVE_CLIENT_SECRET &&
  (!RUN_TEST || RUN_TEST === "spotifyLive" || RUN_TEST === "spotifyLive.integ.test");

/** Spotify editorial playlist — public, stable id for live smoke. */
const PUBLIC_PLAYLIST_ID = "37i9dQZF1DX0XUsuxWHRQd";

const SPOTIFY_DEPLOYMENT_UUID = "fd47d115-67e2-4870-8339-1c26665d1d15";
const SPOTIFY_APPLICATION_UUID = "00514586-bf72-4de3-beea-0a627c821404";
const SPOTIFY_ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

const env: any = process.env;
const { miroirConfig, logConfig: importedLoggerOptions } = await loadTestConfigFiles(env);
if (!miroirConfig) {
  throw new Error("miroirConfig is undefined");
}
if (!importedLoggerOptions) {
  throw new Error("importedLoggerOptions is undefined");
}
const loggerOptions: LoggerOptions = importedLoggerOptions;
const fileName = "spotifyLive.integ.test";

MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName),
).then((_logger: LoggerInterface) => {
  /* logger registered — do not log token or request headers */
});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);

const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Admin.uuid];

const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: adminDeploymentStorageConfiguration,
};

const spotifyDeploymentStorageConfiguration: StoreUnitConfiguration | undefined = miroirConfig.client
  .emulateServer
  ? miroirConfig.client.deploymentStorageConfig[SPOTIFY_DEPLOYMENT_UUID]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[SPOTIFY_DEPLOYMENT_UUID];

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  [selfApplicationSpotify.uuid]: SPOTIFY_DEPLOYMENT_UUID,
};

const spotifyTestbedInitParams = {
  dataStoreType: "app" as const,
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationSpotify,
  applicationModelBranch: selfApplicationModelBranchSpotifyMasterBranch as any,
  applicationVersion: spotifyInitApplicationVersion,
};

let domainController: DomainControllerInterface;

function boxedGetPlaylistQuery(playlistId: string) {
  return {
    actionType: "runBoxedQueryAction" as const,
    endpoint: QUERY_ENDPOINT,
    payload: {
      application: SPOTIFY_APPLICATION_UUID,
      applicationSection: "data" as const,
      queryExecutionStrategy: "storage" as const,
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer" as const,
        application: SPOTIFY_APPLICATION_UUID,
        extractors: {
          playlist: {
            extractorOrCombinerType: "extractorFromAction",
            endpointUuid: SPOTIFY_ENDPOINT_UUID,
            actionType: "get-playlist",
            parameterBindings: { playlist_id: playlistId },
          },
        },
      },
    },
  };
}

beforeAll(async () => {
  if (!miroirConfig.client.emulateServer) {
    throw new Error("spotifyLive requires emulateServer: true (in-process server path).");
  }
  if (!LIVE_CLIENT_ID || !LIVE_CLIENT_SECRET) {
    return;
  }

  registerSecrets({
    spotifyClientId: LIVE_CLIENT_ID,
    spotifyClientSecret: LIVE_CLIENT_SECRET,
  });

  const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client
    .emulateServer
    ? miroirConfig.client.deploymentStorageConfig[deployment_Library_DO_NO_USE.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Library_DO_NO_USE.uuid];

  const session = new AppStackIntegrationTestSession(miroirConfig, {
    applicationDeploymentMap,
    adminDeployment,
    libraryDeploymentStorageConfiguration,
    miroirActivityTracker,
    miroirEventService,
  });
  domainController = (await session.initSession()).domainController;

  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
  ]);

  expect(spotifyDeploymentStorageConfiguration, "Spotify deployment must be in test config").toBeDefined();

  const createSpotify = createDeploymentCompositeAction(
    "SpotifyLive",
    SPOTIFY_DEPLOYMENT_UUID,
    SPOTIFY_APPLICATION_UUID,
    adminDeployment,
    spotifyDeploymentStorageConfiguration as StoreUnitConfiguration,
  );
  const createResult = await domainController.handleCompositeAction(
    createSpotify,
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  if (createResult.status !== "ok") {
    const openResult = await domainController.handleAction(
      {
        actionType: "storeManagementAction_openStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        payload: {
          application: SPOTIFY_APPLICATION_UUID,
          deploymentUuid: SPOTIFY_DEPLOYMENT_UUID,
          configuration: {
            [SPOTIFY_DEPLOYMENT_UUID]: spotifyDeploymentStorageConfiguration,
          },
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expect(openResult instanceof Action2Error, `openStore failed: ${JSON.stringify(openResult)}`).toBe(
      false,
    );
  }

  const initResult = await domainController.handleCompositeAction(
    resetAndinitializeDeploymentCompositeAction(
      selfApplicationSpotify.uuid,
      SPOTIFY_DEPLOYMENT_UUID,
      spotifyTestbedInitParams,
      [],
      defaultSpotifyAppModel,
    ),
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  expect(initResult.status, JSON.stringify(initResult)).toBe("ok");

  expect(spotifyServiceEndpoint.definition.externalService?.baseUrl).toBe(
    "https://api.spotify.com/v1",
  );
}, 120000);

afterAll(() => {
  clearSecrets();
});

describe.skipIf(!shouldRun)("spotifyLive — real Spotify API (opt-in)", () => {
  it("extractorFromAction fetches a public playlist from api.spotify.com", async () => {
    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PUBLIC_PLAYLIST_ID) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (
      queryResult as {
        returnedDomainElement: {
          playlist: { id?: string; name?: string; tracks?: { total?: number } };
        };
      }
    ).returnedDomainElement.playlist;

    expect(typeof playlist.name).toBe("string");
    expect((playlist.name ?? "").length).toBeGreaterThan(0);
    expect(typeof playlist.tracks?.total).toBe("number");
    expect((playlist.tracks?.total ?? 0)).toBeGreaterThan(0);
  });
});
