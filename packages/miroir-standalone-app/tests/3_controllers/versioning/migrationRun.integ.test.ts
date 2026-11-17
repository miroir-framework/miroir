/**
 * #9 part C, #745: a migration run on a following deployment of appForTest (`runMigration`): the steps of the
 * Migration in the order of its one list, model steps executing the model Actions the designer ran, each
 * step recorded in the deployment's `DeploymentState` row as started, then as done (#745 D5).
 *
 * The following deployment is a copy of the authoring one's `model` and `data` folders taken right after
 * 1.0.0 is frozen; it shares the authoring deployment's `modelVersion` folder, where the Migrations and the
 * frozen versions are.
 *
 * Not reachable through MiroirTest: the tests create a following deployment next to the authoring one,
 * copy its stores on disk, and read the stores of the emulated server.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationRun
 * ```
 */
import * as fs from "fs";
import * as path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  createDeploymentCompositeAction,
  DEPLOYMENT_STATE_ENTITY_UUID,
  ENTITY_CREATION_REFUSALS,
  EVOLUTION_TRACE_RECORD_ENTITY_UUID,
  metaModelEntityList,
  type DeploymentStateRow,
  type DomainController,
  type Entity,
  type EntityInstance,
  type StoreUnitConfiguration,
} from "@miroir-framework/core";
import { adminSelfApplication, deployment_Admin, entityDeployment } from "@miroir-framework/core/admin";
import {
  AGREEMENT_COLLECTIONS,
  frozenModelState,
  liveModelState,
  MIGRATION_RUN_REFUSALS,
  type MigrationRow,
  type MigrationStep,
  type ModelState,
} from "@miroir-framework/versioning";
import { entityPublisher } from "miroir-fixture-appForTest";

import { resolveRepoRoot } from "../../helpers/integrationTestProfiles.js";
import {
  APP_FOR_TEST,
  APP_FOR_TEST_DEPLOYMENT,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectOk,
  freezeAppForTest,
  INSTANCE_ENDPOINT,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  loadModelOnServer,
  MIROIR_APPLICATION,
  MIROIR_DEPLOYMENT,
  MODEL_ENDPOINT,
  openVersioningTestContext,
  setCapabilities,
  storedRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const FOLLOWING_DEPLOYMENT = "9c000001-0000-4000-8000-000000000001";
const ADMIN_DEPLOYMENT = deployment_Admin.uuid;
const MIGRATION_ENTITY = "b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";
const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";

const followingMap = {
  [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT,
  [APP_FOR_TEST]: FOLLOWING_DEPLOYMENT,
  [LIBRARY_APPLICATION]: LIBRARY_DEPLOYMENT,
  [adminSelfApplication.uuid]: ADMIN_DEPLOYMENT,
};

const run = Date.now();
const VERSION_1_0 = `9C-1.0.0-${run}`;
const VERSION_1_1 = `9C-1.1.0-${run}`;
const VERSION_1_2 = `9C-1.2.0-${run}`;
const VERSION_1_3 = `9C-1.3.0-${run}`;
const VERSION_1_4 = `9C-1.4.0-${run}`;
const MOTTO = "mottoC9";
/** The Migrations the tests write by hand. */
const [SECOND_MIGRATION, FOURTH_MIGRATION, FIFTH_MIGRATION, SIXTH_MIGRATION] = [
  "9c000004-0000-4000-8000-000000000001",
  "9c00000a-0000-4000-8000-000000000001",
  "9c00000a-0000-4000-8000-000000000002",
  "9c00000a-0000-4000-8000-000000000003",
];
const [SETTLED_MIGRATION, OLD_SHAPE_MIGRATION, RESUMED_MIGRATION, LEFT_BEHIND_MIGRATION] = [
  "9c00000d-0000-4000-8000-000000000001",
  "9c00000d-0000-4000-8000-000000000002",
  "9c00000d-0000-4000-8000-000000000003",
  "9c00000d-0000-4000-8000-000000000004",
];
const [EDITED_MIGRATION, HAND_CHANGED_MIGRATION, MISSING_TO_MIGRATION, MISSING_FROM_MIGRATION] = [
  "9c000013-0000-4000-8000-000000000001",
  "9c000013-0000-4000-8000-000000000011",
  "9c000013-0000-4000-8000-000000000012",
  "9c000013-0000-4000-8000-000000000013",
];

/** An Entity appForTest gains in 1.1.0. */
const edition = {
  uuid: "9c000002-0000-4000-8000-000000000001",
  parentName: "Entity",
  parentUuid: ENTITY_ENTITY,
  selfApplication: APP_FOR_TEST,
  name: "EditionC9",
  conceptLevel: "Model",
  description: "#9 part C: an Entity added in 1.1.0",
  mlSchema: {
    type: "object",
    definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" }, name: { type: "string" } },
  },
} as unknown as Entity;
const EDITION_INSTANCE = { uuid: "9c000003-0000-4000-8000-000000000001", parentUuid: edition.uuid, parentName: "EditionC9", name: "first edition" };

let context: VersioningTestContext;
let followingFolder: string;
let migration: MigrationRow;
/** Migrations written in the shared modelVersion folder, deleted after the file. */
const writtenMigrations: string[] = [];

/** A data step of `updateInstance`s in the following deployment's data, one per `[Entity uuid, instance uuid]`. */
function writeStep(uuid: string, name: string, writes: [string, string][], backwardCompatible = true): MigrationStep {
  return {
    uuid,
    name,
    kind: "data",
    backwardCompatible,
    action: {
      actionType: "compositeActionSequence",
      actionLabel: name,
      endpoint: DOMAIN_ENDPOINT,
      payload: {
        actionSequence: writes.map(([parentUuid, instanceUuid]) => ({
          actionType: "updateInstance",
          actionLabel: `write ${instanceUuid}`,
          endpoint: INSTANCE_ENDPOINT,
          payload: {
            application: APP_FOR_TEST,
            applicationSection: "data",
            parentUuid,
            objects: [{ uuid: instanceUuid, parentUuid, name: `instance ${instanceUuid}` }],
          },
        })),
      },
    } as any,
  };
}

/** A Migration written by hand. */
function manualMigration(uuid: string, from: string, to: string, steps: unknown[], extra: Record<string, unknown> = {}): MigrationRow {
  return {
    uuid,
    parentName: "Migration",
    parentUuid: MIGRATION_ENTITY,
    name: `${from} → ${to}, ${uuid}`,
    application: APP_FOR_TEST,
    from,
    to,
    source: "manual",
    changes: [],
    steps,
    backwardCompatible: true,
    ...extra,
  } as unknown as MigrationRow;
}

/** Writes a Migration in the shared modelVersion section (the following deployment refuses that write). */
async function storeMigration(row: MigrationRow | Record<string, unknown>, actionType = "createInstance"): Promise<void> {
  expectOk(
    await authoringAction({
      actionType,
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: APP_FOR_TEST, applicationSection: "modelVersion", parentUuid: MIGRATION_ENTITY, objects: [row] },
    }),
    `Migration ${String(row.uuid)}`,
  );
  writtenMigrations.push(String(row.uuid));
}

/** The data folder of an Entity uuid in the following deployment. */
function followingDataFolder(entityUuid: string): string {
  return path.join(resolveRepoRoot(), followingFolder, "data", entityUuid);
}

/** Blocks a data folder of the following deployment with a file: a write there fails until `unblock`. */
function block(entityUuid: string): void {
  fs.writeFileSync(followingDataFolder(entityUuid), "a file where a folder is written");
}

/** The store takes each entry of its data folder for an Entity: a folder in place of the file takes the writes. */
function unblock(entityUuid: string): void {
  fs.rmSync(followingDataFolder(entityUuid));
  fs.mkdirSync(followingDataFolder(entityUuid));
}

function host(): DomainController {
  return context.domainController as DomainController;
}

function authoringAction(action: Record<string, unknown>) {
  return context.domainController.handleAction(action as any, applicationDeploymentMap, appForTestModelEnvironment(context.domainController));
}

function runMigration(migrationUuid: string, map: Record<string, string> = followingMap) {
  return context.domainController.handleAction(
    { actionType: "runMigration", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, migration: migrationUuid } } as any,
    map,
    appForTestModelEnvironment(context.domainController),
  );
}

