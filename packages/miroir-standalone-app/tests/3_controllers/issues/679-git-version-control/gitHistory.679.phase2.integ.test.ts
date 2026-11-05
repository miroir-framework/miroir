/**
 * #679 slice 2: `gitAction_log`, `gitAction_commitFiles` and `gitAction_diff` on the Library copy, and
 * `gitAction_init` / the `notARepository` refusal (slice 4).
 *
 * Not reachable through MiroirTest: the test builds a commit history on disk first.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitHistory.679.phase2
 * ```
 */
import fs from "node:fs";
import path from "node:path";
import git from "isomorphic-git";
import { beforeAll, describe, expect, it } from "vitest";

import type {
  GitCommitFilesResult,
  GitDiffResult,
  GitInitResult,
  GitLogResult,
  GitStatusResult,
} from "@miroir-framework/core";

import {
  BOOK_ENTITY,
  BOOK_UBIK,
  expectGitError,
  expectOk,
  gitAction,
  initCommittedRepository,
  openGitTestContext,
  setGitCapability,
  TEST_AUTHOR,
  type GitTestContext,
} from "./gitTestSetup.js";

let context: GitTestContext;
let initialCommit: string;
let secondCommit: string;
let ubikFile: string;
const ubikPath = `data/${BOOK_ENTITY}/${BOOK_UBIK}.json`;

function readUbik(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(ubikFile, "utf8"));
}

beforeAll(async () => {
  context = await openGitTestContext();
  setGitCapability(context, true);
  initialCommit = await initCommittedRepository(context.libraryRoot);
  await git.branch({ fs, dir: context.libraryRoot, ref: "feature" });
  await git.tag({ fs, dir: context.libraryRoot, ref: "v1" });
  ubikFile = path.join(context.sectionDirectory("data"), BOOK_ENTITY, `${BOOK_UBIK}.json`);
  fs.writeFileSync(ubikFile, JSON.stringify({ ...readUbik(), year: 1970 }, undefined, 2));
  await git.add({ fs, dir: context.libraryRoot, filepath: ubikPath });
  secondCommit = await git.commit({
    fs,
    dir: context.libraryRoot,
    message: "Ubik: year 1970",
    author: TEST_AUTHOR,
  });
  // an uncommitted change on top
  fs.writeFileSync(ubikFile, JSON.stringify({ ...readUbik(), year: 1971 }, undefined, 2));
});

describe("gitAction_log (#679 slice 2)", () => {
  it("lists the commits newest first, with their refs", async () => {
    const log = expectOk<GitLogResult>(await gitAction(context, "gitAction_log"));
    expect(log.commits.map((commit) => commit.oid)).toEqual([secondCommit, initialCommit]);
    expect(log.commits[0]).toMatchObject({
      message: "Ubik: year 1970\n",
      parents: [initialCommit],
      author: { name: TEST_AUTHOR.name, email: TEST_AUTHOR.email },
    });
    expect(log.commits[0].refs.sort()).toEqual(["HEAD", "main"]);
    expect(log.commits[1].refs.sort()).toEqual(["feature", "tag: v1"]);
    expect(log.branches).toMatchObject({ current: "main", head: secondCommit, tags: ["v1"] });
    expect(log.branches.local.sort()).toEqual(["feature", "main"]);
  });

  it("follows another ref and stops at the depth", async () => {
    const fromFeature = expectOk<GitLogResult>(await gitAction(context, "gitAction_log", { ref: "feature" }));
    expect(fromFeature.commits.map((commit) => commit.oid)).toEqual([initialCommit]);
    const shallow = expectOk<GitLogResult>(await gitAction(context, "gitAction_log", { depth: 1 }));
    expect(shallow.commits.map((commit) => commit.oid)).toEqual([secondCommit]);
  });
});

describe("gitAction_commitFiles (#679 slice 2)", () => {
  it("lists the files a commit changed, named by Entity and instance", async () => {
    const files = expectOk<GitCommitFilesResult>(
      await gitAction(context, "gitAction_commitFiles", { oid: secondCommit }),
    );
    expect(files.files).toEqual([
      {
        path: ubikPath,
        section: "data",
        entityUuid: BOOK_ENTITY,
        instanceKey: BOOK_UBIK,
        instanceName: "Ubik",
        inApplication: true,
      },
    ]);
  });

  it("lists every file of a root commit", async () => {
    const files = expectOk<GitCommitFilesResult>(
      await gitAction(context, "gitAction_commitFiles", { oid: initialCommit }),
    );
    const tracked = await git.listFiles({ fs, dir: context.libraryRoot, ref: initialCommit });
    expect(files.files.map((file) => file.path).sort()).toEqual(tracked.sort());
  });
});

