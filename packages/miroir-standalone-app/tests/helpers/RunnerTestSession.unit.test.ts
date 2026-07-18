import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildRunnerTestSessionParamBank,
  defaultMiroirMetaModel,
  getBootstrapPhasesForSessionKind,
  MiroirActivityTracker,
  MiroirEventService,
  remapLibraryAppModelForRunTarget,
  resolveRunnerTestRunTarget,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type MetaModel,
  type MiroirConfigClient,
  type MiroirTestDefinition,
  type MiroirTestSuite,
} from "miroir-core";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  miroirTest_runner_library,
  RUNNER_LIBRARY_RUNNER_REGISTRY,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import {
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

const runAppStackIntegrationBootstrapMock = vi.fn();
const runRealServerClientBootstrapMock = vi.fn();
const beforeEachTestMock = vi.fn();
const ensureLibraryPlayfieldMock = vi.fn();

vi.mock("miroir-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-core")>();
  return {
    ...actual,
    ensureLibraryPlayfield: (...args: unknown[]) => ensureLibraryPlayfieldMock(...args),
  };
});

vi.mock("./appStackIntegrationBootstrap.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./appStackIntegrationBootstrap.js")>();
  return {
    ...actual,
    runAppStackIntegrationBootstrap: (...args: unknown[]) =>
      runAppStackIntegrationBootstrapMock(...args),
  };
});

vi.mock("../../src/miroir-fwk/4-tests/runRealServerClientBootstrap.js", () => ({
  runRealServerClientBootstrap: (...args: unknown[]) =>
    runRealServerClientBootstrapMock(...args),
}));

vi.mock("../4_view/RunnerIntegTestTools.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../4_view/RunnerIntegTestTools.js")>();
  return {
    ...actual,
    beforeEachTest: (...args: unknown[]) => beforeEachTestMock(...args),
  };
});

import { getTestSessionConfig, RunnerTestSession } from "./RunnerTestSession.js";
import { buildTestSessionModelEnvironment } from "./testSessionModelEnvironment.js";

function runnerLibrarySuite(): MiroirTestSuite {
  return (miroirTest_runner_library as MiroirTestDefinition).definition as MiroirTestSuite;
}

function runnerLibraryRunTarget() {
  return resolveRunnerTestRunTarget({ suite: runnerLibrarySuite() });
}

function baseMiroirConfig(runTarget = runnerLibraryRunTarget()): MiroirConfigClient {
  const storeSection = {
    admin: { emulatedServerType: "sql" },
    model: { emulatedServerType: "sql" },
    data: { emulatedServerType: "sql" },
  };
  return {
    miroirConfigType: "client",
    client: {
      emulateServer: true,
      rootApiUrl: "http://localhost",
      filesystemDeploymentRootDirectory: "/tmp/miroir-test",
      deploymentStorageConfig: {
        [runTarget.deploymentUuid]: storeSection,
        "f714bb2f-a12d-4e71-a03b-74dcedea6eb4": storeSection,
      },
    },
  } as MiroirConfigClient;
}

