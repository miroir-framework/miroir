import { entityEntity } from "miroir-test-app_deployment-miroir";
import type {
  Entity,
  EntityInstance,
  ExtractorInstancesByEntity,
  ExtractorOrCombiner,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import type { ReduxDeploymentsState } from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { applyExtractorFilterAndOrderBy } from "./ExtractorByEntityReturningObjectListTools";
import { getReduxDeploymentsStateIndex } from "./ReduxDeploymentsState";
import {
  evaluateVirtualAttributesOnInstance,
  requiredVirtualAttributeNames,
  type VirtualAttributeNeed,
} from "./VirtualAttributes";

export function extractorVirtualAttributeNeed(
  extractor: Pick<ExtractorInstancesByEntity, "filter" | "orderBy" | "attributes">,
): VirtualAttributeNeed {
  return {
    filterAttributeName: extractor.filter?.attributeName,
    orderByAttributeName: extractor.orderBy?.attributeName,
    projectedAttributes: extractor.attributes,
  };
}

export function findPresentModelEntityFromDomainState(
  domainState: DomainState,
  deploymentUuid: string,
  entityUuid: string,
): Entity | undefined {
  return domainState[deploymentUuid]?.model?.[entityEntity.uuid]?.[entityUuid] as Entity | undefined;
}

export function findPresentModelEntityFromReduxState(
  state: ReduxDeploymentsState,
  deploymentUuid: string,
  entityUuid: string,
): Entity | undefined {
  const index = getReduxDeploymentsStateIndex(deploymentUuid, "model", entityEntity.uuid);
  return state[index]?.entities?.[entityUuid] as Entity | undefined;
}

export function findEntityFromExtractorState(
  state: DomainState | ReduxDeploymentsState,
  deploymentUuid: string,
  entityUuid: string,
): Entity | undefined {
  return (
    findPresentModelEntityFromDomainState(state as DomainState, deploymentUuid, entityUuid) ??
    findPresentModelEntityFromReduxState(state as ReduxDeploymentsState, deploymentUuid, entityUuid)
  );
}

/**
 * Overlay virtual attributes required by the extractor, then filter / orderBy.
 * Returned rows still carry overlay values used for comparison; strip unprojected
 * names afterwards with {@link stripUnprojectedVirtualAttributes}.
 */
export function overlayAndFilterExtractorInstances(
  entity: Entity | undefined,
  instances: EntityInstance[],
  extractor: Pick<ExtractorInstancesByEntity, "filter" | "orderBy" | "attributes">,
  modelEnvironment: MiroirModelEnvironment,
): EntityInstance[] {
  const need = extractorVirtualAttributeNeed(extractor);
  const needed = entity ? requiredVirtualAttributeNames(entity, need) : [];
  const evaluated =
    entity && needed.length > 0
      ? instances.map((instance) =>
          evaluateVirtualAttributesOnInstance(entity, instance, needed, modelEnvironment),
        )
      : instances;
  return applyExtractorFilterAndOrderBy(evaluated, extractor);
}

/** After filter/orderBy, keep only virtual names that were projected. */
export function stripUnprojectedVirtualAttributes(
  entity: Entity | undefined,
  instances: EntityInstance[],
  extractor: Pick<ExtractorInstancesByEntity, "attributes">,
  modelEnvironment: MiroirModelEnvironment,
): EntityInstance[] {
  if (!entity) {
    return instances;
  }
  const keep = requiredVirtualAttributeNames(entity, {
    projectedAttributes: extractor.attributes,
  });
  return instances.map((instance) =>
    evaluateVirtualAttributesOnInstance(entity, instance, keep, modelEnvironment),
  );
}

export function indexInstancesByUuid(instances: EntityInstance[]): Record<string, EntityInstance> {
  return instances.reduce((acc: Record<string, EntityInstance>, instance) => {
    acc[instance.uuid!] = instance;
    return acc;
  }, {});
}

/**
 * Collect attribute names a boxed query's runtimeTransformers may read
 * (`getUniqueValues.attribute`, `accessDynamicPath` / `referencePath` string segments).
 * Intersection with virtual names happens in {@link requiredVirtualAttributeNames}.
 */
export function collectReferencedAttributeNamesFromRuntimeTransformers(
  runtimeTransformers: Record<string, unknown> | undefined,
): string[] {
  const names = new Set<string>();
  walkRuntimeTransformerNode(runtimeTransformers, names);
  return [...names];
}

function walkRuntimeTransformerNode(node: unknown, names: Set<string>): void {
  if (node == null || typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      walkRuntimeTransformerNode(item, names);
    }
    return;
  }
  const obj = node as Record<string, unknown>;
  if (typeof obj.attribute === "string") {
    names.add(obj.attribute);
  }
  if (Array.isArray(obj.objectAccessPath)) {
    for (const segment of obj.objectAccessPath) {
      if (typeof segment === "string") {
        names.add(segment);
      } else {
        walkRuntimeTransformerNode(segment, names);
      }
    }
  }
  if (Array.isArray(obj.referencePath)) {
    for (const segment of obj.referencePath) {
      if (typeof segment === "string") {
        names.add(segment);
      }
    }
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key === "attribute" || key === "objectAccessPath" || key === "referencePath") {
      continue;
    }
    walkRuntimeTransformerNode(value, names);
  }
}

function extractorOrCombinerParentUuid(
  extractor: ExtractorOrCombiner | undefined,
): string | undefined {
  if (!extractor || !("parentUuid" in extractor)) {
    return undefined;
  }
  const parentUuid = (extractor as { parentUuid?: unknown }).parentUuid;
  return typeof parentUuid === "string" ? parentUuid : undefined;
}

/**
 * Overlay virtual attributes referenced by runtimeTransformers onto extractor/combiner
 * instance lists in `context`, after extractors ran (and after unprojected names were stripped).
 * Combiners without `parentUuid` (e.g. heteronomous many-to-many) are skipped.
 */
export function overlayVirtualAttributesOnQueryContextForRuntimeTransformers(
  state: DomainState | ReduxDeploymentsState,
  deploymentUuid: string,
  extractorsAndCombiners: Record<string, ExtractorOrCombiner | undefined> | undefined,
  runtimeTransformers: Record<string, unknown> | undefined,
  context: Record<string, unknown>,
  modelEnvironment: MiroirModelEnvironment,
): void {
  const referenced = collectReferencedAttributeNamesFromRuntimeTransformers(
    runtimeTransformers,
  );
  if (referenced.length === 0 || !extractorsAndCombiners) {
    return;
  }
  for (const [name, extractor] of Object.entries(extractorsAndCombiners)) {
    const parentUuid = extractorOrCombinerParentUuid(extractor);
    if (!parentUuid) {
      continue;
    }
    const entity = findEntityFromExtractorState(state, deploymentUuid, parentUuid);
    if (!entity) {
      continue;
    }
    const needed = requiredVirtualAttributeNames(entity, {
      referencedAttributeNames: referenced,
    });
    if (needed.length === 0) {
      continue;
    }
    const value = context[name];
    if (!Array.isArray(value)) {
      continue;
    }
    context[name] = value.map((instance) =>
      evaluateVirtualAttributesOnInstance(
        entity,
        instance as EntityInstance,
        needed,
        modelEnvironment,
      ),
    );
  }
}
