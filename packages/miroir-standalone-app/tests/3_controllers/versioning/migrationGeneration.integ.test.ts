/**
 * #9 part B, #745: the draft Migration between two versions of appForTest (`generateMigration`): its
 * classified changes, and its one ordered list of steps, one per model Action the designer ran (D2).
 *
 * The designer changes Entities through the model Actions (`createEntity`, `alterEntityAttribute`,
 * `renameEntity`, `dropEntity`): an instance write of an Entity row refuses generation (#748).
 *
 * Not reachable through MiroirTest: the tests freeze versions, edit the model between them, and read the
 * Migration rows from the stores of the emulated server.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationGeneration
 * ```
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Action2Error, type Entity, type EntityInstance } from "@miroir-framework/core";
import { entityCountry, entityPublisher } from "miroir-fixture-appForTest";

import {
  APP_FOR_TEST,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectOk,
  freezeAppForTest,
  INSTANCE_ENDPOINT,
  MIROIR_APPLICATION,
  loadModelOnServer,
  MODEL_ENDPOINT,
  openVersioningTestContext,
  APP_FOR_TEST_DEPLOYMENT,
  SELF_APPLICATION_VERSION_ENTITY,
  storedAppForTestRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const MIGRATION_ENTITY = "b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITY_VERSION_ENTITY = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const CROSS_ENTITY_VERSION_ENTITY = "8bec933d-6287-4de7-8a88-5c24216de9f4";
const EVOLUTION_TRACE_RECORD_ENTITY = "854c47bd-af74-4305-bdea-aa6bddfa8899";
const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";
const ENDPOINT_ENTITY = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";

let context: VersioningTestContext;
const run = Date.now();
/** Entities a test creates, dropped after the file. */
const createdEntities: string[] = [];
/** Publisher attributes a test adds, removed after the file. */
const PUBLISHER_ATTRIBUTES = ["motto9", "required9", "gone9", "transient9", "offline9", "again9", "a94", "b94", "fixed95", "traced96"];

type Step = { uuid: string; name: string; kind: "model" | "data"; backwardCompatible: boolean; trace?: string; action: any };
type MigrationRow = EntityInstance & {
  application: string;
  from: string;
  to: string;
  source: string;
  changes: { kind: string; entity: string; entityName?: string; attribute?: string; backwardCompatible: boolean; supported: boolean; note?: string }[];
  steps: Step[];
  backwardCompatible: boolean;
};

