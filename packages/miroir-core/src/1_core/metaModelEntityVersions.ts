/**
 * #220 Phase 5a — preferred MetaModel EntityVersion accessors.
 *
 * Named helpers so freeze-adjacent code speaks EntityVersion without a full
 * MetaModel.entityDefinitions → entityVersions schema rename (deferred).
 */

import type {
  EntityVersion,
  MetaModel,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

type MetaModelWithOptionalEntityVersions = MetaModel & {
  entityVersions?: EntityVersion[] | undefined;
};

/**
 * Prefer `entityVersions` when present; otherwise fall back to legacy
 * `entityDefinitions` (typed as EntityVersion[] after #217).
 */
export function getMetaModelEntityVersions(
  model: MetaModelWithOptionalEntityVersions | null | undefined,
): EntityVersion[] {
  if (!model) {
    return [];
  }
  if (Array.isArray(model.entityVersions)) {
    return model.entityVersions;
  }
  return model.entityDefinitions ?? [];
}

/**
 * Write EntityVersion rows onto the MetaModel collection used today
 * (`entityDefinitions`). When the optional `entityVersions` field is already
 * present on the model, mirror the same array there.
 */
export function withMetaModelEntityVersions(
  model: MetaModelWithOptionalEntityVersions,
  entityVersions: EntityVersion[],
): MetaModelWithOptionalEntityVersions {
  const next: MetaModelWithOptionalEntityVersions = {
    ...model,
    entityDefinitions: entityVersions,
  };
  if ("entityVersions" in model) {
    next.entityVersions = entityVersions;
  }
  return next;
}
