import { describe, expect, it, vi } from "vitest";

import {
  getBootstrapPhasesForSessionKind,
  getPlayfieldForSessionKind,
} from "../../src/5_tests/IntegrationTestBootstrap";
import {
  createDefaultMiroirTestIntegrationOrchestrator,
  createUnconfiguredMiroirTestIntegrationOrchestrator,
  type IntegrationTestSessionFactory,
} from "../../src/5_tests/MiroirTestIntegrationOrchestrator";
import type { IntegrationTestSessionKind } from "../../src/5_tests/IntegrationTestBootstrap";
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
      playfield: "libraryDeployment",
    });
  });

  it("describeSession exposes playfield metadata for UI catalog (#197)", () => {
    const orchestrator = createDefaultMiroirTestIntegrationOrchestrator({
      createSession: vi.fn(),
    });

    const catalogKinds: IntegrationTestSessionKind[] = [
      "transformer",
      "appStackPsc",
      "runner",
    ];

    for (const kind of catalogKinds) {
      const descriptor = orchestrator.describeSession(kind);
      expect(descriptor.kind).toBe(kind);
      expect(descriptor.playfield).toBe(getPlayfieldForSessionKind(kind));
      expect(descriptor.bootstrapPhases).toEqual(getBootstrapPhasesForSessionKind(kind));
    }

    expect(orchestrator.describeSession("transformer").playfield).toBe("testApplication");
    expect(orchestrator.describeSession("appStackPsc").playfield).toBe("libraryDeployment");
    expect(orchestrator.describeSession("runner").playfield).toBe("libraryDeployment");
  });

  it("createSession forwards playfieldMode in orchestrator context to factory", () => {
    const factory: IntegrationTestSessionFactory = {
      createSession: vi.fn().mockReturnValue({
        initSession: vi.fn(),
        beforeEach: vi.fn(),
        teardown: vi.fn(),
      } satisfies RunnerTestSessionInterface),
    };
    const orchestrator = createDefaultMiroirTestIntegrationOrchestrator(factory);
    const context = { ...baseContext(), playfieldMode: "requireExisting" as const };

    orchestrator.createSession("appStackPsc", context, { adminDeployment: {} });

    expect(factory.createSession).toHaveBeenCalledWith({
      kind: "appStackPsc",
      context,
      sessionSpecificOptions: { adminDeployment: {} },
    });
  });

  it("unconfigured orchestrator throws on createSession", () => {
    const orchestrator = createUnconfiguredMiroirTestIntegrationOrchestrator();

    expect(() => orchestrator.createSession("runner", baseContext())).toThrow(
      /IntegrationTestSessionFactory not registered/,
    );
  });
});
