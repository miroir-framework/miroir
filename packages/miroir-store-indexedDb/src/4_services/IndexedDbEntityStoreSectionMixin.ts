import {
  EntityDefinition,
  EntityInstance,
  AbstractEntityStoreSectionInterface,
  AbstractInstanceStoreSectionInterface,
  StoreDataSectionInterface,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
  entityEntity,
  entityEntityDefinition,
  getLoggerName,
  ActionReturnType,
  ACTION_OK,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionVoidReturnType,
  ModelActionRenameEntity,
  EntityInstanceWithName,
  ModelActionAlterEntityAttribute,
  Entity
} from "miroir-core";
import { IndexedDbInstanceStoreSectionMixin, MixedIndexedDbInstanceStoreSection } from "./IndexedDbInstanceStoreSectionMixin.js";
import { IndexedDbStoreSection } from "./IndexedDbStoreSection.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDbEntityStoreSectionMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// ################################################################################################
export const MixedIndexedDbEntityAndInstanceStoreSection = IndexedDbEntityStoreSectionMixin(
  IndexedDbInstanceStoreSectionMixin(IndexedDbStoreSection)
);

// ################################################################################################
export function IndexedDbEntityStoreSectionMixin<TBase extends typeof MixedIndexedDbInstanceStoreSection>(Base: TBase) {
  return class MixedIndexedDbEntityStoreSection
    extends Base
    implements AbstractEntityStoreSectionInterface, AbstractInstanceStoreSectionInterface
  {
    public dataStore: StoreDataSectionInterface;

    constructor(
      //   indexedDbStoreName: string,
      //   localUuidIndexedDb: IndexedDb,
      //   logHeader: string,
      //   public dataStore: StoreDataSectionInterface,
      ...args: any[]
    ) {
      super(...args.slice(0, 3));
      this.dataStore = args[3];
      // log.info(this.logHeader,'MixedIndexedDbEntityStoreSection constructor',this.dataStore);
    }

    // ##############################################################################################
    async clear(): Promise<ActionVoidReturnType> {
      // drop data anq model Entities
      // await this.dataStore.clear();
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
    async createEntity(entity: Entity, entityDefinition: EntityDefinition): Promise<ActionVoidReturnType> {
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
    ): Promise<ActionVoidReturnType> {
      for (const e of entities) {
        await this.createEntity(e.entity, e.entityDefinition);
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    async renameEntityClean(update: ModelActionRenameEntity): Promise<ActionVoidReturnType> {
      // TODO: identical to IndexedDbModelStoreSection implementation!
      log.info(this.logHeader, "renameEntityClean", update);
      // const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
      const currentEntity: ActionEntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.entityUuid
      );
      if (currentEntity.status != "ok") {
        return currentEntity
      }
      const currentEntityDefinition: ActionEntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        update.entityDefinitionUuid
      );

      if (currentEntity.status != "ok") {
        return currentEntity
      }
      if (currentEntityDefinition.status != "ok") {
        return currentEntityDefinition
      }
      const modifiedEntity:EntityInstanceWithName = Object.assign({},currentEntity.returnedDomainElement.elementValue,{name:update.targetValue});
      const modifiedEntityDefinition:EntityDefinition = Object.assign({},currentEntityDefinition.returnedDomainElement.elementValue as EntityDefinition,{name:update.targetValue});

      await this.upsertInstance(entityEntity.uuid, modifiedEntity);
      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);

      await this.dataStore.renameStorageSpaceForInstancesOfEntity(
        (currentEntity.returnedDomainElement.elementValue as EntityInstanceWithName).name,
        update.targetValue,
        modifiedEntity,
        modifiedEntityDefinition
      );
      return Promise.resolve(ACTION_OK);
    }

    // ############################################################################################
    async alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<ActionVoidReturnType> {
      log.info(this.logHeader, "alterEntityAttribute", update);
      const currentEntityDefinition: ActionEntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        update.entityDefinitionUuid
      );
      if (currentEntityDefinition.status != "ok") {
        return currentEntityDefinition
      }
      const localEntityDefinition: EntityDefinition = currentEntityDefinition.returnedDomainElement.elementValue as EntityDefinition;
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
    async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate):Promise<ActionVoidReturnType> {
      // TODO: identical to the Filesystem implementation!
      if (
        update.equivalentModelCUDUpdates.length &&
        update.equivalentModelCUDUpdates[0] &&
        update.equivalentModelCUDUpdates[0].objects?.length &&
        update.equivalentModelCUDUpdates[0].objects[0] &&
        update.equivalentModelCUDUpdates[0].objects[1] &&
        update.equivalentModelCUDUpdates[0].objects[0].instances[0] &&
        update.equivalentModelCUDUpdates[0].objects[1].instances[0]
      ) {
        const cudUpdate = update.equivalentModelCUDUpdates[0];
        const currentValue: ActionEntityInstanceReturnType = await this.getInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0].uuid);
        log.info(this.logHeader, "renameEntity", cudUpdate.objects[0].instances[0].parentUuid, currentValue);
        await this.upsertInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0]);
        const updatedValue: ActionEntityInstanceReturnType = await this.getInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0].uuid);
        // TODO: update EntityDefinition, too!
        log.debug(this.logHeader, "renameEntity done", cudUpdate.objects[0].instances[0].parentUuid, updatedValue);
        await this.dataStore.renameStorageSpaceForInstancesOfEntity(
          (update.modelEntityUpdate as any)["entityName"],
          (update.modelEntityUpdate as any)["targetValue"],
          update.equivalentModelCUDUpdates[0].objects[0].instances[0] as MetaEntity,
          update.equivalentModelCUDUpdates[0].objects[1].instances[0] as EntityDefinition
        );
      } else {
        throw new Error(this.logHeader + " renameEntity could not execute update " + update);
      }
      return Promise.resolve(ACTION_OK);
    }

    // #############################################################################################
    async dropEntity(entityUuid: string): Promise<ActionVoidReturnType> {
      log.info(this.logHeader, "dropEntity entity", entityEntity.uuid);
      if (this.dataStore.getEntityUuids().includes(entityUuid)) {
        await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
      } else {
        log.warn(this.logHeader, "dropEntity entity not found:", entityUuid);
      }

      if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
        const entityDefinitions: ActionEntityInstanceCollectionReturnType = await this.getInstances(entityEntityDefinition.uuid);
        if (entityDefinitions.status != "ok") {
          return Promise.resolve({
            status: "error",
            error: {
              errorType: "FailedToDeleteStore",// TODO: correct errorType
              errorMessage: `dropEntity failed for section: data, entityUuid ${entityUuid}, error: ${entityDefinitions.error.errorType}, ${entityDefinitions.error.errorMessage}`,
            },
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

        for (const entityDefinition of entityDefinitions.returnedDomainElement.elementValue.instances.filter((i:EntityDefinition) => i.entityUuid == entityUuid)) {
          await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
        }
      } else {
        log.warn(
          "StoreController dropEntity sublevel for entityEntityDefinition does not exist",
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
    async dropEntities(entityUuids: string[]):Promise<ActionVoidReturnType> {
      for (const entityUuid of entityUuids) {
        await this.dropEntity(entityUuid);
      }
      return Promise.resolve(ACTION_OK);
    }
  };
}
