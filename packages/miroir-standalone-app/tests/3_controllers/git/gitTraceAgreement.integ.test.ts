/**
 * #708 part C, `versioned-git`: a commit of an application with traces on is checked. The model it holds
 * (the index) must be the model of HEAD replayed with the commit records it adds: a commit that stages its
 * records goes on, a model file edited outside Miroir, or staged without its record, is refused and named,
 * and a re-baseline lets the commit go on.
 *
 * Not reachable through MiroirTest: the test builds the repository on disk and edits a model file in it.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitTraceAgreement
 * ```
 */
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { Action2Error, type EntityInstance, type GitLogResult } from "@miroir-framework/core";

import {
  applicationDeploymentMap,
  BOOK_ENTITY,
  expectGitError,
  expectOk,
  gitAction,
  initCommittedRepository,
  LIBRARY_APPLICATION,
  openGitTestContext,
  TEST_AUTHOR,
  writeWorkTreeFile,
  type GitTestContext,
} from "./gitTestSetup.js";

const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";
const EVOLUTION_TRACE_RECORD_ENTITY = "854c47bd-af74-4305-bdea-aa6bddfa8899";
const BOOK_ENTITY_FILE = `model/${ENTITY_ENTITY}/${BOOK_ENTITY}.json`;

let context: GitTestContext;

function libraryModelEnvironment() {
  return context.domainController.currentModelEnvironment(LIBRARY_APPLICATION, applicationDeploymentMap);
}

function readModelFile(relativePath: string): EntityInstance {
  return JSON.parse(fs.readFileSync(path.join(context.libraryRoot, relativePath), "utf8"));
}

/** A write of a Library model row through the DomainController: recorded, with traces on. */
async function updateModelRow(object: EntityInstance): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: { application: LIBRARY_APPLICATION, applicationSection: "model", objects: [object] },
      } as any,
      applicationDeploymentMap,
      libraryModelEnvironment(),
    ),
  );
}

function recordFiles(): string[] {
  const folder = path.join(context.sectionDirectory("modelVersion"), EVOLUTION_TRACE_RECORD_ENTITY);
  return fs.existsSync(folder) ? fs.readdirSync(folder) : [];
}

async function headOid(): Promise<string> {
  return expectOk<GitLogResult>(await gitAction(context, "gitAction_log")).commits[0].oid;
}

function commit(message: string) {
  return gitAction(context, "gitAction_commit", { message, author: TEST_AUTHOR });
}

beforeAll(async () => {
  context = await openGitTestContext();
  context.serverDomainController.setProcessCapabilities({ ...context.baseCapabilities, git: true, versioning: true });
  context.domainController.setProcessCapabilities({ ...context.baseCapabilities, versioning: true });
  // Library in versioned-git with its traces on, in the copy of this test file only
  const selfApplication = readModelFile(`model/${SELF_APPLICATION_ENTITY}/${LIBRARY_APPLICATION}.json`);
  await updateModelRow({ ...selfApplication, versioningMode: "versioned-git", evolutionTraces: true } as EntityInstance);
  expectOk(
    await context.domainController.handleAction(
      { actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION } } as any,
      applicationDeploymentMap,
      libraryModelEnvironment(),
    ),
  );
  await initCommittedRepository(context.libraryRoot);
}, 120000);

describe("evolution trace agreement at a Git commit (#708 C4)", () => {
  it("C4: a commit that stages its records goes on", async () => {
    const records = recordFiles().length;
    await updateModelRow({ ...readModelFile(BOOK_ENTITY_FILE), description: "#708 C4: a recorded change" } as EntityInstance);
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));

    const committed = await commit("#708 C4: recorded change");

    expect({ committed: committed instanceof Action2Error ? committed.errorContext : "ok", records: recordFiles().length }).toEqual({
      committed: "ok",
      records: records + 1,
    });
  }, 60000);

  it("C4: a commit of a model file edited outside Miroir is refused, and names it", async () => {
    const book = readModelFile(BOOK_ENTITY_FILE);
    const head = await headOid();
    writeWorkTreeFile(context, BOOK_ENTITY_FILE, JSON.stringify({ ...book, description: "#708 C4: edited outside Miroir" }, undefined, 2));
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));

    const refused = expectGitError(await commit("#708 C4: outside edit"), "evolutionTracesDisagree");

    expect({
      entities: (refused.errorContext?.differences as any)?.collections?.entities,
      head: await headOid(),
    }).toEqual({
      entities: { added: [], removed: [], changed: [{ uuid: BOOK_ENTITY, name: "Book", attributes: ["description"] }] },
      head,
    });
    // back to the committed file, for the next tests
    writeWorkTreeFile(context, BOOK_ENTITY_FILE, JSON.stringify(book, undefined, 2));
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
  }, 60000);

  it("C4: a recorded change staged without its record is refused, and goes on once the record is staged", async () => {
    const before = new Set(recordFiles());
    await updateModelRow({ ...readModelFile(BOOK_ENTITY_FILE), description: "#708 C4: record not staged" } as EntityInstance);
    const record = recordFiles().find((file) => !before.has(file));
    expectOk(await gitAction(context, "gitAction_stage", { paths: [BOOK_ENTITY_FILE] }));

    const refused = await commit("#708 C4: model file only");
    expectOk(await gitAction(context, "gitAction_stage", { paths: [`modelVersion/${EVOLUTION_TRACE_RECORD_ENTITY}/${record}`] }));
    const committed = await commit("#708 C4: with its record");

    expect({
      refused: (refused as Action2Error).errorContext?.reason,
      committed: committed instanceof Action2Error ? committed.errorContext : "ok",
    }).toEqual({ refused: "evolutionTracesDisagree", committed: "ok" });
  }, 60000);

  it("C5: once the traces are re-baselined, a commit of a model edited outside Miroir goes on", async () => {
    const book = readModelFile(BOOK_ENTITY_FILE);
    writeWorkTreeFile(context, BOOK_ENTITY_FILE, JSON.stringify({ ...book, description: "#708 C5: edited outside Miroir" }, undefined, 2));
    const before = new Set(recordFiles());

    expectOk(
      await context.domainController.handleAction(
        { actionType: "rebaselineEvolutionTraces", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION } } as any,
        applicationDeploymentMap,
        libraryModelEnvironment(),
      ),
    );
    const rebaseline = recordFiles().find((file) => !before.has(file));
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    const committed = await commit("#708 C5: re-baselined");

    expect({
      kind: rebaseline
        ? readModelFile(`modelVersion/${EVOLUTION_TRACE_RECORD_ENTITY}/${rebaseline}`).kind
        : undefined,
      committed: committed instanceof Action2Error ? committed.errorContext : "ok",
    }).toEqual({ kind: "rebaseline", committed: "ok" });
  }, 60000);

  it("C4: a commit is refused when Git ignores the folder of the records", async () => {
    writeWorkTreeFile(context, ".gitignore", "modelVersion\n");
    await updateModelRow({ ...readModelFile(BOOK_ENTITY_FILE), description: "#708 C4: records ignored" } as EntityInstance);
    expectOk(await gitAction(context, "gitAction_stage", { paths: [BOOK_ENTITY_FILE] }));

    expectGitError(await commit("#708 C4: records ignored"), "evolutionTraceRecordsIgnored");
  }, 60000);
});
