/**
 * Spotify example app — Spotify example app package (D7, D3 assets, D10).
 *
 * Vitest integ: full deployment boot + report rendering are not MiroirTest-reachable.
 * Follows the Slice 5 report-path pattern (MemoryRouter + ReportViewWithEditor).
 * Fake server is the sanctioned HTTP fake; package assets keep production baseUrl.
 *
 * Run:
 * ```bash
 * RUN_TEST=spotifyApp npm run testByFile -w miroir-standalone-app -- spotifyApp --profile emulatedServer-filesystem
 * ```
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  JzodObject,
  Report,
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
  jzodTypeCheck,
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

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { ReportPageContextProvider } from "../../src/miroir-fwk/4_view/components/Reports/ReportPageContext.js";
import { ReportViewWithEditor } from "../../src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.js";
import { DocumentOutlineContextProvider } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/InstanceEditorOutlineContext.js";
import { MiroirThemeProvider } from "../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { miroirAppStartup } from "../../src/startup.js";
import { ReportUrlParamKeys } from "../../src/constants.js";
import { cleanLevel, packageName } from "../3_controllers/constants.js";
import { AppStackIntegrationTestSession } from "../helpers/IntegrationTestSession.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";
import {
  startFakeExternalServiceServer,
  type FakeExternalServiceServer,
} from "../utils/fakeExternalServiceServer.js";

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

vi.mock("../../src/miroir-fwk/4_view/components/Reports/ModelDiagramReportSectionView.js", () => ({
  ModelDiagramReportSectionView: () => null,
}));

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "spotifyApp" ||
  RUN_TEST === "spotifyApp.integ.test";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const PLAYLIST_OK = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "playlist-ok.json"), "utf8"),
) as {
  id: string;
  name: string;
  tracks: { total: number; items: { track: { name: string } }[] };
};

const PLAYLIST_NAME_LITERAL = "Rock Classics";
const FIRST_TRACK_NAME_LITERAL = "Born to Run";
const OWNER_DISPLAY_NAME_LITERAL = "Fixture Owner";
const TRACKS_TOTAL_LITERAL = 17;
const PLAYLIST_ID_OK = "test-playlist-001";
const PLAYLIST_ID_NEWSHAPE = "test-playlist-newshape";
const PLAYLIST_ID_METADATA_ONLY = "test-playlist-metadata-only";

/** Spotify Feb-2026 shape: `tracks` renamed to `items`, entries wrap `item` (not `track`). */
const PLAYLIST_NEW_SHAPE = {
  id: PLAYLIST_ID_NEWSHAPE,
  name: "New Shape Mix",
  owner: { id: "newshape-owner", display_name: "New Shape Owner" },
  images: [],
  items: {
    total: 2,
    items: [
      {
        item: {
          id: "newtrack-1",
          name: "Fresh Track One",
          artists: [{ id: "artist-1", name: "Fresh Artist" }],
          duration_ms: 123000,
        },
      },
      {
        item: {
          id: "newtrack-2",
          name: "Fresh Track Two",
          artists: [],
          duration_ms: 234000,
        },
      },
    ],
  },
};
const NEW_SHAPE_FIRST_TRACK_LITERAL = "Fresh Track One";

/** Client-credentials / non-owned playlists: Spotify returns metadata only (no tracks/items). */
const PLAYLIST_METADATA_ONLY = {
  id: PLAYLIST_ID_METADATA_ONLY,
  name: "Metadata Only Playlist",
  owner: { id: "metadata-owner", display_name: "Metadata Owner" },
  images: [],
};
const METADATA_ONLY_NAME_LITERAL = "Metadata Only Playlist";

const SPOTIFY_DEPLOYMENT_UUID = "fd47d115-67e2-4870-8339-1c26665d1d15";
const SPOTIFY_APPLICATION_UUID = "00514586-bf72-4de3-beea-0a627c821404";
const SPOTIFY_PLAYLIST_ENTITY_UUID = "56166585-b6fd-42c6-95d3-32a80c3304f7";
const SPOTIFY_ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454";
const SPOTIFY_REPORT_UUID = "10ce3252-7840-4041-a769-9a0e2d5ee10b";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";

/** TypedValueObjectEditor dumps this prefix in a plain <span> when jzodTypeCheck fails (no testid). */
const TYPED_VALUE_OBJECT_EDITOR_TYPE_ERROR = /typeError:/;
/** Innermost jzodTypeCheck error for an unknown object key (stringified into CodeBlock_ReadOnly). */
const JZOD_UNKNOWN_ATTRIBUTE_ERROR = /not found in schema definition/;

function tracksOnlySpotifyPlaylistMlSchema(liveSchema: JzodObject): JzodObject {
  const { items: _omittedNewShapeItems, ...definitionWithoutItems } = liveSchema.definition;
  return { type: "object", definition: definitionWithoutItems };
}

