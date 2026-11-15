/**
 * #708 part D: `gitAction_tag` on the Library copy: an annotated tag named after the version, at `HEAD` or
 * at a commit, and its refusals.
 *
 * Not reachable through MiroirTest: the test builds the repository on disk first.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitTag
 * ```
 */
import fs from "node:fs";
import git from "isomorphic-git";
import { beforeAll, describe, expect, it } from "vitest";

import type { GitLogResult, GitTagResult } from "@miroir-framework/core";

import {
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

let context: GitTestContext;
let firstCommit: string;
let secondCommit: string;

/** The refs `gitAction_log` shows on each commit, by commit. */
async function refsByCommit(): Promise<Record<string, string[]>> {
  const log = expectOk<GitLogResult>(await gitAction(context, "gitAction_log"));
  return Object.fromEntries(log.commits.map((commit) => [commit.oid, [...commit.refs].sort()]));
}

beforeAll(async () => {
  context = await openGitTestContext();
  setGitCapability(context, true);
  firstCommit = await initCommittedRepository(context.libraryRoot);
  editUbik(context, { year: 1971 });
  expectOk(await gitAction(context, "gitAction_stage", { all: true }));
  secondCommit = expectOk<{ oid: string }>(
    await gitAction(context, "gitAction_commit", { message: "#708 D1: second commit", author: TEST_AUTHOR }),
  ).oid;
});

describe("gitAction_tag (#708 part D)", () => {
  it("D1: tags HEAD with an annotated tag named after the version", async () => {
    const tag = expectOk<GitTagResult>(
      await gitAction(context, "gitAction_tag", { name: "1.0.0", message: "first release", author: TEST_AUTHOR }),
    );

    const oid = await git.resolveRef({ fs, dir: context.libraryRoot, ref: "refs/tags/1.0.0" });
    const annotated = await git.readTag({ fs, dir: context.libraryRoot, oid });
    expect({
      result: { name: tag.name, commit: tag.commit },
      annotated: { object: annotated.tag.object, message: annotated.tag.message.trim(), tagger: annotated.tag.tagger.name },
      refs: (await refsByCommit())[secondCommit],
    }).toEqual({
      result: { name: "1.0.0", commit: secondCommit },
      annotated: { object: secondCommit, message: "first release", tagger: TEST_AUTHOR.name },
      refs: ["HEAD", "main", "tag: 1.0.0"],
    });
  });

  it("D1: tags the commit `ref` names", async () => {
    expectOk(await gitAction(context, "gitAction_tag", { name: "0.9.0", ref: firstCommit, author: TEST_AUTHOR }));

    expect((await refsByCommit())[firstCommit]).toEqual(["tag: 0.9.0"]);
  });

  it("D1: refuses a name that exists, an empty or invalid name, a branch's name, and a ref that names no commit", async () => {
    expectGitError(await gitAction(context, "gitAction_tag", { name: "1.0.0", author: TEST_AUTHOR }), "tagExists");
    expectGitError(await gitAction(context, "gitAction_tag", { name: "  ", author: TEST_AUTHOR }), "invalidPayload");
    expectGitError(await gitAction(context, "gitAction_tag", { name: "1.0..1", author: TEST_AUTHOR }), "invalidPayload");
    expectGitError(await gitAction(context, "gitAction_tag", { name: "main", author: TEST_AUTHOR }), "invalidPayload");
    expectGitError(
      await gitAction(context, "gitAction_tag", { name: "2.0.0", ref: "no-such-branch", author: TEST_AUTHOR }),
      "unknownRevision",
    );
  });
});
