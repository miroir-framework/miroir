import { describe, expect, it } from "vitest";

import { canonicalStoreIdentifier, ephemeralStoreIdentifier } from "../../src/miroir-fwk/4-tests/runnerIntegTestSupport.js";
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

// #477 Slice 2: a test application installed at runtime on SQL or MongoDB carries the name of the
// test environment state its template lives in, so parallel nonreg workers do not share it.
describe("test applications of a test environment on SQL and MongoDB (#477)", () => {
  it("refuses a canonical store name that the _modelVersion suffix would push past 63 characters", () => {
    expect(canonicalStoreIdentifier("testApplication", "test_sql_w2")).toBe("test_sql_w2_testApplication");
    expect(() => canonicalStoreIdentifier("a".repeat(40), "test_mongodb_w12")).toThrow(/too long/);
  });

  const sqlTemplate = (state: string) => ({
    admin: { emulatedServerType: "filesystem" as const, directory: `.miroir/${state}/admin` },
    model: { emulatedServerType: "sql" as const, connectionString: "postgres://postgres@localhost:5432/postgres", schema: "x_library" },
    data: { emulatedServerType: "sql" as const, connectionString: "postgres://postgres@localhost:5432/postgres", schema: "x_library" },
  });
  const mongoTemplate = (state: string) => ({
    admin: { emulatedServerType: "filesystem" as const, directory: `.miroir/${state}/admin` },
    model: { emulatedServerType: "mongodb" as const, connectionString: "mongodb://localhost:27017", database: "x_library" },
    data: { emulatedServerType: "mongodb" as const, connectionString: "mongodb://localhost:27017", database: "x_library" },
  });

  it("prefixes the SQL schemas with the worker state of the template", () => {
    const configuration = testApplicationStorageConfiguration(sqlTemplate("test-sql@w2"), "Library");

    expect(configuration.model).toMatchObject({ schema: "test_sql_w2_Library" });
    expect(configuration.data).toMatchObject({ schema: "test_sql_w2_Library" });
    expect(configuration.modelVersion).toMatchObject({ schema: "test_sql_w2_Library_modelVersion" });
  });

  it("prefixes the SQL schemas with the environment of a run without a worker", () => {
    const configuration = testApplicationStorageConfiguration(sqlTemplate("test-sql"), "Library");

    expect(configuration.model).toMatchObject({ schema: "test_sql_Library" });
  });

  // environments/test-sql.json: every section of Library is on SQL, Admin is a filesystem copy in the state
  const sqlLibraryOfEnvironment = (prefix: string) => {
    const store = (schema: string) => ({
      emulatedServerType: "sql" as const,
      connectionString: "postgres://postgres@localhost:5432/postgres",
      schema,
    });
    return { admin: store(`${prefix}_library_admin`), model: store(`${prefix}_library`), data: store(`${prefix}_library`) };
  };
  const adminApplicationOf = (state: string) => ({
    admin: { emulatedServerType: "filesystem" as const, directory: `.miroir/${state}/admin` },
    model: { emulatedServerType: "filesystem" as const, directory: `.miroir/${state}/admin/model` },
    data: { emulatedServerType: "filesystem" as const, directory: `.miroir/${state}/admin/data` },
  });

  it("finds the worker state through the Admin application when every template section is on SQL", () => {
    const configuration = testApplicationStorageConfiguration(
      sqlLibraryOfEnvironment("test_sql_w3"),
      "Library",
      undefined,
      adminApplicationOf("test-sql@w3"),
    );

    expect(configuration.model).toMatchObject({ schema: "test_sql_w3_Library" });
    expect(configuration.modelVersion).toMatchObject({ schema: "test_sql_w3_Library_modelVersion" });
  });

  it("gives two workers on test-sql different schemas for the same test application", () => {
    const schemaOf = (worker: string) =>
      (
        testApplicationStorageConfiguration(
          sqlLibraryOfEnvironment(`test_sql_${worker}`),
          "Library",
          undefined,
          adminApplicationOf(`test-sql@${worker}`),
        ).model as { schema: string }
      ).schema;

    expect(schemaOf("w3")).not.toBe(schemaOf("w4"));
  });

  it("prefixes the MongoDB databases with the worker state of the template", () => {
    const configuration = testApplicationStorageConfiguration(mongoTemplate("test-mongodb@w3"), "Library");

    expect(configuration.model).toMatchObject({ database: "test_mongodb_w3_Library" });
    expect(configuration.modelVersion).toMatchObject({ database: "test_mongodb_w3_Library_modelVersion" });
  });

  it("keeps the full isolation key and the _modelVersion suffix within 63 characters", () => {
    const key = "0e776954-723b-4718-b320-49a83a1d2b08";
    const configuration = testApplicationStorageConfiguration(
      sqlTemplate("test-sql@w12"),
      "runner_return_document_ephemeral_with_a_long_name",
      key,
    );
    const schema = (configuration.modelVersion as { schema: string }).schema;

    expect(schema.length).toBeLessThanOrEqual(63);
    expect(schema.startsWith("test_sql_w12_")).toBe(true);
    expect(schema.endsWith(`_${key.replace(/-/g, "")}_modelVersion`)).toBe(true);
  });
});
