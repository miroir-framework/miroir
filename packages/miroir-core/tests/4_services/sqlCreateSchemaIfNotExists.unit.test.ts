import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sqlCreateSchemaIfNotExists } from "miroir-store-postgres/src/4_services/sqlCreateSchemaIfNotExists.js";

const POSTGRES_SERVICES = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../miroir-store-postgres/src/4_services",
);

describe("sqlCreateSchemaIfNotExists", () => {
  it("emits idempotent DDL", () => {
    expect(sqlCreateSchemaIfNotExists("Library")).toBe(
      'CREATE SCHEMA IF NOT EXISTS "Library"',
    );
  });

  it("rejects identifiers that would break quoting", () => {
    expect(() => sqlCreateSchemaIfNotExists('bad"name')).toThrow(/Invalid SQL schema/);
  });

  it("SqlDbAdminStore.createStore uses the idempotent helper (open() already creates the schema)", () => {
    const src = readFileSync(join(POSTGRES_SERVICES, "SqlDbAdminStore.ts"), "utf8");
    expect(src).toContain("sqlCreateSchemaIfNotExists");
    expect(src).not.toContain("this.sequelize.createSchema");
  });
});
