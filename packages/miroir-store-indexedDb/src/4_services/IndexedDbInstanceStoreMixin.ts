import { DataStoreApplicationType, IDataSectionStore, EntityDefinition, EntityInstance, IAbstractEntityStore, IAbstractInstanceStore, IAbstractStore, MetaEntity, WrappedTransactionalEntityUpdateWithCUDUpdate, entityEntity, entityEntityDefinition } from "miroir-core";
import { IndexedDbStore, MixableIndexedDbStore } from "./IndexedDbStore.js";


export const MixedIndexedDbInstanceStore = IndexedDbInstanceStoreMixin(IndexedDbStore)


export function IndexedDbInstanceStoreMixin<TBase extends MixableIndexedDbStore>(Base: TBase) {
  return class MixedIndexedDbInstanceStore extends Base implements IAbstractInstanceStore {
    constructor(
      // public applicationName: string;
      // public dataStoreType: DataStoreApplicationType;
      // public localUuidIndexedDb: IndexedDb;
      // public logHeader: string;
      ...args:any[]
    ) {
      super(...args)
      // console.log(this.logHeader,'MixedIndexedDbInstanceStore constructor','this.localUuidIndexedDb',this.localUuidIndexedDb)
    }
    // // ##############################################################################################
    // async clear(): Promise<void> {
    //   await this.localUuidIndexedDb.removeSubLevels(this.getEntityUuids());
    //   return Promise.resolve();
    // }
  
    //   // ##############################################################################################
    //   getEntityUuids(): string[] {
    //     return this.localUuidIndexedDb.getSubLevels();
    //   }
    
    // // #############################################################################################
    // async createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition) {
    //   console.log(
    //     this.logHeader,
    //     "createStorageSpaceForInstancesOfEntity",
    //     "input: entity",
    //     entity,
    //     "entityDefinition",
    //     entityDefinition,
    //     "Entities",
    //     this.localUuidIndexedDb.getSubLevels()
    //   );
    //   if (entity.uuid != entityDefinition.entityUuid) {
    //     // inconsistent input, raise exception
    //     console.error(
    //       this.logHeader,
    //       "createStorageSpaceForInstancesOfEntity",
    //       "Application",
    //       this.applicationName,
    //       "dataStoreType",
    //       this.dataStoreType,
    //       "inconsistent input: given entityDefinition is not related to given entity."
    //     );
    //   } else {
    //     if (!this.localUuidIndexedDb.hasSubLevel(entity.uuid)) {
    //       this.localUuidIndexedDb.addSubLevels([entity.uuid]);
    //     } else {
    //       this.localUuidIndexedDb.db?.sublevel(entity.uuid).clear();
    //       console.log(
    //         this.logHeader,
    //         "createStorageSpaceForInstancesOfEntity",
    //         "input: entity",
    //         entity,
    //         "entityDefinition",
    //         entityDefinition,
    //         "already has entity. Existing entities:",
    //         this.localUuidIndexedDb.getSubLevels()
    //       );
    //     }
    //   }
    //   return Promise.resolve();
    // }
  
    // // ##############################################################################################
    // async dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void> {
    //   if (!this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
    //     await this.localUuidIndexedDb.removeSubLevels([entityUuid]);
    //   } else {
    //     console.log(
    //       this.logHeader,
    //       "createStorageSpaceForInstancesOfEntity",
    //       "input: entity",
    //       entityUuid,
    //       "not found. Existing entities:",
    //       this.localUuidIndexedDb.getSubLevels()
    //     );
    //   }
    //   return Promise.resolve();
    // }
  
    // // ##############################################################################################
    // renameStorageSpaceForInstancesOfEntity(
    //   oldName: string,
    //   newName: string,
    //   entity: MetaEntity,
    //   entityDefinition: EntityDefinition
    // ): Promise<void> {
    //   console.warn(
    //     this.logHeader,
    //     "renameStorageSpaceForInstancesOfEntity does nothing for entity",
    //     oldName,
    //     ", since Entities are indexed by Uuid! Existing entities:",
    //     this.localUuidIndexedDb.getSubLevels()
    //   );
    //   return Promise.resolve();
    // }
  
    // #############################################################################################
    async getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
      const result = await this.localUuidIndexedDb.getValue(parentUuid, uuid);
      return Promise.resolve(result);
    }
  
    // #############################################################################################
    async getInstances(parentUuid: string): Promise<any> {
      const result = await this.localUuidIndexedDb.getAllValue(parentUuid);
      return Promise.resolve(result);
    }
  
    // #############################################################################################
    async upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
      console.log(this.logHeader, "upsertInstance", instance.parentUuid, instance);
  
      if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
        await this.localUuidIndexedDb.putValue(parentUuid, instance);
      } else {
        console.error(this.logHeader, "upsertInstance", instance.parentUuid, "does not exists.");
      }
      return Promise.resolve();
    }
  
    // #############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
      console.log(this.logHeader, "deleteInstances", parentUuid, instances);
      for (const o of instances) {
        // await this.localUuidIndexedDb.deleteValue(parentUuid, o.uuid);
        await this.deleteInstance(parentUuid, { uuid: o.uuid } as EntityInstance);
      }
      return Promise.resolve();
    }
  
    // #############################################################################################
    async deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
      console.log(this.logHeader, "deleteDataInstance", parentUuid, instance);
      // for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(parentUuid, instance.uuid);
      // }
      return Promise.resolve();
    }
  }
}
