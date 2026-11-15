/**
 * #9 part B: the draft Migration between two versions of appForTest (`generateMigration`).
 *
 * Not reachable through MiroirTest: the tests freeze versions, edit the model between them, and read the
 * Migration rows from the stores of the emulated server.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 9-migrations/migrationGeneration
 * ```
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Action2Error, type Entity, type EntityInstance } from "@miroir-framework/core";
import { entityCountry, entityPublisher, selfApplicationAppForTest } from "miroir-fixture-appForTest";

import {
  APP_FOR_TEST,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectOk,
  freezeAppForTest,
  INSTANCE_ENDPOINT,
  MODEL_ENDPOINT,
  openVersioningTestContext,
  storedAppForTestRows,
  type VersioningTestContext,
} from "../../versioning/versioningTestSetup.js";

const MIGRATION_ENTITY = "b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe";
const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";

let context: VersioningTestContext;
const run = Date.now();
/** Entities a test creates, dropped after the file. */
const createdEntities: string[] = [];

type MigrationRow = EntityInstance & {
  application: string;
  from: string;
  to: string;
  source: string;
  changes: { kind: string; entity: string; attribute?: string; backwardCompatible: boolean; supported: boolean }[];
  expand: { name: string; backwardCompatible: boolean; repeatable: boolean; action: { payload: { actionSequence: unknown[] } } }[];
  fill: MigrationRow["expand"];
  contract: MigrationRow["expand"];
  backwardCompatible: boolean;
};

function modelAction(action: Record<string, unknown>) {
  return context.domainController.handleAction(
    { endpoint: MODEL_ENDPOINT, ...action } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(context.domainController),
  );
}

/** A write of an appForTest model row, outside a transaction. */
function modelRowWrite(actionType: string, object: EntityInstance) {
  return context.domainController.handleAction(
    {
      actionType,
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: APP_FOR_TEST, applicationSection: "model", objects: [object] },
    } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(context.domainController),
  );
}

async function storedEntity(uuid: string): Promise<Entity> {
  return (await storedAppForTestRows(context, "model", "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad")).find((row) => row.uuid === uuid) as unknown as Entity;
}

/** The stored Entity row with its attributes changed by `change`. */
async function withAttributes(uuid: string, change: (definition: Record<string, unknown>) => Record<string, unknown>): Promise<Entity> {
  const entity = await storedEntity(uuid);
  return { ...entity, mlSchema: { ...entity.mlSchema, definition: change({ ...entity.mlSchema.definition }) } } as Entity;
}

async function setAppForTestTraces(on: boolean): Promise<void> {
  const stored = (await storedAppForTestRows(context, "model", SELF_APPLICATION_ENTITY)).find((row) => row.uuid === APP_FOR_TEST)!;
  expectOk(await modelRowWrite("updateInstance", { ...stored, evolutionTraces: on } as EntityInstance), `evolutionTraces ${on}`);
}

function generate(from: string, to: string, replace?: boolean) {
  return modelAction({
    actionType: "generateMigration",
    payload: { application: APP_FOR_TEST, from, to, ...(replace === undefined ? {} : { replace }) },
  });
}

async function storedMigration(from: string, to: string): Promise<MigrationRow | undefined> {
  return (await storedAppForTestRows(context, "modelVersion", MIGRATION_ENTITY)).find(
    (row) => (row as MigrationRow).from === from && (row as MigrationRow).to === to,
  ) as MigrationRow | undefined;
}

function refusalReason(result: unknown): string | undefined {
  let error = result as { errorContext?: { reason?: string }; innerError?: unknown } | undefined;
  while (error && typeof error === "object") {
    if (error.errorContext?.reason) {
      return error.errorContext.reason;
    }
    error = error.innerError as typeof error;
  }
  return undefined;
}

beforeAll(async () => {
  context = await openVersioningTestContext();
}, 120000);

