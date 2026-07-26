import {
  ACTION_OK,
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2VoidReturnType,
  Domain2ElementFailed,
  Entity,
  EntityDefinition,
  EntityInstance,
  EntityInstanceWithName,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreEntitySectionAbstractInterface,
  PersistenceStoreInstanceSectionAbstractInterface,
  applyAlterEntityAttributePair,
  applyEntityOnlyAlterAttribute,
  applyEntityOnlyRename,
  applyRenameEntityPair,
  normalizeCreateEntityPair,
  persistEntityThenEntityDefinition,
} from "miroir-core";
import { MongoDbInstanceStoreSectionMixin, MixedMongoDbInstanceStoreSection } from "./MongoDbInstanceStoreSectionMixin.js";
import { MongoDbStoreSection } from "./MongoDbStoreSection.js";
import { entityEntity, entityEntityDefinition } from "miroir-test-app_deployment-miroir";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MongoDbEntityStoreSectionMixin")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export const MixedMongoDbEntityAndInstanceStoreSection = MongoDbEntityStoreSectionMixin(
  MongoDbInstanceStoreSectionMixin(MongoDbStoreSection)
);

// ################################################################################################
/**
 * Mixin that adds entity management operations to a MongoDB store section.
 * Implements PersistenceStoreEntitySectionAbstractInterface.
 */
