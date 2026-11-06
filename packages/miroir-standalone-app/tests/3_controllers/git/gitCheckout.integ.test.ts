/**
 * #679 slice 6: `gitAction_createBranch`, `gitAction_deleteBranch` and `gitAction_checkout` on the Library
 * copy, with the reload of the checked-out files into the local caches, and the refusals that keep
 * uncommitted work.
 *
 * Not reachable through MiroirTest: the test builds branches and commits on disk first.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitCheckout
 * ```
 */
import fs from "node:fs";
import path from "node:path";
import git from "isomorphic-git";
import { beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  type EndpointDefinition,
  type EntityInstance,
  type GitBranchResult,
  type GitCheckoutResult,
  type GitCommitResult,
  type GitStatusResult,
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
  initCommittedRepository,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  openGitTestContext,
  setGitCapability,
  TEST_AUTHOR,
  type GitTestContext,
} from "./gitTestSetup.js";

const FEATURE_BOOK = "679a0006-0000-4000-8000-000000000006";
const libraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  LIBRARY_DEPLOYMENT,
);

let context: GitTestContext;
let initialCommit: string;

function readUbik(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(context.libraryRoot, bookPath(BOOK_UBIK)), "utf8"));
}

/** The Book uuids of a DomainController's local cache. */
function cachedBooks(domainController: GitTestContext["domainController"]): string[] {
  const books = (domainController.getLocalCache().getDomainState() as any)?.[LIBRARY_DEPLOYMENT]?.data?.[BOOK_ENTITY];
  return Object.keys(books ?? {});
}

async function rollback(domainController: GitTestContext["domainController"]): Promise<void> {
  const result = await domainController.handleAction(
    { actionType: "rollback", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", payload: { application: LIBRARY_APPLICATION } },
    applicationDeploymentMap,
    libraryModelEnvironment,
  );
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
}

beforeAll(async () => {
  context = await openGitTestContext();
  setGitCapability(context, true);
  initialCommit = await initCommittedRepository(context.libraryRoot);
});

describe("gitAction_createBranch (#679 slice 6)", () => {
  it("creates a branch at HEAD without checking it out", async () => {
    const result = expectOk<GitBranchResult>(await gitAction(context, "gitAction_createBranch", { name: "feature" }));
    expect(result.branches.local.sort()).toEqual(["feature", "main"]);
    expect(result.branches.current).toBe("main");
  });

  it("refuses an existing name, an invalid name and an unknown start point", async () => {
    expectGitError(await gitAction(context, "gitAction_createBranch", { name: "feature" }), "branchExists");
    expectGitError(await gitAction(context, "gitAction_createBranch", { name: "bad..name" }), "invalidPayload");
    expectGitError(
      await gitAction(context, "gitAction_createBranch", { name: "other", startPoint: "no-such-ref" }),
      "unknownRevision",
    );
  });
});

describe("gitAction_checkout (#679 slice 6)", () => {
  it("checks out a branch, which becomes the current one", async () => {
    const result = expectOk<GitCheckoutResult>(await gitAction(context, "gitAction_checkout", { ref: "feature" }));
    expect(result.branches.current).toBe("feature");
    expect(result.touchedDeployments).toEqual([{ application: LIBRARY_APPLICATION, deploymentUuid: LIBRARY_DEPLOYMENT }]);
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.branches.current).toBe("feature");
  });

  it("reloads the local caches with the files of the checked-out branch", async () => {
    fs.writeFileSync(
      path.join(context.libraryRoot, bookPath(FEATURE_BOOK)),
      JSON.stringify({ ...readUbik(), uuid: FEATURE_BOOK, name: "Galactic Pot-Healer" }, undefined, 2),
    );
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectOk<GitCommitResult>(
      await gitAction(context, "gitAction_commit", { message: "Galactic Pot-Healer", author: TEST_AUTHOR }),
    );
    await rollback(context.domainController);
    expect(cachedBooks(context.domainController)).toContain(FEATURE_BOOK);

    const result = expectOk<GitCheckoutResult>(await gitAction(context, "gitAction_checkout", { ref: "main" }));
    expect(result.touchedDeployments.map((touched) => touched.application)).toEqual([LIBRARY_APPLICATION]);
    expect(fs.existsSync(path.join(context.libraryRoot, bookPath(FEATURE_BOOK)))).toBe(false);
    expect(cachedBooks(context.domainController)).not.toContain(FEATURE_BOOK);
    expect(cachedBooks(context.domainController)).toContain(BOOK_UBIK);
    expect(cachedBooks(context.serverDomainController)).not.toContain(FEATURE_BOOK);
  });

  it("checks out a commit or a tag as a detached HEAD", async () => {
    const byOid = expectOk<GitCheckoutResult>(await gitAction(context, "gitAction_checkout", { ref: initialCommit }));
    expect(byOid.branches.current).toBeUndefined();
    expect(byOid.branches.head).toBe(initialCommit);
    await git.tag({ fs, dir: context.libraryRoot, ref: "v1", object: initialCommit });
    expectOk(await gitAction(context, "gitAction_checkout", { ref: "main" }));
    const byTag = expectOk<GitCheckoutResult>(await gitAction(context, "gitAction_checkout", { ref: "v1" }));
    expect(byTag.branches).toMatchObject({ current: undefined, head: initialCommit });
    expectOk(await gitAction(context, "gitAction_checkout", { ref: "main" }));
  });

  it("refuses an unknown revision", async () => {
    expectGitError(await gitAction(context, "gitAction_checkout", { ref: "no-such-ref" }), "unknownRevision");
    expectGitError(
      await gitAction(context, "gitAction_checkout", { ref: "0123456789abcdef0123456789abcdef01234567" }),
      "unknownRevision",
    );
  });

  it("refuses to overwrite an uncommitted change, leaving the file as it is", async () => {
    editUbik(context, { year: 1970 });
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectOk(await gitAction(context, "gitAction_commit", { message: "Ubik: 1970", author: TEST_AUTHOR }));
    editUbik(context, { year: 1999 });
    const refusal = expectGitError(
      await gitAction(context, "gitAction_checkout", { ref: "feature" }),
      "checkoutConflict",
    );
    expect(refusal.errorContext?.paths).toEqual([bookPath(BOOK_UBIK)]);
    expect(readUbik().year).toBe(1999);
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.branches.current).toBe("main");
  });

  it("refuses to lose a staged change, leaving the index and the file as they are", async () => {
    editUbik(context, { year: 1998 });
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    const refusal = expectGitError(await gitAction(context, "gitAction_checkout", { ref: "feature" }), "checkoutConflict");
    expect(refusal.errorContext?.paths).toEqual([bookPath(BOOK_UBIK)]);
    expect(readUbik().year).toBe(1998);
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.branches.current).toBe("main");
    expect(status.files).toEqual([expect.objectContaining({ path: bookPath(BOOK_UBIK), staged: true })]);
    expectOk(await gitAction(context, "gitAction_unstage", { all: true }));
  });

  it("refuses while the local cache holds an uncommitted Miroir change, leaving the files and the change", async () => {
    editUbik(context, { year: 1970 });
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
              objects: [{ ...readUbik(), uuid: FEATURE_BOOK, name: "Pending" } as EntityInstance],
            },
          },
        },
      },
      applicationDeploymentMap,
      libraryModelEnvironment,
    );
    expect(created instanceof Action2Error, JSON.stringify(created)).toBe(false);
    try {
      expectGitError(await gitAction(context, "gitAction_checkout", { ref: "feature" }), "openMiroirTransaction");
      expect(context.domainController.currentTransaction().length).toBe(1);
      const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
      expect(status.branches.current).toBe("main");
    } finally {
      await rollback(context.domainController);
    }
    expect(context.domainController.currentTransaction()).toEqual([]);
  });
});

