/**
 * Dogfood: run syncExternalServiceSchema on the committed Spotify
 * OpenAPI excerpt and write reviewed operations[] onto the Endpoint asset.
 * Writes Entity JSON only when operationSync.<id>.entity is set.
 *
 * Usage (from repo root):
 *   npm run dogfood-sync -w miroir-test-app_deployment-spotify
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const entityDir = join(
  packageRoot,
  "assets/spotify_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);

const ENDPOINT_UUID = "0e5cb172-12ea-4467-8598-5889338ae454";
const APPLICATION_UUID = "00514586-bf72-4de3-beea-0a627c821404";

const excerpt = JSON.parse(readFileSync(excerptPath, "utf8"));
const endpointSkeleton = JSON.parse(readFileSync(endpointPath, "utf8"));

const openApiDocumentString = JSON.stringify(excerpt);
const operationSync =
  endpointSkeleton.definition?.externalService?.operationSync ?? {};

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
const operations = updateAction?.payload?.objects?.[0]?.definition?.externalService?.operations;

if (!Array.isArray(operations) || operations.length === 0) {
  throw new Error("syncExternalServiceSchema produced no operations[]");
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

const optedInEntityUuids = new Set(
  Object.values(operationSync as Record<string, { entity?: { uuid?: string } }>)
    .map((entry) => entry?.entity?.uuid)
    .filter((uuid): uuid is string => typeof uuid === "string" && uuid.length > 0),
);

const createdEntities = actionSequence
  .filter((step) => step.actionType === "createEntity")
  .flatMap((step) => step.payload?.entities ?? []);

for (const entity of createdEntities) {
  const uuid = typeof entity.uuid === "string" ? entity.uuid : undefined;
  if (!uuid || !optedInEntityUuids.has(uuid)) {
    continue;
  }
  mkdirSync(entityDir, { recursive: true });
  const entityPath = join(entityDir, `${uuid}.json`);
  writeFileSync(entityPath, `${JSON.stringify(entity, null, 2)}\n`, "utf8");
  console.log(`  entity   → ${entityPath}`);
}

const firstOp = operations[0] as { operationId?: string; responseSchema?: unknown };
console.log("dogfood-sync-spotify-schema: wrote reviewed assets");
console.log(`  excerpt: ${Buffer.byteLength(openApiDocumentString)} B compact`);
console.log(`  composite: ${Buffer.byteLength(JSON.stringify(composite))} B compact`);
console.log(`  operations[0].operationId: ${firstOp.operationId}`);
console.log(
  `  operations[0]: ${Buffer.byteLength(JSON.stringify(firstOp))} B compact`,
);
console.log(`  endpoint → ${endpointPath}`);
if (optedInEntityUuids.size === 0) {
  console.log("  entity   → skipped (operationSync.entity not set)");
}
