import { describe, expect, it } from "vitest";

import {
  resolveEphemeralIndexedDbBaseName,
  testApplicationStorageConfiguration,
} from "./RunnerIntegTestTools.js";

describe("testApplicationStorageConfiguration", () => {
  it("routes indexedDb ephemeral stores under tests/tmp when the template does", () => {
    const configuration = testApplicationStorageConfiguration(
      {
        admin: {
          emulatedServerType: "indexedDb",
          indexedDbName: "miroir-standalone-app/tests/tmp/indexedDb-admin",
        },
        model: {
          emulatedServerType: "indexedDb",
          indexedDbName: "miroir-standalone-app/tests/tmp/indexedDb-appForTest",
        },
        data: {
          emulatedServerType: "indexedDb",
          indexedDbName: "miroir-standalone-app/tests/tmp/indexedDb-appForTest",
        },
        modelVersion: {
          emulatedServerType: "indexedDb",
          indexedDbName: "miroir-standalone-app/tests/tmp/indexedDb-appForTest_modelVersion",
        },
      },
      "appForTest",
    );

    expect(configuration.model).toEqual({
      emulatedServerType: "indexedDb",
      indexedDbName: "miroir-standalone-app/tests/tmp/indexedDb-appForTest",
    });
    expect(configuration.data).toEqual({
      emulatedServerType: "indexedDb",
      indexedDbName: "miroir-standalone-app/tests/tmp/indexedDb-appForTest",
    });
    expect(configuration.modelVersion).toEqual({
      emulatedServerType: "indexedDb",
      indexedDbName: "miroir-standalone-app/tests/tmp/indexedDb-appForTest_modelVersion",
    });
  });

  it("keeps short indexedDb names for browser UI templates", () => {
    expect(
      resolveEphemeralIndexedDbBaseName(
        {
          admin: { emulatedServerType: "indexedDb", indexedDbName: "ui-integ-admin" },
          model: { emulatedServerType: "indexedDb", indexedDbName: "ui-integ-appForTest" },
          data: { emulatedServerType: "indexedDb", indexedDbName: "ui-integ-appForTest" },
        },
        "appForTest",
      ),
    ).toBe("appForTest");
  });

  it("creates a distinct MongoDB database for the ephemeral test deployment", () => {
    const configuration = testApplicationStorageConfiguration(
      {
        admin: {
          emulatedServerType: "mongodb",
          connectionString: "mongodb://localhost:27017",
          database: "miroir-admin",
        },
        model: {
          emulatedServerType: "mongodb",
          connectionString: "mongodb://localhost:27017",
          database: "library",
        },
        data: {
          emulatedServerType: "mongodb",
          connectionString: "mongodb://localhost:27017",
          database: "library",
        },
      },
      "runner_library_ephemeral",
    );

    expect(configuration).toMatchObject({
      admin: {
        emulatedServerType: "mongodb",
        database: "miroir-admin",
      },
      model: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: "runner_library_ephemeral",
      },
      data: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: "runner_library_ephemeral",
      },
      modelVersion: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: "runner_library_ephemeral_modelVersion",
      },
    });
  });
});
