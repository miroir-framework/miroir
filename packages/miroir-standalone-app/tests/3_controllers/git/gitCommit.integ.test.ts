/**
 * #679 slice 5: `gitAction_stage`, `gitAction_unstage` and `gitAction_commit` on the Library copy: the
 * application's files only, the commit's author, and the refusal while Miroir changes are not on disk.
 *
 * Not reachable through MiroirTest: the test builds the repository and its index on disk first.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitCommit
 * ```
 */
import fs from "node:fs";
import path from "node:path";
import git from "isomorphic-git";
import { beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  type EntityInstance,
  type EndpointDefinition,
  type GitCommitFilesResult,
  type GitCommitResult,
  type GitLogResult,
  type GitStageResult,
} from "@miroir-framework/core";
import { defaultMiroirMetaModel } from "@miroir-framework/core/meta-model";
import { endpointDocument, getDefaultLibraryModelEnvironmentDEFUNCT } from "miroir-example-library";

import {
  applicationDeploymentMap,
  BOOK_ENTITY,
  BOOK_UBIK,
  bookPath,
  editUbik,
  expectGitError,
  expectOk,
  gitAction,
  gitActionOnServer,
  initCommittedRepository,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  openGitTestContext,
  setGitCapability,
  TEST_AUTHOR,
  type GitTestContext,
} from "./gitTestSetup.js";

const NEW_BOOK = "679a0005-0000-4000-8000-000000000005";
const libraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  LIBRARY_DEPLOYMENT,
);

let context: GitTestContext;

async function commitCount(): Promise<number> {
  return (expectOk<GitLogResult>(await gitAction(context, "gitAction_log"))).commits.length;
}

async function indexPaths(): Promise<string[]> {
  return git.listFiles({ fs, dir: context.libraryRoot });
}

beforeAll(async () => {
  context = await openGitTestContext();
  setGitCapability(context, true);
  await initCommittedRepository(context.libraryRoot);
  editUbik(context, { year: 1970 });
  // a change outside the application's section folders
  fs.writeFileSync(path.join(context.libraryRoot, "NOTES.md"), "not part of the deployment\n");
});

