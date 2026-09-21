/**
 * #281 Slice 4 RED — example package no longer ships Entity 56166585-….
 *
 * These asserts fail while the Entity JSON / export still exist (P7).
 * Entity-backed HTTP UI lives in apiCallReport.281.phase4.integ.test.tsx (GREEN companion).
 *
 * Run:
 * ```bash
 * RUN_TEST=apiCallReport.281.phase4 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase4
 * ```
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { defaultSpotifyAppModel } from "miroir-test-app_deployment-spotify";

import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "apiCallReport.281.phase4" ||
  RUN_TEST === "apiCallReport.281.phase4.unit.test";

const REPO_ROOT = resolveRepoRoot();

const SPOTIFY_PLAYLIST_ENTITY_UUID = "56166585-b6fd-42c6-95d3-32a80c3304f7";
const SPOTIFY_ENTITY_RELATIVE =
  `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/${SPOTIFY_PLAYLIST_ENTITY_UUID}.json`;

const SPOTIFY_MODEL_ROOT = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-spotify/assets/spotify_model",
);
const SPOTIFY_INDEX_TS = join(REPO_ROOT, "packages/miroir-test-app_deployment-spotify/index.ts");
const SPOTIFY_APP_INTEG = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/tests/4_view/spotifyApp.integ.test.tsx",
);
const DOGFOOD_SYNC = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-spotify/scripts/dogfood-sync-spotify-schema.ts",
);

const SKIP_WALK_DIRS = new Set(["node_modules", "dist", "graphify-out", ".git"]);

const EXPECTED_SPOTIFY_MODEL_FILES: {
  relativePath: string;
  uuid: string;
  name: string;
}[] = [
  {
    relativePath:
      "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/10ce3252-7840-4041-a769-9a0e2d5ee10b.json",
    uuid: "10ce3252-7840-4041-a769-9a0e2d5ee10b",
    name: "SpotifyPlaylistReport",
  },
  {
    relativePath:
      "e4320b9e-ab45-4abe-85d8-359604b3c62f/371aed0c-05bb-4b77-8cf1-2c82407555c1.json",
    uuid: "371aed0c-05bb-4b77-8cf1-2c82407555c1",
    name: "spotifyGetPlaylist",
  },
  {
    relativePath:
      "3d8da4d4-8f76-4bb4-9212-14869d81c00c/0e5cb172-12ea-4467-8598-5889338ae454.json",
    uuid: "0e5cb172-12ea-4467-8598-5889338ae454",
    name: "SpotifyService",
  },
  {
    relativePath:
      "a659d350-dd97-4da9-91de-524fa01745dc/00514586-bf72-4de3-beea-0a627c821404.json",
    uuid: "00514586-bf72-4de3-beea-0a627c821404",
    name: "Spotify",
  },
  {
    relativePath:
      "cdb0aec6-b848-43ac-a058-fe2dbe5811f1/cddedb5a-2789-45b2-be93-d6f52ae3f6eb.json",
    uuid: "cddedb5a-2789-45b2-be93-d6f52ae3f6eb",
    name: "master",
  },
  {
    relativePath:
      "dde4c883-ae6d-47c3-b6df-26bc6e3c1842/1b4b181d-4616-4391-a41f-33bbee4fd356.json",
    uuid: "1b4b181d-4616-4391-a41f-33bbee4fd356",
    name: "SpotifyMenu",
  },
];

function collectJsonFilesUnder(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) {
      return;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_WALK_DIRS.has(entry.name)) {
          walk(full);
        }
      } else if (entry.name.endsWith(".json")) {
        found.push(full);
      }
    }
  };
  walk(root);
  return found.sort();
}

describe.skipIf(!shouldRun)("apiCallReport #281 phase4 — example Entity deleted", () => {
  it("defaultSpotifyAppModel.entities is empty", () => {
    expect(defaultSpotifyAppModel.entities).toEqual([]);
  });

  it("spotify_model has exactly 6 JSON files and no SpotifyPlaylist Entity", () => {
    expect(existsSync(join(SPOTIFY_MODEL_ROOT, SPOTIFY_ENTITY_RELATIVE))).toBe(false);

    const files = collectJsonFilesUnder(SPOTIFY_MODEL_ROOT);
    expect(files).toHaveLength(6);

    const inventory = files.map((absolute) => {
      const relFromModel = relative(SPOTIFY_MODEL_ROOT, absolute).replaceAll("\\", "/");
      const instance = JSON.parse(readFileSync(absolute, "utf8")) as {
        uuid: string;
        name: string;
      };
      return { relativePath: relFromModel, uuid: instance.uuid, name: instance.name };
    });

    expect(inventory.map((row) => row.uuid)).not.toContain(SPOTIFY_PLAYLIST_ENTITY_UUID);
    expect(inventory).toEqual(
      [...EXPECTED_SPOTIFY_MODEL_FILES].sort((left, right) =>
        left.relativePath.localeCompare(right.relativePath),
      ),
    );
  });

  it("index.ts does not export entitySpotifyPlaylist", () => {
    const source = readFileSync(SPOTIFY_INDEX_TS, "utf8");
    expect(source).not.toMatch(/\bentitySpotifyPlaylist\b/);
  });

  it("spotifyApp.integ.test.tsx does not import entitySpotifyPlaylist", () => {
    const source = readFileSync(SPOTIFY_APP_INTEG, "utf8");
    expect(source).not.toMatch(/\bentitySpotifyPlaylist\b/);
  });

  it("dogfood-sync-spotify-schema.ts does not write Entity JSON unless operationSync.entity is set", () => {
    const source = readFileSync(DOGFOOD_SYNC, "utf8");
    const entityFileLiteral = `${SPOTIFY_PLAYLIST_ENTITY_UUID}.json`;
    const hardcodesEntityPath = source.includes(entityFileLiteral);
    const writesEntityPath = /writeFileSync\(\s*entityPath/.test(source);
    const writeGatedByOperationSyncEntity =
      /operationSync[\s\S]{0,400}\.entity/.test(source) ||
      /syncEntry\?\.entity/.test(source);

    expect(
      !(hardcodesEntityPath && writesEntityPath) || writeGatedByOperationSyncEntity,
      "dogfood must not hardcode a write of 56166585-….json; write only when operationSync.entity is set",
    ).toBe(true);
    expect(source).not.toContain("did not produce SpotifyPlaylist entity");
  });
});
