import { EntityDefinition, EntityInstance, IAbstractEntityStore, IAbstractInstanceStore, IDataSectionStore, MetaEntity, WrappedTransactionalEntityUpdateWithCUDUpdate, entityEntity, entityEntityDefinition } from "miroir-core";
import { FileSystemStore } from "./FileSystemStore.js";
import { FileSystemDbInstanceStoreMixin, MixedFileSystemDbInstanceStore } from "./FileSystemInstanceStoreMixin.js";

import * as fs from "fs";
import * as path from "path";

export const MixedFileSystemDbEntityAndInstanceStore = FileSystemDbEntityStoreMixin(FileSystemDbInstanceStoreMixin(FileSystemStore))

export function FileSystemDbEntityStoreMixin<TBase extends typeof MixedFileSystemDbInstanceStore>(Base: TBase) {
  return class MixedSqlDbEntityStore extends Base implements IAbstractEntityStore, IAbstractInstanceStore {
    public dataStore: IDataSectionStore;

    constructor(
    // public applicationName: string,
    // public dataStoreType: DataStoreApplicationType,
    // private directory: string,
    // public logHeader: string;
    ...args:any[]
    ) { 
      super(...args.slice(0,4));
      this.dataStore = args[4];
      console.log(this.logHeader,'MixedIndexedDbEntityStore constructor',args);
    }

    // #########################################################################################
    existsEntity(entityUuid: string): boolean {
      const entityDirectories = fs.readdirSync(this.directory);
      return entityDirectories.includes(entityUuid);
    }

    // #########################################################################################
    async createEntity(entity: MetaEntity, entityDefinition: EntityDefinition):Promise<void> {
      if (entity.uuid != entityDefinition.entityUuid) {
        // inconsistent input, raise exception
        console.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityDefinition is not related to given entity."
        );
      } else {
        if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
          console.warn(this.logHeader,'createEntity',entity.name,'already existing entity',entity.uuid,'existing entities',this.dataStore.getEntityUuids());
        } else {
          await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
          await this.upsertInstance(entityEntity.uuid, entity);
          await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
        }
      }


      const entities = fs.readdirSync(this.directory);

      if (!entities.includes(entity.uuid)) {
        fs.mkdirSync(path.join(this.directory,entity.uuid))
      }

      await this.upsertInstance(entityEntity.uuid,entity);
      await this.upsertInstance(entityEntityDefinition.uuid,entityDefinition);
      // fs.writeFileSync(path.join(this.directory,entityEntity.uuid,fullName(entity.uuid)),JSON.stringify(entity))
      // fs.writeFileSync(path.join(this.directory,entityEntityDefinition.uuid,fullName(entityDefinition.uuid)),JSON.stringify(entityDefinition))
      return Promise.resolve()
    }

    // #########################################################################################
    async dropEntity(entityUuid: string):Promise<void> {
      // TODO: implementation ~ indexedDb case. share it?
      if (this.dataStore.getEntityUuids().includes(entityUuid)) {
        // this.localUuidIndexedDb.removeSubLevels([entityUuid]);
        await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid)
      } else {
        console.warn(this.logHeader,'dropEntity entity not found:', entityUuid);
      }

      if(this.getEntityUuids().includes(entityEntityDefinition.uuid)) {
        await this.deleteInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);
      } else {
        console.warn(this.logHeader,'dropEntity sublevel for entityEntity does not exist',entityEntity.uuid,'existing entities',this.getEntityUuids());
      }

      if(this.getEntityUuids().includes(entityEntityDefinition.uuid)) {
        await this.deleteInstance(entityEntity.uuid, {uuid:entityUuid} as EntityInstance);

        const entityDefinitions = (await this.dataStore.getInstances(entityEntityDefinition.uuid) as EntityDefinition[]).filter(i=>i.entityUuid == entityUuid)
        for (
          const entityDefinition of entityDefinitions
        ) {
          await this.dataStore.deleteInstance(entityEntityDefinition.uuid, entityDefinition)
        }
      } else {
        console.warn('StoreController dropEntity entity entityEntityDefinition does not exist',entityEntityDefinition.uuid,'existing entities',this.getEntityUuids());
      }
      return Promise.resolve();
    }

    // #########################################################################################
    async dropEntities(entityUuids: string[]):Promise<void> {
      entityUuids.forEach(async (e) =>await this.dropEntity(e));
      return Promise.resolve()
    }

    // #########################################################################################
    async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate):Promise<void> {
      // TODO: identical to IndexedDbModelSectionStore implementation!
      console.log(this.logHeader,'renameEntity',update);
      const cudUpdate = update.equivalentModelCUDUpdates[0];
      // const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
      if (
        cudUpdate 
        && cudUpdate.objects[0].instances[0].parentUuid 
        && cudUpdate.objects[0].instances[0].parentUuid == entityEntity.uuid
        && cudUpdate.objects[0].instances[0].uuid
      ) {
        const currentValue = await this.getInstance(entityEntity.uuid,cudUpdate.objects[0].instances[0].uuid);
        console.log(this.logHeader, 'renameEntity',cudUpdate.objects[0].instances[0].parentUuid,currentValue);
        await this.upsertInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0]);
        const updatedValue = await this.getInstance(entityEntity.uuid,cudUpdate.objects[0].instances[0].uuid);
        // TODO: update EntityDefinition, too!
        console.log(this.logHeader, 'renameEntity done',cudUpdate.objects[0].instances[0].parentUuid,updatedValue);
      } else {
        throw new Error(this.logHeader + ' renameEntity incorrect parameter ' + cudUpdate);
      }
      return Promise.resolve();
    }
  }
}
