import { describe, expect, it } from "vitest";

import { ephemeralStoreIdentifier } from "../../src/miroir-fwk/4-tests/runnerIntegTestSupport.js";
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
      "runner_return_document_ephemeral",
    );

    expect(configuration).toMatchObject({
      admin: {
        emulatedServerType: "mongodb",
        database: "miroir-admin",
      },
      model: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: "runner_return_document_ephemeral",
      },
      data: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: "runner_return_document_ephemeral",
      },
      modelVersion: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: "runner_return_document_ephemeral_modelVersion",
      },
    });
  });

  it("suffixes sql schemas with the isolation key so ephemeral runs do not share Library", () => {
    const isolationKey = "0e776954-723b-4718-b320-49a83a1d2b08";
    const configuration = testApplicationStorageConfiguration(
      {
        admin: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: "miroirAdmin",
        },
        model: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: "Library",
        },
        data: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: "Library",
        },
      },
      "Library",
      isolationKey,
    );

    expect(configuration.model).toMatchObject({
      emulatedServerType: "sql",
      schema: "Library_0e776954723b4718b32049a83a1d2b08",
    });
    expect(configuration.data).toMatchObject({
      emulatedServerType: "sql",
      schema: "Library_0e776954723b4718b32049a83a1d2b08",
    });
    expect(configuration.modelVersion).toMatchObject({
      emulatedServerType: "sql",
      schema: "Library_0e776954723b4718b32049a83a1d2b08_modelVersion",
    });
  });

  it("keeps the isolation key and _modelVersion suffix when the application name is long", () => {
    const isolationKey = "0e776954-723b-4718-b320-49a83a1d2b08";
    const longName = "A".repeat(62);
    const identifier = ephemeralStoreIdentifier(longName, isolationKey);
    expect(identifier).toContain("0e776954723b4718b32049a83a1d2b08");
    expect(identifier.length).toBeLessThanOrEqual(63 - "_modelVersion".length);
    expect(`${identifier}_modelVersion`.length).toBeLessThanOrEqual(63);

    const otherKey = "11111111-1111-4111-8111-111111111111";
    expect(ephemeralStoreIdentifier(longName, isolationKey)).not.toBe(
      ephemeralStoreIdentifier(longName, otherKey),
    );
  });

  it("suffixes sql schemas with the isolation key so ephemeral runs do not share Library", () => {
    const isolationKey = "0e776954-723b-4718-b320-49a83a1d2b08";
    const configuration = testApplicationStorageConfiguration(
      {
        admin: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: "miroirAdmin",
        },
        model: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: "Library",
        },
        data: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: "Library",
        },
      },
      "Library",
      isolationKey,
    );

    expect(configuration.model).toMatchObject({
      emulatedServerType: "sql",
      schema: "Library_0e776954723b4718b32049a83a1d2b08",
    });
    expect(configuration.data).toMatchObject({
      emulatedServerType: "sql",
      schema: "Library_0e776954723b4718b32049a83a1d2b08",
    });
    expect(configuration.modelVersion).toMatchObject({
      emulatedServerType: "sql",
      schema: "Library_0e776954723b4718b32049a83a1d2b08_modelVersion",
    });
  });

  it("puts filesystem test applications next to their template in a test environment (#321)", () => {
    const configuration = testApplicationStorageConfiguration(
      {
        admin: { emulatedServerType: "filesystem", directory: ".miroir/test-filesystem/library" },
        model: { emulatedServerType: "filesystem", directory: ".miroir/test-filesystem/library/model" },
        data: { emulatedServerType: "filesystem", directory: ".miroir/test-filesystem/library/data" },
        modelVersion: {
          emulatedServerType: "filesystem",
          directory: ".miroir/test-filesystem/library/modelVersion",
        },
      },
      "Library",
      "0e776954-723b-4718-b320-49a83a1d2b08",
    );

    expect(configuration).toEqual({
      admin: { emulatedServerType: "filesystem", directory: ".miroir/test-filesystem/library" },
      model: {
        emulatedServerType: "filesystem",
        directory: ".miroir/test-filesystem/Library_0e776954723b4718b32049a83a1d2b08/model",
      },
      data: {
        emulatedServerType: "filesystem",
        directory: ".miroir/test-filesystem/Library_0e776954723b4718b32049a83a1d2b08/data",
      },
      modelVersion: {
        emulatedServerType: "filesystem",
        directory: ".miroir/test-filesystem/Library_0e776954723b4718b32049a83a1d2b08/modelVersion",
      },
    });
  });

  it("puts indexedDb test applications next to their template in a test environment (#321)", () => {
    const template = (name: string) => ({ emulatedServerType: "indexedDb" as const, indexedDbName: name });
    const configuration = testApplicationStorageConfiguration(
      {
        admin: template(".miroir/test-indexedDb/library/indexedDb"),
        model: template(".miroir/test-indexedDb/library/indexedDb"),
        data: template(".miroir/test-indexedDb/library/indexedDb"),
        modelVersion: template(".miroir/test-indexedDb/library/indexedDb_modelVersion"),
      },
      "appForTest",
    );

    expect(configuration.model).toEqual(template(".miroir/test-indexedDb/appForTest/indexedDb"));
    expect(configuration.data).toEqual(template(".miroir/test-indexedDb/appForTest/indexedDb"));
    expect(configuration.modelVersion).toEqual(template(".miroir/test-indexedDb/appForTest/indexedDb_modelVersion"));
  });

  it("opens sql test applications on the template's server (#321)", () => {
    const connectionString = "postgres://postgres:secret@db.example:5433/postgres";
    const template = (schema: string) => ({ emulatedServerType: "sql" as const, connectionString, schema });
    const configuration = testApplicationStorageConfiguration(
      {
        admin: template("test_sql_library"),
        model: template("test_sql_library"),
        data: template("test_sql_library"),
      },
      "Library",
    );

    expect(configuration.model).toEqual({ emulatedServerType: "sql", connectionString, schema: "Library" });
    expect(configuration.modelVersion).toEqual({
      emulatedServerType: "sql",
      connectionString,
      schema: "Library_modelVersion",
    });
  });
});
