import type { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
import { applyDeploymentDomainActionCarryOn } from "../../0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers";
import { miroirFundamentalJzodSchema } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import type {
  Action,
  JzodElement,
  JzodLiteral,
  JzodObject,
  JzodReference,
  JzodUnion,
  MetaModel,
  MlSchema,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
import { computeCombinedSchemaRevision } from "./schemaChangeKind";
import { resolveEffectiveSchemaMode } from "./schemaModePolicy";

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

function shouldBuildExtendedSchema(model: MetaModel, mode: SchemaResolutionMode): boolean {
  if (mode === "static") {
    return false;
  }
  return hasAppSpecificEndpoints(model);
}

function actionTypeKeyFromLiteral(actionType: JzodLiteral | undefined): string | undefined {
  if (actionType?.type === "literal") {
    return actionType.definition;
  }
  return undefined;
}

function actionTypeKeyFromDomainActionBranch(branch: JzodElement): string | undefined {
  if (branch.type === "schemaReference") {
    return (branch as JzodReference).definition.relativePath;
  }
  if (branch.type === "object") {
    const objectDefinition = (branch as JzodObject).definition as Action["actionParameters"];
    return actionTypeKeyFromLiteral(objectDefinition.actionType);
  }
  return undefined;
}

function buildAppActionBranches(
  appEndpoints: MetaModel["endpoints"],
  existingDomainActionBranches: JzodElement[],
): JzodElement[] {
  const existingActionTypes = new Set(
    existingDomainActionBranches
      .map(actionTypeKeyFromDomainActionBranch)
      .filter((key): key is string => key !== undefined),
  );

  const branches: JzodElement[] = [];
  for (const endpoint of appEndpoints) {
    for (const action of endpoint.definition?.actions ?? []) {
      const actionParameters = action.actionParameters;
      const actionTypeKey = actionTypeKeyFromLiteral(actionParameters.actionType);
      if (actionTypeKey && existingActionTypes.has(actionTypeKey)) {
        console.warn(
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
      } satisfies JzodObject);
    }
  }
  return branches;
}

function buildExtendedSchema(model: MetaModel): MlSchema {
  const baseSchema = miroirFundamentalJzodSchema as MlSchema & { definition: any };
  const appEndpoints = getAppSpecificEndpoints(model);
  const staticDomainAction = baseSchema.definition.context.domainAction as JzodUnion;
  const appActionBranches = buildAppActionBranches(
    appEndpoints,
    staticDomainAction.definition,
  );
  const extendedDomainAction: JzodUnion = {
    ...staticDomainAction,
    definition: [...staticDomainAction.definition, ...appActionBranches],
  };

  return applyDeploymentDomainActionCarryOn(baseSchema, extendedDomainAction);
}

/**
 * Returns the jzod schema for a deployment + model with an explicit resolution mode.
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
    return miroirFundamentalJzodSchema as MlSchema;
  }

  const cached = getCachedSchema(deploymentUuid, model, effectiveMode);
  if (cached) {
    return cached;
  }

  const schema = !shouldBuildExtendedSchema(model, effectiveMode)
    ? (miroirFundamentalJzodSchema as MlSchema)
    : buildExtendedSchema(model);

  setCachedSchema(deploymentUuid, model, effectiveMode, schema);
  return schema;
}

/**
 * Returns the jzod schema for a deployment + model.
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
