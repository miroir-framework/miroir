/**
 * #745 D4: `createEntity` fails on every store when the Entity's row or the storage of its instances already
 * exists, before it writes anything. The stores share the order of the checks through `createEntitiesStrictly`:
 * check every Entity (its row, then its storage), then for each Entity create its storage, then write its row.
 * External Entities have no storage of their own: they are exempt from both checks, and their row is upserted.
 */

import type { Entity } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  Action2Error,
  type Action2EntityInstanceCollectionOrFailure,
  type Action2VoidReturnType,
  Domain2ElementFailed,
} from "../../0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../constants.js";
import { isHttpExternalEntity, isSqlExternalEntity } from "./entityExternalDataSource.js";

/** `errorContext.reason` of a refused `createEntity`. */
export const ENTITY_CREATION_REFUSALS = {
  entityExists: "entityExists",
  storageExists: "storageExists",
} as const;

/** What a store gives `createEntitiesStrictly` to check, then create, the Entities. */
export interface StrictEntityCreationStore {
  /** The store's name, for the error messages. */
  storeLabel: string;
  /** The uuids of the Entity rows the model section holds, read from the Entity table itself. */
  entityRowUuids(): Promise<string[] | Action2Error>;
  /**
   * Whether the storage of an Entity's instances exists, asked of the storage itself (a folder, a table, a
   * sublevel, a collection), not of the Entities the store registered. `undefined` when the store has no probe:
   * then `createEntity` is refused, since it cannot check.
   */
  storageSpaceExists: ((entity: Entity) => Promise<boolean>) | undefined;
  createStorageSpace(entity: Entity): Promise<Action2VoidReturnType>;
  writeEntityRow(entity: Entity): Promise<Action2VoidReturnType>;
}

/**
 * The uuids of the Entity rows a model section holds, read from its Entity table (`entityEntityUuid`); none
 * when the section has no Entity table yet.
 */
export async function readEntityRowUuids(
  section: { getEntityUuids(): string[]; getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure> },
  entityEntityUuid: string,
): Promise<string[] | Action2Error> {
  if (!section.getEntityUuids().includes(entityEntityUuid)) {
    return [];
  }
  const read = await section.getInstances(entityEntityUuid);
  if (read instanceof Action2Error) {
    return read;
  }
  const collection = read.returnedDomainElement;
  if (collection instanceof Domain2ElementFailed) {
    return new Action2Error("FailedToGetInstances", `could not read the Entity rows: ${collection.failureMessage ?? collection.queryFailure}`);
  }
  return collection.instances.map((row) => row.uuid).filter((uuid): uuid is string => typeof uuid === "string");
}

/** An Entity whose instances live outside the store: no storage of its own to check or create. */
export function isExternalEntity(entity: Entity): boolean {
  return isHttpExternalEntity(entity) || isSqlExternalEntity(entity);
}

function refusal(entity: Entity, reason: string, message: string): Action2Error {
  return new Action2Error("FailedToCreateStore", message, ["createEntity"], undefined, {
    reason,
    entity: entity.uuid,
    entityName: entity.name,
  });
}

/**
 * Why the Entities cannot be created, or `undefined`: an Entity named twice in the list, an Entity whose row
 * exists (`entityExists`), an Entity whose storage exists (`storageExists`), a store without a storage probe.
 * Every Entity is checked before any is created.
 */
export async function entityCreationRefusal(
  store: StrictEntityCreationStore,
  entities: readonly Entity[],
): Promise<Action2Error | undefined> {
  const stored = entities.filter((entity) => !isExternalEntity(entity));
  if (stored.length === 0) {
    return undefined;
  }
  const rowUuids = await store.entityRowUuids();
  if (rowUuids instanceof Action2Error) {
    return new Action2Error(
      "FailedToCreateStore",
      `createEntity on ${store.storeLabel}: could not read the Entity rows to check them`,
      ["createEntity"],
      rowUuids,
    );
  }
  const existingRows = new Set(rowUuids);
  const seen = new Set<string>();
  for (const entity of stored) {
    if (existingRows.has(entity.uuid) || seen.has(entity.uuid)) {
      return refusal(
        entity,
        ENTITY_CREATION_REFUSALS.entityExists,
        `createEntity on ${store.storeLabel}: Entity ${entity.name} (${entity.uuid}) exists already${seen.has(entity.uuid) ? ", named twice in one createEntity" : ""}`,
      );
    }
    seen.add(entity.uuid);
  }
  if (!store.storageSpaceExists) {
    return new Action2Error(
      "FailedToCreateStore",
      `createEntity on ${store.storeLabel}: the store cannot check whether the storage of an Entity exists`,
      ["createEntity"],
    );
  }
  for (const entity of stored) {
    if (await store.storageSpaceExists(entity)) {
      return refusal(
        entity,
        ENTITY_CREATION_REFUSALS.storageExists,
        `createEntity on ${store.storeLabel}: the storage of the instances of Entity ${entity.name} (${entity.uuid}) exists, though the Entity does not; remove it or restore its Entity row`,
      );
    }
  }
  return undefined;
}

/**
 * Checks every Entity, then creates each: its storage, then its row. A storage creation that fails writes no
 * row. External Entities keep the upsert of their row.
 */
export async function createEntitiesStrictly(
  store: StrictEntityCreationStore,
  entities: readonly Entity[],
): Promise<Action2VoidReturnType> {
  const refused = await entityCreationRefusal(store, entities);
  if (refused) {
    return refused;
  }
  for (const entity of entities) {
    if (!isExternalEntity(entity)) {
      const created = await store.createStorageSpace(entity);
      if (created instanceof Action2Error) {
        return new Action2Error(
          "FailedToCreateStore",
          `createEntity on ${store.storeLabel}: could not create the storage of Entity ${entity.name} (${entity.uuid}); its row is not written`,
          ["createEntity"],
          created,
          { entity: entity.uuid, entityName: entity.name },
        );
      }
    }
    const written = await store.writeEntityRow(entity);
    if (written instanceof Action2Error) {
      return written;
    }
  }
  return ACTION_OK;
}
