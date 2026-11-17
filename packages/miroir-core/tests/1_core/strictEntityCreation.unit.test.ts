/**
 * #745 D4: the order of the checks and writes of a strict `createEntity`, shared by the stores. The stores
 * themselves are checked in `miroir-standalone-app/tests/4_storage/createEntityStrict.integ.test.ts`; this
 * file holds what no store does on demand: a storage creation that fails.
 *
 * The store below keeps its storage and its Entity rows in two sets, as a store keeps them in folders,
 * tables or sublevels.
 */
import { describe, expect, it } from "vitest";

import {
  ACTION_OK,
  Action2Error,
  createEntitiesStrictly,
  ENTITY_CREATION_REFUSALS,
  type Entity,
  type StrictEntityCreationStore,
} from "@miroir-framework/core";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("strictEntityCreation");

function entity(suffix: string, extra: Partial<Entity> = {}): Entity {
  return { uuid: `745c0000-0000-4000-8000-0000000000${suffix}`, name: `E${suffix}`, ...extra } as Entity;
}

function setStore(options: { rows?: string[]; storage?: string[]; failStorageOf?: string; noProbe?: boolean } = {}) {
  const rows = new Set(options.rows ?? []);
  const storage = new Set(options.storage ?? []);
  const store: StrictEntityCreationStore = {
    storeLabel: "set store",
    entityRowUuids: async () => [...rows],
    storageSpaceExists: options.noProbe ? undefined : async (candidate) => storage.has(candidate.uuid),
    createStorageSpace: async (candidate) => {
      if (candidate.uuid === options.failStorageOf) {
        return new Action2Error("FailedToCreateStore", "no space left");
      }
      storage.add(candidate.uuid);
      return ACTION_OK;
    },
    writeEntityRow: async (candidate) => {
      rows.add(candidate.uuid);
      return ACTION_OK;
    },
  };
  return { store, rows, storage };
}

const reason = (result: unknown) => (result instanceof Action2Error ? result.errorContext?.reason : undefined);

describe.runIf(runThis)("strictEntityCreation (#745 D4)", () => {
  it("creates the storage, then the row, of each Entity", async () => {
    const { store, rows, storage } = setStore();
    expect(await createEntitiesStrictly(store, [entity("01"), entity("02")])).toEqual(ACTION_OK);
    expect([...rows]).toEqual([entity("01").uuid, entity("02").uuid]);
    expect([...storage]).toEqual([entity("01").uuid, entity("02").uuid]);
  });

  it("a storage creation that fails writes no row, and stops before the next Entity", async () => {
    const { store, rows, storage } = setStore({ failStorageOf: entity("01").uuid });
    const result = await createEntitiesStrictly(store, [entity("01"), entity("02")]);
    expect(result instanceof Action2Error).toBe(true);
    expect((result as Action2Error).errorMessage).toContain("its row is not written");
    expect(rows.size).toBe(0);
    expect(storage.size).toBe(0);
  });

  it("checks every Entity before creating any: entityExists, then storageExists", async () => {
    const existingRow = setStore({ rows: [entity("02").uuid] });
    expect(reason(await createEntitiesStrictly(existingRow.store, [entity("01"), entity("02")]))).toBe(ENTITY_CREATION_REFUSALS.entityExists);
    expect([...existingRow.rows]).toEqual([entity("02").uuid]);
    expect(existingRow.storage.size).toBe(0);

    const existingStorage = setStore({ storage: [entity("02").uuid] });
    const refused = await createEntitiesStrictly(existingStorage.store, [entity("01"), entity("02")]);
    expect(reason(refused)).toBe(ENTITY_CREATION_REFUSALS.storageExists);
    expect((refused as Action2Error).errorContext).toMatchObject({ entity: entity("02").uuid, entityName: "E02" });
    expect(existingStorage.rows.size).toBe(0);
  });

  it("an Entity listed twice in one call is refused", async () => {
    const { store, rows } = setStore();
    expect(reason(await createEntitiesStrictly(store, [entity("01"), entity("01")]))).toBe(ENTITY_CREATION_REFUSALS.entityExists);
    expect(rows.size).toBe(0);
  });

  it("two Entities of one name in one call are refused, before any storage is created", async () => {
    const { store, rows, storage } = setStore();
    const refused = await createEntitiesStrictly(store, [entity("01"), entity("02", { name: "E01" })]);
    expect(reason(refused)).toBe(ENTITY_CREATION_REFUSALS.entityExists);
    expect((refused as Action2Error).errorContext).toMatchObject({ entity: entity("02").uuid });
    expect(rows.size).toBe(0);
    expect(storage.size).toBe(0);
  });

  it("external Entities are exempt from both checks, and the store is asked to register them", async () => {
    const http = entity("03", { externalDataSource: { kind: "http", endpoint: "e" } } as Partial<Entity>);
    const sql = entity("04", { conceptLevel: "External" } as Partial<Entity>);
    const { store, rows, storage } = setStore({ rows: [http.uuid, sql.uuid], storage: [sql.uuid] });
    expect(await createEntitiesStrictly(store, [http, sql])).toEqual(ACTION_OK);
    expect([...rows]).toEqual([http.uuid, sql.uuid]);
    // the set store records the call; a real store registers an external Entity without creating storage
    expect([...storage].sort()).toEqual([http.uuid, sql.uuid].sort());
  });

  it("a store without a storage probe refuses", async () => {
    const { store, rows } = setStore({ noProbe: true });
    const result = await createEntitiesStrictly(store, [entity("01")]);
    expect(result instanceof Action2Error).toBe(true);
    expect((result as Action2Error).errorMessage).toContain("cannot check");
    expect(rows.size).toBe(0);
  });
});
