/**
 * Slice 7 dogfood: run syncExternalServiceSchema on the committed Spotify
 * OpenAPI excerpt (and optionally the live Spotify YAML) and write the reviewed
 * operations[] + SpotifyPlaylist Entity into package assets.
 *
 * Usage (from repo root):
 *   npm run dogfood-sync -w miroir-test-app_deployment-spotify
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  defaultMetaModelEnvironment,
  TransformerFailure,
  transformer_extended_apply,
} from "miroir-core";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const excerptPath = join(
  packageRoot,
  "assets/test-resources/spotifyOpenApiExcerpt.get-playlist.json",
);
const endpointPath = join(
  packageRoot,
  "assets/spotify_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0e5cb172-12ea-4467-8598-5889338ae454.json",
);
const entityPath = join(
  packageRoot,
  "assets/spotify_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/56166585-b6fd-42c6-95d3-32a80c3304f7.json",
);

const ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454";
const ENTITY_UUID = "56166585-b6fd-42c6-95d3-32a80c3304f7";
const ENTITY_VERSION_UUID = "1a34fdf2-67c8-411d-9be4-a9265089ac51";
const APPLICATION_UUID = "00514586-bf72-4de3-beea-0a627c821404";

const excerpt = JSON.parse(readFileSync(excerptPath, "utf8"));
const endpointSkeleton = JSON.parse(readFileSync(endpointPath, "utf8"));

const openApiDocumentString = JSON.stringify(excerpt);

const syncInputEndpoint = {
  ...endpointSkeleton,
  application: APPLICATION_UUID,
  definition: {
    externalService: {
      ...endpointSkeleton.definition.externalService,
      openApiDocument: openApiDocumentString,
      operations: [],
    },
  },
};

const composite = transformer_extended_apply(
  "runtime",
  [],
  undefined,
  { transformerType: "syncExternalServiceSchema", interpolation: "runtime" } as any,
  "value",
  defaultMetaModelEnvironment,
  {
    openApiDocument: excerpt,
    appModel: { endpoints: [syncInputEndpoint] },
    scope: ["get-playlist"],
    endpointUuid: ENDPOINT_UUID,
    entityUuid: ENTITY_UUID,
    entityVersionUuid: ENTITY_VERSION_UUID,
  },
);

if (composite instanceof TransformerFailure) {
  throw new Error(`syncExternalServiceSchema failed: ${JSON.stringify(composite)}`);
}

const actionSequence = (composite as {
  payload: {
    actionSequence: Array<{
      actionType?: string;
      payload?: {
        objects?: Array<{ definition?: { externalService?: { operations?: unknown[] } } }>;
        entities?: Array<Record<string, unknown>>;
      };
    }>;
  };
}).payload.actionSequence;

const updateAction = actionSequence.find((step) => step.actionType === "updateInstance");
const createAction = actionSequence.find((step) => step.actionType === "createEntity");
const operations = updateAction?.payload?.objects?.[0]?.definition?.externalService?.operations;
const entity = createAction?.payload?.entities?.[0];

if (!Array.isArray(operations) || operations.length === 0) {
  throw new Error("syncExternalServiceSchema produced no operations[]");
}
if (!entity || entity.uuid !== ENTITY_UUID) {
  throw new Error("syncExternalServiceSchema did not produce SpotifyPlaylist entity");
}

const reviewedEndpoint = {
  ...endpointSkeleton,
  application: APPLICATION_UUID,
  definition: {
    externalService: {
      ...endpointSkeleton.definition.externalService,
      openApiDocument: openApiDocumentString,
      operations,
    },
  },
};

writeFileSync(endpointPath, `${JSON.stringify(reviewedEndpoint, null, 2)}\n`, "utf8");
writeFileSync(entityPath, `${JSON.stringify(entity, null, 2)}\n`, "utf8");

const firstOp = operations[0] as { operationId?: string; responseSchema?: unknown };
console.log("dogfood-sync-spotify-schema: wrote reviewed assets");
console.log(`  excerpt: ${Buffer.byteLength(openApiDocumentString)} B compact`);
console.log(`  composite: ${Buffer.byteLength(JSON.stringify(composite))} B compact`);
console.log(`  operations[0].operationId: ${firstOp.operationId}`);
console.log(
  `  operations[0]: ${Buffer.byteLength(JSON.stringify(firstOp))} B compact`,
);
console.log(
  `  entity.mlSchema: ${Buffer.byteLength(JSON.stringify(entity.mlSchema))} B compact`,
);
console.log(`  endpoint → ${endpointPath}`);
console.log(`  entity   → ${entityPath}`);
