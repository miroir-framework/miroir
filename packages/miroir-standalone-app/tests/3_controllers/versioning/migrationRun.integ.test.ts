/**
 * #9 part C: a Migration run on a following deployment of appForTest (`runMigration`): the steps of the
 * Migration around the jump of the model, recorded in the deployment's `DeploymentState` row.
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
const MOTTO = "mottoC9";
/** The Migrations C2, C3 and C5 write by hand. */
const [SECOND_MIGRATION, THIRD_MIGRATION, FOURTH_MIGRATION, FIFTH_MIGRATION] = [
  "9c000004-0000-4000-8000-000000000001",
  "9c000006-0000-4000-8000-000000000001",
  "9c00000a-0000-4000-8000-000000000001",
  "9c00000a-0000-4000-8000-000000000002",
];

/** An Entity appForTest gains in 1.1.0. */
const edition = {
  uuid: "9c000002-0000-4000-8000-000000000001",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
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

/** A step of `updateInstance`s in the following deployment's data, one per `[Entity uuid, instance uuid]`. */
function writeStep(uuid: string, name: string, writes: [string, string][], backwardCompatible = true) {
  return {
    uuid,
    name,
    backwardCompatible,
    repeatable: true,
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
    },
  };
}

/** The data folder of an Entity uuid in the following deployment. */
function followingDataFolder(entityUuid: string): string {
  return path.join(resolveRepoRoot(), followingFolder, "data", entityUuid);
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

async function deploymentState(): Promise<DeploymentStateRow | undefined> {
  return (await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID)).find(
    (row) => row.uuid === FOLLOWING_DEPLOYMENT,
  ) as DeploymentStateRow | undefined;
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

  // the authoring deployment: 1.0.0 is the fixture; 1.1.0 adds EditionC9 and the optional Publisher.mottoC9
  expectOk(await freezeAppForTest(context.domainController, VERSION_1_0), "freeze 1.0.0");
  expectOk(
    await authoringAction({ actionType: "createEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, transactional: false, entities: [edition] } }),
    "EditionC9",
  );
  const publisher = (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "model", "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad")).find(
    (row) => row.uuid === entityPublisher.uuid,
  ) as unknown as Entity;
  expectOk(
    await authoringAction({
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: APP_FOR_TEST,
        applicationSection: "model",
        objects: [
          { ...publisher, mlSchema: { ...publisher.mlSchema, definition: { ...publisher.mlSchema.definition, [MOTTO]: { type: "string", optional: true } } } },
        ],
      },
    }),
    "Publisher.mottoC9",
  );
  expectOk(await freezeAppForTest(context.domainController, VERSION_1_1), "freeze 1.1.0");

  // the draft, its fill step written by the designer
  expectOk(
    await authoringAction({ actionType: "generateMigration", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, from: VERSION_1_0, to: VERSION_1_1 } }),
    "generateMigration",
  );
  const draft = (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", MIGRATION_ENTITY)).find(
    (row) => (row as unknown as MigrationRow).from === VERSION_1_0 && (row as unknown as MigrationRow).to === VERSION_1_1,
  ) as unknown as MigrationRow;
  expect(draft.fill.map((step) => step.name)).toEqual([`fill Publisher.${MOTTO}`]);
  const publishers = await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "data", entityPublisher.uuid);
  migration = {
    ...draft,
    // set wrong by hand: the run recomputes it
    backwardCompatible: false,
    fill: [
      {
        ...draft.fill[0],
        action: {
          ...draft.fill[0].action,
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
  expectOk(
    await authoringAction({
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: APP_FOR_TEST, applicationSection: "modelVersion", parentUuid: MIGRATION_ENTITY, objects: [migration] },
    }),
    "the completed Migration",
  );

  // the following deployment at 1.0.0: a copy of the authoring one, its modelVersion the authoring one's
  const authoring = (await storedRows(context, ADMIN_DEPLOYMENT, "data", entityDeployment.uuid)).find((row) => row.uuid === APP_FOR_TEST_DEPLOYMENT)!;
  const authoringConfiguration = (authoring as unknown as { configuration: StoreUnitConfiguration & Record<string, any> }).configuration;
  const repoRoot = resolveRepoRoot();
  const authoringModelFolder: string = authoringConfiguration.model.directory;
  followingFolder = path.join(path.dirname(path.dirname(authoringModelFolder)), "appForTest-following9C");
  fs.rmSync(path.join(repoRoot, followingFolder), { recursive: true, force: true });
  fs.cpSync(path.join(repoRoot, authoringModelFolder), path.join(repoRoot, followingFolder, "model"), { recursive: true });
  fs.cpSync(path.join(repoRoot, authoringConfiguration.data.directory), path.join(repoRoot, followingFolder, "data"), { recursive: true });
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
  await authoringAction({
    actionType: "dropEntity",
    endpoint: MODEL_ENDPOINT,
    payload: { application: APP_FOR_TEST, transactional: false, entityUuid: edition.uuid },
  });
  const publisher = (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "model", "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad")).find(
    (row) => row.uuid === entityPublisher.uuid,
  ) as unknown as Entity;
  const { [MOTTO]: _motto, ...definition } = publisher.mlSchema.definition as Record<string, unknown>;
  await authoringAction({
    actionType: "updateInstance",
    endpoint: INSTANCE_ENDPOINT,
    payload: { application: APP_FOR_TEST, applicationSection: "model", objects: [{ ...publisher, mlSchema: { ...publisher.mlSchema, definition } }] },
  });
  const migrations = (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", MIGRATION_ENTITY)).filter((row) =>
    [migration?.uuid, SECOND_MIGRATION, THIRD_MIGRATION, FOURTH_MIGRATION, FIFTH_MIGRATION].includes(row.uuid),
  );
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

describe("#9 part C: runMigration", () => {
  it("C1: the following deployment goes from 1.0.0 to 1.1.0, its data filled; two runs sent together never interleave", async () => {
    const recordsBefore = await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID);
    expect(await deploymentState()).toMatchObject({ version: VERSION_1_0 });

    const [first, second] = await Promise.all([runMigration(migration.uuid), runMigration(migration.uuid)]);

    expectOk(first, "the first run");
    expect(refusalReason(second), JSON.stringify(second)).toBe(MIGRATION_RUN_REFUSALS.migrationNotAtFrom);

    // the model is 1.1.0's
    const following = await state(followingMap);
    expect(ownModel(following)).toEqual(ownModel(await state(followingMap, versionUuid(following, VERSION_1_1))));
    // the data is filled, the new Entity's instance stored
    const publishers = await storedRows(context, FOLLOWING_DEPLOYMENT, "data", entityPublisher.uuid);
    const filled = (migration.fill[0].action.payload.actionSequence[0] as { payload: { objects: { uuid: string; name: string }[] } }).payload.objects;
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
    // a run is no model change of the application: nothing recorded
    expect(await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID)).toEqual(recordsBefore);

    expect(refusalReason(await runMigration(migration.uuid))).toBe(MIGRATION_RUN_REFUSALS.migrationNotAtFrom);
  }, 120000);

  it("C2: a stopped run resumes from its copy of the Migration, at the first step not recorded", async () => {
    expectOk(await freezeAppForTest(context.domainController, VERSION_1_2), "freeze 1.2.0");
    const [E1, E2, F1, F2, Z] = [1, 2, 3, 4, 9].map((n) => `9c00000${n}-0000-4000-8000-0000000000c2`);
    // folders of no Entity of the model, each blocked by a file in its place until the test puts a folder there
    const [BLOCKED_E, BLOCKED_F] = ["9c0000b1-0000-4000-8000-000000000001", "9c0000b2-0000-4000-8000-000000000001"];
    const second: MigrationRow = {
      uuid: SECOND_MIGRATION,
      parentName: "Migration",
      parentUuid: MIGRATION_ENTITY,
      name: `${VERSION_1_1} → ${VERSION_1_2}`,
      application: APP_FOR_TEST,
      from: VERSION_1_1,
      to: VERSION_1_2,
      source: "manual",
      changes: [],
      expand: [
        writeStep("9c000005-0000-4000-8000-000000000001", "expand one", [[edition.uuid, E1]]),
        writeStep("9c000005-0000-4000-8000-000000000002", "expand two", [[BLOCKED_E, E2]]),
      ],
      // a repeatable step whose first write lands and whose second fails
      fill: [writeStep("9c000005-0000-4000-8000-000000000003", "fill", [[edition.uuid, F1], [BLOCKED_F, F2]])],
      // left empty, as generation leaves a contract step (D4)
      contract: [writeStep("9c000005-0000-4000-8000-000000000004", "drop nothing", [], false)],
      // set wrong by hand: the contract step is not backward-compatible
      backwardCompatible: true,
    } as unknown as MigrationRow;
    expectOk(
      await authoringAction({
        actionType: "createInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: { application: APP_FOR_TEST, applicationSection: "modelVersion", parentUuid: MIGRATION_ENTITY, objects: [second] },
      }),
      "the second Migration",
    );
    for (const blocked of [BLOCKED_E, BLOCKED_F]) {
      fs.writeFileSync(followingDataFolder(blocked), "a file where a folder is written");
    }
    // the store takes each entry of its data folder for an Entity: a folder in place of the file takes the writes
    const unblock = (blocked: string) => {
      fs.rmSync(followingDataFolder(blocked));
      fs.mkdirSync(followingDataFolder(blocked));
    };

    // 1. stopped at the second expand step
    const stopped = await runMigration(second.uuid);
    expect(refusalReason(stopped), JSON.stringify(stopped)).toBe(MIGRATION_RUN_REFUSALS.migrationStepFailed);
    const afterStop = await deploymentState();
    expect(afterStop?.version).toBe(VERSION_1_1);
    expect(afterStop?.run?.stepsDone).toEqual([second.expand[0].uuid]);
    expect((afterStop?.run?.migration as MigrationRow).backwardCompatible, "recomputed by the run").toBe(false);

    // another Migration waits for the run in progress
    expect(refusalReason(await runMigration(migration.uuid))).toBe(MIGRATION_RUN_REFUSALS.migrationRunInProgress);

    // the Migration's file changed on disk (the following deployment refuses that write): the run keeps its copy
    const sharedModelVersion = (
      (await storedRows(context, ADMIN_DEPLOYMENT, "data", entityDeployment.uuid)).find((row) => row.uuid === APP_FOR_TEST_DEPLOYMENT) as unknown as {
        configuration: { modelVersion: { directory: string } };
      }
    ).configuration.modelVersion.directory;
    const onDisk = path.join(resolveRepoRoot(), sharedModelVersion, MIGRATION_ENTITY, `${second.uuid}.json`);
    expect(fs.existsSync(onDisk), onDisk).toBe(true);
    fs.writeFileSync(onDisk, fs.readFileSync(onDisk, "utf8").replaceAll(E2, Z));

    // 2. resumed, stopped inside the fill step after its first write
    unblock(BLOCKED_E);
    const stoppedInFill = await runMigration(second.uuid);
    expect(refusalReason(stoppedInFill), JSON.stringify(stoppedInFill)).toBe(MIGRATION_RUN_REFUSALS.migrationStepFailed);
    expect((await deploymentState())?.run?.stepsDone).toEqual([second.expand[0].uuid, second.expand[1].uuid, "jump"]);
    expect(fs.existsSync(path.join(followingDataFolder(edition.uuid), `${F1}.json`)), "the fill step's first write landed").toBe(true);

    // 3. resumed to the end: the whole fill step again, then the empty contract step
    unblock(BLOCKED_F);
    expectOk(await runMigration(second.uuid), "the resumed run");

    const ended = await deploymentState();
    expect(ended).toMatchObject({ version: VERSION_1_2 });
    expect(ended?.run).toBeUndefined();
    expect(ended?.applied?.map((applied) => applied.migration)).toEqual([migration.uuid, second.uuid]);
    // the data of an uninterrupted run: the copy's steps, not the edited file's
    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "data", edition.uuid)).map((row) => row.uuid).sort()).toEqual(
      [EDITION_INSTANCE.uuid, E1, F1].sort(),
    );
    expect(fs.readdirSync(followingDataFolder(BLOCKED_E))).toEqual([`${E2}.json`]);
    expect(fs.readdirSync(followingDataFolder(BLOCKED_F))).toEqual([`${F2}.json`]);
  }, 120000);

  it("C3: refused, nothing written, on an authoring deployment, for an unsupported change, with Miroir changes unsaved, without the versioning capability", async () => {
    const third: MigrationRow = {
      uuid: THIRD_MIGRATION,
      parentName: "Migration",
      parentUuid: MIGRATION_ENTITY,
      name: `${VERSION_1_2} → a renamed Publisher`,
      application: APP_FOR_TEST,
      from: VERSION_1_2,
      to: VERSION_1_2,
      source: "manual",
      changes: [
        { kind: "renameEntity", entity: entityPublisher.uuid, entityName: entityPublisher.name, backwardCompatible: false, supported: false },
      ],
      expand: [writeStep("9c000007-0000-4000-8000-000000000001", "expand", [[edition.uuid, "9c000008-0000-4000-8000-0000000000c3"]])],
      fill: [],
      contract: [],
      backwardCompatible: false,
    } as unknown as MigrationRow;
    expectOk(
      await authoringAction({
        actionType: "createInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: { application: APP_FOR_TEST, applicationSection: "modelVersion", parentUuid: MIGRATION_ENTITY, objects: [third] },
      }),
      "the third Migration",
    );
    const statesBefore = await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID);
    const editionsBefore = await storedRows(context, FOLLOWING_DEPLOYMENT, "data", edition.uuid);
    const nothingWritten = async () => {
      expect(await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID)).toEqual(statesBefore);
      expect(await storedRows(context, FOLLOWING_DEPLOYMENT, "data", edition.uuid)).toEqual(editionsBefore);
    };

    // on the authoring deployment
    expect(refusalReason(await runMigration(third.uuid, applicationDeploymentMap))).toBe(MIGRATION_RUN_REFUSALS.deploymentAuthors);
    await nothingWritten();

    // a change no run can make
    const unsupported = await runMigration(third.uuid);
    expect(refusalReason(unsupported), JSON.stringify(unsupported)).toBe(MIGRATION_RUN_REFUSALS.migrationUnsupportedChange);
    expect((unsupported as Action2Error).errorContext?.changes).toEqual([expect.objectContaining({ kind: "renameEntity" })]);
    await nothingWritten();

    // characterization: unsaved Miroir changes refuse any server-routed versioning action (#696)
    const pendingEntity = { ...edition, uuid: "9c000009-0000-4000-8000-000000000001", name: "PendingC9" } as unknown as Entity;
    expectOk(
      await authoringAction({ actionType: "createEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, entities: [pendingEntity] } }),
      "a pending createEntity",
    );
    try {
      expect(refusalReason(await runMigration(third.uuid))).toBe("openMiroirTransaction");
      await nothingWritten();
    } finally {
      expectOk(await authoringAction({ actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST } }), "rollback");
    }

    // characterization: the versioning capability, on the client and on the server (#696, `requiredCapability`)
    try {
      for (const side of ["client", "server"] as const) {
        setCapabilities(context, { [side]: { versioning: false } });
        const refused = await runMigration(third.uuid);
        expect(refused, `${side}: ${JSON.stringify(refused)}`).toMatchObject({ errorType: "FeatureUnavailable", errorContext: { capability: "versioning" } });
        await nothingWritten();
      }
    } finally {
      setCapabilities(context, {});
    }
  }, 120000);

  it("C5: a model action in a nested sequence of a step is stored, outside the transaction, before the step is recorded; steps with one uuid are refused", async () => {
    const stepEntity = { ...edition, uuid: "9c00000b-0000-4000-8000-000000000001", name: "StepEntityC9" } as unknown as Entity;
    const manual = (uuid: string, contract: unknown[]) =>
      ({
        uuid,
        parentName: "Migration",
        parentUuid: MIGRATION_ENTITY,
        name: `${VERSION_1_2} again, ${uuid}`,
        application: APP_FOR_TEST,
        from: VERSION_1_2,
        to: VERSION_1_2,
        source: "manual",
        changes: [],
        expand: [],
        fill: [],
        contract,
        backwardCompatible: true,
      }) as unknown as MigrationRow;
    const nested = {
      uuid: "9c00000c-0000-4000-8000-000000000001",
      name: "create StepEntityC9",
      backwardCompatible: true,
      repeatable: false,
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
    const duplicated = manual(FIFTH_MIGRATION, [nested, { ...nested, name: "the same uuid again" }]);
    for (const row of [manual(FOURTH_MIGRATION, [nested]), duplicated]) {
      expectOk(
        await authoringAction({
          actionType: "createInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: { application: APP_FOR_TEST, applicationSection: "modelVersion", parentUuid: MIGRATION_ENTITY, objects: [row] },
        }),
        `Migration ${row.uuid}`,
      );
    }
    const statesBefore = await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID);
    expect(refusalReason(await runMigration(FIFTH_MIGRATION))).toBe(MIGRATION_RUN_REFUSALS.migrationStepsInvalid);
    expect(await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID)).toEqual(statesBefore);

    expectOk(await runMigration(FOURTH_MIGRATION), "the run");

    const entities = await storedRows(context, FOLLOWING_DEPLOYMENT, "model", "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad");
    expect(entities.map((row) => row.uuid)).toContain(stepEntity.uuid);
    expect((await deploymentState())?.applied?.map((applied) => applied.migration)).toContain(FOURTH_MIGRATION);
  }, 120000);
});
