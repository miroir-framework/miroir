/**
 * #281 Slice 2 tracer — apiCallReportSection binding / schema lookup hard fail.
 *
 * Vitest integ: MemoryRouter + ReportViewWithEditor + fake Spotify server are not MiroirTest-reachable.
 *
 * Run:
 * ```bash
 * RUN_TEST=apiCallReport.281.phase2 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase2 --profile emulatedServer-filesystem
 * ```
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
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
  getDefaultSpotifyModelEnvironment,
  reportSpotifyPlaylist,
  selfApplicationModelBranchSpotifyMasterBranch,
  selfApplicationSpotify,
  spotifyInitApplicationVersion,
} from "miroir-test-app_deployment-spotify";

import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { ReportPageContextProvider } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportPageContext.js";
import { ReportViewWithEditor } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.js";
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
  RUN_TEST === "apiCallReport.281.phase2" ||
  RUN_TEST === "apiCallReport.281.phase2.integ.test";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures");
const PLAYLIST_OK = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "playlist-ok.json"), "utf8"),
) as {
  id: string;
  name: string;
  tracks: { total: number; items: { track: { name: string } }[] };
};

const PLAYLIST_NAME_LITERAL = "Rock Classics";
const PLAYLIST_ID_OK = "test-playlist-001";

const SPOTIFY_DEPLOYMENT_UUID = "fd47d115-67e2-4870-8339-1c26665d1d15";
const SPOTIFY_APPLICATION_UUID = "00514586-bf72-4de3-beea-0a627c821404";
const SPOTIFY_ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454";
const UNKNOWN_ENDPOINT_UUID = "c0ffee00-0000-4000-8000-000000000001";
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
  throw new Error("apiCallReport.281.phase2 requires emulateServer: true (in-process server path).");
}
const emulatedClient: MiroirConfigForClientStub = miroirConfig.client;
const loggerOptions: LoggerOptions = importedLoggerOptions;
const fileName = "apiCallReport.281.phase2.integ.test";
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
    description: "Slice 2 binding-mismatch test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;
let fakeServer: FakeExternalServiceServer;

/** In-test clone — never mutate the committed Spotify report asset. */
function cloneSpotifyPlaylistReport(): Report {
  return structuredClone(reportSpotifyPlaylist) as Report;
}

function apiCallSectionOf(report: Report): ReportSection & { type: "apiCallReportSection" } {
  const list = report.definition.section as { type: "list"; definition: ReportSection[] };
  const section = list.definition.find((entry) => entry.type === "apiCallReportSection");
  expect(section, "cloned Spotify report must already have apiCallReportSection (Slice 1)").toBeDefined();
  return section as ReportSection & { type: "apiCallReportSection" };
}

