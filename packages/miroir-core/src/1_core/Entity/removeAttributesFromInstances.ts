/**
 * #733: `alterEntityAttribute` with `removeColumns` removes the attributes' values from the stored instances.
 * SQL drops the columns (#745 D7). The document stores (filesystem, IndexedDB, MongoDB) call this helper: their
 * `upsertInstance` replaces the whole instance, so writing it back without the attributes removes them.
 */

import type { Entity, EntityInstance } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  Action2Error,
  type Action2EntityInstanceCollectionOrFailure,
  type Action2VoidReturnType,
  Domain2ElementFailed,
} from "../../0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../constants.js";
import { isExternalEntity } from "./strictEntityCreation.js";

/** What `removeAttributesFromInstances` needs of a data section. */
export interface InstanceAttributeRemovalStore {
  getEntityUuids(): string[];
  getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure>;
  upsertInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType>;
}

/**
 * Removes `attributes` from every stored instance of `entity` that holds one of them. Only the attributes the
 * Entity row declares are removed (as SQL removes only declared columns). An external Entity, or an Entity whose
 * storage the section does not register, has no stored instance to change. Every instance is read before any is
 * written: a failed read writes nothing. An instance without the attributes is not written, so running the
 * removal again after a failed write finishes it.
 */
export async function removeAttributesFromInstances(
  dataSection: InstanceAttributeRemovalStore,
  entity: Entity,
  attributes: string[] | undefined,
): Promise<Action2VoidReturnType> {
  const declared = (attributes ?? []).filter((attribute) => attribute in (entity.mlSchema?.definition ?? {}));
  if (declared.length === 0 || isExternalEntity(entity) || !dataSection.getEntityUuids().includes(entity.uuid)) {
    return ACTION_OK;
  }
  const read = await dataSection.getInstances(entity.uuid);
  if (read instanceof Action2Error) {
    return read;
  }
  const collection = read.returnedDomainElement;
  if (collection instanceof Domain2ElementFailed) {
    return new Action2Error(
      "FailedToGetInstances",
      `alterEntityAttribute: could not read the instances of ${entity.name}: ${collection.failureMessage ?? collection.queryFailure}`,
      ["alterEntityAttribute"],
    );
  }
  for (const instance of collection.instances) {
    const holding = declared.filter((attribute) => attribute in instance);
    if (holding.length === 0) {
      continue;
    }
    const stripped = Object.fromEntries(
      Object.entries(instance).filter(([attribute]) => !holding.includes(attribute)),
    ) as EntityInstance;
    const written = await dataSection.upsertInstance(entity.uuid, stripped);
    if (written instanceof Action2Error) {
      return written;
    }
  }
  return ACTION_OK;
}
