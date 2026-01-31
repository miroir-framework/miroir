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
  entityEntity,
  entityEntityDefinition
} from "miroir-core";
import { MongoDbInstanceStoreSectionMixin, MixedMongoDbInstanceStoreSection } from "./MongoDbInstanceStoreSectionMixin.js";
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
    async createEntity(entity: Entity, entityDefinition: EntityDefinition): Promise<Action2VoidReturnType> {
      if (entity.uuid != entityDefinition.entityUuid) {
        // inconsistent input, raise exception
        log.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityDefinition is not related to given entity."
        );
      } else {
        if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
          log.warn(
            this.logHeader,
            "createEntity",
            entity.name,
            "already existing collection",
            entity.uuid,
            this.localUuidMongoDb.hasCollection(entity.uuid)
          );
        } else {
          await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
          await this.upsertInstance(entityEntity.uuid, entity);
          if (this.localUuidMongoDb.hasCollection(entityEntityDefinition.uuid)) {
            await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
          } else {
            log.warn(
              this.logHeader,
              "createEntity",
              entity.name,
              "collection for entityEntityDefinition does not exist",
              entityEntityDefinition.uuid,
              this.localUuidMongoDb.hasCollection(entityEntityDefinition.uuid)
            );
          }
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async createEntities(
      entities: {
        entity: Entity,
        entityDefinition: EntityDefinition,
      }[]
    ): Promise<Action2VoidReturnType> {
      for (const e of entities) {
        await this.createEntity(e.entity, e.entityDefinition);
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
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
      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        update.payload.entityDefinitionUuid
      );

      if (currentEntityDefinition instanceof Action2Error) {
        return currentEntityDefinition;
      }

      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `renameEntityClean failed for section: data, entityUuid ${update.payload.entityDefinitionUuid}, error: ${currentEntityDefinition.returnedDomainElement.queryFailure}, ${currentEntityDefinition.returnedDomainElement.failureMessage}`
        ));
      }
      const modifiedEntity: EntityInstanceWithName = Object.assign({}, currentEntity.returnedDomainElement, { name: update.payload.targetValue });
      const modifiedEntityDefinition: EntityDefinition = Object.assign({}, currentEntityDefinition.returnedDomainElement as EntityDefinition, { name: update.payload.targetValue });

      await this.upsertInstance(entityEntity.uuid, modifiedEntity);
      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);

      await this.dataStore.renameStorageSpaceForInstancesOfEntity(
        (currentEntity.returnedDomainElement as EntityInstanceWithName).name,
        update.payload.targetValue,
        modifiedEntity,
        modifiedEntityDefinition
      );
      return Promise.resolve(ACTION_OK);
    }

    // ############################################################################################
    async alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "alterEntityAttribute", update);
      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        update.payload.entityDefinitionUuid
      );
      if (currentEntityDefinition instanceof Action2Error) {
        return currentEntityDefinition;
      }
      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `alterEntityAttribute failed for section: data, entityUuid ${update.payload.entityDefinitionUuid}, error: ${currentEntityDefinition.returnedDomainElement.queryFailure}, ${currentEntityDefinition.returnedDomainElement.failureMessage}`
        ));
      }
      const localEntityDefinition: EntityDefinition = currentEntityDefinition.returnedDomainElement as EntityDefinition;
      const localEntityJzodSchemaDefinition =
        update.payload.removeColumns != undefined && Array.isArray(update.payload.removeColumns)
          ? Object.fromEntries(
              Object.entries(localEntityDefinition.mlSchema.definition).filter(
                (e: [string, any]) => !update.payload.removeColumns?.includes(e[0])
              )
            )
          : update.payload.addColumns != undefined && Array.isArray(update.payload.addColumns)
          ? {
              ...localEntityDefinition.mlSchema.definition,
              ...Object.fromEntries(
                update.payload.addColumns.map((c: any) => [c.name, c.definition])
              ),
            }
          : localEntityDefinition.mlSchema.definition;

      const modifiedEntityDefinition: EntityDefinition = Object.assign({}, localEntityDefinition, {
        mlSchema: { definition: localEntityJzodSchemaDefinition },
      });
      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "dropEntity", entityUuid);

      // Get entity definition to find the entityDefinitionUuid
      const entity: Action2EntityInstanceReturnType = await this.getInstance(entityEntity.uuid, entityUuid);
      if (entity instanceof Action2Error) {
        return entity;
      }

      // Delete entity and entity definition instances
      await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);

      // Drop the data storage for this entity
      await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);

      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    async dropEntities(entityUuids: string[]): Promise<Action2VoidReturnType> {
      for (const entityUuid of entityUuids) {
        await this.dropEntity(entityUuid);
      }
      return Promise.resolve(ACTION_OK);
    }
  };
}