async function commitSpotifyEndpoint(updated: EntityInstance): Promise<void> {
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

function readBootedSpotifyEndpoint(): EndpointDefinition {
  const model = domainController.currentModelEnvironment(
    selfApplicationSpotify.uuid,
    applicationDeploymentMap,
  ).currentModel;
  const endpoint = model.endpoints.find((entry) => entry.uuid === SPOTIFY_ENDPOINT_UUID);
  expect(endpoint, "SpotifyService endpoint must be in the booted model").toBeDefined();
  return endpoint as EndpointDefinition;
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

  await commitSpotifyEndpoint(updated);
}

/** Preserve the already-overridden fake-server baseUrl; only change enabledOperations. */
async function overrideEnabledOperations(enabledOperations: string[]): Promise<void> {
  const endpoint = readBootedSpotifyEndpoint();
  const existing = endpoint.definition as { externalService: Record<string, unknown> };
  const updated = {
    ...endpoint,
    definition: {
      ...endpoint.definition,
      externalService: {
        ...existing.externalService,
        enabledOperations,
      },
    },
  } as EntityInstance;
  await commitSpotifyEndpoint(updated);
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

function renderSpotifyReport(reportDefinition: Report, playlistId?: string) {
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

function pageText(): string {
  return document.body.textContent ?? "";
}

/** Ids like get-playlist must not match only as a substring of not-get-playlist. */
function containsStandaloneId(text: string, id: string): boolean {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z0-9-])${escaped}(?![A-Za-z0-9-])`).test(text);
}

function playlistAppearsAsTypedObject(): boolean {
  return Boolean(
    screen.queryByDisplayValue(PLAYLIST_NAME_LITERAL) ||
      screen.queryAllByText(PLAYLIST_NAME_LITERAL, { exact: false }).length > 0,
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

function assertNoSuccessfulPlaylistUi(): void {
  expect(
    playlistAppearsAsTypedObject(),
    `playlist name ${PLAYLIST_NAME_LITERAL} must not appear as a successful typed object`,
  ).toBe(false);
  expect(
    playlistIsDumpedAsPre(),
    "playlist must not be shown only as a <pre> JSON dump",
  ).toBe(false);
  expect(screen.queryByText(/report target entity not found/i)).toBeNull();
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

describe.skipIf(!shouldRun).sequential("apiCallReport #281 phase2 — binding / schema lookup hard fail", () => {
  it("operationId mismatch names both section and extractor ids, without typed playlist UI", async () => {
    const clone = cloneSpotifyPlaylistReport();
    apiCallSectionOf(clone).definition.operationId = "not-get-playlist";
    renderSpotifyReport(clone, PLAYLIST_ID_OK);

    await waitFor(
      () => {
        const text = pageText();
        expect(
          containsStandaloneId(text, "not-get-playlist"),
          "mismatch message must include the section operationId not-get-playlist",
        ).toBe(true);
        expect(
          containsStandaloneId(text, "get-playlist"),
          "mismatch message must include the extractor actionType get-playlist as its own id",
        ).toBe(true);
      },
      { timeout: 15000 },
    );

    assertNoSuccessfulPlaylistUi();
  });

  it("unknown endpointUuid is named and is not 'report target entity not found'", async () => {
    const clone = cloneSpotifyPlaylistReport();
    apiCallSectionOf(clone).definition.endpointUuid = UNKNOWN_ENDPOINT_UUID;
    renderSpotifyReport(clone, PLAYLIST_ID_OK);

    await waitFor(
      () => {
        expect(
          pageText(),
          `mismatch message must name the unknown endpoint uuid ${UNKNOWN_ENDPOINT_UUID}`,
        ).toContain(UNKNOWN_ENDPOINT_UUID);
      },
      { timeout: 15000 },
    );

    expect(screen.queryByText(/report target entity not found/i)).toBeNull();
    assertNoSuccessfulPlaylistUi();
  });

  it("missing fetchedDataReference extractor key is named", async () => {
    const clone = cloneSpotifyPlaylistReport();
    apiCallSectionOf(clone).definition.fetchedDataReference = "tracks";
    renderSpotifyReport(clone, PLAYLIST_ID_OK);

    await waitFor(
      () => {
        const text = pageText();
        expect(
          /(?:extractor|fetchedDataReference|reference).{0,160}\btracks\b|\btracks\b.{0,160}(?:extractor|fetchedDataReference|not found|unknown|missing)/i.test(
            text,
          ),
          "error message must name the missing extractor key tracks",
        ).toBe(true);
      },
      { timeout: 15000 },
    );

    assertNoSuccessfulPlaylistUi();
  });

  it("enabledOperations omit is an external-service fetch error, not a binding-mismatch banner", async () => {
    await overrideEnabledOperations([]);
    const clone = cloneSpotifyPlaylistReport();
    const section = apiCallSectionOf(clone).definition;
    expect(section.operationId).toBe("get-playlist");
    expect(section.endpointUuid).toBe(SPOTIFY_ENDPOINT_UUID);
    expect(section.fetchedDataReference).toBe("playlist");

    renderSpotifyReport(clone, PLAYLIST_ID_OK);

    await waitFor(
      () => {
        const text = pageText();
        expect(
          /Report query failed|not enabled|external service|async load failed|query failure|FailedTransformer/i.test(
            text,
          ),
          `expected an external-service / fetch error, got: ${text.slice(0, 500)}`,
        ).toBe(true);
      },
      { timeout: 15000 },
    );

    const text = pageText();
    expect(text).not.toContain("not-get-playlist");
    expect(text).not.toContain(UNKNOWN_ENDPOINT_UUID);
    expect(
      /(?:extractor|fetchedDataReference).{0,160}\btracks\b|\btracks\b.{0,160}(?:extractor|fetchedDataReference)/i.test(
        text,
      ),
      "disabled operation must not be reported as a missing-extractor binding mismatch",
    ).toBe(false);
    assertNoSuccessfulPlaylistUi();
  });
});
