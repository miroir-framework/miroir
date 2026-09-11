/**
 * External service report path — Report path: extractorTemplateForExternalService + param forwarding
 * + async report-load routing (D5 client, D8).
 *
 * Vitest integ (.tsx + MemoryRouter): React report rendering and URL dispatch
 * are not MiroirTest-reachable. Follows the ReportPage.integ.test.tsx pattern
 * (useParams mock + MemoryRouter). Fake server is the sanctioned HTTP fake.
 *
 * Run:
 * ```bash
 * RUN_TEST=externalServiceReport npm run testByFile -w miroir-standalone-app -- externalServiceReport --profile emulatedServer-filesystem
 * ```
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import * as RRDom from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  Deployment,
  EndpointDefinition,
  Entity,
  EntityInstance,
  Report,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
  allowInsecureBaseUrlsForTests,
  clearAllowedInsecureBaseUrlsForTests,
  clearSecrets,
  ConfigurationService,
  defaultSelfApplicationDeploymentMap,
  DomainControllerInterface,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  registerSecrets,
  resetAndInitApplicationDeployment,
  resetIntegTestbed,
} from "miroir-core";
import {
  LocalCacheProvider,
  MiroirContextReactProvider,
} from "miroir-react";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { deployment_Admin, deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  Country3,
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  endpointDocument,
  entityCountry,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import {
  defaultMiroirMetaModel,
  defaultStoredMiroirTheme,
} from "miroir-test-app_deployment-miroir";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { selfApplicationDeploymentConfigurationsTO_REMOVE } from "../../src/miroir-fwk/4-tests/tests-utils.js";
import { ReportPageContextProvider } from "../../src/miroir-fwk/4_view/components/Reports/ReportPageContext.js";
import { ReportViewWithEditor } from "../../src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.js";
import { DocumentOutlineContextProvider } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/InstanceEditorOutlineContext.js";
import { MiroirThemeProvider } from "../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { reportPageParamsFromSearchParams } from "../../src/miroir-fwk/4_view/PageDispatcher.js";
import { miroirAppStartup } from "../../src/startup.js";
import { cleanLevel, packageName } from "../3_controllers/constants.js";
import { AppStackIntegrationTestSession } from "../helpers/IntegrationTestSession.js";
import {
  libraryEntitiesAndInstances,
  libraryTestbedInitParams,
} from "../helpers/libraryPlayfieldSeeds.js";
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

// Vitest/happy-dom cannot load miroir-diagram-class → svg-toolbelt (CJS `exports` in an ESM package).
vi.mock("../../src/miroir-fwk/4_view/components/Reports/ModelDiagramReportSectionView.js", () => ({
  ModelDiagramReportSectionView: () => null,
}));

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "externalServiceReport" ||
  RUN_TEST === "externalServiceReport.integ.test";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const PLAYLIST_OK = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "playlist-ok.json"), "utf8"),
) as {
  name: string;
  tracks: { total: number; items: { track: { name: string } }[] };
};
const PLAYLIST_REPORT = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "playlistReport.json"), "utf8"),
) as Report;
const MIXED_REPORT = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "mixedPlaylistReport.json"), "utf8"),
) as Report;

const PLAYLIST_NAME_LITERAL = "Rock Classics";
const FIRST_TRACK_NAME_LITERAL = "Born to Run";
const FRANCE_NAME_LITERAL = "France";
const PLAYLIST_ID_OK = "test-playlist-001";
const PLAYLIST_ID_MISSING = "missing-playlist";
const TEST_ENDPOINT_UUID = "c8f2a1b4-6d3e-4a91-9b07-2e5c8d1f4a63";
const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";

const PLAYLIST_RESPONSE_SCHEMA = {
  type: "object",
  definition: {
    id: { type: "string" },
    name: { type: "string" },
    tracks: {
      type: "object",
      definition: {
        total: { type: "number" },
        items: {
          type: "array",
          definition: {
            type: "object",
            definition: {
              track: {
                type: "object",
                definition: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
};

const env: any = process.env;
const { miroirConfig, logConfig: importedLoggerOptions } = await loadTestConfigFiles(env);
if (!miroirConfig) {
  throw new Error("miroirConfig is undefined");
}
if (!importedLoggerOptions) {
  throw new Error("importedLoggerOptions is undefined");
}
const loggerOptions: LoggerOptions = importedLoggerOptions;
const fileName = "externalServiceReport.integ.test";
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

const testApplicationDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client
  .emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client
  .emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Admin.uuid];

const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: adminDeploymentStorageConfiguration,
};

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

const defaultLibraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  deployment_Library_DO_NO_USE.uuid,
);

/** Country is not in `libraryEntitiesAndInstances` (authors/books/publishers only). */
const phase5EntitiesAndInstances = [
  ...libraryEntitiesAndInstances,
  {
    entity: entityCountry as Entity,
    instances: [Country3 as EntityInstance],
  },
];

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "Slice 5 test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;
let fakeServer: FakeExternalServiceServer;

