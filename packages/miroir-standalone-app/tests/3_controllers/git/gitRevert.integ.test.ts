/**
 * #691: `gitAction_revert` on the Library copy. A revert makes a work-tree file equal to the index
 * (rewritten, re-created, or deleted when the index has no entry), for the files of the application with
 * unstaged edits (D3, D9 of the #691 analysis).
 *
 * Not reachable through MiroirTest: each test puts a file in a given index and work-tree state first.
 * ```bash
 * npm run build -w @miroir-framework/git-isomorphic
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/git/gitRevert
 * ```
 */
import fs from "node:fs";
import path from "node:path";
import git from "isomorphic-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type GitStatusResult } from "@miroir-framework/core";

import {
  BOOK_UBIK,
  bookPath,
  expectOk,
  gitAction,
  initCommittedRepository,
  openGitTestContext,
  setGitCapability,
  TEST_AUTHOR,
  writeWorkTreeFile,
  type GitTestContext,
} from "./gitTestSetup.js";

let context: GitTestContext;
const created: string[] = [];

/** The text of a Book file: a copy of Ubik under another uuid and name. */
function bookText(uuid: string, name: string): string {
  const ubik = JSON.parse(fs.readFileSync(path.join(context.libraryRoot, bookPath(BOOK_UBIK)), "utf8"));
  return JSON.stringify({ ...ubik, uuid, name }, undefined, 2);
}

type Row = {
  /** `[head, workdir, stage]` of isomorphic-git's `statusMatrix`. */
  row: [number, number, number];
  change: "added" | "modified" | "deleted";
  staged: boolean;
  unstaged: boolean;
  /** Puts the file in the row's state, from no file at all. */
  build: (file: string, uuid: string) => Promise<void>;
};

const dir = () => context.libraryRoot;
const write = (file: string, uuid: string, name: string) => writeWorkTreeFile(context, file, bookText(uuid, name));
const add = (file: string) => git.add({ fs, dir: dir(), filepath: file });
const remove = (file: string) => git.remove({ fs, dir: dir(), filepath: file });
const unlink = (file: string) => fs.rmSync(path.join(dir(), file));
async function committed(file: string, uuid: string): Promise<void> {
  write(file, uuid, "committed");
  await add(file);
  await git.commit({ fs, dir: dir(), message: `add ${file}`, author: TEST_AUTHOR });
}

/** The rows of the D3 truth table of the #691 analysis. */
const ROWS: Row[] = [
  { row: [0, 2, 0], change: "added", staged: false, unstaged: true, build: async (f, u) => write(f, u, "new") },
  {
    row: [0, 2, 2], change: "added", staged: true, unstaged: false,
    build: async (f, u) => { write(f, u, "new"); await add(f); },
  },
  {
    row: [0, 2, 3], change: "added", staged: true, unstaged: true,
    build: async (f, u) => { write(f, u, "new"); await add(f); write(f, u, "new, edited"); },
  },
  {
    row: [0, 0, 3], change: "added", staged: true, unstaged: true,
    build: async (f, u) => { write(f, u, "new"); await add(f); unlink(f); },
  },
  {
    row: [1, 2, 1], change: "modified", staged: false, unstaged: true,
    build: async (f, u) => { await committed(f, u); write(f, u, "edited"); },
  },
  {
    row: [1, 2, 2], change: "modified", staged: true, unstaged: false,
    build: async (f, u) => { await committed(f, u); write(f, u, "edited"); await add(f); },
  },
  {
    row: [1, 2, 3], change: "modified", staged: true, unstaged: true,
    build: async (f, u) => { await committed(f, u); write(f, u, "edited"); await add(f); write(f, u, "edited again"); },
  },
  {
    row: [1, 1, 3], change: "modified", staged: true, unstaged: true,
    build: async (f, u) => { await committed(f, u); write(f, u, "edited"); await add(f); write(f, u, "committed"); },
  },
  {
    row: [1, 0, 1], change: "deleted", staged: false, unstaged: true,
    build: async (f, u) => { await committed(f, u); unlink(f); },
  },
  {
    row: [1, 0, 0], change: "deleted", staged: true, unstaged: false,
    build: async (f, u) => { await committed(f, u); unlink(f); await remove(f); },
  },
  {
    row: [1, 0, 3], change: "deleted", staged: true, unstaged: true,
    build: async (f, u) => { await committed(f, u); write(f, u, "edited"); await add(f); unlink(f); },
  },
  {
    row: [1, 1, 0], change: "deleted", staged: true, unstaged: true,
    build: async (f, u) => { await committed(f, u); await remove(f); },
  },
  {
    row: [1, 2, 0], change: "deleted", staged: true, unstaged: true,
    build: async (f, u) => { await committed(f, u); await remove(f); write(f, u, "edited"); },
  },
];

/** A Book file of its own for each row, so that the rows do not meet. */
function rowFile(row: [number, number, number]): { file: string; uuid: string } {
  const uuid = `691a0000-0000-4000-8000-0000000${row.join("")}00`.slice(0, 36);
  return { file: bookPath(uuid), uuid };
}

beforeAll(async () => {
  context = await openGitTestContext();
  setGitCapability(context, true);
  await initCommittedRepository(context.libraryRoot);
});

afterAll(() => {
  for (const file of created) {
    fs.rmSync(path.join(context.libraryRoot, file), { force: true });
  }
});

describe("the status of each row a revert reads (#691 slice 0)", () => {
  it.each(ROWS)("row $row reads $change, staged $staged, unstaged $unstaged", async (row) => {
    const { file, uuid } = rowFile(row.row);
    created.push(file);
    await row.build(file, uuid);
    const matrix = await git.statusMatrix({ fs, dir: dir(), filepaths: [file] });
    expect(matrix.map(([, head, workdir, stage]) => [head, workdir, stage]), "the row is built").toEqual([row.row]);

    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    const listed = status.files.find((candidate) => candidate.path === file);
    expect(listed, JSON.stringify(status.files.map((candidate) => candidate.path))).toMatchObject({
      change: row.change,
      staged: row.staged,
      unstaged: row.unstaged,
      inApplication: true,
    });
  });
});
