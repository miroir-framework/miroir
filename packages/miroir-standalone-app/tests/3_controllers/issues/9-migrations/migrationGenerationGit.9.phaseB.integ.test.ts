/**
 * #9 part B, `versioned-git`: the draft Migration of Library between the tag of its last version and HEAD,
 * written as a file of the work tree, to commit before the next tag (epic section 5.2).
 *
 * Not reachable through MiroirTest: the test builds the repository on disk and edits the deployment's
 * configuration.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- migrationGenerationGit
 * ```
 */
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { Action2Error, type EntityInstance } from "@miroir-framework/core";

import {
  applicationDeploymentMap,
  BOOK_ENTITY,
  expectOk,
  gitAction,
  initCommittedRepository,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  openGitTestContext,
  TEST_AUTHOR,
  type GitTestContext,
} from "../../git/gitTestSetup.js";

const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";
const MIGRATION_ENTITY = "b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe";
const BOOK_ENTITY_FILE = `model/${ENTITY_ENTITY}/${BOOK_ENTITY}.json`;

let context: GitTestContext;

function libraryModelEnvironment() {
  return context.domainController.currentModelEnvironment(LIBRARY_APPLICATION, applicationDeploymentMap);
}

function readModelFile(relativePath: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.join(context.libraryRoot, relativePath), "utf8"));
}

/** A write of a Library model row through the DomainController: recorded, with traces on. */
async function updateModelRow(object: Record<string, unknown>): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: { application: LIBRARY_APPLICATION, applicationSection: "model", objects: [object as EntityInstance] },
      } as any,
      applicationDeploymentMap,
      libraryModelEnvironment(),
    ),
  );
}

/** Adds an optional string attribute to Book, through the DomainController. */
async function addBookAttribute(attribute: string): Promise<void> {
  const book = readModelFile(BOOK_ENTITY_FILE);
  await updateModelRow({
    ...book,
    mlSchema: { ...book.mlSchema, definition: { ...book.mlSchema.definition, [attribute]: { type: "string", optional: true } } },
  });
}

function generate(from: string, to: string, replace?: boolean) {
  return context.domainController.handleAction(
    { actionType: "generateMigration", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION, from, to, ...(replace ? { replace } : {}) } } as any,
    applicationDeploymentMap,
    libraryModelEnvironment(),
  );
}

function migrationFiles(): string[] {
  const folder = path.join(context.sectionDirectory("modelVersion"), MIGRATION_ENTITY);
  return fs.existsSync(folder) ? fs.readdirSync(folder) : [];
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
  context = await openGitTestContext();
  context.serverDomainController.setProcessCapabilities({ ...context.baseCapabilities, git: true, versioning: true });
  context.domainController.setProcessCapabilities({ ...context.baseCapabilities, versioning: true });
  // Library in versioned-git with its traces on, in the copy of this test file only
  const selfApplication = readModelFile(`model/${SELF_APPLICATION_ENTITY}/${LIBRARY_APPLICATION}.json`);
  await updateModelRow({ ...selfApplication, versioningMode: "versioned-git", evolutionTraces: true });
  expectOk(
    await context.domainController.handleAction(
      { actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION } } as any,
      applicationDeploymentMap,
      libraryModelEnvironment(),
    ),
  );
  await initCommittedRepository(context.libraryRoot);
  expectOk(await gitAction(context, "gitAction_tag", { name: "1.0.0", author: TEST_AUTHOR }));
}, 120000);

