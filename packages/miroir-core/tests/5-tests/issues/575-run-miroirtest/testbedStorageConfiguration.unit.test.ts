import { describe, expect, it } from "vitest";

import type { StoreUnitConfiguration } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { testbedStorageConfiguration, testbedStoreName } from "../../../../src/5_tests/testbedStorageConfiguration";

// #575: a throwaway testbed's stores sit beside those of the deployment it copies.
const TESTBED = "3406415a-4f63-4c9e-8909-1318e9c4af13";
const STORE = "testbed_3406415a4f634c9e89091318e9c4af13";
const admin = { emulatedServerType: "filesystem", directory: ".miroir/bench/admin" } as const;

describe("testbedStorageConfiguration (#575)", () => {
  it("names the stores after the testbed, as a Postgres identifier", () => {
    expect(testbedStoreName(TESTBED)).toBe(STORE);
  });

  it("puts filesystem sections in a sibling directory of the application's", () => {
    const live: StoreUnitConfiguration = {
      admin,
      model: { emulatedServerType: "filesystem", directory: ".miroir/bench/library/model" },
      data: { emulatedServerType: "filesystem", directory: ".miroir/bench/library/data/" },
      modelVersion: { emulatedServerType: "filesystem", directory: ".miroir/bench/library/modelVersion" },
    };
    expect(testbedStorageConfiguration(live, TESTBED)).toEqual({
      admin,
      model: { emulatedServerType: "filesystem", directory: `.miroir/bench/${STORE}/model` },
      data: { emulatedServerType: "filesystem", directory: `.miroir/bench/${STORE}/data` },
      modelVersion: { emulatedServerType: "filesystem", directory: `.miroir/bench/${STORE}/modelVersion` },
    });
  });

  it("gives sql sections a schema, mongodb sections a database and indexedDb sections a name", () => {
    const sql = { emulatedServerType: "sql", connectionString: "postgres://db", schema: "library" } as const;
    const mongodb = { emulatedServerType: "mongodb", connectionString: "mongodb://db", database: "library" } as const;
    const live = {
      admin,
      model: sql,
      data: mongodb,
      modelVersion: { emulatedServerType: "indexedDb", indexedDbName: "library_modelVersion" },
    } as StoreUnitConfiguration;
    expect(testbedStorageConfiguration(live, TESTBED)).toEqual({
      admin,
      model: { ...sql, schema: STORE },
      data: { ...mongodb, database: STORE },
      modelVersion: { emulatedServerType: "indexedDb", indexedDbName: `${STORE}_modelVersion` },
    });
  });

  it("copies the devData section beside the others, with its own suffix (#647)", () => {
    const sql = { emulatedServerType: "sql", connectionString: "postgres://db", schema: "library" } as const;
    const live = {
      admin,
      model: sql,
      data: sql,
      devData: { ...sql, schema: "library_devData" },
    } as StoreUnitConfiguration;
    expect(testbedStorageConfiguration(live, TESTBED)).toEqual({
      admin,
      model: { ...sql, schema: STORE },
      data: { ...sql, schema: STORE },
      devData: { ...sql, schema: `${STORE}_devData` },
    });
  });

  it("leaves modelVersion out when the live deployment has none", () => {
    const live = {
      admin,
      model: { emulatedServerType: "filesystem", directory: ".miroir/bench/library/model" },
      data: { emulatedServerType: "filesystem", directory: ".miroir/bench/library/data" },
    } as StoreUnitConfiguration;
    expect(testbedStorageConfiguration(live, TESTBED)).not.toHaveProperty("modelVersion");
    expect(testbedStorageConfiguration(live, TESTBED)).not.toHaveProperty("devData");
  });

  it("refuses a bundled store, which is read-only", () => {
    const live = {
      admin,
      model: { emulatedServerType: "bundled" },
      data: { emulatedServerType: "bundled" },
    } as unknown as StoreUnitConfiguration;
    expect(() => testbedStorageConfiguration(live, TESTBED)).toThrow(/bundled/);
  });
});
