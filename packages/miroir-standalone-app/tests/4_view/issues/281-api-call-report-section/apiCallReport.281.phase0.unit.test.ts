import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import {
  entitySpotifyPlaylist,
  querySpotifyGetPlaylist,
  reportSpotifyPlaylist,
  spotifyServiceEndpoint,
} from "miroir-test-app_deployment-spotify";

import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "apiCallReport.281.phase0" ||
  RUN_TEST === "apiCallReport.281.phase0.unit.test";

const REPO_ROOT = resolveRepoRoot();

const SPOTIFY_MODEL_ROOT = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-spotify/assets/spotify_model",
);

const SKIP_WALK_DIRS = new Set(["node_modules", "dist", "graphify-out", ".git"]);

const EXPECTED_SPOTIFY_MODEL_FILES: {
  relativePath: string;
  uuid: string;
  name: string;
}[] = [
  {
    relativePath:
      "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/56166585-b6fd-42c6-95d3-32a80c3304f7.json",
    uuid: "56166585-b6fd-42c6-95d3-32a80c3304f7",
    name: "SpotifyPlaylist",
  },
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

function extractExportTypeBlock(source: string, typeName: string): string {
  const marker = `export type ${typeName} =`;
  const start = source.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const slice = source.slice(start);
  const end = slice.indexOf("\n};");
  expect(end).toBeGreaterThanOrEqual(0);
  return slice.slice(0, end + 3);
}

describe.skipIf(!shouldRun)("apiCallReport #281 phase0 — current contracts", () => {
  it("spotify_model has exactly 7 JSON files with expected uuids and names", () => {
    const files = collectJsonFilesUnder(SPOTIFY_MODEL_ROOT);
    expect(files).toHaveLength(7);

    const inventory = files.map((absolute) => {
      const relFromModel = relative(SPOTIFY_MODEL_ROOT, absolute).replaceAll("\\", "/");
      const instance = JSON.parse(readFileSync(absolute, "utf8")) as {
        uuid: string;
        name: string;
      };
      return { relativePath: relFromModel, uuid: instance.uuid, name: instance.name };
    });

    expect(inventory).toEqual(
      [...EXPECTED_SPOTIFY_MODEL_FILES].sort((left, right) =>
        left.relativePath.localeCompare(right.relativePath),
      ),
    );
  });

  it("SpotifyPlaylist.mlSchema deep-equals get-playlist operations[0].responseSchema", () => {
    const operations = spotifyServiceEndpoint.definition.externalService?.operations ?? [];
    expect(operations[0]?.operationId).toBe("get-playlist");
    expect(entitySpotifyPlaylist.mlSchema).toEqual(operations[0]?.responseSchema);
  });

  it("report inline extractorTemplates.playlist is extractorTemplateForExternalService get-playlist", () => {
    expect(reportSpotifyPlaylist.definition?.extractorTemplates?.playlist).toEqual({
      extractorOrCombinerType: "extractorTemplateForExternalService",
      endpointUuid: "0e5cb172-12ea-4467-8598-5889338ae454",
      actionType: "get-playlist",
      parameterBindings: {
        playlist_id: {
          transformerType: "getFromParameters",
          referenceName: "playlistId",
        },
      },
    });
  });

  it("syncExternalServiceSchema.ts still contains Spotify sync defaults (until Slice 3)", () => {
    const source = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/2_domain/syncExternalServiceSchema.ts"),
      "utf8",
    );
    expect(source).toContain("DEFAULT_GET_PLAYLIST_ENTITY_UUID");
    expect(source).toContain("DEFAULT_SPOTIFY_ENDPOINT_UUID");
    expect(source).toContain("DEFAULT_BOUNDED_PATHS");
    expect(source).toContain("createdEntities[0]");
  });

  it("getReportsAndEntitiesForDeploymentUuid return shape has no endpoints key", () => {
    const modelInterfaceSource = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/0_interfaces/1_core/Model.ts"),
      "utf8",
    );
    const deploymentTypeBlock = extractExportTypeBlock(
      modelInterfaceSource,
      "DeploymentUuidToReportsEntities",
    );
    expect(deploymentTypeBlock).not.toMatch(/\bendpoints\b/);

    const modelImplSource = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/1_core/Model.ts"),
      "utf8",
    );
    const fnStart = modelImplSource.indexOf(
      "export function getReportsAndEntitiesForDeploymentUuid",
    );
    const fnEnd = modelImplSource.indexOf("export const emptyApplicationModel", fnStart);
    expect(fnStart).toBeGreaterThanOrEqual(0);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const fnBody = modelImplSource.slice(fnStart, fnEnd);
    expect(fnBody).toContain("): DeploymentUuidToReportsEntities");
    expect(fnBody).not.toMatch(/\bendpoints\s*:/);
  });

  it("Query spotifyGetPlaylist extractorTemplates match the report embed", () => {
    expect(querySpotifyGetPlaylist.definition?.extractorTemplates).toEqual(
      reportSpotifyPlaylist.definition?.extractorTemplates,
    );
  });
});
