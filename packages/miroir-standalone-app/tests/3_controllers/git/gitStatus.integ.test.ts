/**
 * #679 slice 1 (tracer): `gitAction_status` behind the `git` capability, with the Git implementation
 * loaded on the first Git action only.
 *
 * Not reachable through MiroirTest: the test makes the Library copy a Git repository on disk first.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitStatus
 * ```
 */
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { Action2Error, type GitStatusResult } from "@miroir-framework/core";

import {
  BOOK_ENTITY,
  BOOK_UBIK,
  expectOk,
  gitAction,
  initCommittedRepository,
  openGitTestContext,
  setGitCapability,
  type GitTestContext,
} from "./gitTestSetup.js";

const NEW_BOOK = "679a0001-0000-4000-8000-000000000001";

let context: GitTestContext;
let loaderCallsAfterStartup = -1;

beforeAll(async () => {
  context = await openGitTestContext();
  loaderCallsAfterStartup = context.loaderCalls();
  await initCommittedRepository(context.libraryRoot);
  const books = path.join(context.sectionDirectory("data"), BOOK_ENTITY);
  const ubikFile = path.join(books, `${BOOK_UBIK}.json`);
  const ubik = JSON.parse(fs.readFileSync(ubikFile, "utf8"));
  fs.writeFileSync(ubikFile, JSON.stringify({ ...ubik, year: 1970 }, undefined, 2));
  fs.writeFileSync(
    path.join(books, `${NEW_BOOK}.json`),
    JSON.stringify({ uuid: NEW_BOOK, parentName: "Book", parentUuid: BOOK_ENTITY, name: "Galactic Pot-Healer" }),
  );
  // a change outside the application's section folders
  fs.writeFileSync(path.join(context.libraryRoot, "NOTES.md"), "not part of the deployment\n");
});

describe("gitAction_status (#679 slice 1)", () => {
  it("loads no Git code at startup, with Git registered but unused", () => {
    expect(loaderCallsAfterStartup).toBe(0);
  });

  it("is refused while the git capability is off, without loading Git", async () => {
    setGitCapability(context, false);
    const result = await gitAction(context, "gitAction_status");
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
    expect((result as Action2Error).errorType).toBe("FeatureUnavailable");
    expect((result as Action2Error).errorContext?.capability).toBe("git");
    expect(context.loaderCalls()).toBe(0);
  });

  it("lists the changed files of the application's sections, named by Entity and instance", async () => {
    setGitCapability(context, true);
    const status = expectOk<GitStatusResult>(await gitAction(context, "gitAction_status"));
    expect(context.loaderCalls()).toBe(1);
    expect(fs.realpathSync(status.root)).toBe(fs.realpathSync(context.libraryRoot));
    expect(status.sectionPaths).toMatchObject({ model: "model", data: "data" });
    expect(status.branches.current).toBe("main");
    const byPath = Object.fromEntries(status.files.map((file) => [file.path, file]));
    expect(Object.keys(byPath).sort()).toEqual(
      [`data/${BOOK_ENTITY}/${BOOK_UBIK}.json`, `data/${BOOK_ENTITY}/${NEW_BOOK}.json`].sort(),
    );
    expect(byPath[`data/${BOOK_ENTITY}/${BOOK_UBIK}.json`]).toMatchObject({
      change: "modified",
      staged: false,
      unstaged: true,
      section: "data",
      entityUuid: BOOK_ENTITY,
      instanceKey: BOOK_UBIK,
      instanceName: "Ubik",
      inApplication: true,
    });
    expect(byPath[`data/${BOOK_ENTITY}/${NEW_BOOK}.json`]).toMatchObject({
      change: "added",
      instanceName: "Galactic Pot-Healer",
    });
  });

  it("lists the other changes of the repository on demand", async () => {
    const status = expectOk<GitStatusResult>(
      await gitAction(context, "gitAction_status", { includeOtherChanges: true }),
    );
    const notes = status.files.find((file) => file.path === "NOTES.md");
    expect(notes).toMatchObject({ change: "added", inApplication: false });
    expect(context.loaderCalls()).toBe(1);
  });
});

describe("Git package imports (#679 D15)", () => {
  it("is imported dynamically only, outside its own package", () => {
    const packagesRoot = path.resolve(__dirname, "../../../..");
    const offenders: string[] = [];
    const walk = (directory: string) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) {
          continue;
        }
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
          const text = fs.readFileSync(full, "utf8");
          if (/^\s*import\s[^(]*from\s+["'](@miroir-framework\/git-isomorphic|isomorphic-git)["']/m.test(text)) {
            offenders.push(path.relative(packagesRoot, full));
          }
        }
      }
    };
    for (const pkg of fs.readdirSync(packagesRoot)) {
      const src = path.join(packagesRoot, pkg, "src");
      if (pkg !== "miroir-git-isomorphic" && fs.existsSync(src)) {
        walk(src);
      }
    }
    expect(offenders).toEqual([]);
  });
});