/** A new Entity of appForTest with a `uuid`, `parentUuid` and `name`, created outside a transaction. */
async function createTestEntity(name: string): Promise<Entity> {
  const entity = {
    uuid: randomUUID(),
    parentName: "Entity",
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentDefinitionVersionUuid: entityCountry.parentDefinitionVersionUuid,
    name: `${name}${run}`,
    conceptLevel: "Model",
    description: `#9 part B: ${name}`,
    mlSchema: {
      type: "object",
      definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" }, name: { type: "string" } },
    },
  } as unknown as Entity;
  expectOk(await modelAction({ actionType: "createEntity", payload: { application: APP_FOR_TEST, transactional: false, entities: [entity] } }), `create ${name}`);
  createdEntities.push(entity.uuid);
  return entity;
}

function dropEntity(uuid: string) {
  return modelAction({ actionType: "dropEntity", payload: { application: APP_FOR_TEST, transactional: false, entityUuid: uuid } });
}

/** Freezes `from`, runs `edit`, freezes `to` and generates the Migration between them, which it returns. */
async function migrationAround(label: string, edit: () => Promise<void>): Promise<MigrationRow> {
  const from = `${label}-1.0.0-${run}`;
  const to = `${label}-1.1.0-${run}`;
  expectOk(await freezeAppForTest(context.domainController, from), `freeze ${from}`);
  await edit();
  expectOk(await freezeAppForTest(context.domainController, to), `freeze ${to}`);
  expectOk(await generate(from, to), `generateMigration ${label}`);
  const migration = await storedMigration(from, to);
  expect(migration, `the Migration ${label}`).toBeDefined();
  return migration!;
}

async function writeEntity(entity: Entity, label: string): Promise<void> {
  expectOk(await modelRowWrite("updateInstance", entity as unknown as EntityInstance), label);
}

afterAll(async () => {
  for (const uuid of createdEntities) {
    await dropEntity(uuid);
  }
  for (const attribute of ["motto9", "required9", "gone9", "transient9"]) {
    const publisher = await storedEntity(entityPublisher.uuid);
    if (attribute in publisher.mlSchema.definition) {
      await writeEntity(await withAttributes(entityPublisher.uuid, ({ [attribute]: _removed, ...rest }) => rest), `restore Publisher without ${attribute}`);
    }
  }
  await setAppForTestTraces(false);
}, 60000);

