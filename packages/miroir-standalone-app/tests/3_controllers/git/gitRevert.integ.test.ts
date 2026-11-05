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

import {
  Action2Error,
  type EndpointDefinition,
  type EntityInstance,
  type GitRevertOutcome,
  type GitRevertResult,
  type GitStatusResult,
} from "@miroir-framework/core";
import { defaultMiroirMetaModel } from "@miroir-framework/core/meta-model";
import { endpointDocument, getDefaultLibraryModelEnvironmentDEFUNCT } from "miroir-example-library";

import {
  applicationDeploymentMap,
  BOOK_UBIK,
  bookPath,
  expectGitError,
  expectOk,
  gitAction,
  initCommittedRepository,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  openGitTestContext,
  setGitCapability,
  TEST_AUTHOR,
  writeWorkTreeFile,
  type GitTestContext,
} from "./gitTestSetup.js";

let context: GitTestContext;
const UNSAVED_BOOK = "691a0006-0000-4000-8000-0000000000b1";
const libraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  LIBRARY_DEPLOYMENT,
);
const createdFiles: string[] = [];

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

/** A Book file of its own for each row and each test group (`group`, one hex digit), so that they do not meet. */
function rowFile(row: [number, number, number], group = "0"): { file: string; uuid: string } {
  const uuid = `691a000${group}-0000-4000-8000-0000000${row.join("")}00`;
  createdFiles.push(bookPath(uuid));
  return { file: bookPath(uuid), uuid };
}

/** What a revert does to the file of a row (D11): the index decides. */
function expectedOutcome([, workdir, stage]: [number, number, number]): GitRevertOutcome {
  return stage === 0 ? "deleted" : workdir === 0 ? "recreated" : "rewritten";
}

/** The oid of a path's index entry, undefined when the index has none. */
async function indexOid(file: string): Promise<string | undefined> {
  const oids = await git.walk({
    fs,
    dir: dir(),
    trees: [git.STAGE()],
    map: async (filepath, [entry]) => {
      if (filepath !== "." && !file.startsWith(filepath)) {
        return null;
      }
      return filepath === file ? entry?.oid() : undefined;
    },
  });
  return (oids as (string | undefined)[]).find((oid) => typeof oid === "string");
}

async function blobText(oid: string): Promise<string> {
  const { blob } = await git.readBlob({ fs, dir: dir(), oid });
  return Buffer.from(blob).toString("utf8");
}

const read = (file: string) =>
  fs.existsSync(path.join(dir(), file)) ? fs.readFileSync(path.join(dir(), file), "utf8") : undefined;

beforeAll(async () => {
  context = await openGitTestContext();
  setGitCapability(context, true);
  await initCommittedRepository(context.libraryRoot);
});

afterAll(() => {
  for (const file of createdFiles) {
    fs.rmSync(path.join(context.libraryRoot, file), { force: true });
  }
});