describe("gitAction_diff (#679 slice 2)", () => {
  it("compares HEAD with the work tree by default", async () => {
    const diff = expectOk<GitDiffResult>(await gitAction(context, "gitAction_diff", { path: ubikPath }));
    expect(JSON.parse(diff.before!).year).toBe(1970);
    expect(JSON.parse(diff.after!).year).toBe(1971);
    expect(diff).toMatchObject({ entityUuid: BOOK_ENTITY, instanceKey: BOOK_UBIK, instanceName: "Ubik" });
  });

  it("compares two commits", async () => {
    const diff = expectOk<GitDiffResult>(
      await gitAction(context, "gitAction_diff", { path: ubikPath, from: initialCommit, to: secondCommit }),
    );
    expect(JSON.parse(diff.before!).year).not.toBe(1970);
    expect(JSON.parse(diff.after!).year).toBe(1970);
  });

  it("has no after text for a file deleted from the work tree", async () => {
    const saved = fs.readFileSync(ubikFile, "utf8");
    fs.rmSync(ubikFile);
    try {
      const diff = expectOk<GitDiffResult>(await gitAction(context, "gitAction_diff", { path: ubikPath }));
      expect(diff.before).toBeDefined();
      expect(diff.after).toBeUndefined();
    } finally {
      fs.writeFileSync(ubikFile, saved);
    }
  });
});

describe("gitAction_diff paths (#679 review)", () => {
  it.each([
    ["a path above the repository", "../../../../../../../etc/hostname"],
    ["an absolute path", "/etc/hostname"],
    ["a path through ..", `data/${BOOK_ENTITY}/../../model/x.json`],
    ["the repository's own files", ".git/config"],
    ["a file outside the sections", "NOTES.md"],
    ["a backslash path", `data\\${BOOK_ENTITY}\\${BOOK_UBIK}.json`],
  ])("refuses %s", async (_label, filepath) => {
    expectGitError(await gitAction(context, "gitAction_diff", { path: filepath }), "pathOutsideApplication");
  });

  it("refuses an unknown revision instead of showing the file as added", async () => {
    expectGitError(
      await gitAction(context, "gitAction_diff", { path: ubikPath, from: "0123456789abcdef0123456789abcdef01234567" }),
      "gitFailure",
    );
  });
});

describe("gitAction_init and repository errors (#679 slice 4)", () => {
  it("refuses an action outside a repository, naming the folder to initialize", async () => {
    fs.rmSync(path.join(context.libraryRoot, ".git"), { recursive: true, force: true });
    const error = expectGitError(await gitAction(context, "gitAction_status"), "notARepository");
    expect(fs.realpathSync(String(error.errorContext?.directory))).toBe(fs.realpathSync(context.libraryRoot));
  });

  it("refuses an unknown application", async () => {
    expectGitError(
      await gitAction(context, "gitAction_status", { application: "00000000-0000-4000-8000-000000000679" }),
      "unknownDeployment",
    );
  });

  it("creates a repository around the application's sections, then lists every file as added", async () => {
    const init = expectOk<GitInitResult>(await gitAction(context, "gitAction_init"));
    expect(fs.realpathSync(init.root)).toBe(fs.realpathSync(context.libraryRoot));
    expect(init.sectionPaths).toMatchObject({ model: "model", data: "data" });
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.files.length).toBeGreaterThan(0);
    expect(status.files.every((file) => file.change === "added" && file.inApplication)).toBe(true);
    const log = expectOk<GitLogResult>(await gitAction(context, "gitAction_log"));
    expect(log.commits).toEqual([]);
    expect(log.branches.head).toBeUndefined();
  });

  it("keeps an existing repository on a second init", async () => {
    const commit = await initCommittedRepository(context.libraryRoot);
    expectOk<GitInitResult>(await gitAction(context, "gitAction_init"));
    const log = expectOk<GitLogResult>(await gitAction(context, "gitAction_log"));
    expect(log.commits.map((entry) => entry.oid)).toEqual([commit]);
  });
});
