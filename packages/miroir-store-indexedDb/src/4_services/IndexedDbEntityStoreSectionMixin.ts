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
import { IndexedDbInstanceStoreSectionMixin, MixedIndexedDbInstanceStoreSection } from "./IndexedDbInstanceStoreSectionMixin.js";
import { IndexedDbStoreSection } from "./IndexedDbStoreSection.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "IndexedDbEntityStoreSectionMixin")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export const MixedIndexedDbEntityAndInstanceStoreSection = IndexedDbEntityStoreSectionMixin(
  IndexedDbInstanceStoreSectionMixin(IndexedDbStoreSection)
);

// ################################################################################################
export function IndexedDbEntityStoreSectionMixin<TBase extends typeof MixedIndexedDbInstanceStoreSection>(Base: TBase) {
  return class MixedIndexedDbEntityStoreSection
    extends Base
    implements PersistenceStoreEntitySectionAbstractInterface, PersistenceStoreInstanceSectionAbstractInterface
  {
    public dataStore: PersistenceStoreDataSectionInterface;

    constructor(
      //   indexedDbStoreName: string,
      //   localUuidIndexedDb: IndexedDb,
      //   logHeader: string,
      //   public dataStore: PersistenceStoreDataSectionInterface,
      ...args: any[]
    ) {
      super(...args.slice(0, 3));
      this.dataStore = args[3];
      // log.info(this.logHeader,'MixedIndexedDbEntityStoreSection constructor',this.dataStore);
    }

    // ##############################################################################################
    async clear(): Promise<Action2VoidReturnType> {
      // drop data anq model Entities
      // await this.dataStore.clear();
      log.info("clearing data for entities:",this.getEntityUuids())
      await this.localUuidIndexedDb.removeSubLevels(this.getEntityUuids());
      log.info(this.logHeader, "clear DONE", this.getEntityUuids());
      return Promise.resolve(ACTION_OK);
    }

    // ##################################################################################################
    getEntityUuids(): string[] {
      return this.localUuidIndexedDb.getSubLevels();
    }

    // ##################################################################################################
    existsEntity(entityUuid: string): boolean {
      return this.localUuidIndexedDb.hasSubLevel(entityUuid);
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
            "already existing sublevel",
            entity.uuid,
            this.localUuidIndexedDb.hasSubLevel(entity.uuid)
          );
        } else {
          await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
          await this.upsertInstance(entityEntity.uuid, entity);
          if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
            await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
          } else {
            log.warn(
              this.logHeader,
              "createEntity",
              entity.name,
              "sublevel for entityEntityDefinition does not exist",
              entityEntityDefinition.uuid,
              this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)
            );
          }
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async createEntities(
      entities: {
        entity:Entity,
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
      // TODO: identical to IndexedDbModelStoreSection implementation!
      log.info(this.logHeader, "renameEntityClean", update);
      // const currentValue = await this.localUuidIndexedDb.resolvePathOnObject(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
      const currentEntity: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.entityUuid
      );
      if (currentEntity instanceof Action2Error) {
        return currentEntity
      }
      if (currentEntity.returnedDomainElement instanceof Domain2ElementFailed) {
        return {
          status: "error",
          errorType: "FailedToDeployModule", // TODO: correct errorType
          errorMessage: `renameEntityClean failed for section: data, entityUuid ${update.entityUuid}, error: ${currentEntity.returnedDomainElement.elementValue.queryFailure}, ${currentEntity.returnedDomainElement.elementValue.failureMessage}`,
        };
      }
      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        update.entityDefinitionUuid
      );

      if (currentEntityDefinition instanceof Action2Error) {
        return currentEntityDefinition
      }

      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed) {
        return {
          status: "error",
          errorType: "FailedToDeployModule", // TODO: correct errorType
          errorMessage: `renameEntityClean failed for section: data, entityUuid ${update.entityDefinitionUuid}, error: ${currentEntityDefinition.returnedDomainElement.elementValue.queryFailure}, ${currentEntityDefinition.returnedDomainElement.elementValue.failureMessage}`,
        }
      }
      const modifiedEntity:EntityInstanceWithName = Object.assign({},currentEntity.returnedDomainElement,{name:update.targetValue});
      const modifiedEntityDefinition:EntityDefinition = Object.assign({},currentEntityDefinition.returnedDomainElement as EntityDefinition,{name:update.targetValue});

      await this.upsertInstance(entityEntity.uuid, modifiedEntity);
      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);

      await this.dataStore.renameStorageSpaceForInstancesOfEntity(
        (currentEntity.returnedDomainElement as EntityInstanceWithName).name,
        update.targetValue,
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
        update.entityDefinitionUuid
      );
      if (currentEntityDefinition instanceof Action2Error) {
        return currentEntityDefinition
      }
      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed) {
        return {
          status: "error",
          errorType: "FailedToDeployModule", // TODO: correct errorType
          errorMessage: `alterEntityAttribute failed for section: data, entityUuid ${update.entityDefinitionUuid}, error: ${currentEntityDefinition.returnedDomainElement.elementValue.queryFailure}, ${currentEntityDefinition.returnedDomainElement.elementValue.failureMessage}`,
        }
        
      }
      const localEntityDefinition: EntityDefinition = currentEntityDefinition.returnedDomainElement as EntityDefinition;
      const localEntityJzodSchemaDefinition = update.removeColumns != undefined && Array.isArray(update.removeColumns)?
        Object.fromEntries(
          Object.entries(localEntityDefinition.jzodSchema.definition).filter((i) => update.removeColumns??([] as string[]).includes(i[0]))
        )
        : localEntityDefinition.jzodSchema.definition;
      const modifiedEntityDefinition: EntityDefinition = Object.assign(
        {},
        localEntityDefinition,
        {
          jzodSchema: {
            type: "object",
            definition: {
              ...localEntityJzodSchemaDefinition,
              ...(update.addColumns?Object.fromEntries(update.addColumns.map(c=>[c.name, c.definition])):{})
            },
          },
        }
      );

      log.info("alterEntityAttribute modifiedEntityDefinition", JSON.stringify(modifiedEntityDefinition, undefined, 2));
    
      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);
      return Promise.resolve(ACTION_OK);
    }
    
    // #############################################################################################
    async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "dropEntity entity", entityEntity.uuid);
      if (this.dataStore.getEntityUuids().includes(entityUuid)) {
        await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
      } else {
        log.warn(this.logHeader, "dropEntity entity not found:", entityUuid);
      }

      if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
        const entityDefinitions: Action2EntityInstanceCollectionOrFailure = await this.getInstances(entityEntityDefinition.uuid);
        if (entityDefinitions instanceof Action2Error) {
          return Promise.resolve({
            status: "error",
            errorType: "FailedToDeleteStore", // TODO: correct errorType
            errorMessage: `dropEntity failed for section: data, entityUuid ${entityUuid}, error: ${entityDefinitions.errorType}, ${entityDefinitions.errorMessage}`,
          });
        }
        if (entityDefinitions.returnedDomainElement instanceof Domain2ElementFailed) {
          return Promise.resolve({
            status: "error",
            errorType: "FailedToDeleteStore", // TODO: correct errorType
            errorMessage: `dropEntity failed for section: data, entityUuid ${entityUuid}, error: ${entityDefinitions.returnedDomainElement.elementValue.queryFailure}, ${entityDefinitions.returnedDomainElement.elementValue.failureMessage}`,
          });
        }
        // if (entityDefinitions.returnedDomainElement?.elementType != "entityInstanceCollection") {
        //   return Promise.resolve({
        //     status: "error",
        //     error: {
        //       errorType: "FailedToGetInstances", // TODO: correct errorType
        //       errorMessage: `getInstances failed for section: data, entityUuid ${entityUuid} wrong element type, expected "entityInstanceCollection", got elementType: ${entityDefinitions.returnedDomainElement?.elementType}`,
        //     },
        //   });
        // }

        log.debug(
          this.logHeader,
          "dropEntity entity",
          entityEntity.uuid,
          "found definitions to delete:",
          entityDefinitions
        );

        for (const entityDefinition of entityDefinitions.returnedDomainElement.instances.filter(
          (i: EntityInstance) => (i as EntityDefinition).entityUuid == entityUuid
        )) {
          await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
          // TODO: check for failures!
        }
      } else {
        log.warn(
          "PersistenceStoreController dropEntity sublevel for entityEntityDefinition does not exist",
          entityEntityDefinition.uuid,
          this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)
        );
      }

      if (this.localUuidIndexedDb.hasSubLevel(entityEntity.uuid)) {
        log.debug(this.logHeader, "dropEntity deleting Entity instance for with Entity with uuid", entityUuid);
        await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);
      } else {
        log.warn(
          this.logHeader,
          "dropEntity sublevel for entityEntity does not exist",
          entityEntity.uuid,
          this.localUuidIndexedDb.hasSubLevel(entityEntity.uuid)
        );
      }

      return Promise.resolve(ACTION_OK);
    }

    // #############################################################################################
    async dropEntities(entityUuids: string[]):Promise<Action2VoidReturnType> {
      for (const entityUuid of entityUuids) {
        await this.dropEntity(entityUuid);
      }
      return Promise.resolve(ACTION_OK);
    }
  };
}