describe("gitAction_stage and gitAction_unstage (#679 slice 5)", () => {
  it("stages every changed file of the sections, and only those", async () => {
    const status = expectOk<GitStageResult>(await gitAction(context, "gitAction_stage", { all: true }));
    expect(status.files).toEqual([expect.objectContaining({ path: bookPath(BOOK_UBIK), staged: true, unstaged: false })]);
    expect(await indexPaths()).not.toContain("NOTES.md");
  });

  it("unstages a file, leaving the work tree as it is", async () => {
    const status = expectOk<GitStageResult>(
      await gitAction(context, "gitAction_unstage", { paths: [bookPath(BOOK_UBIK)] }),
    );
    expect(status.files).toEqual([expect.objectContaining({ path: bookPath(BOOK_UBIK), staged: false, unstaged: true })]);
    expect(JSON.parse(fs.readFileSync(path.join(context.libraryRoot, bookPath(BOOK_UBIK)), "utf8")).year).toBe(1970);
  });

  it("stages a named file of the sections", async () => {
    const status = expectOk<GitStageResult>(
      await gitAction(context, "gitAction_stage", { paths: [bookPath(BOOK_UBIK)] }),
    );
    expect(status.files).toEqual([expect.objectContaining({ path: bookPath(BOOK_UBIK), staged: true })]);
  });

  it.each([
    ["a file outside the sections", "NOTES.md"],
    ["the repository's own files", ".git/config"],
    ["a path above the repository", "../escape.json"],
  ])("refuses %s", async (_label, filepath) => {
    expectGitError(await gitAction(context, "gitAction_stage", { paths: [filepath] }), "pathOutsideApplication");
  });

  it("refuses a folder, or a file with no change", async () => {
    const before = await indexPaths();
    expectGitError(await gitAction(context, "gitAction_unstage", { paths: ["data"] }), "invalidPayload");
    expectGitError(
      await gitAction(context, "gitAction_unstage", { paths: [`data/${BOOK_ENTITY}`] }),
      "invalidPayload",
    );
    const unchanged = (await indexPaths()).find((file) => file.startsWith("model/"))!;
    expectGitError(await gitAction(context, "gitAction_stage", { paths: [unchanged] }), "invalidPayload");
    expect(await indexPaths()).toEqual(before);
  });

  it("stages no file reached through a symbolic link out of the repository", async () => {
    const outside = fs.mkdtempSync(path.join(path.dirname(context.libraryRoot), "git679-outside-"));
    fs.writeFileSync(path.join(outside, "secret.json"), JSON.stringify({ secret: true }));
    const link = path.join(context.libraryRoot, "data", BOOK_ENTITY, "link");
    fs.symlinkSync(outside, link, "dir");
    try {
      const result = await gitAction(context, "gitAction_stage", { paths: [`data/${BOOK_ENTITY}/link/secret.json`] });
      expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
      expect((await indexPaths()).some((file) => file.includes("secret"))).toBe(false);
    } finally {
      fs.rmSync(link);
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it("stages a deleted file as its removal", async () => {
    const file = path.join(context.libraryRoot, bookPath(BOOK_UBIK));
    const saved = fs.readFileSync(file, "utf8");
    fs.rmSync(file);
    try {
      const status = expectOk<GitStageResult>(await gitAction(context, "gitAction_stage", { all: true }));
      expect(status.files).toEqual([expect.objectContaining({ path: bookPath(BOOK_UBIK), change: "deleted", staged: true })]);
      expect(await indexPaths()).not.toContain(bookPath(BOOK_UBIK));
    } finally {
      fs.writeFileSync(file, saved);
      expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    }
  });
});

describe("gitAction_commit (#679 slice 5)", () => {
  it("refuses files staged outside the sections, unless told to include them", async () => {
    await git.add({ fs, dir: context.libraryRoot, filepath: "NOTES.md" });
    const before = await commitCount();
    const refusal = expectGitError(
      await gitAction(context, "gitAction_commit", { message: "Ubik: 1970", author: TEST_AUTHOR }),
      "otherStagedChanges",
    );
    expect(refusal.errorContext?.paths).toEqual(["NOTES.md"]);
    expect(await commitCount()).toBe(before);

    const committed = expectOk<GitCommitResult>(
      await gitAction(context, "gitAction_commit", {
        message: "Ubik: 1970",
        author: TEST_AUTHOR,
        includeOtherStagedChanges: true,
      }),
    );
    expect(committed.files.sort()).toEqual([bookPath(BOOK_UBIK), "NOTES.md"].sort());
    const files = expectOk<GitCommitFilesResult>(await gitAction(context, "gitAction_commitFiles", { oid: committed.oid }));
    expect(files.files.map((file) => file.path).sort()).toEqual([bookPath(BOOK_UBIK), "NOTES.md"].sort());
    expect(await commitCount()).toBe(before + 1);
  });

  it("refuses a commit with nothing staged, or with no message", async () => {
    expectGitError(await gitAction(context, "gitAction_commit", { message: "empty", author: TEST_AUTHOR }), "nothingStaged");
    editUbik(context, { year: 1971 });
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectGitError(await gitAction(context, "gitAction_commit", { message: "  ", author: TEST_AUTHOR }), "invalidPayload");
  });

  it("asks for an author when no user is logged in and the repository has none", async () => {
    expectGitError(await gitAction(context, "gitAction_commit", { message: "Ubik: 1971" }), "authorUnknown");
  });

  it("commits with the given author, and remembers it when asked", async () => {
    const committed = expectOk<GitCommitResult>(
      await gitAction(context, "gitAction_commit", { message: "Ubik: 1971", author: TEST_AUTHOR, rememberAuthor: true }),
    );
    expect(committed.author).toEqual(TEST_AUTHOR);
    expect(await git.getConfig({ fs, dir: context.libraryRoot, path: "user.name" })).toBe(TEST_AUTHOR.name);
    expect(await git.getConfig({ fs, dir: context.libraryRoot, path: "user.email" })).toBe(TEST_AUTHOR.email);
  });

  it("then commits as the repository's user.name and user.email", async () => {
    editUbik(context, { year: 1972 });
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    const committed = expectOk<GitCommitResult>(await gitAction(context, "gitAction_commit", { message: "Ubik: 1972" }));
    const { commit } = await git.readCommit({ fs, dir: context.libraryRoot, oid: committed.oid });
    expect(commit.author).toMatchObject(TEST_AUTHOR);
  });

  it("commits as the logged-in user when there is one", async () => {
    editUbik(context, { year: 1973 });
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    const committed = expectOk<GitCommitResult>(
      await gitActionOnServer(context, "gitAction_commit", { message: "Ubik: 1973" }, {
        miroirUserUuid: "679a0005-0000-4000-8000-0000000000a1",
        username: "alice",
      }),
    );
    const { commit } = await git.readCommit({ fs, dir: context.libraryRoot, oid: committed.oid });
    expect(commit.author.name).toBe("alice");
  });
});

describe("gitAction_commit with Miroir changes not on disk (#679 slice 5, D7)", () => {
  it("is refused by the client while the local cache holds an uncommitted Miroir change", async () => {
    const ubik = JSON.parse(fs.readFileSync(path.join(context.libraryRoot, bookPath(BOOK_UBIK)), "utf8"));
    const created = await context.domainController.handleAction(
      {
        actionType: "transactionalInstanceAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        payload: {
          application: LIBRARY_APPLICATION,
          instanceAction: {
            actionType: "createInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: LIBRARY_APPLICATION,
              applicationSection: "data",
              objects: [{ ...ubik, uuid: NEW_BOOK, name: "Galactic Pot-Healer" } as EntityInstance],
            },
          },
        },
      },
      applicationDeploymentMap,
      libraryModelEnvironment,
    );
    expect(created instanceof Action2Error, JSON.stringify(created)).toBe(false);
    expect(context.domainController.currentTransaction().length).toBe(1);

    // with Git off on the server, a request that reached it would be refused as FeatureUnavailable
    setGitCapability(context, false);
    try {
      const refusal = expectGitError(
        await gitAction(context, "gitAction_commit", { message: "too early", author: TEST_AUTHOR }),
        "openMiroirTransaction",
      );
      expect(refusal.errorContext?.applications).toEqual([LIBRARY_APPLICATION]);
    } finally {
      setGitCapability(context, true);
    }
    expect(context.domainController.currentTransaction().length).toBe(1);
    expect(fs.existsSync(path.join(context.libraryRoot, bookPath(NEW_BOOK)))).toBe(false);
  });

  it("commits the instance file once the Miroir change is committed", async () => {
    const miroirCommit = await context.domainController.handleAction(
      { actionType: "commit", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", payload: { application: LIBRARY_APPLICATION } },
      applicationDeploymentMap,
      libraryModelEnvironment,
    );
    expect(miroirCommit instanceof Action2Error, JSON.stringify(miroirCommit)).toBe(false);
    expect(context.domainController.currentTransaction()).toEqual([]);
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    const committed = expectOk<GitCommitResult>(
      await gitAction(context, "gitAction_commit", { message: "Galactic Pot-Healer" }),
    );
    expect(committed.files).toContain(bookPath(NEW_BOOK));
  });
});
