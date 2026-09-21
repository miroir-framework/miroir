/**
 * #281 Slice 1 tracer — typed playlist UI from Endpoint responseSchema, no Entity parentUuid.
 *
 * Vitest integ: MemoryRouter + ReportViewWithEditor + fake Spotify server are not MiroirTest-reachable.
 *
 * Run:
 * ```bash
 * RUN_TEST=apiCallReport.281.phase1 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase1 --profile emulatedServer-filesystem
 * ```
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React, { useEffect } from "react";
import { MemoryRouter, type Params } from "react-router-dom";
import * as RRDom from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  Deployment,
  EndpointDefinition,
  EntityInstance,
  MetaModel,
  Report,
  ReportSection,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
  allowInsecureBaseUrlsForTests,
  clearExternalServiceTokenCacheForTests,
  clearAllowedInsecureBaseUrlsForTests,
  clearSecrets,
  ConfigurationService,
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  DomainControllerInterface,
  getReportsAndEntitiesForDeploymentUuid,
  LoggerInterface,
  LoggerOptions,
  type MiroirConfigForClientStub,
  MiroirActivityTracker,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  registerSecrets,
  resetAndinitializeDeploymentCompositeAction,
  resetAndInitApplicationDeployment,
} from "miroir-core";
import { LocalCacheProvider, MiroirContextReactProvider, useMiroirContextService } from "miroir-react";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { deployment_Admin, deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  deployment_Library_DO_NO_USE,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel, defaultStoredMiroirTheme } from "miroir-test-app_deployment-miroir";
import {
  defaultSpotifyAppModel,
  deployment_Spotify_DO_NO_USE,
  entitySpotifyPlaylist,
  getDefaultSpotifyModelEnvironment,
  reportSpotifyPlaylist,
  selfApplicationModelBranchSpotifyMasterBranch,
  selfApplicationSpotify,
  spotifyInitApplicationVersion,
} from "miroir-test-app_deployment-spotify";

import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { ReportPageContextProvider } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportPageContext.js";
import { ReportViewWithEditor } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.js";
import { reportSectionsFormSchema } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportTools.js";
import { DocumentOutlineContextProvider } from "../../../../src/miroir-fwk/4_view/components/ValueObjectEditor/InstanceEditorOutlineContext.js";
import { MiroirThemeProvider } from "../../../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { miroirAppStartup } from "../../../../src/startup.js";
import { ReportUrlParamKeys } from "../../../../src/constants.js";
import { cleanLevel, packageName } from "../../../3_controllers/constants.js";
import { AppStackIntegrationTestSession } from "../../../helpers/IntegrationTestSession.js";
import { loadTestConfigFiles } from "../../../utils/fileTools.js";
import {
  startFakeExternalServiceServer,
  type FakeExternalServiceServer,
} from "../../../utils/fakeExternalServiceServer.js";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock("miroir-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-react")>();
  return {
    ...actual,
    JsonDisplayHelper: () => null,
  };
});

vi.mock("../../../../src/miroir-fwk/4_view/components/Reports/ModelDiagramReportSectionView.js", () => ({
  ModelDiagramReportSectionView: () => null,
}));

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "apiCallReport.281.phase1" ||
  RUN_TEST === "apiCallReport.281.phase1.integ.test";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures");
const PLAYLIST_OK = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "playlist-ok.json"), "utf8"),
) as {
  id: string;
  name: string;
  tracks: { total: number; items: { track: { name: string } }[] };
};

const PLAYLIST_NAME_LITERAL = "Rock Classics";
const FIRST_TRACK_NAME_LITERAL = "Born to Run";
const PLAYLIST_ID_OK = "test-playlist-001";
const TYPED_VALUE_OBJECT_EDITOR_TYPE_ERROR = /typeError:/;

const SPOTIFY_DEPLOYMENT_UUID = "fd47d115-67e2-4870-8339-1c26665d1d15";
const SPOTIFY_APPLICATION_UUID = "00514586-bf72-4de3-beea-0a627c821404";
const SPOTIFY_PLAYLIST_ENTITY_UUID = "56166585-b6fd-42c6-95d3-32a80c3304f7";
const SPOTIFY_ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";

const PHASE7_PLAYLIST = {
  ...PLAYLIST_OK,
  owner: { id: "spotify-user-001", display_name: "Fixture Owner" },
};

const env: any = process.env;
const { miroirConfig, logConfig: importedLoggerOptions } = await loadTestConfigFiles(env);
if (!miroirConfig) {
  throw new Error("miroirConfig is undefined");
}
if (!importedLoggerOptions) {
  throw new Error("importedLoggerOptions is undefined");
}
if (!miroirConfig.client.emulateServer) {
  throw new Error("apiCallReport.281.phase1 requires emulateServer: true (in-process server path).");
}
const emulatedClient: MiroirConfigForClientStub = miroirConfig.client;
const loggerOptions: LoggerOptions = importedLoggerOptions;
const fileName = "apiCallReport.281.phase1.integ.test";
const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
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

const spotifyDeploymentStorageConfiguration: StoreUnitConfiguration | undefined =
  emulatedClient.deploymentStorageConfig[SPOTIFY_DEPLOYMENT_UUID];

const adminDeploymentStorageConfiguration: StoreUnitConfiguration =
  emulatedClient.deploymentStorageConfig[deployment_Admin.uuid];

const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: adminDeploymentStorageConfiguration,
};

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  [selfApplicationSpotify.uuid]: deployment_Spotify_DO_NO_USE.uuid,
};

const defaultSpotifyModelEnvironment = getDefaultSpotifyModelEnvironment(
  defaultMiroirMetaModel,
  deployment_Spotify_DO_NO_USE.uuid,
);

const spotifyTestbedInitParams = {
  dataStoreType: "app" as const,
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationSpotify,
  applicationModelBranch: selfApplicationModelBranchSpotifyMasterBranch as any,
  applicationVersion: spotifyInitApplicationVersion,
};

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "Slice 1 tracer test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;
let fakeServer: FakeExternalServiceServer;

function resolveFilesystemDirectory(relativeDirectory: string): string {
  return join(emulatedClient.filesystemDeploymentRootDirectory, relativeDirectory);
}

/** In-test structural clone — do not use committed reportSpotifyPlaylist as the tracer report. */
function cloneApiCallPlaylistReport(): Report {
  const clone = structuredClone(reportSpotifyPlaylist) as Report;
  const section = clone.definition.section as {
    type: "list";
    definition: ReportSection[];
  };
  const inputSection = section.definition[0];
  clone.definition.section = {
    type: "list",
    definition: [
      inputSection,
      {
        type: "apiCallReportSection",
        definition: {
          label: "Playlist",
          fetchedDataReference: "playlist",
          endpointUuid: SPOTIFY_ENDPOINT_UUID,
          operationId: "get-playlist",
        },
      } as ReportSection,
    ],
  };
  delete clone.definition.runtimeTransformers;
  return clone;
}