describe("the status of each row a revert reads (#691 slice 0)", () => {
  it.each(ROWS)("row $row reads $change, staged $staged, unstaged $unstaged", async (row) => {
    const { file, uuid } = rowFile(row.row);
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

const OFFERED = ROWS.filter((row) => row.unstaged);

describe("gitAction_revert (#691 slice 7)", () => {
  beforeAll(async () => {
    // the rows of slice 0 committed as they are: every file starts unchanged
    await initCommittedRepository(context.libraryRoot);
  });

  it.each(ROWS)("status gives row $row the revert outcome of the index", async (row) => {
    const { file, uuid } = rowFile(row.row, "1");
    await row.build(file, uuid);
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    const listed = status.files.find((candidate) => candidate.path === file);
    expect(listed?.revertOutcome).toBe(row.unstaged ? expectedOutcome(row.row) : undefined);
  });

  it.each(OFFERED)("makes the file of row $row equal to the index, which it leaves as it is", async (row) => {
    const { file, uuid } = rowFile(row.row, "2");
    await row.build(file, uuid);
    const oidBefore = await indexOid(file);
    const result = expectOk<GitRevertResult>(await gitAction(context, "gitAction_revert", { paths: [file] }));
    expect(result.files).toEqual([{ path: file, outcome: expectedOutcome(row.row) }]);
    expect(await indexOid(file), "the index is unchanged").toBe(oidBefore);
    expect(read(file)).toBe(oidBefore ? await blobText(oidBefore) : undefined);
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.files.find((candidate) => candidate.path === file)?.unstaged ?? false).toBe(false);
  });

  it("reverts every unstaged file of the sections, and only those", async () => {
    await initCommittedRepository(context.libraryRoot);
    const first = rowFile([1, 2, 1], "3");
    const second = rowFile([1, 0, 1], "4");
    await ROWS.find((row) => row.row.join() === "1,2,1")!.build(first.file, first.uuid);
    await ROWS.find((row) => row.row.join() === "1,0,1")!.build(second.file, second.uuid);
    fs.writeFileSync(path.join(dir(), "NOTES.md"), "outside the sections\n");
    const result = expectOk<GitRevertResult>(await gitAction(context, "gitAction_revert", { all: true }));
    expect(result.files.map((file) => file.path).sort()).toEqual([first.file, second.file].sort());
    expect(read("NOTES.md")).toBe("outside the sections\n");
    expect(result.touchedDeployments).toEqual([{ application: LIBRARY_APPLICATION, deploymentUuid: LIBRARY_DEPLOYMENT }]);
  });

  it("skips a fully staged file, and refuses when nothing is left", async () => {
    const staged = rowFile([1, 2, 2], "5");
    const edited = rowFile([1, 2, 1], "5");
    // the edited one first: building a row commits the index, which would take the staged edit with it
    await ROWS.find((row) => row.row.join() === "1,2,1")!.build(edited.file, edited.uuid);
    await ROWS.find((row) => row.row.join() === "1,2,2")!.build(staged.file, staged.uuid);
    expectGitError(await gitAction(context, "gitAction_revert", { paths: [staged.file] }), "nothingToRevert");
    const result = expectOk<GitRevertResult>(
      await gitAction(context, "gitAction_revert", { paths: [staged.file, edited.file] }),
    );
    expect(result.files.map((file) => file.path)).toEqual([edited.file]);
  });

  it("refuses a path outside the application, writing nothing", async () => {
    for (const refused of ["../outside.json", "/etc/hostname", ".git/config", "NOTES.md"]) {
      expectGitError(await gitAction(context, "gitAction_revert", { paths: [refused] }), "pathOutsideApplication");
    }
    expect(read("NOTES.md")).toBe("outside the sections\n");
  });

  it("is refused while Miroir has unsaved changes", async () => {
    const edited = rowFile([1, 2, 1], "6");
    await ROWS.find((row) => row.row.join() === "1,2,1")!.build(edited.file, edited.uuid);
    const before = read(edited.file);
    const ubik = JSON.parse(read(bookPath(BOOK_UBIK))!);
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
              objects: [{ ...ubik, uuid: UNSAVED_BOOK, name: "Unsaved" } as EntityInstance],
            },
          },
        },
      },
      applicationDeploymentMap,
      libraryModelEnvironment,
    );
    expect(created instanceof Action2Error, JSON.stringify(created)).toBe(false);
    try {
      expectGitError(await gitAction(context, "gitAction_revert", { paths: [edited.file] }), "openMiroirTransaction");
      expect(read(edited.file)).toBe(before);
    } finally {
      // the Miroir change is saved, so that the next tests start with none
      const saved = await context.domainController.handleAction(
        { actionType: "commit", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", payload: { application: LIBRARY_APPLICATION } },
        applicationDeploymentMap,
        libraryModelEnvironment,
      );
      expect(saved instanceof Action2Error, JSON.stringify(saved)).toBe(false);
      createdFiles.push(bookPath(UNSAVED_BOOK));
    }
    expect(context.domainController.currentTransaction()).toEqual([]);
  });

  it("writes nothing through a symbolic link", async () => {
    const outside = fs.mkdtempSync(path.join(path.dirname(dir()), "revert-outside-"));
    try {
      // (a) a deleted file whose folder became a link out of the repository
      const folder = "data/691a0007-0000-4000-8000-000000000000";
      writeWorkTreeFile(context, `${folder}/a.json`, "{}\n");
      await add(`${folder}/a.json`);
      await git.commit({ fs, dir: dir(), message: "a folder", author: TEST_AUTHOR });
      fs.rmSync(path.join(dir(), folder), { recursive: true });
      fs.symlinkSync(outside, path.join(dir(), folder));
      expectGitError(await gitAction(context, "gitAction_revert", { paths: [`${folder}/a.json`] }), "symbolicLink");
      expect(fs.readdirSync(outside)).toEqual([]);
      fs.rmSync(path.join(dir(), folder));
      createdFiles.push(folder);

      // (d) a deleted file whose folder became a link to another folder of the repository
      const inTree = "data/691a0008-0000-4000-8000-000000000000";
      writeWorkTreeFile(context, `${inTree}/a.json`, "{}\n");
      await add(`${inTree}/a.json`);
      await git.commit({ fs, dir: dir(), message: "another folder", author: TEST_AUTHOR });
      const otherFolder = path.join(dir(), path.dirname(bookPath(BOOK_UBIK)));
      const otherBefore = fs.readdirSync(otherFolder).sort();
      fs.rmSync(path.join(dir(), inTree), { recursive: true });
      fs.symlinkSync(otherFolder, path.join(dir(), inTree));
      expectGitError(await gitAction(context, "gitAction_revert", { paths: [`${inTree}/a.json`] }), "symbolicLink");
      expect(fs.readdirSync(otherFolder).sort()).toEqual(otherBefore);
      fs.rmSync(path.join(dir(), inTree));
      createdFiles.push(inTree);

      // (b) an edited file that became a link to another file of the repository
      const target = rowFile([1, 2, 1], "8");
      const linked = rowFile([1, 2, 1], "9");
      await committed(target.file, target.uuid);
      await committed(linked.file, linked.uuid);
      const targetText = read(target.file);
      fs.rmSync(path.join(dir(), linked.file));
      fs.symlinkSync(path.join(dir(), target.file), path.join(dir(), linked.file));
      expectGitError(await gitAction(context, "gitAction_revert", { paths: [linked.file] }), "symbolicLink");
      expect(read(target.file)).toBe(targetText);

      // (c) a new file that is a link: the link goes, not its target
      const newLink = rowFile([0, 2, 0], "a");
      fs.symlinkSync(path.join(dir(), target.file), path.join(dir(), newLink.file));
      const result = expectOk<GitRevertResult>(await gitAction(context, "gitAction_revert", { paths: [newLink.file] }));
      expect(result.files).toEqual([{ path: newLink.file, outcome: "deleted" }]);
      expect(fs.existsSync(path.join(dir(), newLink.file))).toBe(false);
      expect(read(target.file)).toBe(targetText);
      fs.rmSync(path.join(dir(), linked.file));
      await committed(linked.file, linked.uuid);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it("keeps the mode of an executable file, and refuses a link in the index", async () => {
    const executable = rowFile([1, 2, 1], "b");
    write(executable.file, executable.uuid, "executable");
    fs.chmodSync(path.join(dir(), executable.file), 0o755);
    await add(executable.file);
    await git.commit({ fs, dir: dir(), message: "an executable file", author: TEST_AUTHOR });
    const mode = () => fs.statSync(path.join(dir(), executable.file)).mode & 0o777;
    // isomorphic-git's init sets core.filemode to false: git then ignores the mode, and so does a revert
    write(executable.file, executable.uuid, "edited");
    fs.chmodSync(path.join(dir(), executable.file), 0o644);
    expectOk(await gitAction(context, "gitAction_revert", { paths: [executable.file] }));
    expect(mode()).toBe(0o644);
    expect(JSON.parse(read(executable.file)!).name).toBe("executable");
    // with core.filemode true, the revert gives back the mode of the index, not the one the edit left
    await git.setConfig({ fs, dir: dir(), path: "core.filemode", value: true });
    try {
      write(executable.file, executable.uuid, "edited");
      expectOk(await gitAction(context, "gitAction_revert", { paths: [executable.file] }));
      expect(mode()).toBe(0o755);
      expect(JSON.parse(read(executable.file)!).name).toBe("executable");
    } finally {
      await git.setConfig({ fs, dir: dir(), path: "core.filemode", value: false });
    }

    const link = rowFile([1, 2, 1], "c");
    fs.symlinkSync(path.join(dir(), executable.file), path.join(dir(), link.file));
    await add(link.file);
    await git.commit({ fs, dir: dir(), message: "a link", author: TEST_AUTHOR });
    fs.rmSync(path.join(dir(), link.file));
    write(link.file, link.uuid, "a file now");
    expectGitError(await gitAction(context, "gitAction_revert", { paths: [link.file] }), "symbolicLink");
  });

  it("reloads the reverted deployment only, though another one is in the repository", async () => {
    // one repository around the Library and Miroir copies: a checkout there touches both
    const testRoot = path.dirname(dir());
    fs.rmSync(path.join(dir(), ".git"), { recursive: true, force: true });
    const edited = rowFile([1, 2, 1], "d");
    try {
      await git.init({ fs, dir: testRoot, defaultBranch: "main" });
      writeWorkTreeFile(context, edited.file, bookText(edited.uuid, "committed"));
      await git.add({ fs, dir: testRoot, filepath: path.relative(testRoot, path.join(dir(), edited.file)) });
      await git.commit({ fs, dir: testRoot, message: "one file", author: TEST_AUTHOR });
      write(edited.file, edited.uuid, "edited");
      const relative = path.relative(testRoot, path.join(dir(), edited.file)).split(path.sep).join("/");
      const result = expectOk<GitRevertResult>(await gitAction(context, "gitAction_revert", { paths: [relative] }));
      expect(result.touchedDeployments).toEqual([{ application: LIBRARY_APPLICATION, deploymentUuid: LIBRARY_DEPLOYMENT }]);
      expect(JSON.parse(read(edited.file)!).name).toBe("committed");
    } finally {
      fs.rmSync(path.join(testRoot, ".git"), { recursive: true, force: true });
      await initCommittedRepository(context.libraryRoot);
    }
  });

  it("is refused without the git capability, writing nothing", async () => {
    const edited = rowFile([1, 2, 1], "e");
    await ROWS.find((row) => row.row.join() === "1,2,1")!.build(edited.file, edited.uuid);
    const before = read(edited.file);
    setGitCapability(context, false);
    try {
      const result = await gitAction(context, "gitAction_revert", { paths: [edited.file] });
      expect((result as Action2Error).errorType).toBe("FeatureUnavailable");
    } finally {
      setGitCapability(context, true);
    }
    expect(read(edited.file)).toBe(before);
  });
});