describe("#9 part B: generateMigration in versioned-git", () => {
  it("B4: the draft between the tag 1.0.0 and HEAD is a file of the work tree", async () => {
    await addBookAttribute("edition9");
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectOk(await gitAction(context, "gitAction_commit", { message: "#9 B4: Book.edition9", author: TEST_AUTHOR }));
    const before = new Set(migrationFiles());

    expectOk(await generate("1.0.0", "1.1.0"));

    const written = migrationFiles().filter((file) => !before.has(file));
    expect(written).toHaveLength(1);
    const migration = readModelFile(`modelVersion/${MIGRATION_ENTITY}/${written[0]}`);
    expect(migration).toMatchObject({
      application: LIBRARY_APPLICATION,
      from: "1.0.0",
      to: "1.1.0",
      source: "traces",
      backwardCompatible: true,
      expand: [],
      contract: [],
    });
    expect(migration.changes).toEqual([
      { kind: "addAttribute", entity: BOOK_ENTITY, entityName: "Book", attribute: "edition9", backwardCompatible: true, supported: true },
    ]);
    expect(migration.fill.map((step: { name: string }) => step.name)).toEqual(["fill Book.edition9"]);
    expect(migration.description).toContain("its model is the one of HEAD");
  }, 60000);

  it("B4: once to is tagged, its model is the tag's, not HEAD's", async () => {
    expectOk(await gitAction(context, "gitAction_tag", { name: "1.1.0", author: TEST_AUTHOR }));
    await addBookAttribute("edition10");
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectOk(await gitAction(context, "gitAction_commit", { message: "#9 B4: Book.edition10", author: TEST_AUTHOR }));

    expectOk(await generate("1.0.0", "1.1.0", true));

    const migration = migrationFiles()
      .map((file) => readModelFile(`modelVersion/${MIGRATION_ENTITY}/${file}`))
      .find((row) => row.from === "1.0.0" && row.to === "1.1.0")!;
    expect(migration.changes.map((change: { attribute?: string }) => change.attribute)).toEqual(["edition9"]);
    expect(migration.description).not.toContain("HEAD");
  }, 60000);

  it("B4: with the traces off at the from tag, the draft comes from the two commits", async () => {
    const selfApplicationFile = `model/${SELF_APPLICATION_ENTITY}/${LIBRARY_APPLICATION}.json`;
    await updateModelRow({ ...readModelFile(selfApplicationFile), evolutionTraces: false });
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectOk(await gitAction(context, "gitAction_commit", { message: "#9 B4: traces off", author: TEST_AUTHOR }));
    expectOk(await gitAction(context, "gitAction_tag", { name: "1.2.0", author: TEST_AUTHOR }));
    await addBookAttribute("edition11");
    await updateModelRow({ ...readModelFile(selfApplicationFile), evolutionTraces: true });
    await addBookAttribute("edition12");
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectOk(await gitAction(context, "gitAction_commit", { message: "#9 B4: traces on again", author: TEST_AUTHOR }));

    expectOk(await generate("1.2.0", "1.3.0"));

    const migration = migrationFiles()
      .map((file) => readModelFile(`modelVersion/${MIGRATION_ENTITY}/${file}`))
      .find((row) => row.from === "1.2.0" && row.to === "1.3.0")!;
    expect(migration.source).toBe("diff");
    expect(migration.description).toContain("the traces are off at 1.2.0");
    expect(migration.changes.map((change: { attribute?: string }) => change.attribute)).toEqual(["edition11", "edition12"]);
  }, 60000);

  it("B4: a branch named as a version is not its tag", async () => {
    expectOk(await gitAction(context, "gitAction_createBranch", { name: "9.9.9", startPoint: "1.0.0" }));
    try {
      // `to` not tagged: the model of HEAD, whatever the branch of that name holds
      expectOk(await generate("1.0.0", "9.9.9"));
      const migration = migrationFiles()
        .map((file) => readModelFile(`modelVersion/${MIGRATION_ENTITY}/${file}`))
        .find((row) => row.from === "1.0.0" && row.to === "9.9.9")!;
      expect(migration.description).toContain("its model is the one of HEAD");
      expect(migration.changes.length).toBeGreaterThan(0);
      // `from` must be a tag
      const result = await generate("9.9.9", "1.1.0");
      expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
      expect((result as Action2Error).errorMessage).toContain("no tag 9.9.9");
    } finally {
      expectOk(await gitAction(context, "gitAction_deleteBranch", { name: "9.9.9" }));
    }
  }, 60000);

  it("B4: an unknown tag is refused", async () => {
    const result = await generate("0.9.0", "1.1.0");
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
    expect((result as Action2Error).errorMessage).toContain("no tag 0.9.0");
  }, 60000);

  it("B4: without a modelVersion folder in the repository, the generation is refused", async () => {
    const manager = (context.serverDomainController as any).persistenceStoreLocalOrRemote.getLocalPersistenceStoreControllerManager();
    const configuration = manager.getPersistenceStoreConfiguration(LIBRARY_DEPLOYMENT);
    const modelVersion = configuration.modelVersion;
    delete configuration.modelVersion;
    try {
      const result = await generate("1.0.0", "1.2.0");
      expect(refusalReason(result), JSON.stringify(result)).toBe("migrationSectionMissing");
    } finally {
      configuration.modelVersion = modelVersion;
    }
  }, 60000);
});