async function overrideEndpointBaseUrl(baseUrl: string): Promise<void> {
  const endpoint = defaultSpotifyAppModel.endpoints.find((e) => e.uuid === SPOTIFY_ENDPOINT_UUID);
  expect(endpoint, "SpotifyService endpoint must be in defaultSpotifyAppModel").toBeDefined();
  const existing = (endpoint as EndpointDefinition).definition as {
    externalService: Record<string, unknown>;
  };
  const securityScheme = existing.externalService.securityScheme as Record<string, unknown> | undefined;
  const updated = {
    ...endpoint,
    definition: {
      externalService: {
        ...existing.externalService,
        baseUrl,
        ...(securityScheme?.type === "oauth2ClientCredentials" ||
        securityScheme?.type === "oauth2AuthorizationCode"
          ? { securityScheme: { ...securityScheme, tokenUrl: `${baseUrl}/api/token` } }
          : {}),
      },
    },
  } as EntityInstance;

  const updateResult = await domainController.handleAction(
    {
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: selfApplicationSpotify.uuid,
        applicationSection: "model",
        objects: [updated],
      },
    },
    applicationDeploymentMap,
    defaultSpotifyModelEnvironment,
  );
  expect(updateResult instanceof Action2Error, `updateInstance failed: ${JSON.stringify(updateResult)}`).toBe(
    false,
  );

  const commitResult = await domainController.handleAction(
    {
      actionType: "commit",
      endpoint: MODEL_ENDPOINT,
      payload: { application: selfApplicationSpotify.uuid },
    },
    applicationDeploymentMap,
    defaultSpotifyModelEnvironment,
  );
  expect(commitResult instanceof Action2Error, `commit failed: ${JSON.stringify(commitResult)}`).toBe(
    false,
  );
}

