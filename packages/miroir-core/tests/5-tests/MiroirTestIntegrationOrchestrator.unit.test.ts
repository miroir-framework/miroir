import { describe, expect, it, vi } from "vitest";

import {
  createDefaultMiroirTestIntegrationOrchestrator,
  createUnconfiguredMiroirTestIntegrationOrchestrator,
  type IntegrationTestSessionFactory,
} from "../../src/5_tests/MiroirTestIntegrationOrchestrator";
import { getBootstrapPhasesForSessionKind } from "../../src/5_tests/IntegrationTestBootstrap";
import type { MiroirConfigClient } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { RunnerTestSessionInterface } from "../../src/5_tests/MiroirTestTools";

function baseContext(): { miroirConfig: MiroirConfigClient } {
  return {
    miroirConfig: {
      miroirConfigType: "client",
      client: {
        emulateServer: true,
        rootApiUrl: "http://localhost",
        filesystemDeploymentRootDirectory: "/tmp/miroir-test",
        deploymentStorageConfig: {},
      },
    } as MiroirConfigClient,
  };
}

describe("MiroirTestIntegrationOrchestrator (Gap E O)", () => {
  it("createSession delegates to IntegrationTestSessionFactory with correct kind", () => {
    const mockSession = {
      initSession: vi.fn(),
      beforeEach: vi.fn(),
      teardown: vi.fn(),
    } satisfies RunnerTestSessionInterface;

    const factory: IntegrationTestSessionFactory = {
      createSession: vi.fn().mockReturnValue(mockSession),
    };

    const orchestrator = createDefaultMiroirTestIntegrationOrchestrator(factory);
    const context = baseContext();
    const sessionSpecificOptions = { applicationName: "testApplication" };

    const session = orchestrator.createSession("transformer", context, sessionSpecificOptions);

    expect(factory.createSession).toHaveBeenCalledWith({
      kind: "transformer",
      context,
      sessionSpecificOptions,
    });
    expect(session).toBe(mockSession);
  });

  it("describeSession returns descriptor from getBootstrapPhasesForSessionKind", () => {
    const factory: IntegrationTestSessionFactory = {
      createSession: vi.fn(),
    };
    const orchestrator = createDefaultMiroirTestIntegrationOrchestrator(factory);

    expect(orchestrator.describeSession("appStackPsc")).toEqual({
      kind: "appStackPsc",
      bootstrapPhases: getBootstrapPhasesForSessionKind("appStackPsc"),
    });
  });

  it("unconfigured orchestrator throws on createSession", () => {
    const orchestrator = createUnconfiguredMiroirTestIntegrationOrchestrator();

    expect(() => orchestrator.createSession("runner", baseContext())).toThrow(
      /IntegrationTestSessionFactory not registered/,
    );
  });
});