describe("#9 part B: generateMigration", () => {
  it("B1: an optional attribute added between two versions gives a backward-compatible draft with one empty fill step", async () => {
    await setAppForTestTraces(true);
    const from = `9B1-1.0.0-${run}`;
    const to = `9B1-1.1.0-${run}`;
    expectOk(await freezeAppForTest(context.domainController, from), "freeze from");
    expectOk(
      await modelRowWrite("updateInstance", (await withAttributes(entityPublisher.uuid, (d) => ({ ...d, motto9: { type: "string", optional: true } }))) as any),
      "Publisher.motto9",
    );
    expectOk(await freezeAppForTest(context.domainController, to), "freeze to");

    expectOk(await generate(from, to), "generateMigration");

    const migration = await storedMigration(from, to);
    expect(migration, "the Migration in modelVersion").toBeDefined();
    expect(migration).toMatchObject({ application: APP_FOR_TEST, source: "traces", backwardCompatible: true, expand: [], contract: [] });
    expect(migration!.changes).toEqual([
      { kind: "addAttribute", entity: entityPublisher.uuid, entityName: entityPublisher.name, attribute: "motto9", backwardCompatible: true, supported: true },
    ]);
    expect(migration!.fill).toHaveLength(1);
    expect(migration!.fill[0]).toMatchObject({ name: `fill ${entityPublisher.name}.motto9`, backwardCompatible: true, repeatable: true });
    expect(migration!.fill[0].action.payload.actionSequence).toEqual([]);
  }, 60000);

  it("B2.1: a removed attribute is not backward-compatible and gets an empty contract step", async () => {
    await writeEntity(await withAttributes(entityPublisher.uuid, (d) => ({ ...d, gone9: { type: "string", optional: true } })), "Publisher.gone9");
    const migration = await migrationAround("9B21", async () =>
      writeEntity(await withAttributes(entityPublisher.uuid, ({ gone9: _removed, ...rest }) => rest), "Publisher without gone9"),
    );
    expect(migration).toMatchObject({ source: "traces", backwardCompatible: false, expand: [], fill: [] });
    expect(migration.changes).toEqual([
      { kind: "removeAttribute", entity: entityPublisher.uuid, entityName: entityPublisher.name, attribute: "gone9", backwardCompatible: false, supported: true },
    ]);
    expect(migration.contract).toHaveLength(1);
    expect(migration.contract[0]).toMatchObject({ name: `drop ${entityPublisher.name}.gone9`, backwardCompatible: false, repeatable: true });
    expect(migration.contract[0].action.payload.actionSequence).toEqual([]);
  }, 60000);

  it("B2.2: an Entity removed through dropEntity gets removeEntity and a contract step", async () => {
    const dropped = await createTestEntity("Dropped9");
    const migration = await migrationAround("9B22", async () => {
      expectOk(await dropEntity(dropped.uuid), "drop Dropped9");
    });
    createdEntities.splice(createdEntities.indexOf(dropped.uuid), 1);
    expect(migration).toMatchObject({ source: "traces", backwardCompatible: false, expand: [], fill: [] });
    expect(migration.changes).toEqual([
      { kind: "removeEntity", entity: dropped.uuid, entityName: dropped.name, backwardCompatible: false, supported: true },
    ]);
    expect(migration.contract.map((step) => step.name)).toEqual([`drop ${dropped.name}`]);
  }, 60000);

  it("B2.3: a required attribute added is not backward-compatible and has its fill step", async () => {
    const migration = await migrationAround("9B23", async () =>
      writeEntity(await withAttributes(entityPublisher.uuid, (d) => ({ ...d, required9: { type: "string" } })), "Publisher.required9"),
    );
    expect(migration).toMatchObject({ source: "traces", backwardCompatible: false, expand: [], contract: [] });
    expect(migration.changes).toEqual([
      { kind: "addAttribute", entity: entityPublisher.uuid, entityName: entityPublisher.name, attribute: "required9", backwardCompatible: false, supported: true },
    ]);
    expect(migration.fill.map((step) => step.name)).toEqual([`fill ${entityPublisher.name}.required9`]);
  }, 60000);

  it("B2.4: an Entity renamed through its row, and its idAttribute changed, are flagged as unsupported", async () => {
    const renamed = await createTestEntity("Renamed9");
    const migration = await migrationAround("9B24", async () =>
      writeEntity({ ...(await storedEntity(renamed.uuid)), name: `Renamed9b${run}`, idAttribute: "name" } as Entity, "rename Renamed9"),
    );
    expect(migration).toMatchObject({ source: "traces", backwardCompatible: false, fill: [], contract: [] });
    expect(migration.changes.map(({ kind, entity, entityName, backwardCompatible, supported }) => ({ kind, entity, entityName, backwardCompatible, supported }))).toEqual([
      { kind: "renameEntity", entity: renamed.uuid, entityName: `Renamed9b${run}`, backwardCompatible: false, supported: false },
      { kind: "changeIdAttribute", entity: renamed.uuid, entityName: `Renamed9b${run}`, backwardCompatible: false, supported: false },
    ]);
  }, 60000);

  it("B2.5: an attribute added then removed between the two versions is no change", async () => {
    const migration = await migrationAround("9B25", async () => {
      await writeEntity(await withAttributes(entityPublisher.uuid, (d) => ({ ...d, transient9: { type: "string", optional: true } })), "Publisher.transient9");
      await writeEntity(await withAttributes(entityPublisher.uuid, ({ transient9: _removed, ...rest }) => rest), "Publisher without transient9");
    });
    expect(migration).toMatchObject({ source: "traces", backwardCompatible: true, changes: [], expand: [], fill: [], contract: [] });
  }, 60000);
});
