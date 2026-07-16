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
const beforeEachTestMock = vi.fn();

vi.mock("./appStackIntegrationBootstrap.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./appStackIntegrationBootstrap.js")>();
  return {
    ...actual,
    runAppStackIntegrationBootstrap: (...args: unknown[]) =>
      runAppStackIntegrationBootstrapMock(...args),
  };
});

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
    const domainController = {
      handleCompositeAction: vi.fn(),
    } as unknown as DomainControllerInterface;
    const runTarget = runnerLibraryRunTarget();
    runAppStackIntegrationBootstrapMock.mockResolvedValue({
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
    expect(action.payload.actionSequence[0]?.payload).toMatchObject({
      deploymentUuid: runTarget.deploymentUuid,
      application: runTarget.applicationUuid,
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