function settle(step: string, outcome: "done" | "notRun", map: Record<string, string> = followingMap) {
  return context.domainController.handleAction(
    { actionType: "settleMigrationStep", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, step, outcome } } as any,
    map,
    appForTestModelEnvironment(context.domainController),
  );
}

async function state(map: Record<string, string>, version?: string): Promise<ModelState> {
  const read = version ? await frozenModelState(host(), APP_FOR_TEST, map, version) : await liveModelState(host(), APP_FOR_TEST, map);
  expect(read instanceof Action2Error, JSON.stringify(read)).toBe(false);
  return read as ModelState;
}

const META_MODEL_ENTITIES = new Set(metaModelEntityList.map(({ entity }) => entity.uuid));

/** The application's own model rows, by collection, sorted, without what a freeze does not keep. */
function ownModel(modelState: ModelState): Record<string, unknown[]> {
  return Object.fromEntries(
    AGREEMENT_COLLECTIONS.map((collection) => [
      collection,
      (modelState[collection] as Record<string, unknown>[])
        .filter((row) => collection !== "entities" || !META_MODEL_ENTITIES.has(row.uuid as string))
        .map(({ parentDefinitionVersionUuid: _p, conceptLevel, ...row }) =>
          collection === "entities" ? { ...row, conceptLevel: conceptLevel ?? "Model" } : row,
        )
        .sort((a, b) => String(a.uuid).localeCompare(String(b.uuid))),
    ]),
  );
}

function versionUuid(modelState: ModelState, name: string): string {
  const version = modelState.applicationVersions.find((row) => row.name === name);
  expect(version, `Application Version ${name}`).toBeDefined();
  return version!.uuid;
}

async function deploymentState(deployment = FOLLOWING_DEPLOYMENT): Promise<DeploymentStateRow | undefined> {
  return (await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID)).find(
    (row) => row.uuid === deployment,
  ) as DeploymentStateRow | undefined;
}

/** Replaces the following deployment's DeploymentState row, as an operator would by hand. */
async function writeDeploymentStateRow(row: DeploymentStateRow): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: { application: adminSelfApplication.uuid, applicationSection: "data", parentUuid: DEPLOYMENT_STATE_ENTITY_UUID, objects: [row] },
      } as any,
      followingMap,
      appForTestModelEnvironment(context.domainController),
    ),
    "the DeploymentState row",
  );
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

/** The context of the innermost error that has a reason. */
function refusalContext(result: unknown): Record<string, unknown> | undefined {
  let error = result as { errorContext?: Record<string, unknown>; innerError?: unknown } | undefined;
  while (error && typeof error === "object") {
    if (error.errorContext?.reason) {
      return error.errorContext;
    }
    error = error.innerError as typeof error;
  }
  return undefined;
}

async function setAppForTestTraces(on: boolean): Promise<void> {
  const stored = (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "model", SELF_APPLICATION_ENTITY)).find((row) => row.uuid === APP_FOR_TEST)!;
  expectOk(
    await authoringAction({
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: APP_FOR_TEST, applicationSection: "model", objects: [{ ...stored, evolutionTraces: on }] },
    }),
    `evolutionTraces ${on}`,
  );
}

function modelAction(action: Record<string, unknown>) {
  return authoringAction({ endpoint: MODEL_ENDPOINT, ...action, payload: { application: APP_FOR_TEST, transactional: false, ...(action.payload as object) } });
}

async function storedMigrationBetween(from: string, to: string): Promise<MigrationRow> {
  const row = (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", MIGRATION_ENTITY)).find(
    (candidate) => (candidate as unknown as MigrationRow).from === from && (candidate as unknown as MigrationRow).to === to,
  ) as unknown as MigrationRow;
  expect(row, `the Migration ${from} → ${to}`).toBeDefined();
  writtenMigrations.push(row.uuid);
  return row;
}

