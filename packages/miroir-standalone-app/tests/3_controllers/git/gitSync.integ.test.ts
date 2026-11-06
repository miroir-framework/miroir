/**
 * #679 slice 9: `gitAction_push` and `gitAction_pull` on the Library copy, against a Git remote served
 * over HTTP by this test process. A push sets the branch's upstream when it has none; a pull is a fetch
 * then a fast-forward (D12), after which the local caches reload the deployment (D8).
 *
 * Not reachable through MiroirTest: the test starts a Git server and commits on the remote first.
 * Skipped when the `git` program, which the test server runs, is not on the PATH.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitSync
 * ```
 */
import fs from "node:fs";
import path from "node:path";
import git from "isomorphic-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  type EndpointDefinition,
  type EntityInstance,
  type GitPullResult,
  type GitRemoteResult,
  type GitStatusResult,
} from "@miroir-framework/core";
import { defaultMiroirMetaModel } from "@miroir-framework/core/meta-model";
import { endpointDocument, getDefaultLibraryModelEnvironmentDEFUNCT } from "miroir-example-library";

import { commitOnRemote, gitCli, gitProgramMissing, startGitHttpServer, type GitHttpServer } from "./gitHttpServer.js";
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

const gitMissing = gitProgramMissing();
if (gitMissing) {
  console.warn(`gitSync skipped: ${gitMissing}`);
}

const REMOTE_BOOK = "679a0009-0000-4000-8000-000000000009";
const libraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  LIBRARY_DEPLOYMENT,
);

let context: GitTestContext;
let server: GitHttpServer;
let bareDirectory: string;
let remoteUrl: string;

function ubik(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(context.libraryRoot, bookPath(BOOK_UBIK)), "utf8"));
}

function cachedBooks(domainController: GitTestContext["domainController"]): string[] {
  const books = (domainController.getLocalCache().getDomainState() as any)?.[LIBRARY_DEPLOYMENT]?.data?.[BOOK_ENTITY];
  return Object.keys(books ?? {});
}

function head(): Promise<string> {
  return git.resolveRef({ fs, dir: context.libraryRoot, ref: "HEAD" });
}

function remoteBranch(branch: string): string {
  return gitCli(bareDirectory, "rev-parse", `refs/heads/${branch}`);
}

async function commitUbik(year: number): Promise<string> {
  editUbik(context, { year });
  expectOk(await gitAction(context, "gitAction_stage", { all: true }));
  return (
    expectOk<{ oid: string }>(await gitAction(context, "gitAction_commit", { message: `Ubik, ${year}`, author: TEST_AUTHOR }))
  ).oid;
}

