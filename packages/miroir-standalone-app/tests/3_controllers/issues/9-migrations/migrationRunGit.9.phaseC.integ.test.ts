/**
 * #9 C4, `versioned-git`: a following deployment of Library is a clone checked out at a tag; a run reads
 * the Migration in the commit of its `to` tag and jumps by checking that tag out (analysis D8).
 *
 * Not reachable through MiroirTest: the test builds the repository and its clone on disk.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- migrationRunGit
 * ```
 */
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  createDeploymentCompositeAction,
  DEPLOYMENT_STATE_ENTITY_UUID,
  type DeploymentStateRow,
  type EntityInstance,
  type StoreUnitConfiguration,
} from "@miroir-framework/core";
import { adminSelfApplication, deployment_Admin, entityDeployment } from "@miroir-framework/core/admin";
import { createGitRepositoryFactory } from "@miroir-framework/git-isomorphic";
import { MIGRATION_RUN_REFUSALS, type MigrationRow } from "@miroir-framework/versioning";

import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";
import {
  applicationDeploymentMap,
  BOOK_ENTITY,
  BOOK_UBIK,
  bookPath,
  expectOk,
  gitAction,
  initCommittedRepository,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  MIROIR_APPLICATION,
  MIROIR_DEPLOYMENT,
  openGitTestContext,
  TEST_AUTHOR,
  type GitTestContext,
} from "../../git/gitTestSetup.js";

const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";
const MIGRATION_ENTITY = "b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe";
const BOOK_ENTITY_FILE = `model/${ENTITY_ENTITY}/${BOOK_ENTITY}.json`;
const ADMIN_DEPLOYMENT = deployment_Admin.uuid;
const FOLLOWING_DEPLOYMENT = "9c400001-0000-4000-8000-000000000001";
/** A deployment the install refuses: its clone is not at the tag of its version. */
const MISPLACED_DEPLOYMENT = "9c400001-0000-4000-8000-000000000002";
const EDITION = "editionC4";
/** The data folder of the following deployment, in its clone, ignored by Git. */
const FOLLOWING_DATA = "followingData";