beforeAll(async () => {
  context = await openVersioningTestContext();
  await loadModelOnServer(context, APP_FOR_TEST);

  // the authoring deployment: 1.0.0 is the fixture, frozen with the traces on
  await setAppForTestTraces(true);
  expectOk(await freezeAppForTest(context.domainController, VERSION_1_0), "freeze 1.0.0");

  // the following deployment's model and data: copies of the authoring ones at 1.0.0
  const authoring = (await storedRows(context, ADMIN_DEPLOYMENT, "data", entityDeployment.uuid)).find((row) => row.uuid === APP_FOR_TEST_DEPLOYMENT)!;
  const authoringConfiguration = (authoring as unknown as { configuration: StoreUnitConfiguration & Record<string, any> }).configuration;
  const repoRoot = resolveRepoRoot();
  const authoringModelFolder: string = authoringConfiguration.model.directory;
  followingFolder = path.join(path.dirname(path.dirname(authoringModelFolder)), "appForTest-following9C");
  fs.rmSync(path.join(repoRoot, followingFolder), { recursive: true, force: true });
  fs.cpSync(path.join(repoRoot, authoringModelFolder), path.join(repoRoot, followingFolder, "model"), { recursive: true });
  fs.cpSync(path.join(repoRoot, authoringConfiguration.data.directory), path.join(repoRoot, followingFolder, "data"), { recursive: true });

  // 1.1.0: EditionC9 created, then the optional Publisher.mottoC9 added, through model Actions
  expectOk(await modelAction({ actionType: "createEntity", payload: { entities: [edition] } }), "EditionC9");
  expectOk(
    await modelAction({
      actionType: "alterEntityAttribute",
      payload: { entityName: entityPublisher.name, entityUuid: entityPublisher.uuid, addColumns: [{ name: MOTTO, definition: { type: "string", optional: true } }] },
    }),
    "Publisher.mottoC9",
  );
  expectOk(await freezeAppForTest(context.domainController, VERSION_1_1), "freeze 1.1.0");

  // the draft, its fill step written by the designer
  expectOk(
    await authoringAction({ actionType: "generateMigration", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, from: VERSION_1_0, to: VERSION_1_1 } }),
    "generateMigration",
  );
  const draft = await storedMigrationBetween(VERSION_1_0, VERSION_1_1);
  expect(draft.steps.map(({ name, kind }) => ({ name, kind }))).toEqual([
    { name: "create Entity EditionC9", kind: "model" },
    { name: `add Publisher.${MOTTO}`, kind: "model" },
    { name: `fill Publisher.${MOTTO}`, kind: "data" },
  ]);
  const publishers = await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "data", entityPublisher.uuid);
  const fill = draft.steps[2];
  migration = {
    ...draft,
    // set wrong by hand: the migration run recomputes it
    backwardCompatible: false,
    steps: [
      ...draft.steps.slice(0, 2),
      {
        ...fill,
        action: {
          ...fill.action,
          payload: {
            actionSequence: [
              {
                actionType: "updateInstance",
                actionLabel: "fill the mottos",
                endpoint: INSTANCE_ENDPOINT,
                payload: {
                  application: APP_FOR_TEST,
                  applicationSection: "data",
                  parentUuid: entityPublisher.uuid,
                  objects: publishers.map((row) => ({ ...row, [MOTTO]: `motto of ${(row as { name?: string }).name}` })),
                },
              },
              {
                actionType: "createInstance",
                actionLabel: "the first edition",
                endpoint: INSTANCE_ENDPOINT,
                payload: { application: APP_FOR_TEST, applicationSection: "data", parentUuid: edition.uuid, objects: [EDITION_INSTANCE] },
              },
            ],
          },
        } as any,
      },
    ],
  };
  await storeMigration(migration, "updateInstance");

  // the following deployment at 1.0.0, its modelVersion the authoring one's
  expectOk(
    await context.domainController.handleAction(
      createDeploymentCompositeAction(
        "appForTest",
        FOLLOWING_DEPLOYMENT,
        APP_FOR_TEST,
        undefined,
        {
          ...authoringConfiguration,
          model: { emulatedServerType: "filesystem", directory: `${followingFolder}/model` },
          data: { emulatedServerType: "filesystem", directory: `${followingFolder}/data` },
        } as StoreUnitConfiguration,
        {
          skipOpenAdminStore: true,
          skipCreateStore: true,
          role: "following",
          installVersion: VERSION_1_0,
          labels: { deployment: { name: "AppForTestFollowing9C", description: "#9 part C: a following deployment of appForTest" } },
        },
      ),
      followingMap,
      appForTestModelEnvironment(context.domainController),
    ),
    "the following deployment",
  );
}, 180000);

afterAll(async () => {
  await setAppForTestTraces(false);
  await modelAction({ actionType: "dropEntity", payload: { entityUuid: edition.uuid } });
  const publisher = (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "model", ENTITY_ENTITY)).find(
    (row) => row.uuid === entityPublisher.uuid,
  ) as unknown as Entity;
  if (MOTTO in publisher.mlSchema.definition) {
    await modelAction({ actionType: "alterEntityAttribute", payload: { entityName: entityPublisher.name, entityUuid: entityPublisher.uuid, removeColumns: [MOTTO] } });
  }
  const migrations = (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", MIGRATION_ENTITY)).filter((row) => writtenMigrations.includes(row.uuid));
  if (migrations.length > 0) {
    await authoringAction({
      actionType: "deleteInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: APP_FOR_TEST, applicationSection: "modelVersion", parentUuid: MIGRATION_ENTITY, objects: migrations },
    });
  }
  for (const parentUuid of [entityDeployment.uuid, DEPLOYMENT_STATE_ENTITY_UUID]) {
    const row = (await storedRows(context, ADMIN_DEPLOYMENT, "data", parentUuid)).find((stored) => stored.uuid === FOLLOWING_DEPLOYMENT);
    if (row) {
      await context.domainController.handleAction(
        {
          actionType: "deleteInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: { application: adminSelfApplication.uuid, applicationSection: "data", parentUuid, objects: [row] },
        } as any,
        followingMap,
        appForTestModelEnvironment(context.domainController),
      );
    }
  }
  if (followingFolder) {
    fs.rmSync(path.join(resolveRepoRoot(), followingFolder), { recursive: true, force: true });
  }
}, 60000);

