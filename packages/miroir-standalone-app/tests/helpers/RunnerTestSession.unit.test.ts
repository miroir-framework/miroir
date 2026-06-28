import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  MiroirConfigClient,
} from "miroir-core";
import {
  buildRunnerTestSessionParamBank,
  getBootstrapPhasesForSessionKind,
  MiroirActivityTracker,
  MiroirEventService,
  resolveRunnerTestRunTarget,
} from "miroir-core";
import { defaultLibraryAppModel, miroirTest_runner_library } from "miroir-test-app_deployment-library";
import type { MiroirTestDefinition, MiroirTestSuite } from "miroir-core";
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

function runnerLibrarySuite(): MiroirTestSuite {
  return (miroirTest_runner_library as MiroirTestDefinition).definition as MiroirTestSuite;
}

function runnerLibraryRunTarget() {
  return resolveRunnerTestRunTarget({ suite: runnerLibrarySuite() });
}

function baseMiroirConfig(runTarget = runnerLibraryRunTarget()): MiroirConfigClient {
  return {
    miroirConfigType: "client",
    client: {
      emulateServer: true,
      rootApiUrl: "http://localhost",
      filesystemDeploymentRootDirectory: "/tmp/miroir-test",
      deploymentStorageConfig: {
        [runTarget.deploymentUuid]: {
          admin: { emulatedServerType: "sql" },
          model: { emulatedServerType: "sql" },
          data: { emulatedServerType: "sql" },
        },
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

    expect(config.internalMiroirConfig.client?.deploymentStorageConfig?.[runTarget.deploymentUuid]).toBeDefined();
    expect(config.testDeploymentStorageConfiguration).toBeDefined();
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
    });

    const env = await session.initSession();

    expect(env.runnerTestContext?.runTarget).toEqual(runTarget);
    expect(env.runnerTestContext?.testParams).toEqual(
      buildRunnerTestSessionParamBank(suite.testParams, runTarget, {
        defaultLibraryAppModel,
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
    });

    await session.initSession();
    await session.beforeEach();

    expect(beforeEachTestMock).toHaveBeenCalledTimes(1);
  });
});