describe.skipIf(gitMissing)("gitAction_push and gitAction_pull (#679 slice 9)", () => {
  beforeAll(async () => {
    context = await openGitTestContext();
    setGitCapability(context, true);
    await initCommittedRepository(context.libraryRoot);
    server = await startGitHttpServer();
    remoteUrl = server.createBareRepository("library");
    bareDirectory = path.join(server.root, "library.git");
    expectOk(await gitAction(context, "gitAction_setRemote", { url: remoteUrl }));
  });

  afterAll(async () => {
    await server?.close();
  });

  it("refuses to pull a branch with no upstream", async () => {
    expectGitError(await gitAction(context, "gitAction_pull"), "noUpstream");
  });

  it("pushes main to an empty remote, and makes origin/main its upstream", async () => {
    const result = expectOk<GitRemoteResult>(await gitAction(context, "gitAction_push"));
    expect(remoteBranch("main")).toBe(await head());
    expect(await git.getConfig({ fs, dir: context.libraryRoot, path: "branch.main.remote" })).toBe("origin");
    expect(await git.getConfig({ fs, dir: context.libraryRoot, path: "branch.main.merge" })).toBe("refs/heads/main");
    expect(result.tracking).toEqual({ upstream: "origin/main", ahead: 0, behind: 0 });
  });

  it("pushes a local commit", async () => {
    const oid = await commitUbik(1981);
    const before = expectOk<{ tracking?: unknown }>(await gitAction(context, "gitAction_status"));
    expect(before.tracking).toEqual({ upstream: "origin/main", ahead: 1, behind: 0 });
    const result = expectOk<GitRemoteResult>(await gitAction(context, "gitAction_push"));
    expect(remoteBranch("main")).toBe(oid);
    expect(result.tracking).toEqual({ upstream: "origin/main", ahead: 0, behind: 0 });
  });

  it("says when the remote itself refuses the push, and pushes once it accepts", async () => {
    const hook = path.join(bareDirectory, "hooks", "pre-receive");
    fs.writeFileSync(hook, "#!/bin/sh\necho 'main is protected' >&2\nexit 1\n", { mode: 0o755 });
    const before = remoteBranch("main");
    const oid = await commitUbik(1982);
    try {
      const refused = expectGitError(await gitAction(context, "gitAction_push"), "pushRefused");
      expect(refused.errorMessage).toContain("refused the push");
      expect(remoteBranch("main")).toBe(before);
    } finally {
      fs.rmSync(hook);
    }
    expectOk<GitRemoteResult>(await gitAction(context, "gitAction_push"));
    expect(remoteBranch("main")).toBe(oid);
  });

  it("pushes to the URL it checked, not to a push URL of the configuration", async () => {
    await git.setConfig({ fs, dir: context.libraryRoot, path: "remote.origin.pushurl", value: "http://127.0.0.1:9/elsewhere.git" });
    try {
      const oid = await commitUbik(1983);
      expectOk<GitRemoteResult>(await gitAction(context, "gitAction_push"));
      expect(remoteBranch("main")).toBe(oid);
    } finally {
      await git.setConfig({ fs, dir: context.libraryRoot, path: "remote.origin.pushurl", value: undefined });
    }
  });

  it("pulls a Book added on the remote: the file is there and the local caches show it", async () => {
    const remoteCommit = commitOnRemote(
      bareDirectory,
      { [bookPath(REMOTE_BOOK)]: JSON.stringify({ ...ubik(), uuid: REMOTE_BOOK, name: "Valis" }, undefined, 2) },
      "Valis",
    );
    expect(cachedBooks(context.domainController)).not.toContain(REMOTE_BOOK);

    const result = expectOk<GitPullResult>(await gitAction(context, "gitAction_pull"));

    expect(result.upToDate).toBe(false);
    expect(result.touchedDeployments.map((touched) => touched.application)).toEqual([LIBRARY_APPLICATION]);
    expect(result.reloadFailures).toBeUndefined();
    expect(result.tracking).toEqual({ upstream: "origin/main", ahead: 0, behind: 0 });
    expect(await head()).toBe(remoteCommit);
    expect(fs.existsSync(path.join(context.libraryRoot, bookPath(REMOTE_BOOK)))).toBe(true);
    expect(cachedBooks(context.domainController)).toContain(REMOTE_BOOK);
    expect(cachedBooks(context.serverDomainController)).toContain(REMOTE_BOOK);
  });

  it("says when there is nothing to pull, and reloads nothing", async () => {
    const result = expectOk<GitPullResult>(await gitAction(context, "gitAction_pull"));
    expect(result.upToDate).toBe(true);
    expect(result.touchedDeployments).toEqual([]);
  });

  it("refuses to pull over an uncommitted change of a file the remote changed, keeping it", async () => {
    commitOnRemote(
      bareDirectory,
      { [bookPath(BOOK_UBIK)]: JSON.stringify({ ...ubik(), year: 1990 }, undefined, 2) },
      "Ubik, 1990",
    );
    const before = await head();
    editUbik(context, { year: 2000 });
    expectGitError(await gitAction(context, "gitAction_pull"), "checkoutConflict");
    expect(ubik().year).toBe(2000);
    expect(await head()).toBe(before);
    // staged, the change is refused before anything is fetched
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectGitError(await gitAction(context, "gitAction_pull"), "checkoutConflict");
    expectOk(await gitAction(context, "gitAction_unstage", { all: true }));
    await git.checkout({ fs, dir: context.libraryRoot, ref: "main", filepaths: [bookPath(BOOK_UBIK)], force: true });
    expectOk<GitPullResult>(await gitAction(context, "gitAction_pull"));
    expect(ubik().year).toBe(1990);
  });

  it("refuses while the local cache holds an uncommitted Miroir change", async () => {
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
              objects: [{ ...ubik(), uuid: "679a0009-0000-4000-8000-00000000000a", name: "Pending" } as EntityInstance],
            },
          },
        },
      },
      applicationDeploymentMap,
      libraryModelEnvironment,
    );
    expect(created instanceof Action2Error, JSON.stringify(created)).toBe(false);
    try {
      expectGitError(await gitAction(context, "gitAction_pull"), "openMiroirTransaction");
    } finally {
      const rollback = await context.domainController.handleAction(
        { actionType: "rollback", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", payload: { application: LIBRARY_APPLICATION } },
        applicationDeploymentMap,
        libraryModelEnvironment,
      );
      expect(rollback instanceof Action2Error, JSON.stringify(rollback)).toBe(false);
    }
  });

  it("refuses to pull or push once local and remote have diverged, changing nothing", async () => {
    const remoteCommit = commitOnRemote(
      bareDirectory,
      { [bookPath(REMOTE_BOOK)]: JSON.stringify({ ...ubik(), uuid: REMOTE_BOOK, name: "Valis, 2nd edition" }, undefined, 2) },
      "Valis, 2nd edition",
    );
    const localCommit = await commitUbik(1995);

    expectGitError(await gitAction(context, "gitAction_pull"), "notFastForward");
    expect(await head()).toBe(localCommit);
    expect(ubik().year).toBe(1995);
    const status = expectOk<{ tracking?: unknown }>(await gitAction(context, "gitAction_status"));
    expect(status.tracking).toEqual({ upstream: "origin/main", ahead: 1, behind: 1 });

    expectGitError(await gitAction(context, "gitAction_push"), "pushRejected");
    expect(remoteBranch("main")).toBe(remoteCommit);
  });

  it("pushes a new branch, which then follows its copy on the remote", async () => {
    expectOk(await gitAction(context, "gitAction_createBranch", { name: "feature" }));
    expectOk(await gitAction(context, "gitAction_checkout", { ref: "feature" }));
    const result = expectOk<GitRemoteResult>(await gitAction(context, "gitAction_push"));
    expect(remoteBranch("feature")).toBe(await head());
    expect(await git.getConfig({ fs, dir: context.libraryRoot, path: "branch.feature.remote" })).toBe("origin");
    expect(await git.getConfig({ fs, dir: context.libraryRoot, path: "branch.feature.merge" })).toBe("refs/heads/feature");
    expect(result.tracking).toEqual({ upstream: "origin/feature", ahead: 0, behind: 0 });
    expect(result.branches.remote).toContain("origin/feature");
  });

  it("refuses to pull or push a detached HEAD", async () => {
    expectOk(await gitAction(context, "gitAction_checkout", { ref: await head() }));
    expectGitError(await gitAction(context, "gitAction_pull"), "detachedHead");
    expectGitError(await gitAction(context, "gitAction_push"), "detachedHead");
    expectOk(await gitAction(context, "gitAction_checkout", { ref: "feature" }));
  });

  it("works with the remote the branch follows when the repository has no origin", async () => {
    // `git remote rename` also moves `branch.*.remote`: feature now follows upstream/feature
    gitCli(context.libraryRoot, "remote", "rename", "origin", "upstream");
    try {
      const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
      expect(status.remote).toBe("upstream");
      expect(status.remoteUrl).toBe(remoteUrl);
      expect(status.tracking?.upstream).toBe("upstream/feature");

      const remoteCommit = commitOnRemote(
        bareDirectory,
        { [bookPath(REMOTE_BOOK)]: JSON.stringify({ ...ubik(), uuid: REMOTE_BOOK, name: "Valis, 3rd edition" }, undefined, 2) },
        "Valis, 3rd edition",
        "feature",
      );
      const fetched = expectOk<GitRemoteResult>(await gitAction(context, "gitAction_fetch"));
      expect(fetched.remote).toBe("upstream");
      expect(fetched.tracking).toEqual({ upstream: "upstream/feature", ahead: 0, behind: 1 });
      expectOk(await gitAction(context, "gitAction_pull"));
      expect(await head()).toBe(remoteCommit);

      await commitUbik(1996);
      expectOk(await gitAction(context, "gitAction_push"));
      expect(remoteBranch("feature")).toBe(await head());
      expect(await git.getConfig({ fs, dir: context.libraryRoot, path: "remote.origin.url" })).toBeUndefined();
    } finally {
      gitCli(context.libraryRoot, "remote", "rename", "upstream", "origin");
    }
  });
});