describe("gitAction_checkout and the filesystem stores (#679 slice 6)", () => {
  const SHELF_ENTITY = "679a0006-0000-4000-8000-0000000000e1";

  /** The primary key the server's filesystem store uses to name the files of an Entity's instances. */
  function storedIdAttribute(entityUuid: string): unknown {
    const manager = (context.serverDomainController as any).persistenceStoreLocalOrRemote.getLocalPersistenceStoreControllerManager();
    return manager.getPersistenceStoreController(LIBRARY_DEPLOYMENT).dataStoreSection.getEntityIdAttribute(entityUuid);
  }

  it("makes the store use the primary key of an Entity the checked-out branch brings", async () => {
    expectOk(await gitAction(context, "gitAction_createBranch", { name: "shelves" }));
    expectOk(await gitAction(context, "gitAction_checkout", { ref: "shelves" }));
    const entityFolder = path.join(context.libraryRoot, "model", "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad");
    const book = JSON.parse(fs.readFileSync(path.join(entityFolder, `${BOOK_ENTITY}.json`), "utf8"));
    fs.writeFileSync(
      path.join(entityFolder, `${SHELF_ENTITY}.json`),
      JSON.stringify({ ...book, uuid: SHELF_ENTITY, name: "Shelf", idAttribute: "code" }, undefined, 2),
    );
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectOk(await gitAction(context, "gitAction_commit", { message: "Shelf", author: TEST_AUTHOR }));
    expectOk(await gitAction(context, "gitAction_checkout", { ref: "main" }));
    expect(storedIdAttribute(SHELF_ENTITY)).toBe("uuid");

    expectOk(await gitAction(context, "gitAction_checkout", { ref: "shelves" }));

    expect(storedIdAttribute(SHELF_ENTITY)).toBe("code");
    expectOk(await gitAction(context, "gitAction_checkout", { ref: "main" }));
    expectOk(await gitAction(context, "gitAction_deleteBranch", { name: "shelves", force: true }));
  });
});

describe("gitAction_deleteBranch (#679 slice 6)", () => {
  it("refuses the current branch", async () => {
    expectGitError(await gitAction(context, "gitAction_deleteBranch", { name: "main" }), "currentBranch");
  });

  it("deletes a branch whose commits the current branch has", async () => {
    expectOk(await gitAction(context, "gitAction_createBranch", { name: "merged" }));
    const result = expectOk<GitBranchResult>(await gitAction(context, "gitAction_deleteBranch", { name: "merged" }));
    expect(result.branches.local.sort()).toEqual(["feature", "main"]);
  });

  it("deletes a branch with commits of its own only when forced", async () => {
    expectGitError(await gitAction(context, "gitAction_deleteBranch", { name: "feature" }), "branchNotMerged");
    const result = expectOk<GitBranchResult>(
      await gitAction(context, "gitAction_deleteBranch", { name: "feature", force: true }),
    );
    expect(result.branches.local).toEqual(["main"]);
    expectGitError(await gitAction(context, "gitAction_deleteBranch", { name: "feature" }), "unknownRevision");
  });
});
