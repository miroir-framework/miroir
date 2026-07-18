import { describe, expect, it } from "vitest";

import type { MiroirConfigClient, StoreUnitConfiguration } from "miroir-core";
import { deployment_Admin } from "miroir-test-app_deployment-admin";
import { deployment_Library_DO_NO_USE } from "miroir-test-app_deployment-library";

import {
  PINNED_INTEG_TEST_APPLICATION_IDENTITY,
} from "../../src/miroir-fwk/4-tests/IntegrationTestSession.js";
import {
  buildTransformerApplicationDeploymentMap,
  buildTransformerInitApplicationParameters,
  deriveEphemeralTestApplicationStorageConfiguration,
  resolveAdminDeploymentFromMiroirConfig,
  resolveLibraryTemplateStorageFromMiroirConfig,
  sanitizeStoreIdentifier,
} from "../../src/miroir-fwk/4-tests/transformerTestApplicationPlayfield.js";

describe("transformerTestApplicationPlayfield builders", () => {
  it("sanitizeStoreIdentifier replaces hyphens and leading digits", () => {
    expect(sanitizeStoreIdentifier("testApplication-abc12345")).toBe(
      "testApplication_abc12345",
    );
    expect(sanitizeStoreIdentifier("123bad")).toBe("app_123bad");
  });

  it("deriveEphemeralTestApplicationStorageConfiguration clones sql schema names", () => {
    const template: StoreUnitConfiguration = {
      admin: {
        emulatedServerType: "sql",
        connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        schema: "miroirAdmin",
      },
      model: {
        emulatedServerType: "sql",
        connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        schema: "library",
        forceNullOptionalAttributeToUndefined: true,
      },
      data: {
        emulatedServerType: "sql",
        connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        schema: "library",
        forceNullOptionalAttributeToUndefined: true,
      },
    };

    const derived = deriveEphemeralTestApplicationStorageConfiguration(
      template,
      "testApplication-ab12cd34",
    );

    expect(derived.model).toMatchObject({
      emulatedServerType: "sql",
      schema: "testApplication_ab12cd34",
    });
    expect(derived.data).toMatchObject({
      emulatedServerType: "sql",
      schema: "testApplication_ab12cd34",
    });
    expect(derived.admin).toEqual(template.admin);
  });

  it("deriveEphemeralTestApplicationStorageConfiguration clones indexedDb names", () => {
    const template: StoreUnitConfiguration = {
      admin: { emulatedServerType: "indexedDb", indexedDbName: "admin" },
      model: { emulatedServerType: "indexedDb", indexedDbName: "library" },
      data: { emulatedServerType: "indexedDb", indexedDbName: "library" },
    };
    const derived = deriveEphemeralTestApplicationStorageConfiguration(
      template,
      "testApplication-zz",
    );
    expect(derived.model).toEqual({
      emulatedServerType: "indexedDb",
      indexedDbName: "testApplication_zz",
    });
  });

  it("buildTransformerApplicationDeploymentMap merges identity deployment", () => {
    const map = buildTransformerApplicationDeploymentMap(PINNED_INTEG_TEST_APPLICATION_IDENTITY);
    expect(map[PINNED_INTEG_TEST_APPLICATION_IDENTITY.applicationUuid]).toBe(
      PINNED_INTEG_TEST_APPLICATION_IDENTITY.deploymentUuid,
    );
  });

  it("buildTransformerInitApplicationParameters uses identity name/uuids", () => {
    const params = buildTransformerInitApplicationParameters(
      PINNED_INTEG_TEST_APPLICATION_IDENTITY,
    );
    expect(params.selfApplication.name).toBe(
      PINNED_INTEG_TEST_APPLICATION_IDENTITY.applicationName,
    );
    expect(params.selfApplication.uuid).toBe(
      PINNED_INTEG_TEST_APPLICATION_IDENTITY.applicationUuid,
    );
  });

  it("resolves library template and admin from realServer miroirConfig", () => {
    const libraryUuid = deployment_Library_DO_NO_USE.uuid;
    const adminUuid = deployment_Admin.uuid;
    const miroirConfig = {
      miroirConfigType: "client",
      client: {
        emulateServer: false,
        serverConfig: {
          rootApiUrl: "https://localhost:3080",
          storeSectionConfiguration: {
            [adminUuid]: {
              admin: { emulatedServerType: "filesystem", directory: "admin" },
              model: { emulatedServerType: "filesystem", directory: "admin_model" },
              data: { emulatedServerType: "filesystem", directory: "admin_data" },
            },
            [libraryUuid]: {
              admin: {
                emulatedServerType: "sql",
                connectionString: "postgres://x",
                schema: "miroirAdmin",
              },
              model: {
                emulatedServerType: "sql",
                connectionString: "postgres://x",
                schema: "library",
              },
              data: {
                emulatedServerType: "sql",
                connectionString: "postgres://x",
                schema: "library",
              },
            },
          },
        },
      },
    } as MiroirConfigClient;

    const library = resolveLibraryTemplateStorageFromMiroirConfig(miroirConfig);
    expect(library.model.emulatedServerType).toBe("sql");

    const admin = resolveAdminDeploymentFromMiroirConfig(miroirConfig);
    expect(admin.uuid).toBe(adminUuid);
    expect(admin.configuration.model.emulatedServerType).toBe("filesystem");
  });
});
