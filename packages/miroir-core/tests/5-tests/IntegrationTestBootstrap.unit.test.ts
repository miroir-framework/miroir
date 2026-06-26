import { describe, expect, it } from "vitest";

import {
  describeIntegrationTestSession,
  getBootstrapPhasesForDomainControllerProfile,
  getBootstrapPhasesForSessionKind,
  getPlayfieldForDomainControllerProfile,
  getPlayfieldForSessionKind,
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
      playfield: "testApplication",
    });
    expect(
      describeIntegrationTestSession("domainController", "miroirPlatform"),
    ).toEqual({
      kind: "domainController",
      bootstrapPhases: ["wireEmulatedStack", "deployMiroir", "resetMiroirModel"],
      playfield: "none",
    });
  });
});

describe("IntegrationTestBootstrap playfield (Gap B L0)", () => {
  it("maps every session kind to exactly one playfield", () => {
    expect(getPlayfieldForSessionKind("transformer")).toBe("testApplication");
    expect(getPlayfieldForSessionKind("appStackPsc")).toBe("libraryDeployment");
    expect(getPlayfieldForSessionKind("runner")).toBe("libraryDeployment");
    expect(() => getPlayfieldForSessionKind("domainController")).toThrow(
      /getPlayfieldForDomainControllerProfile/,
    );
    expect(getPlayfieldForDomainControllerProfile("miroirPlatform")).toBe("none");
    expect(getPlayfieldForDomainControllerProfile("miroirAndLibrary")).toBe(
      "libraryDeployment",
    );
  });

  it("describeIntegrationTestSession includes playfield for all kinds", () => {
    expect(describeIntegrationTestSession("appStackPsc")).toEqual({
      kind: "appStackPsc",
      bootstrapPhases: getBootstrapPhasesForSessionKind("appStackPsc"),
      playfield: "libraryDeployment",
    });
    expect(
      describeIntegrationTestSession("domainController", "miroirAndLibrary"),
    ).toEqual({
      kind: "domainController",
      bootstrapPhases: getBootstrapPhasesForDomainControllerProfile("miroirAndLibrary"),
      playfield: "libraryDeployment",
    });
  });
});
