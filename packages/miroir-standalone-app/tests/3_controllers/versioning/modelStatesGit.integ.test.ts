/**
 * #708 part B: the model of an application at a Git commit, read from the commit's files without a checkout.
 *
 * Not reachable through MiroirTest: the test builds a temporary repository from appForTest's asset files.
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- modelStatesGit
 * ```
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { GitRepositoryInterface } from "@miroir-framework/core";
import { createGitRepositoryFactory } from "@miroir-framework/git-isomorphic";
import { gitModelState } from "@miroir-framework/versioning";

const APP_FOR_TEST = "eef01001-0001-4000-8000-000000000001";
const PUBLISHER_FILE = "appForTest_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
const SECTION_FOLDERS = { model: "appForTest_model", modelVersion: "appForTest_modelVersion" };
const AUTHOR = { name: "Miroir Test", email: "miroir-test@example.com" };

const fixtureAssets = path.resolve(__dirname, "../../../../miroir-fixture-appForTest/assets");

let root: string;
let repository: GitRepositoryInterface;
let firstCommit: string;

/** The files under `folder`, relative to it, with `/` separators. */
function filesUnder(folder: string, relative = ""): string[] {
  return fs.readdirSync(path.join(folder, relative), { withFileTypes: true }).flatMap((entry) => {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    return entry.isDirectory() ? filesUnder(folder, child) : [child];
  });
}

function publisherDescription(text: string | undefined): unknown {
  return JSON.parse(text ?? "{}").description;
}

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "miroir-708-git-"));
  for (const folder of Object.values(SECTION_FOLDERS)) {
    fs.cpSync(path.join(fixtureAssets, folder), path.join(root, folder), { recursive: true });
  }
  repository = await createGitRepositoryFactory().init(root);
  await repository.stage(filesUnder(root).filter((file) => !file.startsWith(".git/")));
  firstCommit = await repository.commit("appForTest model", AUTHOR);

  const publisher = JSON.parse(fs.readFileSync(path.join(root, PUBLISHER_FILE), "utf8"));
  fs.writeFileSync(path.join(root, PUBLISHER_FILE), JSON.stringify({ ...publisher, description: "#708 B4: second commit" }, null, 2));
  await repository.stage([PUBLISHER_FILE]);
  await repository.commit("change the Publisher Entity", AUTHOR);
  fs.writeFileSync(path.join(root, PUBLISHER_FILE), JSON.stringify({ ...publisher, description: "#708 B4: work tree" }, null, 2));
}, 60000);

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("model state at a Git ref (#708 B4)", () => {
  it("B4: the model at the first commit holds the first Publisher Entity, and the work tree is left as it is", async () => {
    const original = publisherDescription(fs.readFileSync(path.join(fixtureAssets, PUBLISHER_FILE), "utf8"));

    const first = await gitModelState(repository, APP_FOR_TEST, SECTION_FOLDERS, firstCommit);
    const head = await gitModelState(repository, APP_FOR_TEST, SECTION_FOLDERS, "HEAD");

    const description = (state: typeof first) =>
      state.entities.find((entity) => entity.uuid === "a027c379-8468-43a5-ba4d-bf618be25cab")?.description;
    expect({
      first: description(first),
      head: description(head),
      workTree: publisherDescription(fs.readFileSync(path.join(root, PUBLISHER_FILE), "utf8")),
      firstApplicationVersions: first.applicationVersions.map((version) => version.uuid),
    }).toEqual({
      first: original,
      head: "#708 B4: second commit",
      workTree: "#708 B4: work tree",
      firstApplicationVersions: ["eef01001-0005-4000-8000-000000000005"],
    });
  });
});
