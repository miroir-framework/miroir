import { getEndpointActions } from "../0_interfaces/1_core/endpointDefinition.js";
import type { Uuid } from "../0_interfaces/1_core/EntityVersion";
import { applyDeploymentDomainActionCarryOn } from "../0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchemaHelpers";
import { miroirFundamentalMlSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalMlSchema";
import type {
  Action,
  MlElement,
  MlLiteral,
  MlObject,
  MlReference,
  MlUnion,
  MetaModel,
  MlSchema,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { selfApplicationMiroir } from "miroir-app-miroir";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { applicationTransformerBranches } from "./TransformerDefinitionRegistry";
import { computeCombinedSchemaRevision } from "../1_core/mls/schemaChangeKind";
import { resolveEffectiveSchemaMode } from "../1_core/mls/schemaModePolicy";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "schemaForDeployment");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => { log = logger; });

export type SchemaResolutionMode = "static" | "extended" | "auto";

const schemaCacheByRevision = new Map<string, MlSchema>();

/** @internal Test-only cache reset */
export function clearSchemaCacheForTests(): void {
  schemaCacheByRevision.clear();
}

function cacheKey(
  deploymentUuid: Uuid,
  model: MetaModel,
  mode: SchemaResolutionMode,
): string {
  return `${deploymentUuid}:${mode}:${computeCombinedSchemaRevision(deploymentUuid, model)}`;
}

function getCachedSchema(
  deploymentUuid: Uuid,
  model: MetaModel,
  mode: SchemaResolutionMode,
): MlSchema | undefined {
  return schemaCacheByRevision.get(cacheKey(deploymentUuid, model, mode));
}

function setCachedSchema(
  deploymentUuid: Uuid,
  model: MetaModel,
  mode: SchemaResolutionMode,
  schema: MlSchema,
): void {
  schemaCacheByRevision.set(cacheKey(deploymentUuid, model, mode), schema);
}

function hasAppSpecificEndpoints(model: MetaModel): boolean {
  if (model.applicationUuid === selfApplicationMiroir.uuid) {
    return false;
  }
  return model.endpoints.some((endpoint) => endpoint.application === model.applicationUuid);
}

function getAppSpecificEndpoints(model: MetaModel) {
  return model.endpoints.filter((endpoint) => endpoint.application === model.applicationUuid);
}

/** #502: the composite TransformerDefinitions of the application, as transformer union branches. */
function getAppTransformerBranches(model: MetaModel): Record<string, MlElement> {
  if (model.applicationUuid === selfApplicationMiroir.uuid) {
    return {};
  }
  return applicationTransformerBranches(model.transformerDefinitions);
}

function shouldBuildExtendedSchema(model: MetaModel, mode: SchemaResolutionMode): boolean {
  if (mode === "static") {
    return false;
  }
  return hasAppSpecificEndpoints(model) || Object.keys(getAppTransformerBranches(model)).length > 0;
}

function actionTypeKeyFromLiteral(actionType: MlLiteral | undefined): string | undefined {
  if (actionType?.type === "literal") {
    return actionType.definition;
  }
  return undefined;
}

function actionTypeKeyFromDomainActionBranch(branch: MlElement): string | undefined {
  if (branch.type === "schemaReference") {
    return (branch as MlReference).definition.relativePath;
  }
  if (branch.type === "object") {
    const objectDefinition = (branch as MlObject).definition as Action["actionParameters"];
    return actionTypeKeyFromLiteral(objectDefinition.actionType);
  }
  return undefined;
}

function buildAppActionBranches(
  appEndpoints: MetaModel["endpoints"],
  existingDomainActionBranches: MlElement[],
): MlElement[] {
  const existingActionTypes = new Set(
    existingDomainActionBranches
      .map(actionTypeKeyFromDomainActionBranch)
      .filter((key): key is string => key !== undefined),
  );

  const branches: MlElement[] = [];
  for (const endpoint of appEndpoints) {
    for (const action of getEndpointActions(endpoint) ?? []) {
      const actionParameters = action.actionParameters;
      const actionTypeKey = actionTypeKeyFromLiteral(actionParameters.actionType);
      if (actionTypeKey && existingActionTypes.has(actionTypeKey)) {
        log.warn(
          `[getMiroirFundamentalSchemaForDeployment] Skipping duplicate domainAction branch for actionType "${actionTypeKey}" (endpoint ${endpoint.uuid})`,
        );
        continue;
      }
      if (actionTypeKey) {
        existingActionTypes.add(actionTypeKey);
      }
      branches.push({
        type: "object",
        definition: actionParameters,
      } satisfies MlObject);
    }
  }
  return branches;
}

