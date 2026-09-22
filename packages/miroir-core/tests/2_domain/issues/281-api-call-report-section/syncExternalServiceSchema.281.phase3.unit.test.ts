/**
 * #281 Slice 3 — syncExternalServiceSchema: required endpointUuid, operationSync
 * boundPaths (fail closed), Entity opt-in, D9 scope default, D16 extra keys ignored.
 *
 * Calls the real handler. OpenAPI excerpt comes from the Spotify Endpoint asset.
 * appModel is supplied in transformerParams (unit defaultMetaModelEnvironment is unused).
 *
 * Run:
 * ```bash
 * RUN_TEST=syncExternalServiceSchema.281.phase3 npm run testByFile -w miroir-core -- syncExternalServiceSchema.281.phase3
 * ```
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { JzodObject } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { TransformerFailure } from "../../../../src/0_interfaces/2_domain/DomainElement.js";
import { jzodTypeCheck } from "../../../../src/1_core/jzod/jzodTypeCheck.js";
import { defaultMetaModelEnvironment } from "../../../../src/1_core/Model.js";
import { handleTransformer_syncExternalServiceSchema } from "../../../../src/2_domain/syncExternalServiceSchema.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "syncExternalServiceSchema.281.phase3" ||
  RUN_TEST === "syncExternalServiceSchema.281.phase3.unit.test";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

const SPOTIFY_ENDPOINT_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-spotify/assets/spotify_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0e5cb172-12ea-4467-8598-5889338ae454.json",
);

const SPOTIFY_EXCERPT_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-spotify/assets/test-resources/spotifyOpenApiExcerpt.get-playlist.json",
);

const ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454";
const APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const ENTITY_ALPHA_UUID = "7c8a1e20-4b3d-4e91-9c2a-0f1e2d3c4b5a";
const ENTITY_BETA_UUID = "8d9b2f31-5c4e-4fa2-ad3b-1a2f3e4d5c6b";

const GET_PLAYLIST_BOUND_PATHS = [
  "id",
  "name",
  "owner.id",
  "owner.display_name",
  "images.url",
  "images.height",
  "images.width",
  "tracks.total",
  "tracks.items.track.id",
  "tracks.items.track.name",
  "tracks.items.track.artists.id",
  "tracks.items.track.artists.name",
  "tracks.items.track.duration_ms",
  "items.total",
  "items.items.item.id",
  "items.items.item.name",
  "items.items.item.artists.id",
  "items.items.item.artists.name",
  "items.items.item.duration_ms",
];

const TRANSFORMER = {
  transformerType: "syncExternalServiceSchema",
  interpolation: "runtime",
} as const;

function loadSpotifyOpenApiExcerpt(): Record<string, unknown> {
  const endpoint = JSON.parse(readFileSync(SPOTIFY_ENDPOINT_PATH, "utf8")) as {
    definition?: { externalService?: { openApiDocument?: unknown } };
  };
  const raw = endpoint.definition?.externalService?.openApiDocument;
  if (raw !== null && typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error("Spotify Endpoint asset is missing openApiDocument");
  }
  return JSON.parse(raw) as Record<string, unknown>;
}

function loadSpotifyOpenApiExcerptFile(): Record<string, unknown> {
  return JSON.parse(readFileSync(SPOTIFY_EXCERPT_PATH, "utf8")) as Record<string, unknown>;
}

function makeEndpoint(overrides: {
  uuid?: string;
  enabledOperations?: string[];
  operationSync?: Record<string, unknown>;
}): Record<string, unknown> {
  const externalService: Record<string, unknown> = {
    openApiDocument: "",
    baseUrl: "https://api.spotify.com/v1",
    securityScheme: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    credentialKey: "spotifyUser",
    enabledOperations: overrides.enabledOperations ?? ["get-playlist"],
    operations: [],
  };
  if (overrides.operationSync !== undefined) {
    externalService.operationSync = overrides.operationSync;
  }
  return {
    uuid: overrides.uuid ?? ENDPOINT_UUID,
    parentName: "Endpoint",
    parentUuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
    application: APPLICATION_UUID,
    name: "SpotifyService",
    version: "1",
    definition: { externalService },
  };
}

function runSync(transformerParams: Record<string, unknown>) {
  return handleTransformer_syncExternalServiceSchema(
    "runtime",
    [],
    undefined,
    TRANSFORMER as any,
    "value",
    defaultMetaModelEnvironment,
    transformerParams,
  );
}

function actionSequence(result: unknown): Array<Record<string, any>> {
  expect(result instanceof TransformerFailure, JSON.stringify(result)).toBe(false);
  const sequence = (result as { payload?: { actionSequence?: unknown } }).payload?.actionSequence;
  expect(Array.isArray(sequence)).toBe(true);
  return sequence as Array<Record<string, any>>;
}

function upsertedEndpoint(result: unknown): Record<string, any> {
  const sequence = actionSequence(result);
  expect(sequence[0]?.actionType).toBe("updateInstance");
  return sequence[0].payload.objects[0];
}

function simpleGetOpenApi(operationId: string, path: string): Record<string, unknown> {
  return {
    openapi: "3.0.0",
    info: { title: operationId, version: "0.0.1" },
    paths: {
      [path]: {
        get: {
          operationId,
          responses: {
            "200": {
              description: "ok",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

(shouldRun ? describe : describe.skip)("syncExternalServiceSchema #281 phase3", () => {
  it("missing endpointUuid is a TransformerFailure", () => {
    const result = runSync({
      openApiDocument: loadSpotifyOpenApiExcerpt(),
      appModel: {
        endpoints: [
          makeEndpoint({
            operationSync: {
              "get-playlist": { boundPaths: GET_PLAYLIST_BOUND_PATHS },
            },
          }),
        ],
      },
      scope: ["get-playlist"],
    });
    expect(result).toBeInstanceOf(TransformerFailure);
    expect((result as TransformerFailure).failureMessage).toMatch(/endpointUuid/i);
  });

  it("in-scope GET without boundPaths fails closed", () => {
    const result = runSync({
      openApiDocument: simpleGetOpenApi("get-album", "/albums/{id}"),
      appModel: {
        endpoints: [
          makeEndpoint({
            enabledOperations: ["get-album"],
            operationSync: {},
          }),
        ],
      },
      scope: ["get-album"],
      endpointUuid: ENDPOINT_UUID,
    });
    expect(result).toBeInstanceOf(TransformerFailure);
    expect((result as TransformerFailure).failureMessage).toMatch(/boundPaths/i);
  });

  it("operationSync.get-playlist.boundPaths materializes id, name, owner.display_name", () => {
    const result = runSync({
      openApiDocument: loadSpotifyOpenApiExcerpt(),
      appModel: {
        endpoints: [
          makeEndpoint({
            operationSync: {
              "get-playlist": {
                boundPaths: ["id", "name", "owner.display_name"],
              },
            },
          }),
        ],
      },
      scope: ["get-playlist"],
      endpointUuid: ENDPOINT_UUID,
    });
    const endpoint = upsertedEndpoint(result);
    const responseSchema =
      endpoint.definition.externalService.operations[0].responseSchema;
    expect(responseSchema.definition.id).toEqual({ type: "string", optional: true });
    expect(responseSchema.definition.name).toEqual({ type: "string", optional: true });
    expect(responseSchema.definition.owner.definition.display_name).toEqual({
      type: "string",
      nullable: true,
      optional: true,
    });
    expect(responseSchema.definition.owner.optional).toBe(true);
    expect(responseSchema.definition.tracks).toBeUndefined();
  });

  it("marks OpenAPI properties optional unless listed in required", () => {
    const result = runSync({
      openApiDocument: {
        openapi: "3.0.0",
        info: { title: "required-vs-optional", version: "0.0.1" },
        paths: {
          "/thing": {
            get: {
              operationId: "get-thing",
              responses: {
                "200": {
                  description: "ok",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        required: ["id"],
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          extra: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      appModel: {
        endpoints: [
          makeEndpoint({
            enabledOperations: ["get-thing"],
            operationSync: {
              "get-thing": { boundPaths: ["id", "name"] },
            },
          }),
        ],
      },
      scope: ["get-thing"],
      endpointUuid: ENDPOINT_UUID,
    });
    const definition = upsertedEndpoint(result).definition.externalService.operations[0]
      .responseSchema.definition;
    expect(definition.id).toEqual({ type: "string" });
    expect(definition.name).toEqual({ type: "string", optional: true });
    expect(definition.extra).toBeUndefined();
  });

  it("PlaylistObject tracks is optional; paging total stays required", () => {
    const result = runSync({
      openApiDocument: loadSpotifyOpenApiExcerptFile(),
      appModel: {
        endpoints: [
          makeEndpoint({
            operationSync: {
              "get-playlist": { boundPaths: GET_PLAYLIST_BOUND_PATHS },
            },
          }),
        ],
      },
      scope: ["get-playlist"],
      endpointUuid: ENDPOINT_UUID,
    });
    const definition = upsertedEndpoint(result).definition.externalService.operations[0]
      .responseSchema.definition;
    expect(definition.tracks.optional).toBe(true);
    expect(definition.tracks.definition.total).toEqual({ type: "number" });
    expect(definition.tracks.definition.items.optional).toBeUndefined();
    expect(definition.items.optional).toBe(true);
    expect(definition.items.definition.total).toEqual({ type: "number" });
    expect(definition.images.optional).toBe(true);
    expect(definition.images.definition.definition.url).toEqual({ type: "string" });
  });

  it("metadata-only and Feb-2026 items playlists typecheck against the synced schema", () => {
    const result = runSync({
      openApiDocument: loadSpotifyOpenApiExcerptFile(),
      appModel: {
        endpoints: [
          makeEndpoint({
            operationSync: {
              "get-playlist": { boundPaths: GET_PLAYLIST_BOUND_PATHS },
            },
          }),
        ],
      },
      scope: ["get-playlist"],
      endpointUuid: ENDPOINT_UUID,
    });
    const schema = upsertedEndpoint(result).definition.externalService.operations[0]
      .responseSchema as JzodObject;
    const metadataOnly = {
      id: "5BQpOaeNsOzzq4l3PFUQMd",
      name: "Ex-yu",
      owner: { id: "donnykerabatsos", display_name: "donnykerabatsos" },
      images: [
        {
          height: 640,
          url: "https://mosaic.scdn.co/640/example",
          width: 640,
        },
      ],
    };
    const newShape = {
      ...metadataOnly,
      items: {
        total: 1,
        items: [
          {
            item: {
              id: "track-1",
              name: "Example Track",
              artists: [{ id: "artist-1", name: "Example Artist" }],
              duration_ms: 180000,
            },
          },
        ],
      },
    };
    const metadataResult = jzodTypeCheck(
      schema,
      metadataOnly,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    const newShapeResult = jzodTypeCheck(
      schema,
      newShape,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    expect(metadataResult.status, JSON.stringify(metadataResult)).toBe("ok");
    expect(newShapeResult.status, JSON.stringify(newShapeResult)).toBe("ok");
  });

  it("two operationSync entity keys emit two createEntity actions", () => {
    const result = runSync({
      openApiDocument: {
        openapi: "3.0.0",
        info: { title: "two ops", version: "0.0.1" },
        paths: {
          "/alpha": {
            get: {
              operationId: "get-alpha",
              responses: {
                "200": {
                  description: "ok",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: { id: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
          "/beta": {
            get: {
              operationId: "get-beta",
              responses: {
                "200": {
                  description: "ok",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: { id: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      appModel: {
        endpoints: [
          makeEndpoint({
            enabledOperations: ["get-alpha", "get-beta"],
            operationSync: {
              "get-alpha": {
                boundPaths: ["id"],
                entity: { uuid: ENTITY_ALPHA_UUID, name: "Alpha" },
              },
              "get-beta": {
                boundPaths: ["id"],
                entity: { uuid: ENTITY_BETA_UUID, name: "Beta" },
              },
            },
          }),
        ],
      },
      scope: ["get-alpha", "get-beta"],
      endpointUuid: ENDPOINT_UUID,
    });
    const sequence = actionSequence(result);
    const createEntityActions = sequence.filter((step) => step.actionType === "createEntity");
    expect(createEntityActions).toHaveLength(2);
    expect(createEntityActions[0].payload.entities[0].uuid).toBe(ENTITY_ALPHA_UUID);
    expect(createEntityActions[1].payload.entities[0].uuid).toBe(ENTITY_BETA_UUID);
  });

  it("omitted scope defaults to enabledOperations when that list is non-empty", () => {
    const result = runSync({
      openApiDocument: loadSpotifyOpenApiExcerpt(),
      appModel: {
        endpoints: [
          makeEndpoint({
            enabledOperations: ["get-playlist"],
            operationSync: {
              "get-playlist": { boundPaths: GET_PLAYLIST_BOUND_PATHS },
            },
          }),
        ],
      },
      endpointUuid: ENDPOINT_UUID,
    });
    const endpoint = upsertedEndpoint(result);
    expect(endpoint.definition.externalService.operations[0].operationId).toBe("get-playlist");
    expect(endpoint.definition.externalService.operations[0].responseSchema.definition.id).toEqual({
      type: "string",
      optional: true,
    });
  });

  it("extra operationSync key not in scope is ignored and enabledOperations is unchanged", () => {
    const result = runSync({
      openApiDocument: loadSpotifyOpenApiExcerpt(),
      appModel: {
        endpoints: [
          makeEndpoint({
            enabledOperations: ["get-playlist"],
            operationSync: {
              "get-playlist": { boundPaths: GET_PLAYLIST_BOUND_PATHS },
              "get-unrelated": {
                boundPaths: ["id"],
                entity: { uuid: ENTITY_BETA_UUID, name: "Unrelated" },
              },
            },
          }),
        ],
      },
      scope: ["get-playlist"],
      endpointUuid: ENDPOINT_UUID,
    });
    const endpoint = upsertedEndpoint(result);
    const external = endpoint.definition.externalService;
    expect(external.enabledOperations).toEqual(["get-playlist"]);
    expect(external.operations.map((op: { operationId: string }) => op.operationId)).toEqual([
      "get-playlist",
    ]);
    const sequence = actionSequence(result);
    expect(sequence.filter((step) => step.actionType === "createEntity")).toHaveLength(0);
    expect(external.operationSync["get-unrelated"]).toEqual({
      boundPaths: ["id"],
      entity: { uuid: ENTITY_BETA_UUID, name: "Unrelated" },
    });
  });
});
