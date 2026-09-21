/**
 * Design-time sync: OpenAPI document + app model + endpointUuid
 * → compositeActionSequence (upsert endpoint operations[]; createEntity only
 * when operationSync.<operationId>.entity is set).
 *
 * Deep module: only `handleTransformer_syncExternalServiceSchema` is imported
 * by TransformersForRuntime. The yaml parser lives here (sync-time only).
 * ExternalServiceClient must not import this file.
 */

import { parse as parseYaml } from "yaml";

import type { CoreTransformerForBuildPlusRuntime } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  getExternalService,
  type EndpointExternalService,
  type EndpointOperationSyncEntry,
} from "../0_interfaces/1_core/endpointDefinition";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { TransformerFailure, type TransformerReturnType } from "../0_interfaces/2_domain/DomainElement";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import type { ResolveBuildTransformersTo, Step } from "./Transformers";
import { cleanLevel } from "./constants";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(
  packageName,
  cleanLevel,
  "syncExternalServiceSchema",
);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

const ENTITY_ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITY_VERSION_OF_ENTITY_UUID = "381ab1be-337f-4198-b1d3-f686867fc1dd";
const COMPOSITE_ACTION_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const INSTANCE_ACTION_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ACTION_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";

const HTTP_METHODS = ["get", "put", "post", "patch", "delete", "head", "options"] as const;

type BoundTree = {
  children: Record<string, BoundTree>;
};

type JzodElementLike = {
  type: string;
  nullable?: boolean;
  optional?: boolean;
  definition?: unknown;
};

function fail(transformerPath: string[], message: string): TransformerFailure {
  return new TransformerFailure({
    queryFailure: "FailedTransformer",
    transformerPath,
    failureOrigin: ["syncExternalServiceSchema"],
    failureMessage: message,
  });
}