/** RootComponent normally seeds this mapping; ReportViewWithEditor tests must do the same. */
function SeedSpotifyDeploymentMapping({ children }: { children: React.ReactNode }) {
  const { setDeploymentUuidToReportsEntitiesMapping } = useMiroirContextService();
  useEffect(() => {
    setDeploymentUuidToReportsEntitiesMapping((previous) => ({
      ...previous,
      [deployment_Spotify_DO_NO_USE.uuid]: getReportsAndEntitiesForDeploymentUuid(
        selfApplicationSpotify.uuid,
        defaultMiroirMetaModel,
        defaultSpotifyAppModel,
      ),
    }));
  }, [setDeploymentUuidToReportsEntitiesMapping]);
  return <>{children}</>;
}

function playlistPageParams(reportUuid: string, playlistId?: string): Params<ReportUrlParamKeys> {
  return {
    application: selfApplicationSpotify.uuid,
    deploymentUuid: deployment_Spotify_DO_NO_USE.uuid,
    applicationSection: "data",
    reportUuid,
    instanceUuid: "",
    ...(playlistId !== undefined ? { playlistId } : {}),
  };
}

function renderApiCallPlaylistReport(reportDefinition: Report, playlistId?: string) {
  const pageParams = playlistPageParams(reportDefinition.uuid, playlistId);
  vi.spyOn(RRDom, "useParams").mockReturnValue(pageParams);
  const search = new URLSearchParams({
    page: "report",
    application: pageParams.application,
    deploymentUuid: pageParams.deploymentUuid,
    applicationSection: pageParams.applicationSection,
    reportUuid: pageParams.reportUuid,
    ...(playlistId !== undefined ? { playlistId } : {}),
  }).toString();

  const reportTree = (
    <DocumentOutlineContextProvider
      isOutlineOpen={false}
      onToggleOutline={() => {}}
      onNavigateToPath={() => {}}
    >
      <ReportPageContextProvider>
        <ReportViewWithEditor
          applicationSection="data"
          application={selfApplicationSpotify.uuid}
          applicationDeploymentMap={applicationDeploymentMap}
          deploymentUuid={deployment_Spotify_DO_NO_USE.uuid}
          pageParams={pageParams}
          reportDefinition={reportDefinition}
        />
      </ReportPageContextProvider>
    </DocumentOutlineContextProvider>
  );

  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={[`/?${search}`]}
    >
      <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
        <LocalCacheProvider store={domainController.getLocalCache().getInnerStore()}>
          <MiroirContextReactProvider
            miroirContext={miroirContext}
            domainController={domainController}
            testingApplication={selfApplicationSpotify.uuid}
            testingDeploymentUuid={deployment_Spotify_DO_NO_USE.uuid}
          >
            <SeedSpotifyDeploymentMapping>{reportTree}</SeedSpotifyDeploymentMapping>
          </MiroirContextReactProvider>
        </LocalCacheProvider>
      </MiroirThemeProvider>
    </MemoryRouter>,
  );
}

