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

function generate(from: string, to: string) {
  return context.domainController.handleAction(
    { actionType: "generateMigration", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION, from, to } } as any,
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
    await updateModelRow({
      ...readModelFile(BOOK_ENTITY_FILE),
      mlSchema: {
        ...readModelFile(BOOK_ENTITY_FILE).mlSchema,
        definition: { ...readModelFile(BOOK_ENTITY_FILE).mlSchema.definition, edition9: { type: "string", optional: true } },
      },
    });
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
