import {
  ACTION_OK,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2VoidReturnType,
  Domain2ElementFailed,
  Entity,
  EntityInstance,
  EntityInstanceWithName,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreEntitySectionAbstractInterface,
  PersistenceStoreInstanceSectionAbstractInterface,
  applyEntityOnlyRename,
  applyMlSchemaColumnChanges
} from "miroir-core";
import { entityEntity } from "miroir-test-app_deployment-miroir";
import { MixedMongoDbInstanceStoreSection, MongoDbInstanceStoreSectionMixin } from "./MongoDbInstanceStoreSectionMixin.js";
import { MongoDbStoreSection } from "./MongoDbStoreSection.js";

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
    // #220 — createEntity is Entity-only (complete present model on Entity required).
    async createEntity(entity: Entity): Promise<Action2VoidReturnType> {
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

    // ##############################################################################################
    async createEntities(entities: Entity[]): Promise<Action2VoidReturnType> {
      for (const entity of entities) {
        const result = await this.createEntity(entity);
        if (result instanceof Action2Error) {
          return result;
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    // #220 — Entity-only rename; never dual-write EntityVersion.
    async renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "renameEntityClean", update);
      const currentEntity: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.payload.entityUuid
      );
      if (currentEntity instanceof Action2Error) {
        return currentEntity
      }
      if (currentEntity.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `renameEntityClean failed for section: data, entityUuid ${update.payload.entityUuid}, error: ${currentEntity.returnedDomainElement.queryFailure}, ${currentEntity.returnedDomainElement.failureMessage}`
        ));
      }
      const previousEntity = currentEntity.returnedDomainElement as Entity;
      // #220 — Entity-only rename; do not dual-write EntityVersion.
      const entityOnly = applyEntityOnlyRename(previousEntity, update.payload.targetValue);
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

    // ############################################################################################
    // #220 — Entity-only alter; never dual-write EntityVersion.
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
      const entityOnly = {
        ...previousEntity,
        mlSchema: applyMlSchemaColumnChanges(previousEntity.mlSchema, 
          {
              addColumns: update.payload.addColumns,
              removeColumns: update.payload.removeColumns,
          }
        )
      }
      if (!entityOnly) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `alterEntityAttribute requires complete Entity.mlSchema (entityUuid ${update.payload.entityUuid})`
        ));
      }
      log.info("alterEntityAttribute Entity-only", entityOnly.uuid);
      return this.upsertInstance(entityEntity.uuid, entityOnly);
    }

    // #########################################################################################
    // #220 — Entity-only drop: remove Entity + storage space; do not touch EntityVersions.
    async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "dropEntity", entityUuid);

      const entity: Action2EntityInstanceReturnType = await this.getInstance(entityEntity.uuid, entityUuid);
      if (entity instanceof Action2Error) {
        return entity;
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