describe("RunnerTestSession (Gap E R)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureLibraryPlayfieldMock.mockResolvedValue({ created: false });
    const domainController = {
      // Real-server initSession calls ensureLibraryPlayfield, which awaits this
      // to create the ephemeral run-target deployment on the server (B6-c).
      handleCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    } as unknown as DomainControllerInterface;
    const runTarget = runnerLibraryRunTarget();
    runAppStackIntegrationBootstrapMock.mockResolvedValue({
      domainController,
      applicationDeploymentMap: {} as ApplicationDeploymentMap,
      testApplicationUuid: runTarget.applicationUuid,
      persistenceStoreControllerManager: {},
    });
    runRealServerClientBootstrapMock.mockResolvedValue({
      domainController,
      applicationDeploymentMap: {} as ApplicationDeploymentMap,
      testApplicationUuid: runTarget.applicationUuid,
      persistenceStoreControllerManager: {},
    });
    beforeEachTestMock.mockResolvedValue(undefined);
  });

  it("getTestSessionConfig uses runTarget instead of global libraryTestIdentifiers", () => {
    const runTarget = runnerLibraryRunTarget();
    const config = getTestSessionConfig(baseMiroirConfig(runTarget), runTarget);

    const client = config.internalMiroirConfig.client;
    expect(client.emulateServer).toBe(true);
    if (client.emulateServer) {
      expect(client.deploymentStorageConfig[runTarget.deploymentUuid]).toBeDefined();
    }
    expect(config.testDeploymentStorageConfiguration).toBeDefined();
  });

  it("initSession seeds remapped defaultLibraryAppModel for ephemeral runTarget (B6-d2)", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const suite = runnerLibrarySuite();
    const ephemeralApplicationUuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const ephemeralDeploymentUuid = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const runTarget = resolveRunnerTestRunTarget({
      suite: { miroirTestLabel: suite.miroirTestLabel },
      generateUuid: (() => {
        let index = 0;
        return () =>
          index++ === 0 ? ephemeralApplicationUuid : ephemeralDeploymentUuid;
      })(),
    });
    const session = new RunnerTestSession({
      miroirConfig: baseMiroirConfig(runTarget),
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
      runTarget,
      suiteTestParams: suite.testParams,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    });

    const env = await session.initSession();
    const sessionModel = env.runnerTestContext?.testParams
      .defaultLibraryAppModel as MetaModel;

    expect(sessionModel.applicationUuid).toBe(runTarget.applicationUuid);
    expect(sessionModel.applicationUuid).not.toBe(selfApplicationLibrary.uuid);
    expect(sessionModel).toEqual(
      remapLibraryAppModelForRunTarget(
        defaultLibraryAppModel as MetaModel,
        selfApplicationLibrary.uuid as string,
        deployment_Library_DO_NO_USE.uuid,
        runTarget,
      ),
    );
  });

  it("initSession seeds runnerTestContext from suite testParams and runTarget (R6-C)", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const suite = runnerLibrarySuite();
    const runTarget = runnerLibraryRunTarget();
    const session = new RunnerTestSession({
      miroirConfig: baseMiroirConfig(runTarget),
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
      runTarget,
      suiteTestParams: suite.testParams,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    });

    const env = await session.initSession();

    expect(env.runnerTestContext?.runTarget).toEqual(runTarget);
    expect(env.runnerTestContext?.runnerRegistry).toBe(RUNNER_LIBRARY_RUNNER_REGISTRY);
    expect(env.runnerTestContext?.testParams).toEqual(
      buildRunnerTestSessionParamBank(suite.testParams, runTarget, {
        defaultLibraryAppModel: remapLibraryAppModelForRunTarget(
          defaultLibraryAppModel as MetaModel,
          selfApplicationLibrary.uuid as string,
          deployment_Library_DO_NO_USE.uuid,
          runTarget,
        ),
      }),
    );
  });

  it("initSession calls runAppStackIntegrationBootstrap with runner phases", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const runTarget = runnerLibraryRunTarget();
    const session = new RunnerTestSession({
      miroirConfig: baseMiroirConfig(runTarget),
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
      runTarget,
      suiteTestParams: runnerLibrarySuite().testParams,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    });

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phases: getBootstrapPhasesForSessionKind("runner"),
        deployMiroirStrategy: "compositeAction",
        openAdminAndMiroirStoresOnServer: false,
        miroirDeploymentUuid: selfApplicationDeploymentMiroir.uuid,
        miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
        testApplicationUuid: runTarget.applicationUuid,
        customFetch: expect.any(Function),
      }),
    );
    expect(runRealServerClientBootstrapMock).not.toHaveBeenCalled();
  });

  it("initSession uses runRealServerClientBootstrap when emulateServer is false (B6-c C1)", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const runTarget = runnerLibraryRunTarget();
    const realServerConfig = {
      miroirConfigType: "client",
      client: {
        emulateServer: false,
        serverConfig: {
          rootApiUrl: "https://localhost:3080",
          storeSectionConfiguration: {
            [runTarget.deploymentUuid]: {
              admin: { emulatedServerType: "sql" },
              model: { emulatedServerType: "sql" },
              data: { emulatedServerType: "sql" },
            },
            "f714bb2f-a12d-4e71-a03b-74dcedea6eb4": {
              admin: { emulatedServerType: "sql" },
              model: { emulatedServerType: "sql" },
              data: { emulatedServerType: "sql" },
            },
            "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
              admin: { emulatedServerType: "sql" },
              model: { emulatedServerType: "sql" },
              data: { emulatedServerType: "sql" },
            },
          },
        },
      },
    } as MiroirConfigClient;

    const session = new RunnerTestSession({
      miroirConfig: realServerConfig,
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
      runTarget,
      suiteTestParams: runnerLibrarySuite().testParams,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    });

    await session.initSession();

    expect(runRealServerClientBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        platformEnsureMode: "skip",
        testApplicationUuid: runTarget.applicationUuid,
        customFetch: expect.any(Function),
      }),
    );
    expect(runAppStackIntegrationBootstrapMock).not.toHaveBeenCalled();
  });

  it("beforeEach delegates to beforeEachTest", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const runTarget = runnerLibraryRunTarget();
    const session = new RunnerTestSession({
      miroirConfig: baseMiroirConfig(runTarget),
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
      runTarget,
      suiteTestParams: runnerLibrarySuite().testParams,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    });

    await session.initSession();
    await session.beforeEach();

    expect(beforeEachTestMock).toHaveBeenCalledTimes(1);
  });

  it("beforeEach forwards libraryPlayfieldSeed and remaps its metaModel for runTarget", async () => {
    const { domainControllerDataCrudLibraryPlayfieldSeed } = await import(
      "./libraryPlayfieldSeeds.js"
    );
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const runTarget = runnerLibraryRunTarget();
    const session = new RunnerTestSession({
      miroirConfig: baseMiroirConfig(runTarget),
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
      runTarget,
      suiteTestParams: runnerLibrarySuite().testParams,
      runnerRegistry: {},
      libraryPlayfieldSeed: domainControllerDataCrudLibraryPlayfieldSeed,
    });

    await session.initSession();
    await session.beforeEach();

    expect(beforeEachTestMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      {
        applicationUuid: runTarget.applicationUuid,
        deploymentUuid: runTarget.deploymentUuid,
      },
      expect.objectContaining({
        clearDocumentBody: false,
        resetMiroirPlatform: true,
        libraryEntitiesAndInstances:
          domainControllerDataCrudLibraryPlayfieldSeed.libraryEntitiesAndInstances,
        librarySeedInitParams:
          domainControllerDataCrudLibraryPlayfieldSeed.librarySeedInitParams,
        librarySeedMetaModel: expect.objectContaining({
          applicationUuid: runTarget.applicationUuid,
        }),
      }),
    );
  });

  it("beforeEach preserves custom seed metaModel entities (not defaultLibraryAppModel)", async () => {
    const { libraryPlayfieldSeedInitParams } = await import("./libraryPlayfieldSeeds.js");
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const runTarget = runnerLibraryRunTarget();
    const customEntityUuid = "44691d2c-d7c1-48e0-8363-71c51195e104";
    const customMetaModel = {
      applicationUuid: selfApplicationLibrary.uuid,
      applicationName: "Library",
      entities: [{ uuid: customEntityUuid, name: "TestEntityCompositePK" }],
      entityDefinitions: [
        { uuid: "fbec9082-5cdf-4877-bd78-66a434a8eebf", entityUuid: customEntityUuid },
      ],
      endpoints: [],
      jzodSchemas: [],
      menus: [],
      runners: [],
      themes: [],
      applicationVersions: [],
      reports: [],
      storedQueries: [],
      applicationVersionCrossEntityDefinition: [],
      applications: [],
    } as unknown as MetaModel;
    const session = new RunnerTestSession({
      miroirConfig: baseMiroirConfig(runTarget),
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
      runTarget,
      suiteTestParams: runnerLibrarySuite().testParams,
      runnerRegistry: {},
      libraryPlayfieldSeed: {
        libraryEntitiesAndInstances: [],
        librarySeedInitParams: libraryPlayfieldSeedInitParams,
        librarySeedMetaModel: customMetaModel,
      },
    });

    await session.initSession();
    await session.beforeEach();

    const forwarded = beforeEachTestMock.mock.calls[0][3] as {
      librarySeedMetaModel: MetaModel;
    };
    expect(forwarded.librarySeedMetaModel.entities.map((e) => e.uuid)).toEqual([
      customEntityUuid,
    ]);
  });

  it("teardown drops runTarget deployment stores via composite action (B4)", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const runTarget = runnerLibraryRunTarget();
    const domainController = {
      handleCompositeAction: vi.fn().mockResolvedValue({}),
    } as unknown as DomainControllerInterface;
    runAppStackIntegrationBootstrapMock.mockResolvedValueOnce({
      domainController,
      applicationDeploymentMap: {} as ApplicationDeploymentMap,
      testApplicationUuid: runTarget.applicationUuid,
      persistenceStoreControllerManager: {},
    });

    const session = new RunnerTestSession({
      miroirConfig: baseMiroirConfig(runTarget),
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
      runTarget,
      suiteTestParams: runnerLibrarySuite().testParams,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    });

    await session.initSession();
    vi.mocked(domainController.handleCompositeAction).mockClear();

    await session.teardown();

    expect(domainController.handleCompositeAction).toHaveBeenCalledTimes(1);
    const [action, applicationDeploymentMapArg, modelEnvironmentArg, optionsArg] = vi.mocked(
      domainController.handleCompositeAction,
    ).mock.calls[0]!;
    expect(action.actionLabel).toBe("teardownTestApplicationStores");
    expect(action.payload.actionSequence.map((step: { actionType: string }) => step.actionType)).toEqual([
      "storeManagementAction_deleteStore",
      "storeManagementAction_closeStore",
      "deleteInstance",
      "deleteInstance",
    ]);
    expect(action.payload.actionSequence[0]?.payload).toMatchObject({
      deploymentUuid: runTarget.deploymentUuid,
      application: runTarget.applicationUuid,
    });
    expect(action.payload.actionSequence[2]?.payload).toMatchObject({
      objects: [{ uuid: runTarget.deploymentUuid }],
    });
    expect(action.payload.actionSequence[3]?.payload).toMatchObject({
      objects: [{ uuid: runTarget.applicationUuid }],
    });
    expect(applicationDeploymentMapArg[runTarget.applicationUuid]).toBe(runTarget.deploymentUuid);
    const remappedLibraryModel = remapLibraryAppModelForRunTarget(
      defaultLibraryAppModel as MetaModel,
      selfApplicationLibrary.uuid as string,
      deployment_Library_DO_NO_USE.uuid,
      runTarget,
    );
    expect(modelEnvironmentArg).toEqual(
      buildTestSessionModelEnvironment(runTarget.deploymentUuid, remappedLibraryModel),
    );
    expect(optionsArg).toEqual({});
  });
});