function testEndpointInstance(baseUrl: string): EndpointDefinition {
  return {
    uuid: TEST_ENDPOINT_UUID,
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: selfApplicationLibrary.uuid,
    name: "FakeSpotifySlice5",
    version: "1",
    description: "Slice 5 report-path endpoint — externalService against the local fake server",
    definition: {
      externalService: {
        openApiDocument:
          '{"openapi":"3.0.0","info":{"title":"FakeSpotify","version":"1.0.0"},"paths":{}}',
        baseUrl,
        securityScheme: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        credentialKey: "fakeSpotify",
        enabledOperations: ["get-playlist"],
        operations: [
          {
            operationId: "get-playlist",
            method: "GET",
            path: "/playlists/{playlist_id}",
            parameterMappings: [{ name: "playlist_id", in: "path", required: true }],
            responseSchema: PLAYLIST_RESPONSE_SCHEMA,
          },
        ],
      },
    },
  } as EndpointDefinition;
}

async function commitTestEndpoint(): Promise<void> {
  const createResult = await domainController.handleAction(
    {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "model",
        objects: [testEndpointInstance(fakeServer.baseUrl) as EntityInstance],
      },
    },
    applicationDeploymentMap,
    defaultLibraryModelEnvironment,
  );
  expect(createResult instanceof Action2Error, `createInstance failed: ${JSON.stringify(createResult)}`).toBe(
    false,
  );

  const commitResult = await domainController.handleAction(
    {
      actionType: "commit",
      endpoint: MODEL_ENDPOINT,
      payload: { application: selfApplicationLibrary.uuid },
    },
    applicationDeploymentMap,
    defaultLibraryModelEnvironment,
  );
  expect(commitResult instanceof Action2Error, `commit failed: ${JSON.stringify(commitResult)}`).toBe(
    false,
  );
}

function playlistPageParams(reportUuid: string, playlistId: string) {
  return {
    application: selfApplicationLibrary.uuid,
    deploymentUuid: deployment_Library_DO_NO_USE.uuid,
    applicationSection: "data",
    reportUuid,
    playlistId,
  };
}

function renderReport(reportDefinition: Report, playlistId: string) {
  const pageParams = playlistPageParams(reportDefinition.uuid, playlistId);
  vi.spyOn(RRDom, "useParams").mockReturnValue(pageParams);
  const search = new URLSearchParams({
    page: "report",
    application: pageParams.application,
    deploymentUuid: pageParams.deploymentUuid,
    applicationSection: pageParams.applicationSection,
    reportUuid: pageParams.reportUuid,
    playlistId,
  }).toString();

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
            testingApplication={selfApplicationLibrary.uuid}
            testingDeploymentUuid={deployment_Library_DO_NO_USE.uuid}
          >
            <DocumentOutlineContextProvider
              isOutlineOpen={false}
              onToggleOutline={() => {}}
              onNavigateToPath={() => {}}
            >
              <ReportPageContextProvider>
                <ReportViewWithEditor
                  applicationSection="data"
                  application={selfApplicationLibrary.uuid}
                  applicationDeploymentMap={applicationDeploymentMap}
                  deploymentUuid={deployment_Library_DO_NO_USE.uuid}
                  pageParams={pageParams}
                  reportDefinition={reportDefinition}
                />
              </ReportPageContextProvider>
            </DocumentOutlineContextProvider>
          </MiroirContextReactProvider>
        </LocalCacheProvider>
      </MiroirThemeProvider>
    </MemoryRouter>,
  );
}

beforeAll(async () => {
  if (!miroirConfig.client.emulateServer) {
    throw new Error(
      "externalServiceReport requires emulateServer: true (in-process server path).",
    );
  }

  fakeServer = await startFakeExternalServiceServer({
    [`GET /playlists/${PLAYLIST_ID_OK}`]: { body: PLAYLIST_OK },
    [`GET /playlists/${PLAYLIST_ID_MISSING}`]: {
      status: 404,
      body: { error: { status: 404, message: "playlist not found" } },
    },
  });
  registerSecrets({ fakeSpotify: "test-token" });
  allowInsecureBaseUrlsForTests([fakeServer.baseUrl]);

  miroirContext = new MiroirContext(miroirActivityTracker, miroirEventService, miroirConfig);

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
  myConsoleLog("session ready", defaultLibraryAppModel.entities?.length ?? 0);
}, 60000);

