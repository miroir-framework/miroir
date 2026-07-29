/**
 * #220 Phase 6 — MetaModel EntityVersion collection accessors.
 *
 * After the schema rename, MetaModel.entityVersions is canonical.
 */

import type {
  EntityVersion,
  MetaModel,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

/**
 * Return MetaModel.entityVersions (empty array when absent).
 * Dual-reads legacy `entityDefinitions` for fixtures / seeds not yet renamed.
 */
export function getMetaModelEntityVersions(
  model: MetaModel | null | undefined,
): EntityVersion[] {
  if (!model) {
    return [];
  }
  if (model.entityVersions) {
    return model.entityVersions;
  }
  const legacy = (model as MetaModel & { entityDefinitions?: EntityVersion[] })
    .entityDefinitions;
  return legacy ?? [];
}

/**
 * Write EntityVersion rows onto MetaModel.entityVersions.
 * Drops any legacy `entityDefinitions` key if present on the input object.
 */
export function withMetaModelEntityVersions(
  model: MetaModel,
  entityVersions: EntityVersion[],
): MetaModel {
  const { entityDefinitions: _legacy, ...rest } = model as MetaModel & {
    entityDefinitions?: EntityVersion[];
  };
  void _legacy;
  return {
    ...rest,
    entityVersions,
  };
}