export function MongoDbEntityStoreSectionMixin<TBase extends typeof MixedMongoDbInstanceStoreSection>(Base: TBase) {
  return class MixedMongoDbEntityStoreSection
    extends Base
    implements PersistenceStoreEntitySectionAbstractInterface, PersistenceStoreInstanceSectionAbstractInterface
  {
    public dataStore: PersistenceStoreDataSectionInterface;

    constructor(
      //   mongoDbStoreName: string,
      //   localUuidMongoDb: MongoDb,
      //   logHeader: string,
      //   public dataStore: PersistenceStoreDataSectionInterface,
      ...args: any[]
    ) {
      super(...args.slice(0, 3));
      this.dataStore = args[3];
    }

    // ##############################################################################################
    async clear(): Promise<Action2VoidReturnType> {
      // drop data and model Entities
      log.info("clearing data for entities:", this.getEntityUuids());
      await this.localUuidMongoDb.removeCollections(this.getEntityUuids());
      log.info(this.logHeader, "clear DONE", this.getEntityUuids());
      return Promise.resolve(ACTION_OK);
    }

    // ##################################################################################################
    getEntityUuids(): string[] {
      return this.localUuidMongoDb.getCollections();
    }

    // ##################################################################################################
    existsEntity(entityUuid: string): boolean {
      return this.localUuidMongoDb.hasCollection(entityUuid);
    }

    // #############################################################################################
    // #217 Phase 6/11: Entity then optional EntityDefinition; Entity-only when ED omitted.
    async createEntity(entity: Entity, entityDefinition?: EntityDefinition): Promise<Action2VoidReturnType> {
      if (entityDefinition && entity.uuid != entityDefinition.entityUuid) {
        log.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityDefinition is not related to given entity."
        );
        return new Action2Error(
          "FailedToCreateStore",
          "createEntity failed: entity.uuid != entityDefinition.entityUuid",
        );
      }
      if (!entityDefinition) {
        if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
          log.warn(
            this.logHeader,
            "createEntity",
            entity.name,
            "already existing collection",
            entity.uuid,
          );
        } else {
          await this.dataStore.createStorageSpaceForInstancesOfEntity(entity);
        }
        return this.upsertInstance(entityEntity.uuid, entity);
      }
      const pair = normalizeCreateEntityPair(entity, entityDefinition);
      if (this.dataStore.getEntityUuids().includes(pair.entity.uuid)) {
        log.warn(
          this.logHeader,
          "createEntity",
          pair.entity.name,
          "already existing collection",
          pair.entity.uuid,
          this.localUuidMongoDb.hasCollection(pair.entity.uuid)
        );
      } else {
        await this.dataStore.createStorageSpaceForInstancesOfEntity(
          pair.entity,
          pair.entityDefinition,
        );
      }
      if (!this.localUuidMongoDb.hasCollection(entityEntityDefinition.uuid)) {
        log.warn(
          this.logHeader,
          "createEntity",
          pair.entity.name,
          "collection for entityEntityDefinition does not exist",
          entityEntityDefinition.uuid,
        );
      }
      return persistEntityThenEntityDefinition(
        pair,
        {
          writeEntity: (nextEntity) => this.upsertInstance(entityEntity.uuid, nextEntity),
          writeEntityDefinition: (nextEntityDefinition) =>
            this.upsertInstance(entityEntityDefinition.uuid, nextEntityDefinition),
          deleteEntity: (writtenEntity) =>
            this.deleteInstance(entityEntity.uuid, writtenEntity),
        },
        { failurePolicy: { kind: "compensate" } },
      );
    }

    // ##############################################################################################
    async createEntities(
      entities: {
        entity: Entity,
        entityDefinition?: EntityDefinition,
      }[]
    ): Promise<Action2VoidReturnType> {
      for (const e of entities) {
        const result = await this.createEntity(e.entity, e.entityDefinition);
        if (result instanceof Action2Error) {
          return result;
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    // #217 Phase 11: Entity-only rename when present model is complete; dual-write only for incomplete Entity.
    async renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "renameEntityClean", update);
      const currentEntity: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.payload.entityUuid
      );
      if (currentEntity instanceof Action2Error) {
        return currentEntity;
      }
      if (currentEntity.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(
          new Action2Error(
            "FailedToDeployModule",
            `renameEntityClean failed for section: data, entityUuid ${update.payload.entityUuid}, error: ${currentEntity.returnedDomainElement.queryFailure}, ${currentEntity.returnedDomainElement.failureMessage}`
          )
        );
      }
      const previousEntity = currentEntity.returnedDomainElement as Entity;
      const entityOnly = applyEntityOnlyRename(previousEntity, update.payload.targetValue);
      if (entityOnly) {
        const upsertResult = await this.upsertInstance(entityEntity.uuid, entityOnly);
        if (upsertResult instanceof Action2Error) {
          return upsertResult;
        }
        await this.dataStore.renameStorageSpaceForInstancesOfEntity(
          (previousEntity as EntityInstanceWithName).name,
          update.payload.targetValue,
          entityOnly,
        );
        return Promise.resolve(ACTION_OK);
      }

      const entityVersionUuid = update.payload.entityVersionUuid;
      if (!entityVersionUuid) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `renameEntityClean requires entityVersionUuid when Entity present model is incomplete (entityUuid ${update.payload.entityUuid})`
        ));
      }
      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        entityVersionUuid
      );

      if (currentEntityDefinition instanceof Action2Error) {
        return currentEntityDefinition;
      }

      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `renameEntityClean failed for section: data, entityUuid ${entityVersionUuid}, error: ${currentEntityDefinition.returnedDomainElement.queryFailure}, ${currentEntityDefinition.returnedDomainElement.failureMessage}`
        ));
      }
      const previousEntityDefinition =
        currentEntityDefinition.returnedDomainElement as EntityDefinition;
      const pair = applyRenameEntityPair(
        previousEntity,
        previousEntityDefinition,
        update.payload.targetValue,
      );

      const persistResult = await persistEntityThenEntityDefinition(
        pair,
        {
          writeEntity: (nextEntity) => this.upsertInstance(entityEntity.uuid, nextEntity),
          writeEntityDefinition: (nextEntityDefinition) =>
            this.upsertInstance(entityEntityDefinition.uuid, nextEntityDefinition),
          restoreEntity: (entityToRestore) =>
            this.upsertInstance(entityEntity.uuid, entityToRestore),
        },
        { failurePolicy: { kind: "compensate" }, previousEntity },
      );
      if (persistResult instanceof Action2Error) {
        return persistResult;
      }

      await this.dataStore.renameStorageSpaceForInstancesOfEntity(
        (previousEntity as EntityInstanceWithName).name,
        update.payload.targetValue,
        pair.entity as any,
        pair.entityDefinition
      );
      return Promise.resolve(ACTION_OK);
    }

    // ############################################################################################
    // #217 Phase 11: Entity-only alter when present model is complete; dual-write only for incomplete Entity.
    async alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "alterEntityAttribute", update);
      const currentEntity: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.payload.entityUuid
      );
      if (currentEntity instanceof Action2Error) {
        return currentEntity;
      }
      if (currentEntity.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(
          new Action2Error(
            "FailedToDeployModule",
            `alterEntityAttribute failed for section: data, entityUuid ${update.payload.entityUuid}, error: ${currentEntity.returnedDomainElement.queryFailure}, ${currentEntity.returnedDomainElement.failureMessage}`
          )
        );
      }
      const previousEntity = currentEntity.returnedDomainElement as Entity;
      const entityOnly = applyEntityOnlyAlterAttribute(previousEntity, {
        addColumns: update.payload.addColumns,
        removeColumns: update.payload.removeColumns,
      });
      if (entityOnly) {
        log.info("alterEntityAttribute Entity-only", entityOnly.uuid);
        return this.upsertInstance(entityEntity.uuid, entityOnly);
      }

      const entityVersionUuid = update.payload.entityVersionUuid;
      if (!entityVersionUuid) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `alterEntityAttribute requires entityVersionUuid when Entity present model is incomplete (entityUuid ${update.payload.entityUuid})`
        ));
      }
      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        entityVersionUuid
      );
      if (currentEntityDefinition instanceof Action2Error) {
        return currentEntityDefinition;
      }
      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `alterEntityAttribute failed for section: data, entityUuid ${entityVersionUuid}, error: ${currentEntityDefinition.returnedDomainElement.queryFailure}, ${currentEntityDefinition.returnedDomainElement.failureMessage}`
        ));
      }
      const previousEntityDefinition =
        currentEntityDefinition.returnedDomainElement as EntityDefinition;
      const pair = applyAlterEntityAttributePair(
        previousEntity,
        previousEntityDefinition,
        {
          addColumns: update.payload.addColumns,
          removeColumns: update.payload.removeColumns,
        },
      );

      return persistEntityThenEntityDefinition(
        pair,
        {
          writeEntity: (nextEntity) => this.upsertInstance(entityEntity.uuid, nextEntity),
          writeEntityDefinition: (nextEntityDefinition) =>
            this.upsertInstance(entityEntityDefinition.uuid, nextEntityDefinition),
          restoreEntity: (entityToRestore) =>
            this.upsertInstance(entityEntity.uuid, entityToRestore),
        },
        { failurePolicy: { kind: "compensate" }, previousEntity },
      );
    }

    // #########################################################################################
    async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "dropEntity", entityUuid);

      const entity: Action2EntityInstanceReturnType = await this.getInstance(entityEntity.uuid, entityUuid);
      if (entity instanceof Action2Error) {
        return entity;
      }

      // Delete redundant EntityDefinition(s) first, then live Entity (same as FS/IDB).
      if (this.localUuidMongoDb.hasCollection(entityEntityDefinition.uuid)) {
        const entityDefinitions: Action2EntityInstanceCollectionOrFailure = await this.getInstances(
          entityEntityDefinition.uuid,
        );
        if (entityDefinitions instanceof Action2Error) {
          return entityDefinitions;
        }
        if (!(entityDefinitions.returnedDomainElement instanceof Domain2ElementFailed)) {
          for (const entityDefinition of entityDefinitions.returnedDomainElement.instances.filter(
            (i: EntityInstance) => (i as EntityDefinition).entityUuid == entityUuid,
          )) {
            await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
          }
        }
      }

      await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);
      await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);

      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    async dropEntities(entityUuids: string[]): Promise<Action2VoidReturnType> {
      for (const entityUuid of entityUuids) {
        const result = await this.dropEntity(entityUuid);
        if (result instanceof Action2Error) {
          return result;
        }
      }
      return Promise.resolve(ACTION_OK);
    }
  };
}