beforeEach(async () => {
  fakeServer.receivedRequests.length = 0;
  fakeServer.setFixture(`GET /playlists/${PLAYLIST_ID_OK}`, { body: PLAYLIST_OK });
  await resetIntegTestbed({
    domainController,
    applicationDeploymentMap,
    libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
    librarySelfApplicationUuid: selfApplicationLibrary.uuid,
    deploymentsToReset: selfApplicationDeploymentConfigurationsTO_REMOVE,
    testbedEntitiesAndInstances: phase5EntitiesAndInstances,
    testbedInitApplicationParameters: libraryTestbedInitParams,
    testbedModel: defaultLibraryModelEnvironment.currentModel as any,
  });
  await commitTestEndpoint();
}, 60000);

afterEach(() => {
  cleanup();
});

afterAll(async () => {
  clearSecrets();
  clearAllowedInsecureBaseUrlsForTests();
  if (fakeServer) {
    await fakeServer.close();
  }
});

describe.skipIf(!shouldRun).sequential(
  "externalServiceReport — report path + extractorTemplateForExternalService",
  () => {
    it("reportPageParamsFromSearchParams forwards unknown keys such as playlistId", () => {
      const searchParams = new URLSearchParams(
        "page=report&application=app&deploymentUuid=dep&applicationSection=data&reportUuid=rep&playlistId=abc",
      );
      const params = reportPageParamsFromSearchParams(searchParams);
      expect(params).toMatchObject({
        application: "app",
        deploymentUuid: "dep",
        applicationSection: "data",
        reportUuid: "rep",
        playlistId: "abc",
      });
    });

    it("legacy path-segment mode is unchanged (search-param helper still requires page=report)", () => {
      const searchParams = new URLSearchParams("application=app&deploymentUuid=dep&reportUuid=rep");
      expect(reportPageParamsFromSearchParams(searchParams)).toBeUndefined();
    });

    it("report with extractorTemplateForExternalService renders the fake-server playlist name and first track", async () => {
      expect(PLAYLIST_OK.name).toBe(PLAYLIST_NAME_LITERAL);
      expect(PLAYLIST_OK.tracks.items[0]?.track.name).toBe(FIRST_TRACK_NAME_LITERAL);

      renderReport(PLAYLIST_REPORT, PLAYLIST_ID_OK);

      await waitFor(
        () => {
          expect(screen.getByText(PLAYLIST_NAME_LITERAL, { exact: false })).toBeInTheDocument();
          expect(screen.getByText(FIRST_TRACK_NAME_LITERAL, { exact: false })).toBeInTheDocument();
        },
        { timeout: 15000 },
      );
    });

    it("async report load shows loading then loaded, and error for a missing playlist", async () => {
      fakeServer.setFixture(`GET /playlists/${PLAYLIST_ID_OK}`, {
        body: PLAYLIST_OK,
        delayMs: 250,
      });
      renderReport(PLAYLIST_REPORT, PLAYLIST_ID_OK);
      expect(await screen.findByText("Loading report data…", {}, { timeout: 5000 })).toBeInTheDocument();
      await waitFor(
        () => {
          expect(screen.getByText(PLAYLIST_NAME_LITERAL, { exact: false })).toBeInTheDocument();
        },
        { timeout: 15000 },
      );

      cleanup();
      renderReport(PLAYLIST_REPORT, PLAYLIST_ID_MISSING);
      expect(
        await screen.findByText("Report async load failed", { exact: false }, { timeout: 15000 }),
      ).toBeInTheDocument();
    });

    it("mixed store + external query renders both data sources (combiner over merged context)", async () => {
      renderReport(MIXED_REPORT, PLAYLIST_ID_OK);
      await waitFor(
        () => {
          expect(screen.getByText(PLAYLIST_NAME_LITERAL, { exact: false })).toBeInTheDocument();
          expect(screen.getByText(FIRST_TRACK_NAME_LITERAL, { exact: false })).toBeInTheDocument();
          expect(screen.getByText(FRANCE_NAME_LITERAL, { exact: false })).toBeInTheDocument();
        },
        { timeout: 15000 },
      );
    });
  },
);