/**
 * #502: `schema` with `branches` in the context and referenced by both transformer unions, so the
 * form, the transformerType select and the default node of a type change know them.
 */
function withAppTransformerBranches(schema: MlSchema, branches: Record<string, MlElement>): MlSchema {
  const branchNames = Object.keys(branches);
  if (branchNames.length === 0) {
    return schema;
  }
  const context = (schema.definition as { context: Record<string, MlElement> }).context;
  const references: MlElement[] = branchNames.map((relativePath) => ({
    type: "schemaReference",
    definition: { absolutePath: schema.uuid, relativePath },
  }));
  const extendedUnion = (unionName: string): MlUnion => {
    const union = context[unionName] as MlUnion;
    return { ...union, definition: [...union.definition, ...references] };
  };
  return {
    ...schema,
    definition: {
      ...schema.definition,
      context: {
        ...context,
        ...branches,
        coreTransformerForBuildPlusRuntime: extendedUnion("coreTransformerForBuildPlusRuntime"),
        coreTransformerForBuildPlusRuntimeWithoutArray: extendedUnion("coreTransformerForBuildPlusRuntimeWithoutArray"),
      },
    },
  } as MlSchema;
}

function buildExtendedSchema(model: MetaModel): MlSchema {
  const baseSchema = miroirFundamentalMlSchema as MlSchema & { definition: any };
  const transformerBranches = getAppTransformerBranches(model);
  if (!hasAppSpecificEndpoints(model)) {
    return withAppTransformerBranches(baseSchema, transformerBranches);
  }
  const appEndpoints = getAppSpecificEndpoints(model);
  const staticDomainAction = baseSchema.definition.context.domainAction as MlUnion;
  const appActionBranches = buildAppActionBranches(
    appEndpoints,
    staticDomainAction.definition,
  );
  const extendedDomainAction: MlUnion = {
    ...staticDomainAction,
    definition: [...staticDomainAction.definition, ...appActionBranches],
  };

  return withAppTransformerBranches(
    applyDeploymentDomainActionCarryOn(baseSchema, extendedDomainAction),
    transformerBranches,
  );
}

/**
 * Returns the ML schema for a deployment + model with an explicit resolution mode.
 * - `'static'` → build artifact only (no carry-on, no app endpoint branches)
 * - `'extended'` → app endpoint branches + carry-on when app-owned endpoints exist
 * - `'auto'` → legacy 198 behavior (extended when `hasAppSpecificEndpoints`)
 */
export function resolveFundamentalSchemaForDeployment(
  deploymentUuid: Uuid,
  model: MetaModel,
  mode: SchemaResolutionMode = "auto",
): MlSchema {
  const effectiveMode = resolveEffectiveSchemaMode(mode);

  if (effectiveMode === "static") {
    return miroirFundamentalMlSchema as MlSchema;
  }

  const cached = getCachedSchema(deploymentUuid, model, effectiveMode);
  if (cached) {
    return cached;
  }

  const schema = !shouldBuildExtendedSchema(model, effectiveMode)
    ? (miroirFundamentalMlSchema as MlSchema)
    : buildExtendedSchema(model);

  setCachedSchema(deploymentUuid, model, effectiveMode, schema);
  return schema;
}

/**
 * Returns the ML schema for a deployment + model.
 * Phase 2.1+: distinct schema object when the model has app-owned endpoints.
 * Phase 2.2+: extends domainAction with app endpoint action shapes.
 * Phase 2.4+: rebuilds carry-on templates (actionTemplate) for extended domainAction.
 */
export function getMiroirFundamentalSchemaForDeployment(
  deploymentUuid: Uuid,
  model: MetaModel,
): MlSchema {
  return resolveFundamentalSchemaForDeployment(deploymentUuid, model, "auto");
}
