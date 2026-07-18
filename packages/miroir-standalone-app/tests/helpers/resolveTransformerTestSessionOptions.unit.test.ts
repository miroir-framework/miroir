import { describe, expect, it } from "vitest";

import type { MiroirConfigClient } from "miroir-core";

import {
  isBrowserEmulatedTransformerProfile,
  isRealServerTransformerProfile,
  resolveBrowserTransformerTestSessionOptions,
  resolveRealServerTransformerTestSessionOptions,
} from "../../src/miroir-fwk/4-tests/resolveTransformerTestSessionOptions.js";
import { isRealServerTransformerSessionOptions } from "../../src/miroir-fwk/4-tests/RealServerTransformerTestSession.js";

function realServerSqlConfig(): MiroirConfigClient {
  return {
    miroirConfigType: "client",
    client: {
      emulateServer: false,
      serverConfig: {
        rootApiUrl: "https://localhost:3080",
        storeSectionConfiguration: {},
      },
    },
  } as MiroirConfigClient;
}

function emulatedIndexedDbConfig(): MiroirConfigClient {
  return {
    miroirConfigType: "client",
    client: {
      emulateServer: true,
      rootApiUrl: "http://localhost",
      filesystemDeploymentRootDirectory: "/tmp",
      deploymentStorageConfig: {},
    },
  } as MiroirConfigClient;
}

describe("resolveTransformerTestSessionOptions realServer vs indexedDb", () => {
  it("detects emulated vs realServer profiles", () => {
    expect(isBrowserEmulatedTransformerProfile(emulatedIndexedDbConfig())).toBe(true);
    expect(isRealServerTransformerProfile(emulatedIndexedDbConfig())).toBe(false);
    expect(isBrowserEmulatedTransformerProfile(realServerSqlConfig())).toBe(false);
    expect(isRealServerTransformerProfile(realServerSqlConfig())).toBe(true);
  });

  it("resolves IndexedDB + bundled admin for emulated browser path", () => {
    const options = resolveBrowserTransformerTestSessionOptions({
      runTargetMode: "ephemeral",
      bundledDeploymentData: {},
      profileName: "emulatedServer-indexedDb",
    });
    expect(options.testApplicationStore.emulatedServerType).toBe("indexedDb");
    expect(options.adminStore.emulatedServerType).toBe("bundled");
    expect(isRealServerTransformerSessionOptions(options)).toBe(false);
  });

  it("resolves transport:realServer for realServer-sql", () => {
    const options = resolveRealServerTransformerTestSessionOptions({
      profileName: "realServer-sql",
      runTargetMode: "ephemeral",
      miroirConfig: realServerSqlConfig(),
    });
    expect(options.transport).toBe("realServer");
    expect(options.platformEnsureMode).toBe("skip");
    expect(options.applicationIdentity?.applicationName).toMatch(/^testApplication-/);
    expect(isRealServerTransformerSessionOptions(options)).toBe(true);
  });

  it("rejects non-sql realServer profiles for transformer", () => {
    expect(() =>
      resolveRealServerTransformerTestSessionOptions({
        profileName: "realServer-filesystem",
        runTargetMode: "ephemeral",
        miroirConfig: realServerSqlConfig(),
      }),
    ).toThrow(/realServer-sql/);
  });
});
