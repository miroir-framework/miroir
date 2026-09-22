/**
 * Design-time helper: turn a displayed OpenAPI Endpoint instance into the
 * syncExternalServiceSchema composite (scope omitted → enabledOperations).
 *
 * Lives outside syncExternalServiceSchema.ts so TransformersForRuntime can
 * keep importing the handler without a cycle.
 */

import {
  asOpenApiSyncEndpoint,
  getExternalService,
  isOpenApiExternalServiceEndpoint,
  type EndpointDefinitionLike,
} from "../0_interfaces/1_core/endpointDefinition";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { TransformerFailure, type TransformerReturnType } from "../0_interfaces/2_domain/DomainElement";
import { transformer_extended_apply } from "./TransformersForRuntime";

export type OpenApiEndpointSyncSource = EndpointDefinitionLike & { uuid?: string };

export function buildOpenApiEndpointSyncComposite(
  endpoint: OpenApiEndpointSyncSource | undefined | null,
  modelEnvironment: MiroirModelEnvironment,
): TransformerReturnType<any> {
  if (endpoint == null) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath: [],
      failureOrigin: ["buildOpenApiEndpointSyncComposite"],
      failureMessage: "OpenAPI Endpoint sync requires an endpoint uuid",
    });
  }
  const uuid = endpoint.uuid;
  if (typeof uuid !== "string" || uuid.length === 0) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath: [],
      failureOrigin: ["buildOpenApiEndpointSyncComposite"],
      failureMessage: "OpenAPI Endpoint sync requires an endpoint uuid",
    });
  }
  if (!isOpenApiExternalServiceEndpoint(endpoint)) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath: [],
      failureOrigin: ["buildOpenApiEndpointSyncComposite"],
      failureMessage: "OpenAPI Endpoint sync requires definition.externalService.openApiDocument",
    });
  }
  const syncEndpoint = asOpenApiSyncEndpoint(endpoint);
  const external = getExternalService(syncEndpoint);
  if (!external) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath: [],
      failureOrigin: ["buildOpenApiEndpointSyncComposite"],
      failureMessage: "OpenAPI Endpoint sync requires definition.externalService.openApiDocument",
    });
  }
  return transformer_extended_apply(
    "runtime",
    [],
    "syncExternalServiceSchema",
    { transformerType: "syncExternalServiceSchema", interpolation: "runtime" } as any,
    "value",
    modelEnvironment,
    {
      openApiDocument: external.openApiDocument,
      appModel: { endpoints: [syncEndpoint] },
      endpointUuid: uuid,
    },
  );
}

export function extractSyncedEndpointFromComposite(composite: unknown): unknown | undefined {
  if (composite === null || typeof composite !== "object") {
    return undefined;
  }
  const sequence = (composite as { payload?: { actionSequence?: unknown } }).payload?.actionSequence;
  if (!Array.isArray(sequence)) {
    return undefined;
  }
  const upsert = sequence.find(
    (action) =>
      action !== null &&
      typeof action === "object" &&
      (action as { actionLabel?: unknown }).actionLabel === "upsertExternalServiceOperations",
  ) as { payload?: { objects?: unknown[] } } | undefined;
  const objects = upsert?.payload?.objects;
  if (!Array.isArray(objects) || objects.length === 0) {
    return undefined;
  }
  return objects[0];
}