function trackNameIsVisible(): boolean {
  return Boolean(
    screen.queryByDisplayValue(FIRST_TRACK_NAME_LITERAL) ||
      screen.queryAllByText(FIRST_TRACK_NAME_LITERAL, { exact: false }).length > 0,
  );
}

function playlistIsDumpedAsPre(): boolean {
  return Array.from(document.querySelectorAll("pre")).some((el) => {
    const text = el.textContent ?? "";
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" && parsed.name === PLAYLIST_NAME_LITERAL;
    } catch {
      return text.includes(`"name"`) && text.includes(PLAYLIST_NAME_LITERAL) && text.trim().startsWith("{");
    }
  });
}

beforeAll(async () => {
  fakeServer = await startFakeExternalServiceServer({
    [`GET /playlists/${PLAYLIST_ID_OK}`]: { body: PHASE7_PLAYLIST },
  });
  registerSecrets({
    spotifyClientId: "test-client-id",
    spotifyClientSecret: "test-client-secret",
    spotifyRefreshToken: "test-refresh-token",
  });
  allowInsecureBaseUrlsForTests([fakeServer.baseUrl]);

  miroirContext = new MiroirContext(miroirActivityTracker, miroirEventService, miroirConfig);

  const libraryDeploymentStorageConfiguration: StoreUnitConfiguration =
    emulatedClient.deploymentStorageConfig[deployment_Library_DO_NO_USE.uuid];

  const session = new AppStackIntegrationTestSession(miroirConfig, {
    applicationDeploymentMap,
    adminDeployment,
    libraryDeploymentStorageConfiguration,
    miroirActivityTracker,
    miroirEventService,
  });
  const executionEnvironment = await session.initSession();
  domainController = executionEnvironment.domainController;

  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
  ]);

  expect(
    spotifyDeploymentStorageConfiguration,
    "Spotify deployment must be registered in the test profile config",
  ).toBeDefined();

  const createSpotify = createDeploymentCompositeAction(
    "Spotify",
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
    myConsoleLog("createDeploymentCompositeAction (may already exist)", JSON.stringify(createResult));
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

  myConsoleLog("session ready", defaultSpotifyAppModel.entities?.length ?? 0);
}, 60000);