describe("#9 part C, #745: runMigration", () => {
  it("C1: the following deployment goes from 1.0.0 to 1.1.0 by the traced model Actions, its data filled; a second migration run is refused", async () => {
    const recordsBefore = await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID);
    expect(await deploymentState()).toMatchObject({ version: VERSION_1_0 });
    expect(fs.existsSync(followingDataFolder(edition.uuid)), "no storage of EditionC9 before the migration run").toBe(false);
    expect(migration.steps[0].trace, "the createEntity step names its record").toBeDefined();

    const [first, second] = await Promise.all([runMigration(migration.uuid), runMigration(migration.uuid)]);

    expectOk(first, "the first migration run");
    expect(refusalReason(second), JSON.stringify(second)).toBe(MIGRATION_RUN_REFUSALS.migrationAlreadyApplied);

    // the createEntity step made EditionC9's storage during the migration run
    expect(fs.existsSync(followingDataFolder(edition.uuid))).toBe(true);
    // the model is 1.1.0's
    const following = await state(followingMap);
    expect(ownModel(following)).toEqual(ownModel(await state(followingMap, versionUuid(following, VERSION_1_1))));
    // the data is filled, the new Entity's instance stored
    const publishers = await storedRows(context, FOLLOWING_DEPLOYMENT, "data", entityPublisher.uuid);
    const filled = ((migration.steps[2].action as any).payload.actionSequence[0] as { payload: { objects: { uuid: string; name: string }[] } }).payload.objects;
    expect(filled.length).toBeGreaterThan(0);
    // some fixture files are named after another uuid than the row's: their update lands in a second file
    const mottos = new Map(
      publishers.filter((row) => (row as Record<string, unknown>)[MOTTO] !== undefined).map((row) => [row.uuid, (row as Record<string, unknown>)[MOTTO]]),
    );
    expect(filled.map((row) => mottos.get(row.uuid))).toEqual(filled.map((row) => `motto of ${row.name}`));
    expect(await storedRows(context, FOLLOWING_DEPLOYMENT, "data", edition.uuid)).toEqual([expect.objectContaining(EDITION_INSTANCE)]);
    // the authoring deployment's data is untouched
    expect((await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "data", edition.uuid)).length).toBe(0);
    // the state record
    const recorded = await deploymentState();
    expect(recorded).toMatchObject({ version: VERSION_1_1, applied: [expect.objectContaining({ migration: migration.uuid, from: VERSION_1_0, to: VERSION_1_1 })] });
    expect(recorded?.run).toBeUndefined();
    // a migration run is no model change of the application: nothing recorded
    expect(await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID)).toEqual(recordsBefore);

    expect(refusalReason(await runMigration(migration.uuid))).toBe(MIGRATION_RUN_REFUSALS.migrationAlreadyApplied);
  }, 120000);

  it("C2: a step that fails part way is in doubt: the next runMigration is refused until the step is settled", async () => {
    expectOk(await freezeAppForTest(context.domainController, VERSION_1_2), "freeze 1.2.0");
    const [E1, E2, F1, F2] = [1, 2, 3, 4].map((n) => `9c00000${n}-0000-4000-8000-0000000000c2`);
    // folders of no Entity of the model, each blocked by a file in its place until the test puts a folder there
    const [BLOCKED_E, BLOCKED_F] = ["9c0000b1-0000-4000-8000-000000000001", "9c0000b2-0000-4000-8000-000000000001"];
    const second = manualMigration(
      SECOND_MIGRATION,
      VERSION_1_1,
      VERSION_1_2,
      [
        writeStep("9c000005-0000-4000-8000-000000000001", "one", [[edition.uuid, E1]]),
        writeStep("9c000005-0000-4000-8000-000000000002", "two", [[BLOCKED_E, E2]]),
        // its first write lands, its second fails
        writeStep("9c000005-0000-4000-8000-000000000003", "fill", [[edition.uuid, F1], [BLOCKED_F, F2]]),
        writeStep("9c000005-0000-4000-8000-000000000004", "drop nothing", [], false),
      ],
      // set wrong by hand: the last step is not backward-compatible
      { backwardCompatible: true },
    );
    await storeMigration(second);
    block(BLOCKED_E);
    block(BLOCKED_F);
    const [one, two, fill] = second.steps;

    // 1. stopped at the step "two": it is in doubt
    const stopped = await runMigration(second.uuid);
    expect(refusalReason(stopped), JSON.stringify(stopped)).toBe(MIGRATION_RUN_REFUSALS.migrationStepFailed);
    expect(refusalContext(stopped)).toMatchObject({ step: two.uuid, stepName: "two" });
    const afterStop = await deploymentState();
    expect(afterStop?.version).toBe(VERSION_1_1);
    expect(afterStop?.run).toMatchObject({ stepsDone: [one.uuid], stepStarted: two.uuid });
    expect((afterStop?.run?.migration as MigrationRow).backwardCompatible, "recomputed by the migration run").toBe(false);

    // another Migration waits for the migration run in progress
    expect(refusalReason(await runMigration(migration.uuid))).toBe(MIGRATION_RUN_REFUSALS.migrationAlreadyApplied);
    const other = manualMigration("9c000004-0000-4000-8000-000000000002", VERSION_1_1, VERSION_1_2, []);
    await storeMigration(other);
    expect(refusalReason(await runMigration(other.uuid))).toBe(MIGRATION_RUN_REFUSALS.migrationRunInProgress);

    // 2. the step in doubt stops every later runMigration, which writes nothing
    unblock(BLOCKED_E);
    const inDoubt = await runMigration(second.uuid);
    expect(refusalReason(inDoubt), JSON.stringify(inDoubt)).toBe(MIGRATION_RUN_REFUSALS.migrationStepInDoubt);
    expect(refusalContext(inDoubt)).toMatchObject({ step: two.uuid, stepName: "two" });
    expect((inDoubt as Action2Error).errorMessage).toContain('"two"');
    expect(await deploymentState()).toEqual(afterStop);

    // the Migration's file changed on disk (the following deployment refuses that write): the migration run keeps its copy
    const sharedModelVersion = (
      (await storedRows(context, ADMIN_DEPLOYMENT, "data", entityDeployment.uuid)).find((row) => row.uuid === APP_FOR_TEST_DEPLOYMENT) as unknown as {
        configuration: { modelVersion: { directory: string } };
      }
    ).configuration.modelVersion.directory;
    const onDisk = path.join(resolveRepoRoot(), sharedModelVersion, MIGRATION_ENTITY, `${second.uuid}.json`);
    expect(fs.existsSync(onDisk), onDisk).toBe(true);
    fs.writeFileSync(onDisk, fs.readFileSync(onDisk, "utf8").replaceAll(E2, "9c000009-0000-4000-8000-0000000000c2"));

    // 3. settled as not run (none of its writes landed): the next runMigration executes it, and stops in "fill"
    expectOk(await settle(two.uuid, "notRun"), "settle two");
    expect((await deploymentState())?.run).toMatchObject({ stepsDone: [one.uuid] });
    expect((await deploymentState())?.run?.stepStarted).toBeUndefined();
    const stoppedInFill = await runMigration(second.uuid);
    expect(refusalReason(stoppedInFill), JSON.stringify(stoppedInFill)).toBe(MIGRATION_RUN_REFUSALS.migrationStepFailed);
    expect((await deploymentState())?.run).toMatchObject({ stepsDone: [one.uuid, two.uuid], stepStarted: fill.uuid });
    const firstFillWrite = path.join(followingDataFolder(edition.uuid), `${F1}.json`);
    expect(fs.existsSync(firstFillWrite), "the fill step's first write landed").toBe(true);
    expect(refusalReason(await runMigration(second.uuid))).toBe(MIGRATION_RUN_REFUSALS.migrationStepInDoubt);

    // 4. its first write undone by hand, the step settled as not run: the migration run ends
    fs.rmSync(firstFillWrite);
    unblock(BLOCKED_F);
    expectOk(await settle(fill.uuid, "notRun"), "settle fill");
    expectOk(await runMigration(second.uuid), "the continued migration run");

    const ended = await deploymentState();
    expect(ended).toMatchObject({ version: VERSION_1_2 });
    expect(ended?.run).toBeUndefined();
    expect(ended?.applied?.map((applied) => applied.migration)).toEqual([migration.uuid, second.uuid]);
    // the data of an uninterrupted migration run: the copy's steps, not the edited file's
    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "data", edition.uuid)).map((row) => row.uuid).sort()).toEqual(
      [EDITION_INSTANCE.uuid, E1, F1].sort(),
    );
    expect(fs.readdirSync(followingDataFolder(BLOCKED_E))).toEqual([`${E2}.json`]);
    expect(fs.readdirSync(followingDataFolder(BLOCKED_F))).toEqual([`${F2}.json`]);
  }, 120000);

  it("C9: a traced renameEntity and a traced dropEntity are replayed: the renamed Entity keeps its instances, the dropped one's storage is gone", async () => {
    const temporary = { ...edition, uuid: "9c00000e-0000-4000-8000-000000000001", name: "TemporaryC9" } as unknown as Entity;
    expectOk(await modelAction({ actionType: "renameEntity", payload: { entityName: edition.name, entityUuid: edition.uuid, targetValue: "EditionC9b" } }), "rename EditionC9");
    expectOk(await modelAction({ actionType: "createEntity", payload: { entities: [temporary] } }), "create TemporaryC9");
    expectOk(await modelAction({ actionType: "dropEntity", payload: { entityUuid: temporary.uuid } }), "drop TemporaryC9");
    expectOk(await freezeAppForTest(context.domainController, VERSION_1_3), "freeze 1.3.0");
    expectOk(
      await authoringAction({ actionType: "generateMigration", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, from: VERSION_1_2, to: VERSION_1_3 } }),
      "generateMigration",
    );
    const renameAndDrop = await storedMigrationBetween(VERSION_1_2, VERSION_1_3);
    expect(renameAndDrop.steps.map(({ name }) => name)).toEqual(["rename Entity EditionC9 to EditionC9b", "create Entity TemporaryC9", "drop Entity TemporaryC9"]);
    const editionsBefore = (await storedRows(context, FOLLOWING_DEPLOYMENT, "data", edition.uuid)).map((row) => row.uuid).sort();

    expectOk(await runMigration(renameAndDrop.uuid), "the migration run");

    const following = await state(followingMap);
    expect(following.entities.find((entity) => entity.uuid === edition.uuid)?.name).toBe("EditionC9b");
    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "data", edition.uuid)).map((row) => row.uuid).sort()).toEqual(editionsBefore);
    expect(following.entities.some((entity) => entity.uuid === temporary.uuid)).toBe(false);
    expect(fs.existsSync(followingDataFolder(temporary.uuid)), "the dropped Entity's storage").toBe(false);
    expect(await deploymentState()).toMatchObject({ version: VERSION_1_3 });
  }, 120000);

  it("C3: refused, nothing written: on an authoring deployment, for a change no model Action applies, with Miroir changes unsaved, without the versioning capability", async () => {
    // a Migration generated with the traces off, between versions where Publisher.name changes type
    await setAppForTestTraces(false);
    const publisher = (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "model", ENTITY_ENTITY)).find(
      (row) => row.uuid === entityPublisher.uuid,
    ) as unknown as Entity;
    const writePublisher = async (row: Entity, label: string) =>
      expectOk(
        await authoringAction({ actionType: "updateInstance", endpoint: INSTANCE_ENDPOINT, payload: { application: APP_FOR_TEST, applicationSection: "model", objects: [row] } }),
        label,
      );
    let unsupportedMigration: MigrationRow;
    try {
      await writePublisher(
        { ...publisher, mlSchema: { ...publisher.mlSchema, definition: { ...publisher.mlSchema.definition, name: { type: "number" } } } } as Entity,
        "Publisher.name as a number",
      );
      expectOk(await freezeAppForTest(context.domainController, VERSION_1_4), "freeze 1.4.0");
      expectOk(
        await authoringAction({ actionType: "generateMigration", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, from: VERSION_1_3, to: VERSION_1_4 } }),
        "generateMigration",
      );
      unsupportedMigration = await storedMigrationBetween(VERSION_1_3, VERSION_1_4);
    } finally {
      await writePublisher(publisher, "Publisher.name restored");
      await setAppForTestTraces(true);
    }
    expect(unsupportedMigration.changes).toEqual([expect.objectContaining({ kind: "changeAttribute", attribute: "name", supported: false })]);

    const statesBefore = await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID);
    const publishersBefore = await storedRows(context, FOLLOWING_DEPLOYMENT, "data", entityPublisher.uuid);
    const nothingWritten = async () => {
      expect(await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID)).toEqual(statesBefore);
      expect(await storedRows(context, FOLLOWING_DEPLOYMENT, "data", entityPublisher.uuid)).toEqual(publishersBefore);
    };

    // on the authoring deployment
    expect(refusalReason(await runMigration(unsupportedMigration.uuid, applicationDeploymentMap))).toBe(MIGRATION_RUN_REFUSALS.deploymentAuthors);
    await nothingWritten();

    // a change no model Action applies, refused before step 1
    const unsupported = await runMigration(unsupportedMigration.uuid);
    expect(refusalReason(unsupported), JSON.stringify(unsupported)).toBe(MIGRATION_RUN_REFUSALS.migrationUnsupportedChange);
    expect((unsupported as Action2Error).errorContext?.changes).toEqual([expect.objectContaining({ kind: "changeAttribute", attribute: "name" })]);
    await nothingWritten();

    // characterization: unsaved Miroir changes refuse any server-routed versioning action (#696)
    const pendingEntity = { ...edition, uuid: "9c000009-0000-4000-8000-000000000001", name: "PendingC9" } as unknown as Entity;
    expectOk(
      await authoringAction({ actionType: "createEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, entities: [pendingEntity] } }),
      "a pending createEntity",
    );
    try {
      expect(refusalReason(await runMigration(unsupportedMigration.uuid))).toBe("openMiroirTransaction");
      await nothingWritten();
    } finally {
      expectOk(await authoringAction({ actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST } }), "rollback");
    }

    // characterization: the versioning capability, on the client and on the server (#696, `requiredCapability`)
    try {
      for (const side of ["client", "server"] as const) {
        setCapabilities(context, { [side]: { versioning: false } });
        const refused = await runMigration(unsupportedMigration.uuid);
        expect(refused, `${side}: ${JSON.stringify(refused)}`).toMatchObject({ errorType: "FeatureUnavailable", errorContext: { capability: "versioning" } });
        await nothingWritten();
      }
    } finally {
      setCapabilities(context, {});
    }
  }, 120000);

  it("C5: a model action in a nested sequence of a data step is stored, outside the transaction, before the step is recorded, and fails the check against to; steps with one uuid, or with a transactional instance action, are refused", async () => {
    const stepEntity = { ...edition, uuid: "9c00000b-0000-4000-8000-000000000001", name: "StepEntityC9" } as unknown as Entity;
    const nested = {
      uuid: "9c00000c-0000-4000-8000-000000000001",
      name: "create StepEntityC9",
      kind: "data",
      backwardCompatible: true,
      action: {
        actionType: "compositeActionSequence",
        actionLabel: "outer",
        endpoint: DOMAIN_ENDPOINT,
        payload: {
          actionSequence: [
            {
              actionType: "compositeActionSequence",
              actionLabel: "inner",
              endpoint: DOMAIN_ENDPOINT,
              payload: {
                actionSequence: [
                  // no `transactional`: a model action waits in the transaction by default
                  { actionType: "createEntity", actionLabel: "StepEntityC9", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, entities: [stepEntity] } },
                ],
              },
            },
          ],
        },
      },
    };
    const duplicated = manualMigration(FIFTH_MIGRATION, VERSION_1_3, VERSION_1_3, [nested, { ...nested, name: "the same uuid again" }]);
    // its write would wait in the local cache for a commit no step makes
    const pending = manualMigration(SIXTH_MIGRATION, VERSION_1_3, VERSION_1_3, [
      {
        uuid: "9c00000c-0000-4000-8000-000000000002",
        name: "a pending write",
        kind: "data",
        backwardCompatible: true,
        action: {
          actionType: "compositeActionSequence",
          actionLabel: "pending",
          endpoint: DOMAIN_ENDPOINT,
          payload: {
            actionSequence: [
              {
                actionType: "transactionalInstanceAction",
                actionLabel: "pending",
                endpoint: DOMAIN_ENDPOINT,
                payload: {
                  application: APP_FOR_TEST,
                  instanceAction: {
                    actionType: "createInstance",
                    endpoint: INSTANCE_ENDPOINT,
                    payload: { application: APP_FOR_TEST, applicationSection: "data", parentUuid: MIGRATION_ENTITY, objects: [] },
                  },
                },
              },
            ],
          },
        },
      },
    ]);
    for (const row of [manualMigration(FOURTH_MIGRATION, VERSION_1_3, VERSION_1_3, [nested]), duplicated, pending]) {
      await storeMigration(row);
    }
    const statesBefore = await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID);
    expect(refusalReason(await runMigration(FIFTH_MIGRATION))).toBe(MIGRATION_RUN_REFUSALS.migrationStepsInvalid);
    expect(refusalReason(await runMigration(SIXTH_MIGRATION))).toBe(MIGRATION_RUN_REFUSALS.migrationStepsInvalid);
    expect(await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID)).toEqual(statesBefore);

    const stateRow = (await deploymentState())!;
    const stopped = await runMigration(FOURTH_MIGRATION);

    // #745 D6: the data step changed the model; after the last step the model is not 1.3.0: the migration run
    // stays recorded, the version unchanged
    expect(refusalReason(stopped), JSON.stringify(stopped)).toBe(MIGRATION_RUN_REFUSALS.migrationModelMismatch);
    expect(refusalContext(stopped)).toMatchObject({ check: "to", version: VERSION_1_3 });
    expect((stopped as Action2Error).errorMessage).toContain("StepEntityC9");
    const entities = await storedRows(context, FOLLOWING_DEPLOYMENT, "model", ENTITY_ENTITY);
    expect(entities.map((row) => row.uuid)).toContain(stepEntity.uuid);
    const recorded = await deploymentState();
    expect(recorded?.version).toBe(VERSION_1_3);
    expect(recorded?.run).toMatchObject({ stepsDone: [nested.uuid] });
    expect(recorded?.run?.stepStarted).toBeUndefined();
    expect(recorded?.applied?.map((applied) => applied.migration)).not.toContain(FOURTH_MIGRATION);

    // the operator puts the deployment back at 1.3.0 by hand
    const followingStore = context.serverStores.getPersistenceStoreController(FOLLOWING_DEPLOYMENT)!;
    expectOk((await followingStore.dropEntity(stepEntity.uuid)) as any, "drop StepEntityC9 by hand");
    await writeDeploymentStateRow(stateRow);
  }, 120000);

  it("C7: settleMigrationStep; a Migration in the shape of #9 is refused; a stopped migration run continues at the first step not started", async () => {
    // no step is in doubt
    const notInDoubt = await settle("9c00000f-0000-4000-8000-000000000001", "done");
    expect(refusalReason(notInDoubt), JSON.stringify(notInDoubt)).toBe(MIGRATION_RUN_REFUSALS.migrationStepNotInDoubt);

    // outcome "done": the step in doubt is recorded as done, and the next runMigration starts at the step after it
    const BLOCKED = "9c0000b7-0000-4000-8000-000000000001";
    const G7 = "9c000007-0000-4000-8000-0000000000c7";
    const settled = manualMigration(SETTLED_MIGRATION, VERSION_1_3, VERSION_1_3, [
      writeStep("9c000010-0000-4000-8000-000000000001", "blocked", [[BLOCKED, "9c000007-0000-4000-8000-0000000000b7"]]),
      writeStep("9c000010-0000-4000-8000-000000000002", "after", [[edition.uuid, G7]]),
    ]);
    await storeMigration(settled);
    block(BLOCKED);
    expect(refusalReason(await runMigration(settled.uuid))).toBe(MIGRATION_RUN_REFUSALS.migrationStepFailed);
    expect(refusalReason(await settle(settled.steps[1].uuid, "done")), "only the step in doubt").toBe(MIGRATION_RUN_REFUSALS.migrationStepNotInDoubt);
    expectOk(await settle(settled.steps[0].uuid, "done"), "settle the blocked step as done");
    expect((await deploymentState())?.run).toMatchObject({ stepsDone: [settled.steps[0].uuid] });
    expectOk(await runMigration(settled.uuid), "the continued migration run");
    expect(fs.statSync(followingDataFolder(BLOCKED)).isFile(), "the step settled as done is not executed again").toBe(true);
    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "data", edition.uuid)).map((row) => row.uuid)).toContain(G7);
    expect(refusalReason(await runMigration(settled.uuid))).toBe(MIGRATION_RUN_REFUSALS.migrationAlreadyApplied);
    fs.rmSync(followingDataFolder(BLOCKED));

    // a stored Migration in the shape of #9, and a migration run in progress holding one
    const oldShape = { ...manualMigration(OLD_SHAPE_MIGRATION, VERSION_1_3, VERSION_1_3, []), expand: [], fill: [], contract: [] } as Record<string, unknown>;
    delete oldShape.steps;
    await storeMigration(oldShape);
    const statesBefore = await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID);
    expect(refusalReason(await runMigration(OLD_SHAPE_MIGRATION))).toBe(MIGRATION_RUN_REFUSALS.migrationStepsInvalid);
    expect(await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID)).toEqual(statesBefore);
    const stateRow = (await deploymentState())!;
    await writeDeploymentStateRow({ ...stateRow, run: { migration: oldShape, stepsDone: [], startedAt: new Date().toISOString() } });
    try {
      expect(refusalReason(await runMigration(OLD_SHAPE_MIGRATION))).toBe(MIGRATION_RUN_REFUSALS.migrationStepsInvalid);
    } finally {
      await writeDeploymentStateRow(stateRow);
    }

    // a migration run stopped between two steps, the first a createEntity: it continues at the second (a
    // createEntity executed again would fail, its Entity existing); the last step drops the Entity, so that the
    // model ends at 1.3.0
    const resumedEntity = { ...edition, uuid: "9c000011-0000-4000-8000-000000000001", name: "ResumedC9" } as unknown as Entity;
    const resumed = manualMigration(RESUMED_MIGRATION, VERSION_1_3, VERSION_1_3, [
      {
        uuid: "9c000011-0000-4000-8000-000000000002",
        name: "create Entity ResumedC9",
        kind: "model",
        backwardCompatible: true,
        action: { actionType: "createEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, entities: [resumedEntity] } },
      },
      writeStep("9c000011-0000-4000-8000-000000000003", "write EditionC9", [[edition.uuid, "9c000011-0000-4000-8000-000000000004"]]),
      {
        uuid: "9c000011-0000-4000-8000-000000000005",
        name: "drop Entity ResumedC9",
        kind: "model",
        backwardCompatible: false,
        action: { actionType: "dropEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, entityUuid: resumedEntity.uuid } },
      },
    ]);
    await storeMigration(resumed);
    // the first step done, as the stopped migration run left it
    const followingStore = context.serverStores.getPersistenceStoreController(FOLLOWING_DEPLOYMENT)!;
    expectOk(await followingStore.createEntity(resumedEntity) as any, "the first step's work");
    await writeDeploymentStateRow({
      ...stateRow,
      run: { migration: structuredClone(resumed), stepsDone: [resumed.steps[0].uuid], startedAt: new Date().toISOString() },
    });

    expectOk(await runMigration(RESUMED_MIGRATION), "the continued migration run");

    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "data", edition.uuid)).map((row) => row.uuid)).toContain("9c000011-0000-4000-8000-000000000004");
    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "model", ENTITY_ENTITY)).map((row) => row.uuid)).not.toContain(resumedEntity.uuid);
    expect((await deploymentState())?.applied?.map((applied) => applied.migration)).toContain(RESUMED_MIGRATION);
  }, 120000);

  it("C6: a createEntity step meets storage left behind: the migration run stops with storageExists, the storage untouched; once the operator removes it, the migration run continues", async () => {
    const leftBehind = { ...edition, uuid: "9c000012-0000-4000-8000-000000000001", name: "LeftBehindC6" } as unknown as Entity;
    const createStep = {
      uuid: "9c000012-0000-4000-8000-000000000002",
      name: "create Entity LeftBehindC6",
      kind: "model",
      backwardCompatible: true,
      action: { actionType: "createEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, entities: [leftBehind] } },
    };
    // the last step drops the Entity, so that the model ends at 1.3.0
    const dropStep = {
      uuid: "9c000012-0000-4000-8000-000000000004",
      name: "drop Entity LeftBehindC6",
      kind: "model",
      backwardCompatible: false,
      action: { actionType: "dropEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, entityUuid: leftBehind.uuid } },
    };
    const leftBehindMigration = manualMigration(LEFT_BEHIND_MIGRATION, VERSION_1_3, VERSION_1_3, [createStep, dropStep]);
    await storeMigration(leftBehindMigration);
    // storage of an Entity the model does not hold, with an instance in it
    const folder = followingDataFolder(leftBehind.uuid);
    const leftFile = path.join(folder, "9c000012-0000-4000-8000-000000000003.json");
    fs.mkdirSync(folder, { recursive: true });
    const leftContent = JSON.stringify({ uuid: "9c000012-0000-4000-8000-000000000003", parentUuid: leftBehind.uuid, name: "left behind" });
    fs.writeFileSync(leftFile, leftContent);

    const stopped = await runMigration(LEFT_BEHIND_MIGRATION);

    expect(refusalContext(stopped), JSON.stringify(stopped)).toMatchObject({ step: createStep.uuid, stepName: createStep.name });
    expect(JSON.stringify(stopped)).toContain(`"reason":"${ENTITY_CREATION_REFUSALS.storageExists}"`);
    expect(fs.readdirSync(folder)).toEqual([path.basename(leftFile)]);
    expect(fs.readFileSync(leftFile, "utf8")).toBe(leftContent);
    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "model", ENTITY_ENTITY)).map((row) => row.uuid)).not.toContain(leftBehind.uuid);
    expect((await deploymentState())?.run).toMatchObject({ stepsDone: [], stepStarted: createStep.uuid });

    // the operator removes the storage and settles the step: the migration run creates, then drops, the Entity
    fs.rmSync(folder, { recursive: true });
    expectOk(await settle(createStep.uuid, "notRun"), "settle the createEntity step");
    expectOk(await runMigration(LEFT_BEHIND_MIGRATION), "the continued migration run");
    expect((await deploymentState())?.applied?.map((applied) => applied.migration)).toContain(LEFT_BEHIND_MIGRATION);
    expect(fs.existsSync(folder)).toBe(false);
  }, 120000);

  it("C8: the model is checked against the frozen versions: a model changed by hand, a step that does not give to, a missing reference; nothing is written", async () => {
    const statesBefore = await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID);
    const unchanged = async () => expect(await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID)).toEqual(statesBefore);

    // a model step the designer edited: its replay on 1.3.0 does not give 1.3.0
    const edited = manualMigration(EDITED_MIGRATION, VERSION_1_3, VERSION_1_3, [
      {
        uuid: "9c000013-0000-4000-8000-000000000002",
        name: "add Publisher.editedC8",
        kind: "model",
        backwardCompatible: true,
        action: {
          actionType: "alterEntityAttribute",
          endpoint: MODEL_ENDPOINT,
          payload: { application: APP_FOR_TEST, entityName: entityPublisher.name, entityUuid: entityPublisher.uuid, addColumns: [{ name: "editedC8", definition: { type: "string", optional: true } }] },
        },
      },
    ]);
    await storeMigration(edited);
    const editedResult = await runMigration(EDITED_MIGRATION);
    expect(refusalReason(editedResult), JSON.stringify(editedResult)).toBe(MIGRATION_RUN_REFUSALS.migrationModelMismatch);
    expect(refusalContext(editedResult)).toMatchObject({ check: "steps", version: VERSION_1_3 });
    expect((editedResult as Action2Error).errorMessage).toContain("Publisher");
    await unchanged();

    // the model of the following deployment changed by hand, on disk: it is not 1.3.0
    const dataOnly = manualMigration(HAND_CHANGED_MIGRATION, VERSION_1_3, VERSION_1_3, [writeStep("9c000013-0000-4000-8000-000000000003", "a write", [])]);
    await storeMigration(dataOnly);
    const entityFolder = path.join(resolveRepoRoot(), followingFolder, "model", ENTITY_ENTITY);
    const publisherFile = fs
      .readdirSync(entityFolder)
      .map((file) => path.join(entityFolder, file))
      .find((file) => JSON.parse(fs.readFileSync(file, "utf8")).uuid === entityPublisher.uuid)!;
    const publisherText = fs.readFileSync(publisherFile, "utf8");
    fs.writeFileSync(publisherFile, JSON.stringify({ ...JSON.parse(publisherText), description: "changed by hand" }, undefined, 2));
    try {
      const changed = await runMigration(HAND_CHANGED_MIGRATION);
      expect(refusalReason(changed), JSON.stringify(changed)).toBe(MIGRATION_RUN_REFUSALS.migrationModelMismatch);
      expect(refusalContext(changed)).toMatchObject({ check: "from", version: VERSION_1_3 });
      expect((changed as Action2Error).errorMessage).toContain("Publisher (description)");
      await unchanged();
    } finally {
      fs.writeFileSync(publisherFile, publisherText);
    }

    // a Migration to a version the modelVersion section does not hold
    const MISSING = `9C-missing-${run}`;
    await storeMigration(manualMigration(MISSING_TO_MIGRATION, VERSION_1_3, MISSING, []));
    const missingTo = await runMigration(MISSING_TO_MIGRATION);
    expect(refusalReason(missingTo), JSON.stringify(missingTo)).toBe(MIGRATION_RUN_REFUSALS.migrationReferenceMissing);
    expect(refusalContext(missingTo)).toMatchObject({ version: MISSING });
    await unchanged();

    // a deployment whose state says a version the modelVersion section does not hold
    const stateRow = (await deploymentState())!;
    await storeMigration(manualMigration(MISSING_FROM_MIGRATION, MISSING, VERSION_1_3, []));
    await writeDeploymentStateRow({ ...stateRow, version: MISSING });
    try {
      const missingFrom = await runMigration(MISSING_FROM_MIGRATION);
      expect(refusalReason(missingFrom), JSON.stringify(missingFrom)).toBe(MIGRATION_RUN_REFUSALS.migrationReferenceMissing);
      expect(refusalContext(missingFrom)).toMatchObject({ version: MISSING });
    } finally {
      await writeDeploymentStateRow(stateRow);
    }
    await unchanged();
  }, 120000);
});
