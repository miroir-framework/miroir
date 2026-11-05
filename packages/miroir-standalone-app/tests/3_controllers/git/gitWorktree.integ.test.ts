/**
 * #689: the Git actions on a deployment inside a linked worktree (`git worktree add`), whose `.git` is a
 * file naming a gitdir that holds only the worktree's HEAD and index: the branches, objects and
 * configuration are in the common directory that gitdir's `commondir` names.
 *
 * Not reachable through MiroirTest: the test lays out the worktree on disk first, with isomorphic-git
 * (no Git binary), as `git worktree add` does.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitWorktree
 * ```
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import git from "isomorphic-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { GitCommitResult, GitLogResult, GitStatusResult } from "@miroir-framework/core";

import {
  bookPath,
  BOOK_UBIK,
  editUbik,
  expectOk,
  gitAction,
  initCommittedRepository,
  openGitTestContext,
  setGitCapability,
  TEST_AUTHOR,
  type GitTestContext,
} from "./gitTestSetup.js";

const REMOTE_URL = "https://example.com/miroir/library.git";
const SCRIPT = "run.sh";

let context: GitTestContext;
let mainCheckout: string;
let commonDirectory: string;
let worktreeGitdir: string;
let initialCommit: string;

/** The mode the worktree's index records for a path. */
async function indexMode(filepath: string): Promise<number | undefined> {
  const [mode] = await git.walk({
    fs,
    dir: context.libraryRoot,
    gitdir: worktreeGitdir,
    trees: [git.STAGE()],
    map: async (entryPath, [entry]) => (entryPath === filepath ? entry?.mode() : undefined),
  });
  return mode as number | undefined;
}

beforeAll(async () => {
  context = await openGitTestContext();
  setGitCapability(context, true);
  const root = context.libraryRoot;
  await initCommittedRepository(root);
  await git.setConfig({ fs, dir: root, path: "core.filemode", value: false });
  await git.addRemote({ fs, dir: root, remote: "origin", url: REMOTE_URL });
  // an executable file, as a Windows work tree (core.filemode false) cannot tell from its stat
  fs.writeFileSync(path.join(root, SCRIPT), "echo library\n");
  const blob = await git.writeBlob({ fs, dir: root, blob: fs.readFileSync(path.join(root, SCRIPT)) });
  await git.updateIndex({ fs, dir: root, filepath: SCRIPT, oid: blob, mode: 0o100755, add: true });
  initialCommit = await git.commit({ fs, dir: root, message: "executable script", author: TEST_AUTHOR });

  // what `git worktree add <root> main` leaves: the repository in the main checkout, the worktree's HEAD and
  // index in .git/worktrees/library, and a .git file in the worktree pointing there
  mainCheckout = fs.mkdtempSync(path.join(os.tmpdir(), "miroir-689-"));
  commonDirectory = path.join(mainCheckout, ".git");
  fs.cpSync(path.join(root, ".git"), commonDirectory, { recursive: true });
  fs.rmSync(path.join(root, ".git"), { recursive: true, force: true });
  worktreeGitdir = path.join(commonDirectory, "worktrees", "library");
  fs.mkdirSync(worktreeGitdir, { recursive: true });
  fs.renameSync(path.join(commonDirectory, "index"), path.join(worktreeGitdir, "index"));
  fs.writeFileSync(path.join(worktreeGitdir, "HEAD"), "ref: refs/heads/main\n");
  fs.writeFileSync(path.join(worktreeGitdir, "commondir"), "../..\n");
  fs.writeFileSync(path.join(worktreeGitdir, "gitdir"), `${path.join(root, ".git").split(path.sep).join("/")}\n`);
  // main is checked out in the worktree: the main checkout is left on a detached HEAD
  fs.writeFileSync(path.join(commonDirectory, "HEAD"), `${initialCommit}\n`);
  fs.writeFileSync(path.join(root, ".git"), `gitdir: ${worktreeGitdir.split(path.sep).join("/")}\n`);

  // the script's stat no longer matches the index, which isomorphic-git would refresh on a status
  const later = Math.floor(Date.now() / 1000) + 5;
  fs.utimesSync(path.join(root, SCRIPT), later, later);
  editUbik(context, { year: 1970 });
});

afterAll(() => {
  fs.rmSync(mainCheckout, { recursive: true, force: true });
  // the next test file starts from the sections alone
  fs.rmSync(path.join(context.libraryRoot, ".git"), { force: true });
});

describe("Git actions in a linked worktree (#689)", () => {
  it("reads the branch, the remote and the changes from the common directory", async () => {
    const status = expectOk<GitStatusResult>(
      await gitAction(context, "gitAction_status", { includeOtherChanges: true }),
    );
    expect(fs.realpathSync(status.root)).toBe(fs.realpathSync(context.libraryRoot));
    expect(status.branches.current).toBe("main");
    expect(status.branches.head).toBe(initialCommit);
    expect(status.remoteUrl).toBe(REMOTE_URL);
    expect(status.files).toEqual([
      expect.objectContaining({ path: bookPath(BOOK_UBIK), change: "modified", staged: false, unstaged: true }),
    ]);
  });

  it("leaves the index alone while reading the status", async () => {
    expect(await indexMode(SCRIPT)).toBe(0o100755);
  });

  it("lists the history of the branch", async () => {
    const log = expectOk<GitLogResult>(await gitAction(context, "gitAction_log"));
    expect(log.commits.map((commit) => commit.message.trim())).toEqual(["executable script", "initial"]);
    expect(log.commits[0].refs.sort()).toEqual(["HEAD", "main"]);
  });

  it("commits on the shared branch, with the objects in the common directory", async () => {
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    const commit = expectOk<GitCommitResult>(
      await gitAction(context, "gitAction_commit", { message: "Ubik: 1970", author: TEST_AUTHOR }),
    );
    expect(commit.files).toEqual([bookPath(BOOK_UBIK)]);
    expect(await git.resolveRef({ fs, gitdir: commonDirectory, ref: "refs/heads/main" })).toBe(commit.oid);
    // the worktree's own gitdir gained no branch and no object
    expect(fs.existsSync(path.join(worktreeGitdir, "refs", "heads", "main"))).toBe(false);
    expect(fs.existsSync(path.join(worktreeGitdir, "objects"))).toBe(false);
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.files).toEqual([]);
    expect(status.branches.head).toBe(commit.oid);
  });
});