beforeEach(async () => {
  fakeServer.receivedRequests.length = 0;
  clearExternalServiceTokenCacheForTests();
  fakeServer.setFixture("GET", `/playlists/${PLAYLIST_ID_OK}`, { body: PHASE7_PLAYLIST });
  fakeServer.setFixture("POST", "/api/token", {
    body: { access_token: "test-access-token", token_type: "Bearer", expires_in: 3600 },
  });

  const initResult = await domainController.handleCompositeAction(
    resetAndinitializeDeploymentCompositeAction(
      selfApplicationSpotify.uuid,
      deployment_Spotify_DO_NO_USE.uuid,
      spotifyTestbedInitParams,
      [],
      defaultSpotifyAppModel,
    ),
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  expect(initResult.status, `spotify seed failed: ${JSON.stringify(initResult)}`).toBe("ok");

  await overrideEndpointBaseUrl(fakeServer.baseUrl);
}, 60000);

afterEach(() => {
  cleanup();
});

afterAll(async () => {
  clearSecrets();
  clearAllowedInsecureBaseUrlsForTests();
  clearExternalServiceTokenCacheForTests();
  if (fakeServer) {
    await fakeServer.close();
  }
});

describe.skipIf(!shouldRun).sequential("apiCallReport #281 phase1 — typed playlist without parentUuid", () => {
  it("SpotifyPlaylist Entity may exist in the model but has no filesystem instance cache", () => {
    const model = domainController.currentModelEnvironment(
      selfApplicationSpotify.uuid,
      applicationDeploymentMap,
    ).currentModel;
    const playlistEntity = model.entities.find((entity) => entity.uuid === SPOTIFY_PLAYLIST_ENTITY_UUID);
    expect(playlistEntity, "SpotifyPlaylist must be present in the booted model").toBeDefined();
    expect(playlistEntity?.name).toBe("SpotifyPlaylist");
    expect(entitySpotifyPlaylist.externalDataSource?.kind).toBe("http");

    const spotifyEndpoint = model.endpoints.find((endpoint) => endpoint.uuid === SPOTIFY_ENDPOINT_UUID);
    expect(spotifyEndpoint, "SpotifyService endpoint must land in the booted model").toBeDefined();

    const dataConfig = spotifyDeploymentStorageConfiguration?.data as
      | { directory?: string }
      | undefined;
    expect(dataConfig?.directory, "filesystem data directory").toBeDefined();
    const runtimePlaylistDir = resolveFilesystemDirectory(
      join(dataConfig?.directory as string, SPOTIFY_PLAYLIST_ENTITY_UUID),
    );
    expect(existsSync(runtimePlaylistDir), runtimePlaylistDir).toBe(false);

    const packagePlaylistDir = resolveFilesystemDirectory(
      join(
        "miroir-test-app_deployment-spotify/assets/spotify_data",
        SPOTIFY_PLAYLIST_ENTITY_UUID,
      ),
    );
    expect(existsSync(packagePlaylistDir), packagePlaylistDir).toBe(false);
  });

  it("cloned apiCall report renders playlist name and nested track as typed fields, not a JSON dump", async () => {
    expect(PLAYLIST_OK.name).toBe(PLAYLIST_NAME_LITERAL);
    expect(PLAYLIST_OK.tracks.items[0]?.track.name).toBe(FIRST_TRACK_NAME_LITERAL);

    const clone = cloneApiCallPlaylistReport();
    renderApiCallPlaylistReport(clone, PLAYLIST_ID_OK);

    await waitFor(
      () => {
        expect(screen.queryByText(TYPED_VALUE_OBJECT_EDITOR_TYPE_ERROR)).toBeNull();
        expect(
          screen.queryByDisplayValue(PLAYLIST_NAME_LITERAL) ||
            screen.queryAllByText(PLAYLIST_NAME_LITERAL, { exact: false }).length > 0,
          `expected playlist name ${PLAYLIST_NAME_LITERAL} in typed UI (display value or text)`,
        ).toBeTruthy();
      },
      { timeout: 15000 },
    );

    expect(screen.queryByText(/report target entity not found/i)).toBeNull();
    expect(
      screen.queryByDisplayValue(FIRST_TRACK_NAME_LITERAL) ||
        screen.queryAllByText(FIRST_TRACK_NAME_LITERAL, { exact: false }).length > 0,
      `expected nested track name ${FIRST_TRACK_NAME_LITERAL} as object/array fields`,
    ).toBeTruthy();
    expect(
      playlistIsDumpedAsPre(),
      "playlist must not be shown only as a <pre> JSON dump",
    ).toBe(false);
  });

  it("reportSectionsFormSchema does not throw for apiCallReportSection", () => {
    const clone = cloneApiCallPlaylistReport();
    const listSection = clone.definition.section as { type: "list"; definition: ReportSection[] };
    expect(listSection.definition.map((entry) => entry.type)).toEqual([
      "inputReportSection",
      "apiCallReportSection",
    ]);
    const apiCallSection = listSection.definition[1];

    expect(() =>
      reportSectionsFormSchema(
        apiCallSection,
        selfApplicationSpotify.uuid,
        deployment_Spotify_DO_NO_USE.uuid,
        {},
        {
          applicationUuid: selfApplicationSpotify.uuid,
          entities: [],
        } as unknown as MetaModel,
        {},
        ["definition", "section", "definition", 1],
      ),
    ).not.toThrow();
  });
});
