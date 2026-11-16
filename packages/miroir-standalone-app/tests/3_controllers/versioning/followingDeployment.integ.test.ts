/**
 * #9 part A: a following deployment of appForTest, created at an earlier version next to the authoring one,
 * sharing its `modelVersion` folder.
 *
 * Not reachable through MiroirTest: the tests create a second deployment of an application with its own
 * application deployment map, copy its stores on disk, and read the stores of the emulated server.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/followingDeployment
 * ```
 */
import * as fs from "fs";
import * as path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  createDeploymentCompositeAction,
  DEPLOYMENT_STATE_ENTITY_UUID,
  deploymentRoleOf,
  markMigrationRun,
  markRecordedBySender,
  EVOLUTION_TRACE_RECORD_ENTITY_UUID,
  metaModelEntityList,
  type DomainController,
  type Entity,
  type EntityInstance,
  type StoreUnitConfiguration,
} from "@miroir-framework/core";
import { adminSelfApplication, deployment_Admin, entityDeployment } from "@miroir-framework/core/admin";
import { AGREEMENT_COLLECTIONS, frozenModelState, HISTORY_ENTITIES, liveModelState, type ModelState } from "@miroir-framework/versioning";
import { entityCountry, entityPublisher } from "miroir-fixture-appForTest";

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
  SELF_APPLICATION_VERSION_ENTITY,
  storedRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const FOLLOWING_DEPLOYMENT = "9a000001-0000-4000-8000-000000000001";
const ADMIN_DEPLOYMENT = deployment_Admin.uuid;
const ENTITY_VERSION_ENTITY = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";

