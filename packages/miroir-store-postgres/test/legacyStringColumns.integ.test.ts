/**
 * ML `string` attributes are stored as TEXT. Tables created when they were varchar(255) get their
 * string columns widened when the store boots, so existing deployments accept longer values.
 *
 * Needs PostgreSQL:
 * ```bash
 * MIROIR_POSTGRES_PASSWORD=... npm run vitest -w miroir-store-postgres -- legacyStringColumns
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Sequelize } from "sequelize";

import { ACTION_OK, type Entity } from "miroir-core";

import { SqlDbDataStoreSection } from "../src/4_services/SqlDbDataStoreSection.js";

const password = process.env.MIROIR_POSTGRES_PASSWORD;
const connectionString = `postgres://postgres:${password}@localhost:5432/postgres`;
const schema = "test_legacy_string_columns";

const noteEntity: Entity = {
  uuid: "5b0f7f5e-2d5c-4a51-9a8e-3f2b8c1d6e47",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  selfApplication: "6c4edcb2-e165-407a-b728-fbf8a18b6bf7",
  name: "Note",
  conceptLevel: "Model",
  mlSchema: {
    type: "object",
    definition: {
      uuid: { type: "uuid" },
      parentName: { type: "string", optional: true },
      parentUuid: { type: "uuid" },
      description: { type: "string", optional: true },
    },
  },
} as Entity;

async function columnTypes(rawSql: Sequelize): Promise<Record<string, string>> {
  const [rows] = await rawSql.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = :schema AND table_name = 'Note'`,
    { replacements: { schema } },
  );
  return Object.fromEntries(
    (rows as { column_name: string; data_type: string }[]).map((row) => [row.column_name, row.data_type]),
  );
}

describe.skipIf(!password)("legacy varchar(255) string columns", () => {
  let rawSql: Sequelize;
  let store: SqlDbDataStoreSection;

  beforeAll(async () => {
    rawSql = new Sequelize(connectionString, { logging: false });
    await rawSql.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await rawSql.query(`CREATE SCHEMA ${schema}`);
    // the table as an older store created it
    await rawSql.query(
      `CREATE TABLE ${schema}."Note" ("uuid" varchar(255) PRIMARY KEY, "parentName" varchar(255), "parentUuid" varchar(255) NOT NULL, "description" varchar(255))`,
    );
    store = new SqlDbDataStoreSection("data", "legacyStringColumns", connectionString, schema);
    await store.open();
  });

  afterAll(async () => {
    await store?.close();
    await rawSql?.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await rawSql?.close();
  });

  it("boot widens the string columns to TEXT and keeps uuid columns", async () => {
    expect(await store.bootFromPersistedState([noteEntity])).toEqual(ACTION_OK);

    expect(await columnTypes(rawSql)).toEqual({
      uuid: "character varying",
      parentName: "text",
      parentUuid: "character varying",
      description: "text",
    });
  });

  it("a description longer than 255 characters is stored whole", async () => {
    const description = "d".repeat(300);
    const upsertResult = await store.upsertInstance(noteEntity.uuid, {
      uuid: "0f3c2a71-8e4b-4d6a-b5c9-7a1e2d3f4b5c",
      parentName: "Note",
      parentUuid: noteEntity.uuid,
      description,
    } as any);
    expect(upsertResult).toEqual(ACTION_OK);

    const [rows] = await rawSql.query(`SELECT "description" FROM ${schema}."Note"`);
    expect((rows as { description: string }[])[0].description).toBe(description);
  });
});
