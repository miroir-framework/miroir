import { EntityDefinition, EntityInstance, EntityInstanceCollection, IAbstractInstanceStore, MetaEntity } from "miroir-core"
import { FileSystemStore, MixableFileSystemDbStore } from "./FileSystemStore.js"

import * as fs from "fs";
import * as path from "path";

const fileExt = '.json'
export function fullName(baseName:string) {
  return baseName + fileExt;
}
export function extractName(fullName:string) {
  return fullName.substring(fullName.length-5);
}

export const MixedFileSystemInstanceStore = FileSystemInstanceStoreMixin(FileSystemStore)


export function FileSystemInstanceStoreMixin<TBase extends MixableFileSystemDbStore>(Base: TBase) {
  return class MixedIndexedDbInstanceStore extends Base implements IAbstractInstanceStore {
    // ##############################################################################################
    constructor(
    // public applicationName: string,
    // public dataStoreType: DataStoreApplicationType,
    // private directory: string,
      // public logHeader: string,
      ...args:any[]
    ) {
      super(...args)
    }
    
    // // #############################################################################################
    // async clear(): Promise<void> {
    //   console.log(this.logHeader, 'clear this.getEntityUuids()',this.getEntityUuids());

    //   for (const parentUuid of this.getEntityUuids()) {
    //     console.log(this.logHeader, 'clear for entity',parentUuid);
    //     await this.dropStorageSpaceForInstancesOfEntity(parentUuid);
    //   }
    //   return Promise.resolve();
    // }
    
    // // #############################################################################################
    // createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    //   // console.log(this.logHeader, 'createStorageSpaceForInstancesOfEntity does nothing!');
    //   const entityInstancesPath = path.join(this.directory,entity.uuid)
    //   if (!fs.existsSync(entityInstancesPath)) {
    //     fs.mkdirSync(entityInstancesPath)
    //   } else {
    //     console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity storage space already exists for',entity.uuid);
    //   }
    //   return Promise.resolve();
    // }

    // // #############################################################################################
    // dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void> {
    //   const entityInstancesPath = path.join(this.directory,entityUuid)
    //   if (fs.existsSync(entityInstancesPath)) {
    //     fs.rmSync(entityInstancesPath,{ recursive: true, force: true })
    //   } else {
    //     console.log(this.logHeader,'dropStorageSpaceForInstancesOfEntity storage space does not exist for',entityUuid);
    //   }
    //   return Promise.resolve();
    // }

    // // #############################################################################################
    // renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    //   console.log(this.logHeader, 'renameStorageSpaceForInstancesOfEntity does nothing!');
    //   return Promise.resolve();
    // }
    // #############################################################################################
    getInstance(entityUuid: string, uuid: string): Promise<EntityInstance | undefined> {
      const entityInstancePath = path.join(this.directory,entityUuid,fullName(uuid))
      return Promise.resolve(JSON.parse(fs.readFileSync(entityInstancePath).toString()) as EntityInstance);
    }

    // #########################################################################################
    async getInstances(entityUuid: string): Promise<EntityInstance[]> {
      console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.directory);
      
      const entityInstancesPath = path.join(this.directory,entityUuid)
      if (fs.existsSync(entityInstancesPath)) {
        const entityInstancesUuid = fs.readdirSync(entityInstancesPath);
        console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.directory,'found entity instances',entityInstancesUuid);
        const entityInstances = {parentUuid:entityUuid, instances:entityInstancesUuid.map(e=>JSON.parse(fs.readFileSync(path.join(entityInstancesPath,e)).toString()))} as EntityInstanceCollection;
        console.log('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'directory',this.directory,'found entity instances',entityInstances);
        return Promise.resolve(entityInstances.instances);
      } else {
        console.warn('FileSystemEntityDataStore getInstances application',this.applicationName,'dataStoreType',this.dataStoreType,'entityUuid',entityUuid,'could not find path',entityInstancesPath);
        return Promise.resolve([]);
      }
    }
    // #########################################################################################
    upsertInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
      const filePath = path.join(this.directory,entityUuid,fullName(instance.uuid));
      fs.writeFileSync(filePath,JSON.stringify(instance, undefined, 2))

      return Promise.resolve(undefined);
    }

    // #############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
      console.log(this.logHeader, 'deleteInstances',parentUuid, instances);
      for (const o of instances) {
        await this.deleteInstance(parentUuid, {uuid:o.uuid} as EntityInstance);
      }
      return Promise.resolve();
    }

    // #############################################################################################
    deleteInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
      const filePath = path.join(this.directory,entityUuid,fullName(instance.uuid));
      fs.rmSync(filePath);
      return Promise.resolve();
    }
  }
}
