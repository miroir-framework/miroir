/**
 * #267 Slice 6 — store-section skip for Entity externalDataSource.kind === "http".
 * Full deployment boot proof is Slice 7; this is the store-section-level assertion.
 */
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { isHttpExternalEntity, type Entity } from "miroir-core";
import { FileSystemStoreSection } from "../../../../miroir-store-filesystem/src/4_services/FileSystemStoreSection.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "externalServiceHttpStoreSkip.267.phase6" ||
  RUN_TEST === "externalServiceHttpStoreSkip.267.phase6.unit.test";

const HTTP_ENTITY_UUID = "56166585-b6fd-42c6-95d3-32a80c3304f7";
const SQL_ENTITY_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

const httpEntity = {
  uuid: HTTP_ENTITY_UUID,
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  name: "SpotifyPlaylist",
  idAttribute: "id",
  externalDataSource: {
    kind: "http",
    endpoint: "0e5cb172-12ea-4467-8598-5889338ae454",
  },
  mlSchema: { type: "object", definition: { id: { type: "string" } } },
} as Entity;

const sqlEntity = {
  uuid: SQL_ENTITY_UUID,
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  name: "SqlBacked",
  mlSchema: { type: "object", definition: { id: { type: "string" } } },
} as Entity;

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe.skipIf(!shouldRun)("externalServiceHttpStoreSkip #267 phase6", () => {
  it("isHttpExternalEntity is true only for kind http", () => {
    expect(isHttpExternalEntity(httpEntity)).toBe(true);
    expect(isHttpExternalEntity(sqlEntity)).toBe(false);
    expect(isHttpExternalEntity({ externalDataSource: { schema: "information_schema" } })).toBe(
      false,
    );
  });

  it("filesystem createStorageSpaceForInstancesOfEntity does not create a folder for kind http", async () => {
    const root = mkdtempSync(join(tmpdir(), "miroir-http-skip-"));
    dirs.push(root);
    const store = new FileSystemStoreSection("data", "http-skip", root, "data", "http-skip");
    await store.open();

    await store.createStorageSpaceForInstancesOfEntity(httpEntity);
    expect(existsSync(join(store.directory, HTTP_ENTITY_UUID))).toBe(false);

    await store.createStorageSpaceForInstancesOfEntity(sqlEntity);
    expect(existsSync(join(store.directory, SQL_ENTITY_UUID))).toBe(true);
  });
});
