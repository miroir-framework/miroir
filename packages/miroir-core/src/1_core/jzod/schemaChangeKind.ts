import type { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
import type {
  EndpointDefinition,
  EntityDefinition,
  Menu,
  MetaModel,
  MlSchema,
  Query,
  Report,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

export type SchemaChangeKind = "none" | "app-overlay" | "meta-full-carry-on";
export type SchemaRevisionScope = "meta" | "app";

export function classifySchemaChange(
  prevRevision: string,
  nextRevision: string,
  scope: SchemaRevisionScope,
): SchemaChangeKind {
  if (prevRevision === nextRevision) {
    return "none";
  }
  return scope === "meta" ? "meta-full-carry-on" : "app-overlay";
}

/**
 * Fingerprint of schema-relevant model content for a deployment + application scope.
 * Instance/data payloads are excluded — only structural definitions affect the revision.
 */
export function computeSchemaRevision(
  deploymentUuid: Uuid,
  model: MetaModel,
  applicationUuid: Uuid,
): string {
  const payload =
    applicationUuid === selfApplicationMiroir.uuid
      ? buildMetaSchemaRevisionPayload(deploymentUuid, model)
      : buildAppSchemaRevisionPayload(deploymentUuid, model, applicationUuid);

  return hashStableValue(payload);
}

export function computeCombinedSchemaRevision(deploymentUuid: Uuid, model: MetaModel): string {
  const metaRevision = computeSchemaRevision(deploymentUuid, model, selfApplicationMiroir.uuid);
  const appRevision = computeSchemaRevision(deploymentUuid, model, model.applicationUuid);
  return `${metaRevision}:${appRevision}`;
}

function definedArray<T>(values: T[] | undefined | null): T[] {
  return values ?? [];
}

function buildMetaSchemaRevisionPayload(deploymentUuid: Uuid, model: MetaModel) {
  return {
    scope: "meta" as const,
    deploymentUuid,
    entityDefinitions: fingerprintEntityDefinitions(model.entityDefinitions),
    reports: fingerprintReports(model.reports),
    storedQueries: fingerprintQueries(model.storedQueries),
    runners: fingerprintRunners(model.runners),
    jzodSchemas: fingerprintJzodSchemas(model.jzodSchemas),
    menus: fingerprintMenus(model.menus),
    endpoints: fingerprintEndpoints(model.endpoints),
  };
}

function buildAppSchemaRevisionPayload(
  deploymentUuid: Uuid,
  model: MetaModel,
  applicationUuid: Uuid,
) {
  const appEndpoints = definedArray(model.endpoints).filter(
    (endpoint) => endpoint.application === applicationUuid,
  );

  return {
    scope: "app" as const,
    deploymentUuid,
    applicationUuid,
    entityDefinitions: fingerprintEntityDefinitions(model.entityDefinitions),
    reports: fingerprintReports(model.reports),
    menus: fingerprintMenus(model.menus),
    endpoints: fingerprintEndpoints(appEndpoints),
    endpointActionTypes: extractEndpointActionTypes(appEndpoints),
  };
}

function fingerprintEntityDefinitions(entityDefinitions: EntityDefinition[] | undefined) {
  return [...definedArray(entityDefinitions)]
    .map((entityDefinition) => ({
      uuid: entityDefinition.uuid,
      entityUuid: entityDefinition.entityUuid,
      name: entityDefinition.name,
      viewAttributes: entityDefinition.viewAttributes,
      defaultInstanceDetailsReportUuid: entityDefinition.defaultInstanceDetailsReportUuid,
      mlSchema: entityDefinition.mlSchema,
    }))
    .sort((left, right) => left.uuid.localeCompare(right.uuid));
}

function fingerprintReports(reports: Report[] | undefined) {
  return [...definedArray(reports)]
    .map((report) => ({
      uuid: report.uuid,
      name: report.name,
      definition: report.definition,
    }))
    .sort((left, right) => left.uuid.localeCompare(right.uuid));
}

function fingerprintQueries(queries: Query[] | undefined) {
  return definedArray(queries).map((query) => sortValue(query));
}

function fingerprintRunners(runners: MetaModel["runners"] | undefined) {
  return [...definedArray(runners)]
    .map((runner) => ({
      uuid: runner.uuid,
      name: runner.name,
      definition: runner.definition,
    }))
    .sort((left, right) => left.uuid.localeCompare(right.uuid));
}

function fingerprintJzodSchemas(jzodSchemas: MlSchema[] | undefined) {
  return [...definedArray(jzodSchemas)]
    .map((schema) => ({
      uuid: schema.uuid,
      definition: schema.definition,
    }))
    .sort((left, right) => left.uuid.localeCompare(right.uuid));
}

function fingerprintMenus(menus: Menu[] | undefined) {
  return [...definedArray(menus)]
    .map((menu) => ({
      uuid: menu.uuid,
      name: menu.name,
      definition: menu.definition,
    }))
    .sort((left, right) => left.uuid.localeCompare(right.uuid));
}

function fingerprintEndpoints(endpoints: EndpointDefinition[] | undefined) {
  return [...definedArray(endpoints)]
    .map((endpoint) => ({
      uuid: endpoint.uuid,
      application: endpoint.application,
      name: endpoint.name,
      definition: endpoint.definition,
    }))
    .sort((left, right) => left.uuid.localeCompare(right.uuid));
}

function extractEndpointActionTypes(endpoints: EndpointDefinition[]): string[] {
  const actionTypes = new Set<string>();
  for (const endpoint of endpoints) {
    for (const action of endpoint.definition?.actions ?? []) {
      const actionType = action.actionParameters?.actionType;
      if (actionType?.type === "literal" && typeof actionType.definition === "string") {
        actionTypes.add(actionType.definition);
      }
    }
  }
  return [...actionTypes].sort();
}

function hashStableValue(value: unknown): string {
  const input = stableStringify(value);
  // Browser-safe fingerprint (no node:crypto) — sufficient for revision change detection.
  return `${fnv1a32Hex(input)}${fnv1a32Hex(input, 0x811c9dc5 ^ 0xffffffff)}`;
}

function fnv1a32Hex(input: string, seed = 0x811c9dc5): string {
  let hash = seed >>> 0;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortValue(nestedValue)]),
    );
  }
  return value;
}
