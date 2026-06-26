import { describe, expect, it } from "vitest";

import {
  describeIntegrationTestSession,
  getBootstrapPhasesForDomainControllerProfile,
  getBootstrapPhasesForSessionKind,
} from "../../src/5_tests/IntegrationTestBootstrap";

describe("IntegrationTestBootstrap (Gap E B0)", () => {
  it("transformer session has no wireEmulatedStack phase", () => {
    const phases = getBootstrapPhasesForSessionKind("transformer");
    expect(phases).not.toContain("wireEmulatedStack");
    expect(phases).toEqual([]);
  });

  it("appStackPsc session wires emulated stack and deploys miroir + library", () => {
    expect(getBootstrapPhasesForSessionKind("appStackPsc")).toEqual([
      "wireEmulatedStack",
      "deployMiroir",
      "deployLibrary",
    ]);
  });

  it("runner session wires emulated stack and deploys miroir only", () => {
    expect(getBootstrapPhasesForSessionKind("runner")).toEqual([
      "wireEmulatedStack",
      "deployMiroir",
    ]);
  });

  it("domainController kind requires profile-specific phases", () => {
    expect(() => getBootstrapPhasesForSessionKind("domainController")).toThrow(
      /getBootstrapPhasesForDomainControllerProfile/,
    );
    expect(getBootstrapPhasesForDomainControllerProfile("miroirPlatform")).toEqual([
      "wireEmulatedStack",
      "deployMiroir",
      "resetMiroirModel",
    ]);
    expect(getBootstrapPhasesForDomainControllerProfile("miroirAndLibrary")).toEqual([
      "wireEmulatedStack",
      "deployMiroir",
      "deployLibrary",
    ]);
  });

  it("describeIntegrationTestSession returns descriptor for each kind", () => {
    expect(describeIntegrationTestSession("transformer")).toEqual({
      kind: "transformer",
      bootstrapPhases: [],
    });
    expect(
      describeIntegrationTestSession("domainController", "miroirPlatform"),
    ).toEqual({
      kind: "domainController",
      bootstrapPhases: ["wireEmulatedStack", "deployMiroir", "resetMiroirModel"],
    });
  });
});