const PHASE7_PLAYLIST = {
  ...PLAYLIST_OK,
  owner: { id: "spotify-user-001", display_name: OWNER_DISPLAY_NAME_LITERAL },
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
  throw new Error("spotifyApp requires emulateServer: true (in-process server path).");
}
const emulatedClient: MiroirConfigForClientStub = miroirConfig.client;
const loggerOptions: LoggerOptions = importedLoggerOptions;
const fileName = "spotifyApp.integ.test";
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
    description: "Slice 7 test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;
let fakeServer: FakeExternalServiceServer;

function resolveFilesystemDirectory(relativeDirectory: string): string {
  return join(emulatedClient.filesystemDeploymentRootDirectory, relativeDirectory);
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
        // Point the OAuth2 token exchange at the fake server too (production: accounts.spotify.com).
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

function renderSpotifyReport(
  reportDefinition: Report,
  playlistId?: string,
  options?: { seedEntityMapping?: boolean },
) {
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
            {options?.seedEntityMapping ? (
              <SeedSpotifyDeploymentMapping>{reportTree}</SeedSpotifyDeploymentMapping>
            ) : (
              reportTree
            )}
          </MiroirContextReactProvider>
        </LocalCacheProvider>
      </MiroirThemeProvider>
    </MemoryRouter>,
  );
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
  fakeServer.setFixture("GET", `/playlists/${PLAYLIST_ID_NEWSHAPE}`, { body: PLAYLIST_NEW_SHAPE });
  fakeServer.setFixture("GET", `/playlists/${PLAYLIST_ID_METADATA_ONLY}`, { body: PLAYLIST_METADATA_ONLY });
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

describe.skipIf(!shouldRun).sequential("spotifyApp — Spotify deployment boot + report", () => {
  it("registers the Spotify deployment in admin assets, test config, and the testbed map", () => {
    expect(deployment_Spotify_DO_NO_USE.uuid).toBe(SPOTIFY_DEPLOYMENT_UUID);
    expect(deployment_Spotify_DO_NO_USE.uuid).toBe(SPOTIFY_DEPLOYMENT_UUID);
    expect(selfApplicationSpotify.uuid).toBe(SPOTIFY_APPLICATION_UUID);
    expect(applicationDeploymentMap[SPOTIFY_APPLICATION_UUID]).toBe(SPOTIFY_DEPLOYMENT_UUID);
    expect(emulatedClient.deploymentStorageConfig[SPOTIFY_DEPLOYMENT_UUID]).toBeDefined();

    const adminDeploymentPath = join(
      resolveFilesystemDirectory("miroir-standalone-app/tests/assets/admin_data"),
      "7959d814-400c-4e80-988f-a00fe582ab98",
      `${SPOTIFY_DEPLOYMENT_UUID}.json`,
    );
    expect(existsSync(adminDeploymentPath), adminDeploymentPath).toBe(true);
    expect(JSON.parse(readFileSync(adminDeploymentPath, "utf8")).uuid).toBe(SPOTIFY_DEPLOYMENT_UUID);
  });

  it("boots with SpotifyPlaylist in the model and creates no storage space for the HTTP entity", () => {
    const model = domainController.currentModelEnvironment(
      selfApplicationSpotify.uuid,
      applicationDeploymentMap,
    ).currentModel;
    const playlistEntity = model.entities.find((entity) => entity.uuid === SPOTIFY_PLAYLIST_ENTITY_UUID);
    expect(playlistEntity, "SpotifyPlaylist must be present in the booted model").toBeDefined();
    expect(playlistEntity?.name).toBe("SpotifyPlaylist");
    expect(entitySpotifyPlaylist.externalDataSource?.kind).toBe("http");

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

  it("playlist report renders name, owner, first-page tracks, and tracks.total via playlistId", async () => {
    expect(PLAYLIST_OK.name).toBe(PLAYLIST_NAME_LITERAL);
    expect(PLAYLIST_OK.tracks.items[0]?.track.name).toBe(FIRST_TRACK_NAME_LITERAL);
    expect(PLAYLIST_OK.tracks.total).toBe(TRACKS_TOTAL_LITERAL);
    expect(reportSpotifyPlaylist.uuid).toBe(SPOTIFY_REPORT_UUID);

    renderSpotifyReport(reportSpotifyPlaylist as Report, PLAYLIST_ID_OK);

    await waitFor(
      () => {
        // Playlist JSON + tracks.items list both contain the first track name.
        expect(screen.getAllByText(PLAYLIST_NAME_LITERAL, { exact: false }).length).toBeGreaterThan(0);
        expect(screen.getAllByText(OWNER_DISPLAY_NAME_LITERAL, { exact: false }).length).toBeGreaterThan(0);
        expect(screen.getAllByText(FIRST_TRACK_NAME_LITERAL, { exact: false }).length).toBeGreaterThan(0);
        expect(screen.getAllByText(String(TRACKS_TOTAL_LITERAL), { exact: false }).length).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );

    // The playlistId input section seeds its field from the URL page params.
    // (input id is the bare attribute name on the success path, the full
    // "playlistInput.playlistId" path when the query failed — match by suffix.)
    const playlistIdInput = document.querySelector<HTMLInputElement>(
      'input[data-testid="miroirInput"][id$="playlistId"]',
    );
    expect(playlistIdInput, "playlistId input field must be rendered").not.toBeNull();
    expect(playlistIdInput?.value).toBe(PLAYLIST_ID_OK);
  });

  it("playlist report without playlistId renders an input whose OK button writes playlistId into the report URL", async () => {
    const mockNavigate = vi.fn();
    vi.mocked(RRDom.useNavigate).mockReturnValue(mockNavigate as any);

    renderSpotifyReport(reportSpotifyPlaylist as Report);

    // The input section renders even though the query cannot resolve playlistId.
    await waitFor(
      () => {
        expect(screen.getAllByText("Playlist ID", { exact: false }).length).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );
    const playlistIdInput = document.querySelector<HTMLInputElement>(
      'input[data-testid="miroirInput"][id$="playlistId"]',
    );
    expect(playlistIdInput, "playlistId input field must be rendered").not.toBeNull();
    expect(playlistIdInput?.value).toBe("");

    fireEvent.change(playlistIdInput as HTMLInputElement, { target: { value: PLAYLIST_ID_OK } });
    fireEvent.click(screen.getByRole("button", { name: "OK" }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const url = mockNavigate.mock.calls[0]?.[0] as string;
    const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));
    expect(params.get("page")).toBe("report");
    expect(params.get("application")).toBe(selfApplicationSpotify.uuid);
    expect(params.get("deploymentUuid")).toBe(deployment_Spotify_DO_NO_USE.uuid);
    expect(params.get("applicationSection")).toBe("data");
    expect(params.get("reportUuid")).toBe(SPOTIFY_REPORT_UUID);
    expect(params.get("playlistId")).toBe(PLAYLIST_ID_OK);
  });

  it("new-shape playlist fails display-time jzodTypeCheck against a tracks-only SpotifyPlaylist mlSchema", () => {
    const liveSchema = entitySpotifyPlaylist.mlSchema as JzodObject;
    expect(
      liveSchema.definition.items,
      "live SpotifyPlaylist mlSchema must include optional items (the entity-schema fix)",
    ).toBeDefined();

    const staleResult = jzodTypeCheck(
      tracksOnlySpotifyPlaylistMlSchema(liveSchema),
      PLAYLIST_NEW_SHAPE,
      [],
      [],
      defaultSpotifyModelEnvironment,
      {},
    );
    expect(staleResult.status).toBe("error");
    expect(JSON.stringify(staleResult)).toMatch(JZOD_UNKNOWN_ATTRIBUTE_ERROR);
    expect(JSON.stringify(staleResult)).toMatch(/'items'/);

    const liveResult = jzodTypeCheck(
      liveSchema,
      PLAYLIST_NEW_SHAPE,
      [],
      [],
      defaultSpotifyModelEnvironment,
      {},
    );
    expect(liveResult.status).toBe("ok");
  });

  it("playlist report renders tracks from the Feb-2026 `items.items[].item` response shape", async () => {
    renderSpotifyReport(reportSpotifyPlaylist as Report, PLAYLIST_ID_NEWSHAPE, {
      seedEntityMapping: true,
    });

    await waitFor(
      () => {
        // Name is an editor input (objectInstanceReportSection), not visible text.
        expect(screen.getByDisplayValue(PLAYLIST_NEW_SHAPE.name)).toBeTruthy();
        expect(
          screen.getAllByText(NEW_SHAPE_FIRST_TRACK_LITERAL, { exact: false }).length,
        ).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );

    // objectInstanceReportSection → TypedValueObjectEditor: no testid on the
    // failure box. On jzodTypeCheck error it renders a <span>"typeError: "…</span>
    // plus CodeBlock_ReadOnly of getInnermostTypeCheckError (the live bug dump).
    expect(screen.queryByText(TYPED_VALUE_OBJECT_EDITOR_TYPE_ERROR)).toBeNull();
    expect(screen.queryByText(JZOD_UNKNOWN_ATTRIBUTE_ERROR)).toBeNull();
    expect(screen.queryByText(/Could not resolve jzod schema/)).toBeNull();
    expect(document.body.textContent).not.toMatch(JZOD_UNKNOWN_ATTRIBUTE_ERROR);
    expect(screen.queryByText(/Oops, ReportSectionEntityInstance could not be displayed/)).toBeNull();
  });

  it("playlist report tolerates a metadata-only response (no tracks/items) without a query failure", async () => {
    renderSpotifyReport(reportSpotifyPlaylist as Report, PLAYLIST_ID_METADATA_ONLY);

    await waitFor(
      () => {
        expect(
          screen.getAllByText(METADATA_ONLY_NAME_LITERAL, { exact: false }).length,
        ).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );
    // Tracks section falls back to an empty list — no failure dump, no error banner,
    // and the jsonReportSection <pre> shows "[]" instead of a FailedTransformer payload.
    expect(screen.queryByText(/found query failure/)).toBeNull();
    expect(screen.queryByText(/Report query failed/)).toBeNull();
    const preTexts = Array.from(document.querySelectorAll("pre")).map((e) => e.textContent);
    expect(preTexts.join("\n")).not.toContain("FailedTransformer");
    expect(preTexts).toContain("[]");
  });
});
