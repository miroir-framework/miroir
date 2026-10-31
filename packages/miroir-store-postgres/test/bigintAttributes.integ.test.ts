/**
 * #48: ML `bigint` attributes are stored in int8 columns and read back as BigInt values, with every
 * digit, including values beyond Number.MAX_SAFE_INTEGER.
 *
 * Needs PostgreSQL:
 * ```bash
 * MIROIR_POSTGRES_PASSWORD=... npm run vitest -w miroir-store-postgres -- bigintAttributes
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Sequelize } from "sequelize";

import { ACTION_OK, type Entity } from "miroir-core";

import { SqlDbDataStoreSection } from "../src/4_services/SqlDbDataStoreSection.js";

const password = process.env.MIROIR_POSTGRES_PASSWORD;
const connectionString = `postgres://postgres:${password}@localhost:5432/postgres`;
const schema = "test_bigint_attributes";

const counterEntity: Entity = {
  uuid: "8d2b6a4e-1c3f-4e5a-9b7d-2f6e8a0c4b13",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  selfApplication: "6c4edcb2-e165-407a-b728-fbf8a18b6bf7",
  name: "Counter",
  conceptLevel: "Model",
  mlSchema: {
    type: "object",
    definition: {
      uuid: { type: "uuid" },
      parentName: { type: "string", optional: true },
      parentUuid: { type: "uuid" },
      count: { type: "bigint" },
      previousCount: { type: "bigint", optional: true },
    },
  },
} as Entity;

const big = 9223372036854775807n; // int8 maximum, far beyond Number.MAX_SAFE_INTEGER
const counter = {
  uuid: "3a7c1e5b-9d2f-4b6a-8e0c-5f1a3b7d9e24",
  parentName: "Counter",
  parentUuid: counterEntity.uuid,
  count: big,
};

describe.skipIf(!password)("bigint attributes", () => {
  let rawSql: Sequelize;
  let store: SqlDbDataStoreSection;

  beforeAll(async () => {
    rawSql = new Sequelize(connectionString, { logging: false });
    await rawSql.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await rawSql.query(`CREATE SCHEMA ${schema}`);
    store = new SqlDbDataStoreSection("data", "bigintAttributes", connectionString, schema);
    await store.open();
    expect(await store.bootFromPersistedState([counterEntity])).toEqual(ACTION_OK);
    expect(await store.createStorageSpaceForInstancesOfEntity(counterEntity)).toEqual(ACTION_OK);
  });

  afterAll(async () => {
    await store?.close();
    await rawSql?.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await rawSql?.close();
  });

  it("stores a bigint attribute in an int8 column", async () => {
    const [rows] = await rawSql.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = :schema AND table_name = 'Counter' AND column_name = 'count'`,
      { replacements: { schema } },
    );
    expect(rows).toEqual([{ column_name: "count", data_type: "bigint" }]);
  });

  it("writes and reads back a BigInt value with every digit", async () => {
    expect(await store.upsertInstance(counterEntity.uuid, counter as any)).toEqual(ACTION_OK);

    const [rows] = await rawSql.query(`SELECT "count"::text AS count FROM ${schema}."Counter"`);
    expect((rows as { count: string }[])[0].count).toBe(big.toString());

    const one = await store.getInstance(counterEntity.uuid, counter.uuid);
    expect(one).toMatchObject({ status: "ok" });
    expect((one as any).returnedDomainElement.count).toBe(big);

    const all = await store.getInstances(counterEntity.uuid);
    expect(all).toMatchObject({ status: "ok" });
    const instances = (all as any).returnedDomainElement.instances;
    expect(instances).toHaveLength(1);
    expect(instances[0].count).toBe(big);
    expect(instances[0].previousCount ?? null).toBeNull();
  });
});
