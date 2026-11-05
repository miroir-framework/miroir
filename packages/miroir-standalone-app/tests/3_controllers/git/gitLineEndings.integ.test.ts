/**
 * #690: `core.autocrlf` set by the global configuration only, as Git for Windows sets it in its system one:
 * a work tree with CRLF line endings over LF blobs shows no change, and a staged file is stored with LF.
 *
 * Not reachable through MiroirTest: the test writes a global configuration and the work tree's files first.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitLineEndings
 * ```
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import git from "isomorphic-git";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { GitStatusResult } from "@miroir-framework/core";

import {
  bookPath,
  BOOK_UBIK,
  expectOk,
  gitAction,
  initCommittedRepository,
  openGitTestContext,
  setGitCapability,
  TEST_AUTHOR,
  type GitTestContext,
} from "./gitTestSetup.js";

const REMOTE_URL = "https://example.com/miroir/library.git";
const NOTES = "NOTES.md";
const NOTES_TEXT = String.fromCharCode(0xfeff) + "# Library\n\nNot part of the deployment.\n";

let context: GitTestContext;
let configDirectory: string;
/** The committed text of the Ubik file, with LF line endings. */
let committed: string;
const savedEnvironment = {
  GIT_CONFIG_GLOBAL: process.env.GIT_CONFIG_GLOBAL,
  GIT_CONFIG_NOSYSTEM: process.env.GIT_CONFIG_NOSYSTEM,
};

function ubikFile(): string {
  return path.join(context.libraryRoot, bookPath(BOOK_UBIK));
}

/**
 * Writes `text` to the Ubik file with CRLF line endings, as git checks it out on Windows, its stat no longer
 * the index's so that isomorphic-git reads the file again.
 */
let clock = Math.floor(Date.now() / 1000) + 10;
function writeUbikWithCrlf(text: string): void {
  fs.writeFileSync(ubikFile(), text.replace(/\n/g, "\r\n"));
  fs.utimesSync(ubikFile(), clock, clock);
  clock += 2;
}

const renamed = () => committed.replace('"name": "Ubik"', '"name": "Ubik!"');

async function stagedText(filepath: string): Promise<string | undefined> {
  const [oid] = await git.walk({
    fs,
    dir: context.libraryRoot,
    trees: [git.STAGE()],
    map: async (entryPath, [entry]) => (entryPath === filepath ? entry?.oid() : undefined),
  });
  if (typeof oid !== "string") {
    return undefined;
  }
  const { blob } = await git.readBlob({ fs, dir: context.libraryRoot, oid });
  return Buffer.from(blob).toString("utf8");
}

function repositoryConfig(): string {
  return fs.readFileSync(path.join(context.libraryRoot, ".git", "config"), "utf8");
}

beforeAll(async () => {
  context = await openGitTestContext();
  setGitCapability(context, true);
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "miroir-690-"));
  const globalConfig = path.join(configDirectory, "gitconfig");
  fs.writeFileSync(globalConfig, "[user]\n\tname = Someone\n[core]\n\tautocrlf = true ; as Git for Windows sets it\n");
  process.env.GIT_CONFIG_GLOBAL = globalConfig;
  process.env.GIT_CONFIG_NOSYSTEM = "1";
  // the seeded copy has the line endings of the checkout it comes from: the commit holds LF, as git stores it
  committed = fs.readFileSync(ubikFile(), "utf8").replace(/\r\n/g, "\n");
  expect(committed).toContain('"name": "Ubik"');
  fs.writeFileSync(ubikFile(), committed);
  await initCommittedRepository(context.libraryRoot);
  writeUbikWithCrlf(committed);
  // a file that starts with a UTF-8 BOM, which the conversion keeps
  const notes = path.join(context.libraryRoot, NOTES);
  fs.writeFileSync(notes, NOTES_TEXT);
  await git.add({ fs, dir: context.libraryRoot, filepath: NOTES });
  await git.commit({ fs, dir: context.libraryRoot, message: "notes", author: TEST_AUTHOR });
  fs.writeFileSync(notes, NOTES_TEXT.replace(/\n/g, "\r\n"));
  fs.utimesSync(notes, clock, clock);
});

afterAll(() => {
  for (const [name, value] of Object.entries(savedEnvironment)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

describe("core.autocrlf from the global configuration (#690)", () => {
  it("shows no change for a file that differs by its line endings only, with or without a BOM", async () => {
    const status = expectOk<GitStatusResult>(
      await gitAction(context, "gitAction_status", { includeOtherChanges: true }),
    );
    expect(status.files).toEqual([]);
  });

  it("stages a changed CRLF file with LF line endings", async () => {
    writeUbikWithCrlf(renamed());
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.files).toEqual([expect.objectContaining({ path: bookPath(BOOK_UBIK), change: "modified" })]);
    expectOk(await gitAction(context, "gitAction_stage", { all: true }));
    const staged = await stagedText(bookPath(BOOK_UBIK));
    expect(staged).toBe(renamed());
  });

  it("leaves the inherited setting out of the repository's configuration", async () => {
    expectOk(await gitAction(context, "gitAction_setRemote", { url: REMOTE_URL }));
    const config = repositoryConfig();
    expect(config).toContain(REMOTE_URL);
    expect(config).not.toMatch(/autocrlf/i);
    expect(config.match(/^\[core\]/gm)).toHaveLength(1);
  });

  it("lets the repository's own core.autocrlf win", async () => {
    await git.resetIndex({ fs, dir: context.libraryRoot, filepath: bookPath(BOOK_UBIK) });
    writeUbikWithCrlf(committed);
    await git.setConfig({ fs, dir: context.libraryRoot, path: "core.autocrlf", value: "false" });
    // the committed text has LF: with no conversion, the CRLF file differs from it
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(status.files).toEqual([expect.objectContaining({ path: bookPath(BOOK_UBIK), change: "modified" })]);
    await git.setConfig({ fs, dir: context.libraryRoot, path: "core.autocrlf", value: undefined });
    expect(expectOk<GitStatusResult>(await gitAction(context, "gitAction_status")).files).toEqual([]);
  });
});
