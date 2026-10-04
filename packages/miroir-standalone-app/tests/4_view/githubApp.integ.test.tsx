/**
 * GitHub example app (#472): deployment boot + repositories Report.
 *
 * Vitest integ: full deployment boot + report rendering are not MiroirTest-reachable
 * with a local HTTP server (same pattern as spotifyApp.integ.test.tsx).
 * Package assets keep https://api.github.com; the test points the Endpoint at the fake server.
 *
 * Run:
 * ```bash
 * RUN_TEST=githubApp npm run testByFile -w miroir-standalone-app -- githubApp --profile emulatedServer-filesystem
 * ```
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter, type Params } from "react-router-dom";
import * as RRDom from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  EndpointDefinition,
  EntityInstance,
  LoggerOptions,
  MiroirConfigForClientStub,
  Report,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
  clearSecrets,
  ConfigurationService,
  createDeploymentCompositeAction,
  createExternalServiceTokenCache,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  MiroirActivityTracker,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  registerSecrets,
  resetAndinitializeDeploymentCompositeAction,
  resetAndInitApplicationDeployment,
} from "miroir-core";
import { LocalCacheProvider, MiroirContextReactProvider } from "miroir-react";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { deployment_Admin, deployment_Miroir } from "miroir-app-admin";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-example-library";
import { defaultMiroirMetaModel, defaultStoredMiroirTheme } from "miroir-app-miroir";
import {
  defaultGitHubAppModel,
  deployment_GitHub_DO_NOT_USE,
  getDefaultGitHubModelEnvironment,
  githubInitApplicationVersion,
  githubServiceEndpoint,
  reportGitHubRepositories,
  selfApplicationGitHub,
  selfApplicationModelBranchGitHubMasterBranch,
} from "miroir-example-github";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { ReportPageContextProvider } from "../../src/miroir-fwk/4_view/components/Reports/ReportPageContext.js";
import { ReportViewWithEditor } from "../../src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.js";
import { DocumentOutlineContextProvider } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/InstanceEditorOutlineContext.js";
import { MiroirThemeProvider } from "../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { miroirAppStartup } from "../../src/startup.js";
import { ReportUrlParamKeys } from "../../src/constants.js";
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
const shouldRun = !RUN_TEST || RUN_TEST === "githubApp" || RUN_TEST === "githubApp.integ.test";

const GITHUB_DEPLOYMENT_UUID = "752c2412-a2cc-4632-94f3-937168969998";
const GITHUB_APPLICATION_UUID = "6c4edcb2-e165-407a-b728-fbf8a18b6bf7";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const TEST_TOKEN = "ghp_test-token";

function repository(id: number, name: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    node_id: `node-${id}`,
    name,
    full_name: `octocat/${name}`,
    owner: { login: "octocat", id: 1, avatar_url: "https://example.test/a.png", html_url: "https://github.com/octocat" },
    private: false,
    html_url: `https://github.com/octocat/${name}`,
    description: null,
    language: "TypeScript",
    stargazers_count: 3,
    updated_at: "2026-10-01T10:00:00Z",
    archive_url: "not bound, stripped by the client",
    ...extra,
  };
}

const REPOSITORIES = [
  repository(11, "hello-miroir"),
  repository(12, "private-notes", { private: true, language: null, stargazers_count: 0 }),
];

const env: any = process.env;
const { miroirConfig, logConfig } = await loadTestConfigFiles(env);
if (!miroirConfig || !logConfig) {
  throw new Error("githubApp: test configuration is missing");
}
if (!miroirConfig.client.emulateServer) {
  throw new Error("githubApp requires emulateServer: true (in-process server path).");
}
const emulatedClient: MiroirConfigForClientStub = miroirConfig.client;
const loggerOptions: LoggerOptions = logConfig;

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

const githubDeploymentStorageConfiguration: StoreUnitConfiguration | undefined =
  emulatedClient.deploymentStorageConfig[GITHUB_DEPLOYMENT_UUID];

const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: emulatedClient.deploymentStorageConfig[deployment_Admin.uuid],
};

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  [selfApplicationGitHub.uuid]: deployment_GitHub_DO_NOT_USE.uuid,
};

const githubModelEnvironment = getDefaultGitHubModelEnvironment(
  defaultMiroirMetaModel,
  deployment_GitHub_DO_NOT_USE.uuid,
);

const githubTestbedInitParams = {
  dataStoreType: "app" as const,
  metaModel: defaultMiroirMetaModel,
  selfApplication: selfApplicationGitHub,
  applicationModelBranch: selfApplicationModelBranchGitHubMasterBranch as any,
  applicationVersion: githubInitApplicationVersion,
};

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "githubApp test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;
let fakeServer: FakeExternalServiceServer;
const tokenCache = createExternalServiceTokenCache();

async function overrideEndpointBaseUrl(baseUrl: string): Promise<void> {
  const existing = (githubServiceEndpoint as EndpointDefinition).definition as {
    externalService: Record<string, unknown>;
  };
  const updated = {
    ...githubServiceEndpoint,
    definition: { externalService: { ...existing.externalService, baseUrl } },
  } as EntityInstance;
  const updateResult = await domainController.handleAction(
    {
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: selfApplicationGitHub.uuid,
        applicationSection: "model",
        objects: [updated],
      },
    },
    applicationDeploymentMap,
    githubModelEnvironment,
  );
  expect(updateResult instanceof Action2Error, JSON.stringify(updateResult)).toBe(false);
  const commitResult = await domainController.handleAction(
    {
      actionType: "commit",
      endpoint: MODEL_ENDPOINT,
      payload: { application: selfApplicationGitHub.uuid },
    },
    applicationDeploymentMap,
    githubModelEnvironment,
  );
  expect(commitResult instanceof Action2Error, JSON.stringify(commitResult)).toBe(false);
}

function renderGitHubReport(reportDefinition: Report) {
  const pageParams: Params<ReportUrlParamKeys> = {
    application: selfApplicationGitHub.uuid,
    deploymentUuid: deployment_GitHub_DO_NOT_USE.uuid,
    applicationSection: "data",
    reportUuid: reportDefinition.uuid,
    instanceUuid: "",
  };
  vi.spyOn(RRDom, "useParams").mockReturnValue(pageParams);
  const search = new URLSearchParams({ page: "report", ...(pageParams as Record<string, string>) }).toString();
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
            testingApplication={selfApplicationGitHub.uuid}
            testingDeploymentUuid={deployment_GitHub_DO_NOT_USE.uuid}
          >
            <DocumentOutlineContextProvider
              isOutlineOpen={false}
              onToggleOutline={() => {}}
              onNavigateToPath={() => {}}
            >
              <ReportPageContextProvider>
                <ReportViewWithEditor
                  applicationSection="data"
                  application={selfApplicationGitHub.uuid}
                  applicationDeploymentMap={applicationDeploymentMap}
                  deploymentUuid={deployment_GitHub_DO_NOT_USE.uuid}
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

function shownOnPage(text: string): boolean {
  return !!screen.queryByDisplayValue(text) || screen.queryAllByText(text, { exact: false }).length > 0;
}

beforeAll(async () => {
  fakeServer = await startFakeExternalServiceServer();
  miroirContext = new MiroirContext(miroirActivityTracker, miroirEventService, miroirConfig);
  const session = new AppStackIntegrationTestSession(miroirConfig, {
    externalServiceEnvironment: { insecureBaseUrls: [fakeServer.baseUrl], tokenCache },
    applicationDeploymentMap,
    adminDeployment,
    libraryDeploymentStorageConfiguration:
      emulatedClient.deploymentStorageConfig[deployment_Library_DO_NO_USE.uuid],
    miroirActivityTracker,
    miroirEventService,
  });
  domainController = (await session.initSession()).domainController;

  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
  ]);
  expect(githubDeploymentStorageConfiguration, "GitHub deployment must be in the test environment").toBeDefined();
  const createResult = await domainController.handleCompositeAction(
    createDeploymentCompositeAction(
      "GitHub",
      GITHUB_DEPLOYMENT_UUID,
      GITHUB_APPLICATION_UUID,
      adminDeployment,
      githubDeploymentStorageConfiguration as StoreUnitConfiguration,
    ),
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
          application: GITHUB_APPLICATION_UUID,
          deploymentUuid: GITHUB_DEPLOYMENT_UUID,
          configuration: { [GITHUB_DEPLOYMENT_UUID]: githubDeploymentStorageConfiguration },
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expect(openResult instanceof Action2Error, JSON.stringify(openResult)).toBe(false);
  }
}, 60000);

beforeEach(async () => {
  fakeServer.receivedRequests.length = 0;
  registerSecrets({ githubToken: TEST_TOKEN });
  fakeServer.setFixture("GET", "/user/repos", { body: REPOSITORIES });
  fakeServer.setFixtureForAuth("GET", "/user/repos", "Bearer ghp_revoked", {
    status: 401,
    body: { message: "Bad credentials", status: "401" },
  });
  const initResult = await domainController.handleCompositeAction(
    resetAndinitializeDeploymentCompositeAction(
      selfApplicationGitHub.uuid,
      deployment_GitHub_DO_NOT_USE.uuid,
      githubTestbedInitParams,
      [],
      defaultGitHubAppModel,
    ),
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  expect(initResult.status, JSON.stringify(initResult)).toBe("ok");
  await overrideEndpointBaseUrl(fakeServer.baseUrl);
}, 60000);

afterEach(() => {
  cleanup();
  clearSecrets();
});

afterAll(async () => {
  clearSecrets();
  await fakeServer?.close();
});

describe.skipIf(!shouldRun)("githubApp: GitHub deployment and repositories Report", () => {
  it("lists the connected user's repositories", async () => {
    renderGitHubReport(reportGitHubRepositories);
    await waitFor(
      () => {
        expect(shownOnPage("octocat/hello-miroir")).toBe(true);
        expect(shownOnPage("octocat/private-notes")).toBe(true);
      },
      { timeout: 15000 },
    );
  });

  it("asks GitHub for the 100 most recently updated repositories with the user's token and GitHub's headers", async () => {
    renderGitHubReport(reportGitHubRepositories);
    await waitFor(() => expect(fakeServer.receivedRequests.length).toBeGreaterThan(0), {
      timeout: 15000,
    });
    const request = fakeServer.receivedRequests[0];
    expect(request.path).toBe("/user/repos");
    expect(new URLSearchParams(request.search).get("per_page")).toBe("100");
    expect(new URLSearchParams(request.search).get("sort")).toBe("updated");
    expect(request.headers.authorization).toBe(`Bearer ${TEST_TOKEN}`);
    expect(request.headers["user-agent"]).toBe("miroir-example-github");
    expect(request.headers.accept).toBe("application/vnd.github+json");
    expect(request.headers["x-github-api-version"]).toBe("2022-11-28");
  });

  it("shows no repositories and a load failure when GitHub refuses the token", async () => {
    registerSecrets({ githubToken: "ghp_revoked" });
    renderGitHubReport(reportGitHubRepositories);
    await waitFor(
      () => {
        expect(fakeServer.receivedRequests.length).toBeGreaterThan(0);
        expect(shownOnPage("octocat/hello-miroir")).toBe(false);
        expect(screen.queryAllByText(/Report async load failed/).length).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );
  });
});