const followingMap = {
  [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT,
  [LIBRARY_APPLICATION]: FOLLOWING_DEPLOYMENT,
  [adminSelfApplication.uuid]: ADMIN_DEPLOYMENT,
};

let context: GitTestContext;
let cloneRoot: string;
let dataRoot: string;
let migration: MigrationRow;

function readJson(root: string, relativePath: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function libraryAction(action: Record<string, unknown>, map: Record<string, string> = applicationDeploymentMap) {
  return context.domainController.handleAction(
    action as any,
    map,
    context.domainController.currentModelEnvironment(LIBRARY_APPLICATION, map),
  );
}

function updateLibraryRow(section: "model" | "modelVersion", object: Record<string, unknown>) {
  return libraryAction({
    actionType: "updateInstance",
    endpoint: INSTANCE_ENDPOINT,
    payload: { application: LIBRARY_APPLICATION, applicationSection: section, objects: [object as EntityInstance] },
  });
}

function runMigration(migrationUuid: string) {
  return libraryAction(
    { actionType: "runMigration", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION, migration: migrationUuid } },
    followingMap,
  );
}

async function adminRows(parentUuid: string): Promise<EntityInstance[]> {
  const manager = (context.serverDomainController as any).persistenceStoreLocalOrRemote.getLocalPersistenceStoreControllerManager();
  const read = await manager.getPersistenceStoreController(ADMIN_DEPLOYMENT).getInstances("data", parentUuid);
  return (read?.returnedDomainElement?.instances ?? []) as EntityInstance[];
}

async function deploymentState(): Promise<DeploymentStateRow | undefined> {
  return (await adminRows(DEPLOYMENT_STATE_ENTITY_UUID)).find((row) => row.uuid === FOLLOWING_DEPLOYMENT) as DeploymentStateRow | undefined;
}

function refusalReasons(result: unknown): string[] {
  const reasons: string[] = [];
  let error = result as { errorContext?: { reason?: string }; innerError?: unknown } | undefined;
  while (error && typeof error === "object") {
    if (error.errorContext?.reason) {
      reasons.push(error.errorContext.reason);
    }
    error = error.innerError as typeof error;
  }
  return reasons;
}

async function cloneHead(): Promise<string | undefined> {
  return (await (await createGitRepositoryFactory().open(cloneRoot)).branches()).head;
}

async function tagCommit(tag: string): Promise<string | undefined> {
  return (await (await createGitRepositoryFactory().open(cloneRoot)).log({ ref: tag, depth: 1 }))[0]?.oid;
}

/** A following deployment of Library on the clone, its data outside it, installed at `version`. */
function createFollowing(deploymentUuid: string, version: string) {
  const manager = (context.serverDomainController as any).persistenceStoreLocalOrRemote.getLocalPersistenceStoreControllerManager();
  const configuration = manager.getPersistenceStoreConfiguration(LIBRARY_DEPLOYMENT) as StoreUnitConfiguration & Record<string, any>;
  const relative = (absolute: string) => path.relative(resolveRepoRoot(), absolute);
  return context.domainController.handleAction(
    createDeploymentCompositeAction(
      "library",
      deploymentUuid,
      LIBRARY_APPLICATION,
      undefined,
      {
        ...configuration,
        model: { emulatedServerType: "filesystem", directory: relative(path.join(cloneRoot, "model")) },
        data: { emulatedServerType: "filesystem", directory: relative(dataRoot) },
        modelVersion: { emulatedServerType: "filesystem", directory: relative(path.join(cloneRoot, "modelVersion")) },
      } as StoreUnitConfiguration,
      {
        skipOpenAdminStore: true,
        skipCreateStore: true,
        role: "following",
        installVersion: version,
        labels: { deployment: { name: "LibraryFollowing9C4", description: "#9 C4: a following clone of Library" } },
      },
    ),
    { ...followingMap, [LIBRARY_APPLICATION]: deploymentUuid },
    context.domainController.currentModelEnvironment(LIBRARY_APPLICATION, applicationDeploymentMap),
  );
}

beforeAll(async () => {
  context = await openGitTestContext();
  context.serverDomainController.setProcessCapabilities({ ...context.baseCapabilities, git: true, versioning: true });
  context.domainController.setProcessCapabilities({ ...context.baseCapabilities, versioning: true });
  const { libraryRoot } = context;
  // Library in versioned-git, in the copy of this test file only
  expectOk(
    await updateLibraryRow("model", { ...readJson(libraryRoot, `model/${SELF_APPLICATION_ENTITY}/${LIBRARY_APPLICATION}.json`), versioningMode: "versioned-git" }),
  );
  expectOk(await libraryAction({ actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION } }));
  await initCommittedRepository(libraryRoot);
  expectOk(await gitAction(context, "gitAction_tag", { name: "1.0.0", author: TEST_AUTHOR }));

  // 1.1.0: Book.editionC4, and the Migration that fills it for Ubik, committed before the tag
  const book = readJson(libraryRoot, BOOK_ENTITY_FILE);
  expectOk(
    await updateLibraryRow("model", { ...book, mlSchema: { ...book.mlSchema, definition: { ...book.mlSchema.definition, [EDITION]: { type: "string", optional: true } } } }),
  );
  expectOk(await gitAction(context, "gitAction_stage", { all: true }));
  expectOk(await gitAction(context, "gitAction_commit", { message: "#9 C4: Book.editionC4", author: TEST_AUTHOR }));
  const migrationFolder = path.join(context.sectionDirectory("modelVersion"), MIGRATION_ENTITY);
  const migrationFiles = () => (fs.existsSync(migrationFolder) ? fs.readdirSync(migrationFolder) : []);
  const before = new Set(migrationFiles());
  expectOk(
    await libraryAction({ actionType: "generateMigration", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION, from: "1.0.0", to: "1.1.0" } }),
  );
  const [written] = migrationFiles().filter((file) => !before.has(file));
  const draft = readJson(libraryRoot, `modelVersion/${MIGRATION_ENTITY}/${written}`) as MigrationRow;
  const ubik = readJson(libraryRoot, bookPath(BOOK_UBIK));
  const writeUbik = (label: string, edition: string) => ({
    actionType: "compositeActionSequence",
    actionLabel: label,
    endpoint: DOMAIN_ENDPOINT,
    payload: {
      actionSequence: [
        {
          actionType: "updateInstance",
          actionLabel: `the edition of Ubik: ${edition}`,
          endpoint: INSTANCE_ENDPOINT,
          payload: { application: LIBRARY_APPLICATION, applicationSection: "data", parentUuid: BOOK_ENTITY, objects: [{ ...ubik, [EDITION]: edition }] },
        },
      ],
    },
  });
  migration = {
    ...draft,
    // a write of data before the jump: the checkout passes over it, Git ignoring the data folder
    expand: [{ uuid: "9c400003-0000-4000-8000-000000000001", name: "draft edition", backwardCompatible: true, repeatable: true, action: writeUbik("draft edition", "draft") as any }],
    fill: [
      {
        ...draft.fill[0],
        action: writeUbik("fill Book.editionC4", "first") as any,
      },
    ],
  };
  expectOk(await updateLibraryRow("modelVersion", migration as unknown as Record<string, unknown>));
  expectOk(await gitAction(context, "gitAction_stage", { all: true }));
  expectOk(await gitAction(context, "gitAction_commit", { message: "#9 C4: the Migration to 1.1.0", author: TEST_AUTHOR }));
  expectOk(await gitAction(context, "gitAction_tag", { name: "1.1.0", author: TEST_AUTHOR }));

  // the following clone at 1.0.0, its data section in a folder Git ignores (epic D7): every section of a
  // deployment is in its one repository, and the checkout of the jump looks at the files Git tracks only
  cloneRoot = `${libraryRoot}-following9C4`;
  dataRoot = path.join(cloneRoot, FOLLOWING_DATA);
  fs.rmSync(cloneRoot, { recursive: true, force: true });
  fs.cpSync(libraryRoot, cloneRoot, { recursive: true });
  fs.cpSync(path.join(libraryRoot, "data"), dataRoot, { recursive: true });
  fs.writeFileSync(path.join(cloneRoot, ".gitignore"), `${FOLLOWING_DATA}/\n`);
  expect((await (await createGitRepositoryFactory().open(cloneRoot)).checkout("1.0.0")).conflicts).toEqual([]);
  expectOk(await createFollowing(FOLLOWING_DEPLOYMENT, "1.0.0"));
}, 180000);

