/**
 * #679 slice 7: `gitAction_setRemote` and `gitAction_fetch` on the Library copy, against a Git remote served
 * over HTTP by this test process (D22), with the branch's ahead / behind counts; a remote that is not
 * `http(s)` is refused (D21).
 *
 * Not reachable through MiroirTest: the test starts a Git server and commits on the remote first.
 * Skipped when the `git` program, which the test server runs, is not on the PATH.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitFetch.679.phase7
 * ```
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import git from "isomorphic-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { GitCommitResult, GitRemoteResult, GitStatusResult } from "@miroir-framework/core";
import { createGitRepositoryFactory } from "@miroir-framework/git-isomorphic";

import { commitOnRemote, gitCli, gitProgramMissing, startGitHttpServer, type GitHttpServer } from "./gitHttpServer.js";
import {
  BOOK_UBIK,
  bookPath,
  editUbik,
  expectGitError,
  expectOk,
  gitAction,
  initCommittedRepository,
  openGitTestContext,
  setGitCapability,
  TEST_AUTHOR,
  type GitTestContext,
} from "./gitTestSetup.js";

const gitMissing = gitProgramMissing();
if (gitMissing) {
  console.warn(`gitFetch.679.phase7 skipped: ${gitMissing}`);
}

let context: GitTestContext;
let server: GitHttpServer;
let remoteUrl: string;
let bareDirectory: string;

describe.skipIf(gitMissing)("gitAction_setRemote and gitAction_fetch (#679 slice 7)", () => {
  beforeAll(async () => {
    context = await openGitTestContext();
    setGitCapability(context, true);
    await initCommittedRepository(context.libraryRoot);
    server = await startGitHttpServer();
    remoteUrl = server.createBareRepository("library");
    bareDirectory = path.join(server.root, "library.git");
  });

  afterAll(async () => {
    await server?.close();
  });

  it("reports no remote before one is set", async () => {
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.remoteUrl).toBeUndefined();
    expect(status.tracking).toBeUndefined();
    expectGitError(await gitAction(context, "gitAction_fetch"), "noRemote");
  });

  it("refuses an SSH remote, and a URL holding a token", async () => {
    expectGitError(
      await gitAction(context, "gitAction_setRemote", { url: "git@github.com:owner/repo.git" }),
      "unsupportedRemoteProtocol",
    );
    expectGitError(
      await gitAction(context, "gitAction_setRemote", { url: "ssh://git@github.com/owner/repo.git" }),
      "unsupportedRemoteProtocol",
    );
    expectGitError(
      await gitAction(context, "gitAction_setRemote", { url: remoteUrl.replace("http://", "http://user:token@") }),
      "invalidPayload",
    );
    expect(await git.listRemotes({ fs, dir: context.libraryRoot })).toEqual([]);
  });

  it("sets the remote's URL, which the status then shows", async () => {
    const result = expectOk<GitRemoteResult>(await gitAction(context, "gitAction_setRemote", { url: remoteUrl }));
    expect(result).toMatchObject({ remote: "origin", url: remoteUrl });
    expect(await git.getConfig({ fs, dir: context.libraryRoot, path: "remote.origin.url" })).toBe(remoteUrl);
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.remoteUrl).toBe(remoteUrl);
  });

  it("fetches a commit pushed by another machine: the branch is one commit behind", async () => {
    // the deployment's branch is on the remote and follows it, as after a first push
    gitCli(context.libraryRoot, "push", "--quiet", bareDirectory, "main");
    await git.setConfig({ fs, dir: context.libraryRoot, path: "branch.main.remote", value: "origin" });
    await git.setConfig({ fs, dir: context.libraryRoot, path: "branch.main.merge", value: "refs/heads/main" });
    const remoteCommit = commitOnRemote(
      bareDirectory,
      { [bookPath(BOOK_UBIK)]: JSON.stringify({ ...ubik(), year: 1971 }, undefined, 2) },
      "Ubik, 1971",
    );
    const requestsBefore = server.requests.length;

    const result = expectOk<GitRemoteResult>(await gitAction(context, "gitAction_fetch"));

    expect(server.requests.slice(requestsBefore).map((request) => request.status)).toContain(200);
    expect(result.branches.remote).toContain("origin/main");
    expect(result.tracking).toEqual({ upstream: "origin/main", ahead: 0, behind: 1 });
    expect(await git.resolveRef({ fs, dir: context.libraryRoot, ref: "refs/remotes/origin/main" })).toBe(remoteCommit);
    // a fetch changes no work tree file
    expect(ubik().year).not.toBe(1971);
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.tracking).toEqual({ upstream: "origin/main", ahead: 0, behind: 1 });
  });

  it("counts a local commit as ahead once the branches have diverged", async () => {
    editUbik(context, { year: 1980 });
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    expectOk<GitCommitResult>(await gitAction(context, "gitAction_commit", { message: "Ubik, 1980", author: TEST_AUTHOR }));
    const result = expectOk<GitRemoteResult>(await gitAction(context, "gitAction_fetch"));
    expect(result.tracking).toEqual({ upstream: "origin/main", ahead: 1, behind: 1 });
  });

  it("never returns a token written in the remote's URL, which still serves the fetch", async () => {
    const withToken = remoteUrl.replace("http://", "http://someone:url-token-679@");
    await git.setConfig({ fs, dir: context.libraryRoot, path: "remote.origin.url", value: withToken });
    try {
      const fetched = expectOk<GitRemoteResult>(await gitAction(context, "gitAction_fetch"));
      const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
      expect(fetched.url).toBe(remoteUrl);
      expect(status.remoteUrl).toBe(remoteUrl);
      expect(JSON.stringify([fetched, status])).not.toContain("url-token-679");
    } finally {
      await git.setConfig({ fs, dir: context.libraryRoot, path: "remote.origin.url", value: remoteUrl });
    }
  });

  it("fetches from the URL it checked, whatever proxy the configuration names", async () => {
    await git.setConfig({ fs, dir: context.libraryRoot, path: "http.corsProxy", value: "http://127.0.0.1:9" });
    try {
      const requestsBefore = server.requests.length;
      expectOk<GitRemoteResult>(await gitAction(context, "gitAction_fetch"));
      expect(server.requests.length).toBeGreaterThan(requestsBefore);
    } finally {
      await git.setConfig({ fs, dir: context.libraryRoot, path: "http.corsProxy", value: undefined });
    }
  });

  it("counts shared commits as shared when they have the same timestamp", async () => {
    // on a repository of its own: ten shared commits, then one on each side, all in the same second, and
    // again with the local commit an hour earlier (another machine's clock)
    for (const localOffset of [0, -3600]) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "miroir-git679-ab-"));
      try {
        await git.init({ fs, dir, defaultBranch: "main" });
        const when = (offset: number) => ({ ...TEST_AUTHOR, timestamp: 1_700_000_000 + offset, timezoneOffset: 0 });
        let count = 0;
        const commit = async (parent: string[], offset = 0) => {
          fs.writeFileSync(path.join(dir, "f.txt"), String(count++));
          await git.add({ fs, dir, filepath: "f.txt" });
          return git.commit({ fs, dir, message: `c${count}`, author: when(offset), committer: when(offset), parent, ref: "refs/heads/scratch" });
        };
        let shared = await commit([]);
        for (let index = 0; index < 10; index++) {
          shared = await commit([shared]);
        }
        await git.writeRef({ fs, dir, ref: "refs/heads/main", value: await commit([shared], localOffset), force: true });
        await git.writeRef({ fs, dir, ref: "refs/remotes/origin/main", value: await commit([shared]), force: true });
        const repository = await createGitRepositoryFactory().open(dir);
        expect(await repository.aheadBehind("main", "origin/main"), `local offset ${localOffset}`).toEqual({
          ahead: 1,
          behind: 1,
        });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it("refuses to fetch from an SSH origin, and still shows the status", async () => {
    await git.setConfig({ fs, dir: context.libraryRoot, path: "remote.origin.url", value: "git@github.com:owner/repo.git" });
    try {
      expectGitError(await gitAction(context, "gitAction_fetch"), "unsupportedRemoteProtocol");
      const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
      expect(status.remoteUrl).toBe("git@github.com:owner/repo.git");
      expect(status.branches.current).toBe("main");
    } finally {
      await git.setConfig({ fs, dir: context.libraryRoot, path: "remote.origin.url", value: remoteUrl });
    }
  });

  it("says when the remote cannot be reached", async () => {
    const missing = `${server.baseUrl}/missing.git`;
    expectOk(await gitAction(context, "gitAction_setRemote", { url: missing, remote: "elsewhere" }));
    expectGitError(await gitAction(context, "gitAction_fetch", { remote: "elsewhere" }), "remoteUnreachable");
    expectOk(await gitAction(context, "gitAction_setRemote", { url: "http://127.0.0.1:9/library.git", remote: "elsewhere" }));
    expectGitError(await gitAction(context, "gitAction_fetch", { remote: "elsewhere" }), "remoteUnreachable");
  });
});

function ubik(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(context.libraryRoot, bookPath(BOOK_UBIK)), "utf8"));
}