function parseOpenApiDocument(input: unknown): Record<string, unknown> {
  if (input !== null && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  if (typeof input !== "string") {
    throw new Error("openApiDocument must be a YAML/JSON string or an object");
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new Error("openApiDocument is empty");
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as Record<string, unknown>;
  }
  return parseYaml(trimmed) as Record<string, unknown>;
}

function pathsToTree(paths: string[]): BoundTree {
  const root: BoundTree = { children: {} };
  for (const path of paths) {
    let node = root;
    for (const part of path.split(".").filter(Boolean)) {
      node.children[part] ??= { children: {} };
      node = node.children[part];
    }
  }
  return root;
}

function isEmptyBound(bound: BoundTree | undefined): boolean {
  return !bound || Object.keys(bound.children).length === 0;
}

function resolveJsonPointer(doc: Record<string, unknown>, pointer: string): unknown {
  if (!pointer.startsWith("#/")) {
    throw new Error(`unsupported $ref "${pointer}" (only document-local #/ refs are resolved)`);
  }
  const parts = pointer
    .slice(2)
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  let current: unknown = doc;
  for (const part of parts) {
    if (current === null || typeof current !== "object") {
      throw new Error(`unresolved $ref "${pointer}"`);
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (current === undefined) {
    throw new Error(`unresolved $ref "${pointer}"`);
  }
  return current;
}

function deref(
  doc: Record<string, unknown>,
  schema: unknown,
  stack: string[] = [],
): Record<string, unknown> {
  if (schema === null || typeof schema !== "object" || Array.isArray(schema)) {
    return (schema ?? {}) as Record<string, unknown>;
  }
  const record = schema as Record<string, unknown>;
  const ref = record.$ref;
  if (typeof ref !== "string") {
    return record;
  }
  if (stack.includes(ref)) {
    throw new Error(`cyclic $ref "${ref}"`);
  }
  const resolved = resolveJsonPointer(doc, ref);
  return deref(doc, resolved, [...stack, ref]);
}

function flattenAllOf(
  doc: Record<string, unknown>,
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const allOf = schema.allOf;
  if (!Array.isArray(allOf) || allOf.length === 0) {
    return schema;
  }
  const mergedProperties: Record<string, unknown> = {};
  let nullable = schema.nullable === true;
  let type = schema.type;
  for (const part of allOf) {
    const flattened = flattenAllOf(doc, deref(doc, part));
    if (flattened.nullable === true) {
      nullable = true;
    }
    if (flattened.type !== undefined) {
      type = flattened.type;
    }
    const props = flattened.properties;
    if (props !== null && typeof props === "object" && !Array.isArray(props)) {
      Object.assign(mergedProperties, props);
    }
  }
  const ownProps = schema.properties;
  if (ownProps !== null && typeof ownProps === "object" && !Array.isArray(ownProps)) {
    Object.assign(mergedProperties, ownProps);
  }
  return {
    ...schema,
    type: type ?? "object",
    nullable: nullable || undefined,
    properties: mergedProperties,
    allOf: undefined,
  };
}

function isObjectSchema(schema: Record<string, unknown>): boolean {
  return (
    schema.type === "object" ||
    schema.properties !== undefined ||
    Array.isArray(schema.allOf)
  );
}

function variantHasBoundFields(
  doc: Record<string, unknown>,
  schema: Record<string, unknown>,
  bound: BoundTree,
): boolean {
  const flat = flattenAllOf(doc, deref(doc, schema));
  if (isEmptyBound(bound)) {
    return isObjectSchema(flat);
  }
  const props =
    flat.properties !== null && typeof flat.properties === "object" && !Array.isArray(flat.properties)
      ? (flat.properties as Record<string, unknown>)
      : {};
  for (const key of Object.keys(bound.children)) {
    if (props[key] === undefined) {
      return false;
    }
  }
  return true;
}

function convertSchema(
  doc: Record<string, unknown>,
  schema: unknown,
  bound: BoundTree | undefined,
  transformerPath: string[],
): JzodElementLike {
  const derefed = flattenAllOf(doc, deref(doc, schema));
  const alternatives = (derefed.oneOf ?? derefed.anyOf) as unknown[] | undefined;
  if (Array.isArray(alternatives) && alternatives.length > 0) {
    const keyword = derefed.oneOf ? "oneOf" : "anyOf";
    if (!bound || isEmptyBound(bound)) {
      throw new Error(
        `syncExternalServiceSchema: ${keyword} is outside the bounded OpenAPI subset and cannot be converted`,
      );
    }
    const matching = alternatives.filter((variant) =>
      variantHasBoundFields(doc, deref(doc, variant), bound),
    );
    if (matching.length !== 1) {
      throw new Error(
        `syncExternalServiceSchema: ${keyword} is outside the bounded OpenAPI subset and cannot be converted`,
      );
    }
    return convertSchema(doc, matching[0], bound, transformerPath);
  }

  const nullable = derefed.nullable === true;
  const items = derefed.items;
  if (derefed.type === "array" || items !== undefined) {
    return {
      type: "array",
      ...(nullable ? { nullable: true } : {}),
      definition: convertSchema(doc, items ?? {}, bound, transformerPath),
    };
  }

  if (isObjectSchema(derefed)) {
    const props =
      derefed.properties !== null &&
      typeof derefed.properties === "object" &&
      !Array.isArray(derefed.properties)
        ? (derefed.properties as Record<string, unknown>)
        : {};
    const definition: Record<string, JzodElementLike> = {};
    if (!isEmptyBound(bound)) {
      for (const [key, childBound] of Object.entries(bound!.children)) {
        if (props[key] === undefined) {
          continue;
        }
        definition[key] = convertSchema(doc, props[key], childBound, transformerPath);
      }
    } else {
      for (const [key, prop] of Object.entries(props)) {
        definition[key] = convertSchema(doc, prop, undefined, transformerPath);
      }
    }
    return {
      type: "object",
      ...(nullable ? { nullable: true } : {}),
      definition,
    };
  }

  const scalarType =
    derefed.type === "integer" || derefed.type === "number"
      ? "number"
      : derefed.type === "boolean"
        ? "boolean"
        : "string";
  return {
    type: scalarType,
    ...(nullable ? { nullable: true } : {}),
  };
}

function collectParameters(
  doc: Record<string, unknown>,
  pathItem: Record<string, unknown>,
  operation: Record<string, unknown>,
): Array<{ name: string; in: string; required?: boolean }> {
  const raw = [
    ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
    ...(Array.isArray(operation.parameters) ? operation.parameters : []),
  ];
  const byKey = new Map<string, { name: string; in: string; required?: boolean }>();
  for (const entry of raw) {
    const resolved = deref(doc, entry);
    const name = typeof resolved.name === "string" ? resolved.name : undefined;
    const location = typeof resolved.in === "string" ? resolved.in : undefined;
    if (!name || !location) {
      continue;
    }
    byKey.set(`${location}:${name}`, {
      name,
      in: location,
      ...(resolved.required === true ? { required: true } : {}),
    });
  }
  return [...byKey.values()];
}

function responseSchemaForOperation(
  doc: Record<string, unknown>,
  operation: Record<string, unknown>,
): unknown {
  const responses =
    operation.responses !== null && typeof operation.responses === "object"
      ? (operation.responses as Record<string, unknown>)
      : {};
  const ok = responses["200"] ?? responses["201"] ?? responses.default;
  if (ok === undefined) {
    throw new Error("syncExternalServiceSchema: GET operation has no 200/201 response schema");
  }
  const resolved = deref(doc, ok);
  const content =
    resolved.content !== null && typeof resolved.content === "object"
      ? (resolved.content as Record<string, unknown>)
      : {};
  const json =
    (content["application/json"] as Record<string, unknown> | undefined) ??
    (Object.values(content)[0] as Record<string, unknown> | undefined);
  if (!json || json.schema === undefined) {
    throw new Error("syncExternalServiceSchema: GET operation response has no JSON schema");
  }
  return json.schema;
}

function findEndpoints(appModel: unknown): any[] {
  if (appModel === null || typeof appModel !== "object") {
    return [];
  }
  const record = appModel as Record<string, any>;
  if (record.endpointsByUuid && typeof record.endpointsByUuid === "object") {
    return Object.values(record.endpointsByUuid);
  }
  if (Array.isArray(record.endpoints)) {
    return record.endpoints;
  }
  if (record.currentModel && Array.isArray(record.currentModel.endpoints)) {
    return record.currentModel.endpoints;
  }
  return [];
}

function pickEndpoint(appModel: unknown, preferredUuid: string): any {
  return findEndpoints(appModel).find((e) => e?.uuid === preferredUuid);
}

function resolveOperationSync(
  transformerParams: Record<string, any>,
  existingExternal: EndpointExternalService,
): Record<string, EndpointOperationSyncEntry> {
  const fromParams = transformerParams.operationSync;
  if (fromParams !== null && typeof fromParams === "object" && !Array.isArray(fromParams)) {
    return fromParams as Record<string, EndpointOperationSyncEntry>;
  }
  return existingExternal.operationSync ?? {};
}

function buildCompositeAction(params: {
  endpointInstance: any;
  operations: any[];
  entities: Record<string, unknown>[];
}): Record<string, unknown> {
  const application = params.endpointInstance.application;
  const updatedEndpoint = {
    ...params.endpointInstance,
    definition: {
      ...params.endpointInstance.definition,
      externalService: {
        ...getExternalService(params.endpointInstance),
        operations: params.operations,
      },
    },
  };
  const actionSequence: Record<string, unknown>[] = [
    {
      actionType: "updateInstance",
      actionLabel: "upsertExternalServiceOperations",
      endpoint: INSTANCE_ACTION_ENDPOINT,
      payload: {
        application,
        applicationSection: "model",
        objects: [updatedEndpoint],
      },
    },
  ];
  for (const entity of params.entities) {
    actionSequence.push({
      actionType: "createEntity",
      actionLabel: `create${entity.name}`,
      endpoint: MODEL_ACTION_ENDPOINT,
      payload: {
        application,
        entities: [entity],
      },
    });
  }
  return {
    actionType: "compositeActionSequence",
    actionLabel: "syncExternalServiceSchema",
    endpoint: COMPOSITE_ACTION_ENDPOINT,
    payload: {
      actionSequence,
    },
  };
}

function syncExternalServiceSchemaValue(
  transformerPath: string[],
  transformerParams: Record<string, any>,
  transformer: Record<string, any>,
): TransformerReturnType<any> {
  const openApiDocumentInput =
    transformerParams.openApiDocument ?? transformer.openApiDocument;
  const appModel = transformerParams.appModel ?? transformer.appModel;
  const endpointUuid = transformerParams.endpointUuid ?? transformer.endpointUuid;

  if (openApiDocumentInput === undefined) {
    return fail(transformerPath, "syncExternalServiceSchema requires transformerParams.openApiDocument");
  }
  if (typeof endpointUuid !== "string" || endpointUuid.length === 0) {
    return fail(transformerPath, "syncExternalServiceSchema requires transformerParams.endpointUuid");
  }

  let doc: Record<string, unknown>;
  try {
    doc = parseOpenApiDocument(openApiDocumentInput);
  } catch (error: any) {
    return fail(
      transformerPath,
      `syncExternalServiceSchema: failed to parse openApiDocument: ${error?.message ?? String(error)}`,
    );
  }

  const endpointInstance = pickEndpoint(appModel, endpointUuid);
  if (!endpointInstance) {
    return fail(
      transformerPath,
      "syncExternalServiceSchema requires transformerParams.appModel with an externalService endpoint matching endpointUuid",
    );
  }
  const existingExternal = getExternalService(endpointInstance);
  if (!existingExternal) {
    return fail(
      transformerPath,
      "syncExternalServiceSchema: appModel endpoint is not an externalService endpoint",
    );
  }

  let scope = transformerParams.scope ?? transformer.scope;
  if (!Array.isArray(scope) || scope.length === 0) {
    const enabled = existingExternal.enabledOperations;
    if (Array.isArray(enabled) && enabled.length > 0) {
      scope = enabled;
    } else {
      return fail(
        transformerPath,
        "syncExternalServiceSchema requires transformerParams.scope (operationIds)",
      );
    }
  }

  const operationSync = resolveOperationSync(transformerParams, existingExternal);
  const existingOperations = Array.isArray(existingExternal.operations)
    ? [...existingExternal.operations]
    : [];
  const createdEntities: Record<string, unknown>[] = [];

  const paths =
    doc.paths !== null && typeof doc.paths === "object"
      ? (doc.paths as Record<string, unknown>)
      : {};

  try {
    for (const [path, pathItemRaw] of Object.entries(paths)) {
      const pathItem = deref(doc, pathItemRaw);
      for (const method of HTTP_METHODS) {
        const operationRaw = pathItem[method];
        if (operationRaw === undefined) {
          continue;
        }
        const operation = deref(doc, operationRaw);
        const operationId =
          typeof operation.operationId === "string" ? operation.operationId : undefined;
        if (!operationId || !scope.includes(operationId)) {
          continue;
        }
        if (method !== "get") {
          log.info(
            "syncExternalServiceSchema skipping non-GET operation in scope",
            operationId,
            method,
          );
          continue;
        }

        const syncEntry = operationSync[operationId];
        const boundPaths = syncEntry?.boundPaths;
        if (!Array.isArray(boundPaths) || boundPaths.length === 0) {
          throw new Error(
            `syncExternalServiceSchema: operationSync.${operationId}.boundPaths is required`,
          );
        }

        const parameterMappings = collectParameters(doc, pathItem, operation);
        const responseSchema = convertSchema(
          doc,
          responseSchemaForOperation(doc, operation),
          pathsToTree(boundPaths),
          transformerPath,
        );

        const materialized = {
          operationId,
          method: "GET",
          path,
          parameterMappings,
          responseSchema,
        };
        const existingIndex = existingOperations.findIndex(
          (op: any) => op?.operationId === operationId,
        );
        if (existingIndex >= 0) {
          existingOperations[existingIndex] = materialized;
        } else {
          existingOperations.push(materialized);
        }

        const entitySpec = syncEntry?.entity;
        if (!entitySpec?.uuid) {
          continue;
        }
        createdEntities.push({
          uuid: entitySpec.uuid,
          parentName: "Entity",
          parentUuid: ENTITY_ENTITY_UUID,
          parentDefinitionVersionUuid:
            entitySpec.entityVersionUuid ?? ENTITY_VERSION_OF_ENTITY_UUID,
          selfApplication: endpointInstance.application,
          name: entitySpec.name ?? operationId,
          conceptLevel: "Model",
          description: `External HTTP entity for ${operationId}`,
          idAttribute: "id",
          externalDataSource: {
            kind: "http",
            endpoint: endpointInstance.uuid,
          },
          mlSchema: responseSchema,
        });
      }
    }
  } catch (error: any) {
    return fail(transformerPath, error?.message ?? String(error));
  }

  return buildCompositeAction({
    endpointInstance,
    operations: existingOperations,
    entities: createdEntities,
  });
}

export function handleTransformer_syncExternalServiceSchema(
  _step: Step,
  transformerPath: string[],
  _label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime | Record<string, any>,
  _resolveBuildTransformersTo: ResolveBuildTransformersTo,
  _modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  _contextResults?: Record<string, any>,
): TransformerReturnType<any> {
  log.info(
    "handleTransformer_syncExternalServiceSchema",
    "scope",
    transformerParams.scope ?? (transformer as any).scope,
  );
  return syncExternalServiceSchemaValue(
    transformerPath,
    transformerParams,
    transformer as Record<string, any>,
  );
}