afterAll(async () => {
  for (const parentUuid of [entityDeployment.uuid, DEPLOYMENT_STATE_ENTITY_UUID]) {
    const rows = (await adminRows(parentUuid)).filter((row) => [FOLLOWING_DEPLOYMENT, MISPLACED_DEPLOYMENT].includes(row.uuid));
    if (rows.length > 0) {
      await context.domainController.handleAction(
        {
          actionType: "deleteInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: { application: adminSelfApplication.uuid, applicationSection: "data", parentUuid, objects: rows },
        } as any,
        followingMap,
      );
    }
  }
  if (cloneRoot) {
    fs.rmSync(cloneRoot, { recursive: true, force: true });
  }
}, 60000);

describe("#9 C4: runMigration in versioned-git", () => {
  it("C4: the install names the commit of the tag; a run reads the Migration at its tag, and a dirty work tree stops it at the jump", async () => {
    expect(await deploymentState()).toMatchObject({ version: "1.0.0", gitCommit: await tagCommit("1.0.0") });
    // the clone at 1.0.0 does not hold the Migration
    expect(fs.existsSync(path.join(cloneRoot, "modelVersion", MIGRATION_ENTITY, `${migration.uuid}.json`))).toBe(false);

    // an edit not committed in the clone: the checkout of 1.1.0 would overwrite it
    const bookFile = path.join(cloneRoot, BOOK_ENTITY_FILE);
    const bookText = fs.readFileSync(bookFile, "utf8");
    fs.writeFileSync(bookFile, `${bookText}\n`);
    const stopped = await runMigration(migration.uuid);
    expect(refusalReasons(stopped), JSON.stringify(stopped)).toEqual([MIGRATION_RUN_REFUSALS.migrationStepFailed, "checkoutConflict"]);
    expect((stopped as Action2Error).errorContext?.step).toBe("jump");
    expect(await deploymentState()).toMatchObject({ version: "1.0.0", run: { stepsDone: [migration.expand[0].uuid] } });
    expect(readJson(dataRoot, `${BOOK_ENTITY}/${BOOK_UBIK}.json`)[EDITION]).toBe("draft");
    expect(await cloneHead()).toBe(await tagCommit("1.0.0"));

    // the edit discarded: the run resumes at the jump and ends
    fs.writeFileSync(bookFile, bookText);
    expectOk(await runMigration(migration.uuid));

    expect(await cloneHead()).toBe(await tagCommit("1.1.0"));
    const ended = await deploymentState();
    expect(ended).toMatchObject({
      version: "1.1.0",
      gitCommit: await tagCommit("1.1.0"),
      applied: [expect.objectContaining({ migration: migration.uuid, from: "1.0.0", to: "1.1.0" })],
    });
    expect(ended?.run).toBeUndefined();
    // the model is the tag's, the data filled outside the work tree
    expect(readJson(cloneRoot, BOOK_ENTITY_FILE).mlSchema.definition[EDITION]).toEqual({ type: "string", optional: true });
    expect(readJson(dataRoot, `${BOOK_ENTITY}/${BOOK_UBIK}.json`)[EDITION]).toBe("first");
    expect(fs.existsSync(path.join(cloneRoot, bookPath(BOOK_UBIK)))).toBe(true);
    expect(readJson(cloneRoot, bookPath(BOOK_UBIK))[EDITION]).toBeUndefined();
  }, 120000);

  it("C4: a Migration no tag holds as its to is not found", async () => {
    const result = await runMigration("9c400002-0000-4000-8000-000000000001");
    expect(refusalReasons(result), JSON.stringify(result)).toEqual([MIGRATION_RUN_REFUSALS.migrationNotFound]);
  }, 60000);

  it("C4: the install refuses a clone that is not at the tag of the version", async () => {
    const result = await createFollowing(MISPLACED_DEPLOYMENT, "1.0.0");
    // the composite action of the creation reports its failed action as text
    expect(result instanceof Action2Error).toBe(true);
    expect(JSON.stringify(result)).toContain('\\"reason\\": \\"versionNotCheckedOut\\"');
    expect((await adminRows(DEPLOYMENT_STATE_ENTITY_UUID)).map((row) => row.uuid)).not.toContain(MISPLACED_DEPLOYMENT);
  }, 60000);
});