const followingMap = {
  [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT,
  [APP_FOR_TEST]: FOLLOWING_DEPLOYMENT,
  [LIBRARY_APPLICATION]: LIBRARY_DEPLOYMENT,
  [adminSelfApplication.uuid]: ADMIN_DEPLOYMENT,
};

const VERSION_1_0 = `9A-1.0.0-${Date.now()}`;
const VERSION_1_1 = `9A-1.1.0-${Date.now()}`;

/** An Entity appForTest gains in 1.1.0. */
const imprint = {
  uuid: "9a000002-0000-4000-8000-000000000001",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  selfApplication: APP_FOR_TEST,
  name: "Imprint9",
  conceptLevel: "Model",
  description: "#9 part A: an Entity added in 1.1.0",
  mlSchema: {
    type: "object",
    definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" }, name: { type: "string" } },
  },
} as unknown as Entity;

let context: VersioningTestContext;
let followingFolder: string;

function host(): DomainController {
  return context.domainController as DomainController;
}

/** A write of an appForTest model row on the authoring deployment, outside a transaction. */
function authoringInstanceWrite(actionType: string, object: EntityInstance) {
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

/** An Entity row with one more optional string attribute. */
function withAttribute(entity: Entity, attribute: string): Entity {
  return {
    ...entity,
    mlSchema: {
      ...entity.mlSchema,
      definition: { ...entity.mlSchema.definition, [attribute]: { type: "string", optional: true } },
    },
  } as Entity;
}

async function state(map: Record<string, string>, version?: string): Promise<ModelState> {
  const read = version
    ? await frozenModelState(host(), APP_FOR_TEST, map, version)
    : await liveModelState(host(), APP_FOR_TEST, map);
  expect(read instanceof Action2Error, JSON.stringify(read)).toBe(false);
  return read as ModelState;
}

const META_MODEL_ENTITIES = new Set(metaModelEntityList.map(({ entity }) => entity.uuid));

/**
 * The application's own model rows, by collection, sorted by uuid, without what a freeze does not keep:
 * `parentDefinitionVersionUuid`, and `conceptLevel` but on Entities.
 */
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

async function deploymentRowOf(deployment: string): Promise<EntityInstance & Record<string, unknown>> {
  const rows = await storedRows(context, ADMIN_DEPLOYMENT, "data", entityDeployment.uuid);
  return rows.find((row) => row.uuid === deployment) as EntityInstance & Record<string, unknown>;
}

/** The shared `modelVersion` rows a following deployment must not change, by Entity. */
async function sharedModelVersionRows(): Promise<Record<string, unknown[]>> {
  const entities = [SELF_APPLICATION_VERSION_ENTITY, ENTITY_VERSION_ENTITY, EVOLUTION_TRACE_RECORD_ENTITY_UUID];
  return Object.fromEntries(
    await Promise.all(
      entities.map(async (entity) => [
        entity,
        (await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", entity)).sort((a, b) => a.uuid.localeCompare(b.uuid)),
      ]),
    ),
  );
}

/** The refusal reason of a result, looked for along its chain of inner errors. */
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

/** An update of an Admin Deployment row, as an operator's editor sends it. */
function updateDeploymentRow(row: EntityInstance) {
  return context.domainController.handleAction(
    {
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: adminSelfApplication.uuid, applicationSection: "data", parentUuid: entityDeployment.uuid, objects: [row] },
    } as any,
    followingMap,
    appForTestModelEnvironment(context.domainController),
  );
}

let sharedBefore: Record<string, unknown[]>;
let createResult: Awaited<ReturnType<typeof context.domainController.handleAction>>;

beforeAll(async () => {
  context = await openVersioningTestContext();

  // the authoring deployment: 1.0.0 adds Publisher.foundedIn to the fixture; 1.1.0 adds Imprint9 and Country.motto
  expectOk(await authoringInstanceWrite("updateInstance", withAttribute(entityPublisher as Entity, "foundedIn") as any), "Publisher.foundedIn");
  expectOk(await freezeAppForTest(context.domainController, VERSION_1_0), "freeze 1.0.0");
  expectOk(
    await context.domainController.handleAction(
      { actionType: "createEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, transactional: false, entities: [imprint] } } as any,
      applicationDeploymentMap,
      appForTestModelEnvironment(context.domainController),
    ),
    "Imprint9",
  );
  expectOk(await authoringInstanceWrite("updateInstance", withAttribute(entityCountry as Entity, "motto") as any), "Country.motto");
  expectOk(await freezeAppForTest(context.domainController, VERSION_1_1), "freeze 1.1.0");

  // the following deployment: its own model and data stores, its modelVersion the authoring one's
  const authoring = await deploymentRowOf(APP_FOR_TEST_DEPLOYMENT);
  const authoringConfiguration = authoring.configuration as StoreUnitConfiguration & Record<string, any>;
  const repoRoot = resolveRepoRoot();
  const authoringModelFolder: string = authoringConfiguration.model.directory;
  followingFolder = path.join(path.dirname(path.dirname(authoringModelFolder)), "appForTest-following9");
  fs.rmSync(path.join(repoRoot, followingFolder), { recursive: true, force: true });
  // a copy of the authoring deployment at 1.1.0: the install of 1.0.0 removes what 1.1.0 added
  fs.cpSync(path.join(repoRoot, authoringModelFolder), path.join(repoRoot, followingFolder, "model"), { recursive: true });
  fs.cpSync(path.join(repoRoot, authoringConfiguration.data.directory), path.join(repoRoot, followingFolder, "data"), { recursive: true });
  const followingConfiguration = {
    ...authoringConfiguration,
    model: { emulatedServerType: "filesystem", directory: `${followingFolder}/model` },
    data: { emulatedServerType: "filesystem", directory: `${followingFolder}/data` },
  } as StoreUnitConfiguration;

  sharedBefore = await sharedModelVersionRows();
  createResult = await context.domainController.handleAction(
    createDeploymentCompositeAction("appForTest", FOLLOWING_DEPLOYMENT, APP_FOR_TEST, undefined, followingConfiguration, {
      skipOpenAdminStore: true,
      skipCreateStore: true,
      role: "following",
      installVersion: VERSION_1_0,
      labels: { deployment: { name: "AppForTestFollowing9", description: "#9: a following deployment of appForTest" } },
    }),
    followingMap,
    appForTestModelEnvironment(context.domainController),
  );
}, 180000);

afterAll(async () => {
  await context.domainController.handleAction(
    { actionType: "dropEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, transactional: false, entityUuid: imprint.uuid } } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(context.domainController),
  );
  for (const [parentUuid, uuid] of [
    [entityDeployment.uuid, FOLLOWING_DEPLOYMENT],
    [DEPLOYMENT_STATE_ENTITY_UUID, FOLLOWING_DEPLOYMENT],
  ]) {
    const row = (await storedRows(context, ADMIN_DEPLOYMENT, "data", parentUuid)).find((stored) => stored.uuid === uuid);
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

describe("#9 part A: a following deployment", () => {
  it("A1: created at 1.0.0, its model is 1.0.0's and its state record says so", async () => {
    expectOk(createResult, "create the following deployment at 1.0.0");

    const authoringLive = await state(applicationDeploymentMap);
    const following = await state(followingMap);
    const frozen = await state(followingMap, versionUuid(following, VERSION_1_0));
    // the freeze names the collections it snapshotted: an empty one is empty, not unknown
    expect(following.applicationVersions.find((row) => row.name === VERSION_1_0)?.frozenCollections).toEqual(
      expect.arrayContaining(["entities", "tests", "blobs", "testConfigurations"]),
    );

    // the model is the version's: Publisher.foundedIn, no Imprint9, no Country.motto
    expect(ownModel(following)).toEqual(ownModel(frozen));
    expect(ownModel(following)).not.toEqual(ownModel(authoringLive));
    const publisher = following.entities.find((entity) => entity.uuid === entityPublisher.uuid)!;
    expect(Object.keys(publisher.mlSchema.definition)).toContain("foundedIn");
    expect(following.entities.map((entity) => entity.uuid)).not.toContain(imprint.uuid);
    // the storage of a removed Entity stays: only a dropEntity step of a Migration removes it (#745)
    expect(fs.existsSync(path.join(resolveRepoRoot(), followingFolder, "data", imprint.uuid))).toBe(true);
    const country = following.entities.find((entity) => entity.uuid === entityCountry.uuid)!;
    expect(Object.keys(country.mlSchema.definition)).not.toContain("motto");

    // a rewritten row keeps its live parentDefinitionVersionUuid and conceptLevel
    expect(publisher.parentDefinitionVersionUuid).toBe(entityPublisher.parentDefinitionVersionUuid);
    expect(publisher.conceptLevel).toBe(entityPublisher.conceptLevel);

    // it reads the shared history: its model holds the history and record Entities
    const entityUuids = new Set(following.entities.map((entity) => entity.uuid));
    expect(HISTORY_ENTITIES.filter((entity) => !entityUuids.has(entity.uuid)).map((entity) => entity.name)).toEqual([]);
    expect(entityUuids.has(EVOLUTION_TRACE_RECORD_ENTITY_UUID)).toBe(true);

    // the shared modelVersion rows are unchanged, and no record was appended
    expect(await sharedModelVersionRows()).toEqual(sharedBefore);

    // its Deployment row says following; its state record says 1.0.0, nothing applied, no run
    expect((await deploymentRowOf(FOLLOWING_DEPLOYMENT))?.role).toBe("following");
    const deploymentStates = await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID);
    const deploymentState = deploymentStates.find((row) => row.uuid === FOLLOWING_DEPLOYMENT) as Record<string, unknown>;
    expect(deploymentState).toMatchObject({ deployment: FOLLOWING_DEPLOYMENT, application: APP_FOR_TEST, version: VERSION_1_0 });
    expect(deploymentState.applied).toBeUndefined();
    expect(deploymentState.run).toBeUndefined();

    // the authoring deployment is untouched, and has no state record
    expect((await deploymentRowOf(APP_FOR_TEST_DEPLOYMENT))?.role).toBeUndefined();
    expect(deploymentStates.find((row) => row.uuid === APP_FOR_TEST_DEPLOYMENT)).toBeUndefined();
    expect(authoringLive.entities.map((entity) => entity.uuid)).toContain(imprint.uuid);
  }, 60000);

  it("A1: a second install is refused: a following deployment changes version by a migration run", async () => {
    const stateBefore = await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID);
    const reinstalled = await context.domainController.handleAction(
      { actionType: "installApplicationVersion", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, version: VERSION_1_1 } } as any,
      followingMap,
      appForTestModelEnvironment(context.domainController),
    );
    expect(refusalReason(reinstalled), JSON.stringify(reinstalled)).toBe("deploymentInstalled");
    expect(await storedRows(context, ADMIN_DEPLOYMENT, "data", DEPLOYMENT_STATE_ENTITY_UUID)).toEqual(stateBefore);

    const onAuthoring = await context.domainController.handleAction(
      { actionType: "installApplicationVersion", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, version: VERSION_1_0 } } as any,
      applicationDeploymentMap,
      appForTestModelEnvironment(context.domainController),
    );
    expect(refusalReason(onAuthoring), JSON.stringify(onAuthoring)).toBe("deploymentAuthors");
  }, 60000);

  it("A2: the role of a deployment cannot change; its other attributes can", async () => {
    const following = await deploymentRowOf(FOLLOWING_DEPLOYMENT);

    const toAuthoring = await updateDeploymentRow({ ...following, role: "authoring" } as EntityInstance);
    expect(toAuthoring instanceof Action2Error, JSON.stringify(toAuthoring)).toBe(true);
    expect(refusalReason(toAuthoring), JSON.stringify(toAuthoring)).toBe("deploymentRoleFixed");
    expect(await deploymentRowOf(FOLLOWING_DEPLOYMENT)).toEqual(following);

    const { role: _role, ...withoutRole } = following;
    const roleRemoved = await updateDeploymentRow(withoutRole as EntityInstance);
    expect(refusalReason(roleRemoved), JSON.stringify(roleRemoved)).toBe("deploymentRoleFixed");

    // the Entity named by the payload only
    const { parentUuid: _parentUuid, ...withoutParent } = following;
    const throughPayload = await context.domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: adminSelfApplication.uuid,
          applicationSection: "data",
          parentUuid: entityDeployment.uuid,
          objects: [{ ...withoutParent, role: "authoring" }],
        },
      } as any,
      followingMap,
      appForTestModelEnvironment(context.domainController),
    );
    expect(refusalReason(throughPayload), JSON.stringify(throughPayload)).toBe("deploymentRoleFixed");

    const described = { ...following, description: "#9 A2: a following deployment, described again" } as EntityInstance;
    expectOk(await updateDeploymentRow(described), "update of the description");
    expect(await deploymentRowOf(FOLLOWING_DEPLOYMENT)).toEqual(described);

    // a Deployment row without a role (every deployment before #9) is authoring, and cannot be made following
    const authoring = await deploymentRowOf(APP_FOR_TEST_DEPLOYMENT);
    expect(deploymentRoleOf(authoring)).toBe("authoring");
    const toFollowing = await updateDeploymentRow({ ...authoring, role: "following" } as EntityInstance);
    expect(refusalReason(toFollowing), JSON.stringify(toFollowing)).toBe("deploymentRoleFixed");
    expectOk(await updateDeploymentRow({ ...authoring, role: "authoring" } as EntityInstance), "the default role, written");
    expectOk(await updateDeploymentRow(authoring), "the default role, left out again");
  }, 60000);

  it("A2: a role changed in a transaction is refused at the commit, before anything is written", async () => {
    const following = await deploymentRowOf(FOLLOWING_DEPLOYMENT);
    const adminEnvironment = context.domainController.currentModelEnvironment(adminSelfApplication.uuid, followingMap);
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "transactionalInstanceAction",
          endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
          payload: {
            application: adminSelfApplication.uuid,
            instanceAction: {
              actionType: "updateInstance",
              endpoint: INSTANCE_ENDPOINT,
              payload: { application: adminSelfApplication.uuid, applicationSection: "data", objects: [{ ...following, role: "authoring" }] },
            },
          },
        } as any,
        followingMap,
        adminEnvironment,
      ),
      "the staged change",
    );
    try {
      const committed = await context.domainController.handleAction(
        { actionType: "commit", endpoint: MODEL_ENDPOINT, payload: { application: adminSelfApplication.uuid } } as any,
        followingMap,
        adminEnvironment,
      );
      expect(refusalReason(committed), JSON.stringify(committed)).toBe("deploymentRoleFixed");
      expect(await deploymentRowOf(FOLLOWING_DEPLOYMENT)).toEqual(following);
    } finally {
      await context.domainController.handleAction(
        { actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: adminSelfApplication.uuid } } as any,
        followingMap,
        adminEnvironment,
      );
    }
  }, 60000);

  it("A3.1: the server refuses a model write a remote client sends to a following deployment; a migration run's write passes", async () => {
    const before = (await storedRows(context, FOLLOWING_DEPLOYMENT, "model", ENTITY_ENTITY)).find((row) => row.uuid === entityPublisher.uuid)!;
    const write = (description: string) => ({
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: APP_FOR_TEST,
        applicationSection: "model",
        parentUuid: ENTITY_ENTITY,
        objects: [{ ...before, description }],
      },
    });
    const serverWrite = (action: object) =>
      context.serverDomainController.handleAction(action as any, followingMap, appForTestModelEnvironment(context.serverDomainController));

    const sent = await serverWrite(markRecordedBySender(write("#9 A3: a tester's edit")));
    expect(refusalReason(sent), JSON.stringify(sent)).toBe("deploymentFollows");
    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "model", ENTITY_ENTITY)).find((row) => row.uuid === entityPublisher.uuid)).toEqual(before);

    const version = (await storedRows(context, FOLLOWING_DEPLOYMENT, "modelVersion", SELF_APPLICATION_VERSION_ENTITY))[0];
    const versionDeleted = await serverWrite(
      markRecordedBySender({
        actionType: "deleteInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: { application: APP_FOR_TEST, applicationSection: "modelVersion", parentUuid: SELF_APPLICATION_VERSION_ENTITY, objects: [version] },
      }),
    );
    expect(refusalReason(versionDeleted), JSON.stringify(versionDeleted)).toBe("deploymentFollows");
    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "modelVersion", SELF_APPLICATION_VERSION_ENTITY)).map((row) => row.uuid)).toContain(version.uuid);

    const entityDropped = await serverWrite(
      markRecordedBySender({ actionType: "dropEntity", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, transactional: false, entityUuid: entityCountry.uuid } }),
    );
    expect(refusalReason(entityDropped), JSON.stringify(entityDropped)).toBe("deploymentFollows");

    expectOk(await serverWrite(markMigrationRun(write("#9 A3: a migration run's write"))), "the run's write");
    expect(
      (await storedRows(context, FOLLOWING_DEPLOYMENT, "model", ENTITY_ENTITY)).find((row) => row.uuid === entityPublisher.uuid)?.description,
    ).toBe("#9 A3: a migration run's write");
    expectOk(await serverWrite(markMigrationRun(write(before.description as string))), "the run's write, undone");
  }, 60000);

  it("A3.2: a commit on a following deployment is refused, and nothing is recorded", async () => {
    const recordsBefore = await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID);
    const modelAction = (action: Record<string, unknown>) =>
      context.domainController.handleAction(
        { endpoint: MODEL_ENDPOINT, ...action } as any,
        followingMap,
        appForTestModelEnvironment(context.domainController),
      );

    const edited = { ...imprint, uuid: "9a000003-0000-4000-8000-000000000001", name: "Edited9" };
    const created = await modelAction({ actionType: "createEntity", payload: { application: APP_FOR_TEST, transactional: false, entities: [edited] } });
    expect(refusalReason(created), JSON.stringify(created)).toBe("deploymentFollows");
    const createdInTransaction = await modelAction({ actionType: "createEntity", payload: { application: APP_FOR_TEST, entities: [edited] } });
    expect(refusalReason(createdInTransaction), JSON.stringify(createdInTransaction)).toBe("deploymentFollows");
    const committed = await modelAction({ actionType: "commit", payload: { application: APP_FOR_TEST } });
    expect(refusalReason(committed), JSON.stringify(committed)).toBe("deploymentFollows");
    await modelAction({ actionType: "rollback", payload: { application: APP_FOR_TEST } });

    const stored = await storedRows(context, FOLLOWING_DEPLOYMENT, "model", ENTITY_ENTITY);
    expect(stored.map((row) => row.uuid)).not.toContain("9a000003-0000-4000-8000-000000000001");
    expect(await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID)).toEqual(recordsBefore);
  }, 60000);

  it("A3.3: a freeze, a re-baseline, a record append and a Migration generation are refused on a following deployment", async () => {
    const versionsBefore = await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", SELF_APPLICATION_VERSION_ENTITY);
    for (const [actionType, payload] of [
      ["freezeApplicationVersion", { application: APP_FOR_TEST, versionName: "9A3-refused" }],
      ["rebaselineEvolutionTraces", { application: APP_FOR_TEST, versionName: "9A3-refused" }],
      ["appendEvolutionTraceRecord", { application: APP_FOR_TEST, kind: "rebaseline" }],
      // #9 B3
      ["generateMigration", { application: APP_FOR_TEST, from: VERSION_1_0, to: VERSION_1_1 }],
    ] as const) {
      const result = await context.domainController.handleAction(
        { actionType, endpoint: MODEL_ENDPOINT, payload } as any,
        followingMap,
        appForTestModelEnvironment(context.domainController),
      );
      expect(refusalReason(result), `${actionType}: ${JSON.stringify(result)}`).toBe("deploymentFollows");
    }
    expect(await storedRows(context, APP_FOR_TEST_DEPLOYMENT, "modelVersion", SELF_APPLICATION_VERSION_ENTITY)).toEqual(versionsBefore);
  }, 60000);

  it("A3.4: a data write on a following deployment passes", async () => {
    const publishers = await storedRows(context, FOLLOWING_DEPLOYMENT, "data", entityPublisher.uuid);
    const publisher = { ...publishers[0], name: "#9 A3: renamed on the following deployment" };
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "updateInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: { application: APP_FOR_TEST, applicationSection: "data", parentUuid: entityPublisher.uuid, objects: [publisher] },
        } as any,
        followingMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "data write",
    );
    expect((await storedRows(context, FOLLOWING_DEPLOYMENT, "data", entityPublisher.uuid)).find((row) => row.uuid === publisher.uuid)).toEqual(publisher);
  }, 60000);
});