function modelAction(action: Record<string, unknown>, application = APP_FOR_TEST) {
  return context.domainController.handleAction(
    { endpoint: MODEL_ENDPOINT, ...action } as any,
    applicationDeploymentMap,
    context.domainController.currentModelEnvironment(application, applicationDeploymentMap),
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
  return (await storedAppForTestRows(context, "model", ENTITY_ENTITY)).find((row) => row.uuid === uuid) as unknown as Entity;
}

/** The stored Entity row with its attributes changed by `change`. */
async function withAttributes(uuid: string, change: (definition: Record<string, unknown>) => Record<string, unknown>): Promise<Entity> {
  const entity = await storedEntity(uuid);
  return { ...entity, mlSchema: { ...entity.mlSchema, definition: change({ ...entity.mlSchema.definition }) } } as Entity;
}

/** `alterEntityAttribute` on Publisher, outside a transaction. */
async function alterPublisher(columns: { addColumns?: { name: string; definition: unknown }[]; removeColumns?: string[] }, label: string): Promise<void> {
  expectOk(
    await modelAction({
      actionType: "alterEntityAttribute",
      payload: { application: APP_FOR_TEST, transactional: false, entityName: entityPublisher.name, entityUuid: entityPublisher.uuid, ...columns },
    }),
    label,
  );
}

const optionalString = { type: "string", optional: true };

async function setAppForTestTraces(on: boolean): Promise<void> {
  const stored = (await storedAppForTestRows(context, "model", SELF_APPLICATION_ENTITY)).find((row) => row.uuid === APP_FOR_TEST)!;
  expectOk(await modelRowWrite("updateInstance", { ...stored, evolutionTraces: on } as EntityInstance), `evolutionTraces ${on}`);
}

function generate(from: string, to: string, replace?: boolean, application = APP_FOR_TEST) {
  return modelAction(
    {
      actionType: "generateMigration",
      payload: { application, from, to, ...(replace === undefined ? {} : { replace }) },
    },
    application,
  );
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

/** The name, kind and backward compatibility of each step, in order. */
function stepsOf(migration: MigrationRow) {
  return migration.steps.map(({ name, kind, backwardCompatible }) => ({ name, kind, backwardCompatible }));
}

beforeAll(async () => {
  context = await openVersioningTestContext();
  await loadModelOnServer(context, APP_FOR_TEST);
  // every test but those that say otherwise runs with the traces of appForTest on, whichever runs first
  await setAppForTestTraces(true);
}, 120000);

/** A new Entity of appForTest with a `uuid`, `parentUuid` and `name`. */
function testEntity(name: string): Entity {
  return {
    uuid: randomUUID(),
    parentName: "Entity",
    parentUuid: ENTITY_ENTITY,
    parentDefinitionVersionUuid: entityCountry.parentDefinitionVersionUuid,
    selfApplication: APP_FOR_TEST,
    name: `${name}${run}`,
    conceptLevel: "Model",
    description: `#9 part B: ${name}`,
    mlSchema: {
      type: "object",
      definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" }, name: { type: "string" } },
    },
  } as unknown as Entity;
}

/** Creates `entities` with one `createEntity`, outside a transaction. */
async function createEntities(entities: Entity[], label: string): Promise<void> {
  expectOk(await modelAction({ actionType: "createEntity", payload: { application: APP_FOR_TEST, transactional: false, entities } }), label);
  createdEntities.push(...entities.map((entity) => entity.uuid));
}

async function createTestEntity(name: string): Promise<Entity> {
  const entity = testEntity(name);
  await createEntities([entity], `create ${name}`);
  return entity;
}

function dropEntity(uuid: string) {
  return modelAction({ actionType: "dropEntity", payload: { application: APP_FOR_TEST, transactional: false, entityUuid: uuid } });
}

/** Freezes `from`, runs `edit`, freezes `to`; returns the version names. */
async function versionsAround(label: string, edit: () => Promise<void>): Promise<{ from: string; to: string }> {
  const from = `${label}-1.0.0-${run}`;
  const to = `${label}-1.1.0-${run}`;
  expectOk(await freezeAppForTest(context.domainController, from), `freeze ${from}`);
  await edit();
  expectOk(await freezeAppForTest(context.domainController, to), `freeze ${to}`);
  return { from, to };
}

/** Freezes `from`, runs `edit`, freezes `to` and generates the Migration between them, which it returns. */
async function migrationAround(label: string, edit: () => Promise<void>): Promise<MigrationRow> {
  const { from, to } = await versionsAround(label, edit);
  expectOk(await generate(from, to), `generateMigration ${label}`);
  const migration = await storedMigration(from, to);
  expect(migration, `the Migration ${label}`).toBeDefined();
  return migration!;
}

async function writeEntity(entity: Entity, label: string): Promise<void> {
  expectOk(await modelRowWrite("updateInstance", entity as unknown as EntityInstance), label);
}

/** An Endpoint of appForTest, written as a model row (no model Action writes Endpoints). */
function testEndpoint(name: string, description: string): EntityInstance {
  return {
    uuid: randomUUID(),
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY,
    application: APP_FOR_TEST,
    name: `${name}${run}`,
    version: "1",
    description,
    definition: { actions: [] },
  } as unknown as EntityInstance;
}

afterAll(async () => {
  await setAppForTestTraces(false);
  for (const uuid of createdEntities) {
    await dropEntity(uuid);
  }
  const publisher = await storedEntity(entityPublisher.uuid);
  const removeColumns = PUBLISHER_ATTRIBUTES.filter((attribute) => attribute in publisher.mlSchema.definition);
  if (removeColumns.length > 0) {
    await alterPublisher({ removeColumns }, "restore Publisher's attributes");
  }
  if ((await storedEntity(entityPublisher.uuid)).description !== entityPublisher.description) {
    await writeEntity({ ...(await storedEntity(entityPublisher.uuid)), description: entityPublisher.description } as Entity, "restore Publisher's description");
  }
}, 60000);

describe("#9 part B, #745: generateMigration", () => {
  it("B1: an optional attribute added with alterEntityAttribute gives its model step, then an empty fill step", async () => {
    await setAppForTestTraces(true);
    const migration = await migrationAround("9B1", () => alterPublisher({ addColumns: [{ name: "motto9", definition: optionalString }] }, "Publisher.motto9"));

    expect(migration).toMatchObject({ application: APP_FOR_TEST, source: "traces", backwardCompatible: true });
    expect(migration.changes).toEqual([
      { kind: "addAttribute", entity: entityPublisher.uuid, entityName: entityPublisher.name, attribute: "motto9", backwardCompatible: true, supported: true },
    ]);
    expect(stepsOf(migration)).toEqual([
      { name: `add ${entityPublisher.name}.motto9`, kind: "model", backwardCompatible: true },
      { name: `fill ${entityPublisher.name}.motto9`, kind: "data", backwardCompatible: true },
    ]);
    const [add, fill] = migration.steps;
    expect(add.action).toMatchObject({
      actionType: "alterEntityAttribute",
      endpoint: MODEL_ENDPOINT,
      payload: { application: APP_FOR_TEST, entityUuid: entityPublisher.uuid, addColumns: [{ name: "motto9", definition: optionalString }] },
    });
    expect(add.action.payload.transactional, "the migration run sets it").toBeUndefined();
    const record = (await storedAppForTestRows(context, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY)).find((row) => row.uuid === add.trace);
    expect(record, "the step names the record of its Action").toBeDefined();
    expect(fill.action.payload.actionSequence).toEqual([]);
  }, 60000);

  it("B2.1: an attribute removed with alterEntityAttribute is a model step that is not backward-compatible", async () => {
    await alterPublisher({ addColumns: [{ name: "gone9", definition: optionalString }] }, "Publisher.gone9");
    const migration = await migrationAround("9B21", () => alterPublisher({ removeColumns: ["gone9"] }, "Publisher without gone9"));
    expect(migration).toMatchObject({ source: "traces", backwardCompatible: false });
    expect(migration.changes).toEqual([
      { kind: "removeAttribute", entity: entityPublisher.uuid, entityName: entityPublisher.name, attribute: "gone9", backwardCompatible: false, supported: true },
    ]);
    expect(stepsOf(migration)).toEqual([{ name: `remove ${entityPublisher.name}.gone9`, kind: "model", backwardCompatible: false }]);
  }, 60000);

  it("B2.2: an Entity removed through dropEntity gives removeEntity and its dropEntity step", async () => {
    const dropped = await createTestEntity("Dropped9");
    const migration = await migrationAround("9B22", async () => {
      expectOk(await dropEntity(dropped.uuid), "drop Dropped9");
    });
    createdEntities.splice(createdEntities.indexOf(dropped.uuid), 1);
    expect(migration).toMatchObject({ source: "traces", backwardCompatible: false });
    expect(migration.changes).toEqual([{ kind: "removeEntity", entity: dropped.uuid, entityName: dropped.name, backwardCompatible: false, supported: true }]);
    expect(stepsOf(migration)).toEqual([{ name: `drop Entity ${dropped.name}`, kind: "model", backwardCompatible: false }]);
    expect(migration.steps[0].action).toMatchObject({ actionType: "dropEntity", payload: { entityUuid: dropped.uuid } });
  }, 60000);

  it("B2.3 (#745 D3): a required attribute added to an existing Entity is written as unsupported, with its steps", async () => {
    const migration = await migrationAround("9B23", () => alterPublisher({ addColumns: [{ name: "required9", definition: { type: "string" } }] }, "Publisher.required9"));
    expect(migration).toMatchObject({ source: "traces", backwardCompatible: false });
    expect(migration.changes).toEqual([
      {
        kind: "addAttribute",
        entity: entityPublisher.uuid,
        entityName: entityPublisher.name,
        attribute: "required9",
        backwardCompatible: false,
        supported: false,
        note: expect.stringContaining("#749"),
      },
    ]);
    expect(stepsOf(migration).map(({ name }) => name)).toEqual([`add ${entityPublisher.name}.required9`, `fill ${entityPublisher.name}.required9`]);
  }, 60000);

  it("B2.4 (#745 D3): traces off, an Entity renamed and its idAttribute changed: the rename is supported, the key change is not", async () => {
    const renamed = await createTestEntity("Renamed9");
    await setAppForTestTraces(false);
    let migration: MigrationRow;
    try {
      migration = await migrationAround("9B24", async () =>
        writeEntity({ ...(await storedEntity(renamed.uuid)), name: `Renamed9b${run}`, idAttribute: "name" } as Entity, "rename Renamed9"),
      );
    } finally {
      await setAppForTestTraces(true);
    }
    expect(migration).toMatchObject({ source: "diff", backwardCompatible: false });
    expect(migration.changes.map(({ kind, entity, entityName, backwardCompatible, supported }) => ({ kind, entity, entityName, backwardCompatible, supported }))).toEqual([
      { kind: "renameEntity", entity: renamed.uuid, entityName: `Renamed9b${run}`, backwardCompatible: false, supported: true },
      { kind: "changeIdAttribute", entity: renamed.uuid, entityName: `Renamed9b${run}`, backwardCompatible: false, supported: false },
    ]);
    expect(stepsOf(migration).map(({ name }) => name)).toEqual([`rename Entity Renamed9${run} to Renamed9b${run}`]);
  }, 60000);

  it("B2.5: an attribute added then removed between the two versions is no change, and its steps are the Actions run", async () => {
    const migration = await migrationAround("9B25", async () => {
      await alterPublisher({ addColumns: [{ name: "transient9", definition: optionalString }] }, "Publisher.transient9");
      await alterPublisher({ removeColumns: ["transient9"] }, "Publisher without transient9");
    });
    expect(migration).toMatchObject({ source: "traces", changes: [] });
    expect(stepsOf(migration).map(({ name }) => name)).toEqual([
      `add ${entityPublisher.name}.transient9`,
      `fill ${entityPublisher.name}.transient9`,
      `remove ${entityPublisher.name}.transient9`,
    ]);
  }, 60000);

  it("B3.1: traces that do not give the to version refuse the generation, and name the difference", async () => {
    const endpoint = testEndpoint("Label31", "Label");
    expectOk(await modelRowWrite("createInstance", endpoint), "the Endpoint");
    const from = `9B31-1.0.0-${run}`;
    const to = `9B31-1.1.0-${run}`;
    expectOk(await freezeAppForTest(context.domainController, from), "freeze from");
    const recordsBefore = new Set((await storedAppForTestRows(context, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY)).map((row) => row.uuid));
    expectOk(await modelRowWrite("updateInstance", { ...endpoint, description: "Motto" } as EntityInstance), "the Endpoint's description");
    expectOk(await freezeAppForTest(context.domainController, to), "freeze to");
    // the record of the edit, changed in the store: its replay no longer gives the to version
    const record = (await storedAppForTestRows(context, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY)).find(
      (row) => !recordsBefore.has(row.uuid) && JSON.stringify(row).includes('"Motto"'),
    )!;
    expect(record, "the record of the edit").toBeDefined();
    const store = context.serverStores.getPersistenceStoreController(APP_FOR_TEST_DEPLOYMENT)!;
    expect(await store.upsertInstance("modelVersion", JSON.parse(JSON.stringify(record).replaceAll('"Motto"', '"Edited"')))).not.toBeInstanceOf(Action2Error);
    try {
      const refused = await generate(from, to);
      expect(refusalReason(refused), JSON.stringify(refused)).toBe("evolutionTracesDisagree");
      expect((refused as Action2Error).errorMessage ?? JSON.stringify(refused)).toContain(`Label31${run}`);
      expect(await storedMigration(from, to)).toBeUndefined();
    } finally {
      await store.upsertInstance("modelVersion", record);
    }
  }, 60000);

  it("B3.2: a re-baseline between the two versions refuses the generation", async () => {
    const from = `9B32-1.0.0-${run}`;
    const to = `9B32-1.1.0-${run}`;
    expectOk(await freezeAppForTest(context.domainController, from), "freeze from");
    expectOk(await modelAction({ actionType: "rebaselineEvolutionTraces", payload: { application: APP_FOR_TEST, versionName: `9B32-rebaseline-${run}` } }), "re-baseline");
    expectOk(await freezeAppForTest(context.domainController, to), "freeze to");

    const refused = await generate(from, to);

    expect(refusalReason(refused), JSON.stringify(refused)).toBe("migrationAcrossRebaseline");
    expect(await storedMigration(from, to)).toBeUndefined();
  }, 60000);

  it("B3.2: a re-baseline after a from version frozen with the traces off still refuses the generation", async () => {
    const from = `9B32b-1.0.0-${run}`;
    const to = `9B32b-1.1.0-${run}`;
    await setAppForTestTraces(false);
    try {
      expectOk(await freezeAppForTest(context.domainController, from), "freeze from, traces off");
    } finally {
      await setAppForTestTraces(true);
    }
    expectOk(await modelAction({ actionType: "rebaselineEvolutionTraces", payload: { application: APP_FOR_TEST, versionName: `9B32b-rebaseline-${run}` } }), "re-baseline");
    expectOk(await freezeAppForTest(context.domainController, to), "freeze to");

    const refused = await generate(from, to);

    expect(refusalReason(refused), JSON.stringify(refused)).toBe("migrationAcrossRebaseline");
    expect(await storedMigration(from, to)).toBeUndefined();
  }, 60000);

  it("B3.6: a version whose Cross rows name an EntityVersion it does not hold is refused, not read as a removal", async () => {
    const from = `9B36-1.0.0-${run}`;
    const to = `9B36-1.1.0-${run}`;
    expectOk(await freezeAppForTest(context.domainController, from), "freeze from");
    expectOk(await freezeAppForTest(context.domainController, to), "freeze to");
    const fromVersion = (await storedAppForTestRows(context, "modelVersion", SELF_APPLICATION_VERSION_ENTITY)).find((row) => row.name === from)!;
    const cross = (await storedAppForTestRows(context, "modelVersion", CROSS_ENTITY_VERSION_ENTITY)).find(
      (row) => (row as { applicationVersion?: string }).applicationVersion === fromVersion.uuid,
    ) as { entityVersion: string };
    const entityVersion = (await storedAppForTestRows(context, "modelVersion", ENTITY_VERSION_ENTITY)).find((row) => row.uuid === cross.entityVersion)!;
    const store = (context.serverDomainController as any).persistenceStoreLocalOrRemote
      .getLocalPersistenceStoreControllerManager()
      .getPersistenceStoreController(APP_FOR_TEST_DEPLOYMENT);
    expectOk(await store.deleteInstance("modelVersion", entityVersion), "delete an EntityVersion of from");
    try {
      const refused = await generate(from, to);
      expect(refusalReason(refused), JSON.stringify(refused)).toBe("versionIncomplete");
      expect(await storedMigration(from, to)).toBeUndefined();
    } finally {
      expectOk(await store.upsertInstance("modelVersion", entityVersion), "restore the EntityVersion");
    }
  }, 60000);

  it("B3.3: with the traces off, the Migration comes from the two versions, as the same model Actions", async () => {
    await setAppForTestTraces(false);
    try {
      const migration = await migrationAround("9B33", () => alterPublisher({ addColumns: [{ name: "offline9", definition: optionalString }] }, "Publisher.offline9"));
      expect(migration).toMatchObject({ source: "diff", backwardCompatible: true });
      expect(migration.changes).toEqual([
        { kind: "addAttribute", entity: entityPublisher.uuid, entityName: entityPublisher.name, attribute: "offline9", backwardCompatible: true, supported: true },
      ]);
      expect(stepsOf(migration).map(({ name }) => name)).toEqual([`add ${entityPublisher.name}.offline9`, `fill ${entityPublisher.name}.offline9`]);
      expect(migration.steps[0].trace, "no record").toBeUndefined();
    } finally {
      await setAppForTestTraces(true);
    }
  }, 60000);

  it("B3.4: a second generation is refused unless it replaces the Migration, which keeps its uuid", async () => {
    const migration = await migrationAround("9B34", () => alterPublisher({ addColumns: [{ name: "again9", definition: optionalString }] }, "Publisher.again9"));
    const from = `9B34-1.0.0-${run}`;
    const to = `9B34-1.1.0-${run}`;

    const refused = await generate(from, to);
    expect(refusalReason(refused), JSON.stringify(refused)).toBe("migrationExists");
    expect(refusalReason(await generate(from, to, false))).toBe("migrationExists");

    expectOk(await generate(from, to, true), "replace");
    const pair = (await storedAppForTestRows(context, "modelVersion", MIGRATION_ENTITY)).filter(
      (row) => (row as MigrationRow).from === from && (row as MigrationRow).to === to,
    ) as MigrationRow[];
    expect(pair.map((row) => row.uuid)).toEqual([migration.uuid]);
    expect(pair[0].changes).toEqual(migration.changes);
    expect(pair[0].steps[0].uuid, "a new draft, new steps").not.toBe(migration.steps[0].uuid);
  }, 60000);

  it("B3.5: a Migration written by hand is read as any other, and generation does not overwrite it", async () => {
    const from = `9B35-1.0.0-${run}`;
    const to = `9B35-1.1.0-${run}`;
    expectOk(await freezeAppForTest(context.domainController, from), "freeze from");
    expectOk(await freezeAppForTest(context.domainController, to), "freeze to");
    const manual = {
      uuid: randomUUID(),
      parentName: "Migration",
      parentUuid: MIGRATION_ENTITY,
      name: `${from} → ${to}`,
      application: APP_FOR_TEST,
      from,
      to,
      source: "manual",
      changes: [],
      steps: [],
      backwardCompatible: true,
      description: "#9 B3: written by hand",
    };
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "createInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: { application: APP_FOR_TEST, applicationSection: "modelVersion", parentUuid: MIGRATION_ENTITY, objects: [manual] },
        } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "the manual Migration",
    );

    expect(await storedMigration(from, to)).toMatchObject({ uuid: manual.uuid, source: "manual", description: "#9 B3: written by hand" });
    expect(refusalReason(await generate(from, to))).toBe("migrationExists");
    expect(await storedMigration(from, to)).toMatchObject({ uuid: manual.uuid, source: "manual" });
  }, 60000);

  // ##############################################################################################
  // #745 D2: the steps, in trace order, and the refusals
  it("B4.1: one alterEntityAttribute adding a94 and removing b94 gives the add, its fill step, then the remove", async () => {
    await alterPublisher({ addColumns: [{ name: "b94", definition: optionalString }] }, "Publisher.b94");
    const migration = await migrationAround("9B41", () =>
      alterPublisher({ addColumns: [{ name: "a94", definition: optionalString }], removeColumns: ["b94"] }, "Publisher a94 for b94"),
    );
    expect(stepsOf(migration)).toEqual([
      { name: `add ${entityPublisher.name}.a94`, kind: "model", backwardCompatible: true },
      { name: `fill ${entityPublisher.name}.a94`, kind: "data", backwardCompatible: true },
      { name: `remove ${entityPublisher.name}.b94`, kind: "model", backwardCompatible: false },
    ]);
    expect(migration.steps[0].trace).toBe(migration.steps[2].trace);
  }, 60000);

  it("B4.2: an instance write of an Entity row refuses the generation, naming the record; nothing is written", async () => {
    // an attribute added by an updateInstance of the Entity row
    const updated = await versionsAround("9B42u", async () =>
      writeEntity(await withAttributes(entityPublisher.uuid, (d) => ({ ...d, rowWrite9: optionalString })), "Publisher.rowWrite9 by its row"),
    );
    const refusedUpdate = await generate(updated.from, updated.to);
    expect(refusalReason(refusedUpdate), JSON.stringify(refusedUpdate)).toBe("migrationEntityRowWrite");
    expect((refusedUpdate as Action2Error).errorContext?.record).toBeDefined();
    expect((refusedUpdate as Action2Error).errorMessage).toContain(entityPublisher.name);
    expect(await storedMigration(updated.from, updated.to)).toBeUndefined();
    await writeEntity(await withAttributes(entityPublisher.uuid, ({ rowWrite9: _removed, ...rest }) => rest), "Publisher without rowWrite9");

    // an Entity row created, then deleted, by instance writes
    const rowOnly = testEntity("RowOnly9");
    const created = await versionsAround("9B42c", async () => {
      expectOk(await modelRowWrite("createInstance", rowOnly as unknown as EntityInstance), "createInstance of an Entity row");
    });
    expect(refusalReason(await generate(created.from, created.to))).toBe("migrationEntityRowWrite");
    const deleted = await versionsAround("9B42d", async () => {
      expectOk(await modelRowWrite("deleteInstance", rowOnly as unknown as EntityInstance), "deleteInstance of an Entity row");
    });
    expect(refusalReason(await generate(deleted.from, deleted.to))).toBe("migrationEntityRowWrite");
    expect(await storedMigration(created.from, created.to)).toBeUndefined();
    expect(await storedMigration(deleted.from, deleted.to)).toBeUndefined();
  }, 120000);

  it("B4.3: an Endpoint created, updated and deleted gives three model steps; the traces switch gives a settingsChange and no step", async () => {
    const endpoint = testEndpoint("Endpoint43", "Before");
    const migration = await migrationAround("9B43", async () => {
      expectOk(await modelRowWrite("createInstance", endpoint), "create the Endpoint");
      expectOk(await modelRowWrite("updateInstance", { ...endpoint, description: "After" } as EntityInstance), "update the Endpoint");
      expectOk(await modelRowWrite("deleteInstance", endpoint), "delete the Endpoint");
      await setAppForTestTraces(true);
    });
    expect(stepsOf(migration)).toEqual([
      { name: `createInstance Endpoint Endpoint43${run}`, kind: "model", backwardCompatible: true },
      { name: `updateInstance Endpoint Endpoint43${run}`, kind: "model", backwardCompatible: true },
      { name: `deleteInstance Endpoint Endpoint43${run}`, kind: "model", backwardCompatible: true },
    ]);
    expect(migration.steps[1].action).toMatchObject({
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: APP_FOR_TEST, applicationSection: "model", objects: [expect.objectContaining({ uuid: endpoint.uuid, description: "After" })] },
    });
    expect(migration.changes).toEqual([
      expect.objectContaining({ kind: "settingsChange", entity: SELF_APPLICATION_ENTITY, backwardCompatible: true, supported: true }),
    ]);
  }, 60000);

  it("B4.4: an incomplete record between the two versions refuses the generation; so does a generation for Miroir", async () => {
    const { from, to } = await versionsAround("9B44", () => alterPublisher({ addColumns: [{ name: "incomplete9", definition: optionalString }] }, "Publisher.incomplete9"));
    await alterPublisher({ removeColumns: ["incomplete9"] }, "Publisher without incomplete9");
    const record = (await storedAppForTestRows(context, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY)).find((row) =>
      JSON.stringify(row).includes('"incomplete9"'),
    )!;
    expect(record, "the record of the edit").toBeDefined();
    const store = context.serverStores.getPersistenceStoreController(APP_FOR_TEST_DEPLOYMENT)!;
    expect(await store.upsertInstance("modelVersion", { ...record, complete: false } as EntityInstance)).not.toBeInstanceOf(Action2Error);
    try {
      const refused = await generate(from, to);
      expect(refusalReason(refused), JSON.stringify(refused)).toBe("migrationIncompleteRecord");
      expect((refused as Action2Error).errorContext?.record).toBe(record.uuid);
      expect(await storedMigration(from, to)).toBeUndefined();
    } finally {
      await store.upsertInstance("modelVersion", record);
    }

    const miroir = await generate("1.0.0", "1.1.0", undefined, MIROIR_APPLICATION);
    expect(refusalReason(miroir), JSON.stringify(miroir)).toBe("migrationUnsupportedApplication");
  }, 60000);

  it("B4.5: traces off, the diff gives the model Actions in the fixed order: Entities created before attributes added", async () => {
    const created = testEntity("Fixed95");
    await setAppForTestTraces(false);
    let migration: MigrationRow;
    try {
      migration = await migrationAround("9B45", async () => {
        await alterPublisher({ addColumns: [{ name: "fixed95", definition: optionalString }] }, "Publisher.fixed95");
        await createEntities([created], "Fixed95");
      });
    } finally {
      await setAppForTestTraces(true);
    }
    expect(migration).toMatchObject({ source: "diff" });
    expect(stepsOf(migration).map(({ name }) => name)).toEqual([
      `create Entity ${created.name}`,
      `add ${entityPublisher.name}.fixed95`,
      `fill ${entityPublisher.name}.fixed95`,
    ]);
  }, 60000);

  it("B4.6: traces on, the same edits give the steps in trace order: the alter, its fill step, then the createEntity", async () => {
    const created = testEntity("Traced96");
    const migration = await migrationAround("9B46", async () => {
      await alterPublisher({ addColumns: [{ name: "traced96", definition: optionalString }] }, "Publisher.traced96");
      await createEntities([created], "Traced96");
    });
    expect(migration).toMatchObject({ source: "traces" });
    expect(stepsOf(migration).map(({ name }) => name)).toEqual([
      `add ${entityPublisher.name}.traced96`,
      `fill ${entityPublisher.name}.traced96`,
      `create Entity ${created.name}`,
    ]);
  }, 60000);

  it("B4.7: one createEntity of two Entities gives two steps", async () => {
    const [first, second] = [testEntity("First97"), testEntity("Second97")];
    const migration = await migrationAround("9B47", () => createEntities([first, second], "First97 and Second97"));
    expect(stepsOf(migration)).toEqual([
      { name: `create Entity ${first.name}`, kind: "model", backwardCompatible: true },
      { name: `create Entity ${second.name}`, kind: "model", backwardCompatible: true },
    ]);
    expect(migration.steps.map((step) => step.action.payload.entities.map((entity: Entity) => entity.uuid))).toEqual([[first.uuid], [second.uuid]]);
    expect(migration.steps[0].trace).toBe(migration.steps[1].trace);
  }, 60000);

  it("B4.8: traces off, an Entity description changed has no model Action yet (#748): refused, naming the Entity and the field", async () => {
    await setAppForTestTraces(false);
    let versions: { from: string; to: string };
    try {
      versions = await versionsAround("9B48", async () =>
        writeEntity({ ...(await storedEntity(entityPublisher.uuid)), description: `described in ${run}` } as Entity, "Publisher's description"),
      );
    } finally {
      await setAppForTestTraces(true);
    }
    const refused = await generate(versions.from, versions.to);
    expect(refusalReason(refused), JSON.stringify(refused)).toBe("migrationNoModelAction");
    expect((refused as Action2Error).errorMessage).toContain(entityPublisher.name);
    expect((refused as Action2Error).errorMessage).toContain("description");
    expect(await storedMigration(versions.from, versions.to)).toBeUndefined();
  }, 60000);
});
