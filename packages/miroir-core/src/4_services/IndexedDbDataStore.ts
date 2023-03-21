
import { ModelStructureUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { Instance } from "../0_interfaces/1_core/Instance";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { IndexedDb } from "./indexedDb";

export class IndexedDbDataStore implements DataStoreInterface{
  constructor(
    // private localIndexedDb: IndexedDb,
    private localUuidIndexedDb: IndexedDb,
  ){}

  // #############################################################################################
  async init():Promise<void> {
    return Promise.resolve();
  }

  // #############################################################################################
  getUuidEntities(): string[] {
      return this.localUuidIndexedDb.getSubLevels();
  }

  // #############################################################################################
  dropUuidEntity(entityUuid:string) {
    if (this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
      this.localUuidIndexedDb.removeSubLevels([entityUuid]);
    } else {
      console.warn('dropUuidEntity entityName not found:', entityUuid);
    } 
  }

  // #############################################################################################
  dropUuidEntities(entityUuids:string[]) {
    entityUuids.forEach(e =>this.dropUuidEntity(e));
  }
  
  // #############################################################################################
  getInstancesUuid(entityUuid:string):Promise<any> {
    return this.localUuidIndexedDb.getAllValue(entityUuid);
  }
  
  // #############################################################################################
  upsertInstanceUuid(entityUuid:string, instance:Instance):Promise<any> {
    console.log('IndexedDbDataStore upsertInstanceUuid',instance.entityUuid, instance);

    // if (instance.entityUuid == entityEntity.uuid && !this.localUuidIndexedDb.hasSubLevel(instance.entityUuid)) {
    if (!this.localUuidIndexedDb.hasSubLevel(instance.entityUuid)) {
      console.log('IndexedDbDataStore upsertInstanceUuid create sublevel',instance.entityUuid);
      this.localUuidIndexedDb.addSubLevels([instance.entityUuid]);
    } else {
      console.log('IndexedDbDataStore upsertInstanceUuid existing sublevel',instance.entityUuid,this.localUuidIndexedDb.hasSubLevel(instance.entityUuid));
    }

    return this.localUuidIndexedDb.putValue(instance.entityUuid,instance);
  }

  // #############################################################################################
  async deleteInstancesUuid(entityUuid:string, instances:Instance[]):Promise<any> {
    console.log('IndexedDbDataStore deleteInstancesUuid',entityUuid, instances);
    for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(o.entityUuid, o.uuid);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteInstanceUuid(entityUuid:string, instance:Instance):Promise<any> {
    console.log('IndexedDbDataStore deleteInstanceUuid',entityUuid, instance);
    // for (const o of instances) {
      await this.localUuidIndexedDb.deleteValue(instance.entityUuid, instance.uuid);
    // }
    return Promise.resolve();
  }

  // ##############################################################################################
  async applyModelStructureUpdates(updates:ModelStructureUpdate[]){
    console.log('IndexedDbDataStore applyModelStructureUpdates',updates);
    const currentUpdate = updates[0];
    const currentValue = await this.localUuidIndexedDb.getValue(currentUpdate.equivalentModelCUDUpdates[0].objects[0].instances[0].entityUuid,currentUpdate.equivalentModelCUDUpdates[0].objects[0].instances[0].uuid);
    if (this.localUuidIndexedDb.hasSubLevel(currentUpdate.entityUuid) && !!currentValue) {
      // const model = this.sqlUuidEntities[currentUpdate.entityUuid];
      console.log('IndexedDbDataStore SqlDbServer applyModelStructureUpdates',currentUpdate.equivalentModelCUDUpdates[0].objects[0].instances[0].entityUuid,currentValue);
      // this.sequelize.getQueryInterface().renameTable(currentUpdate.entityName,currentUpdate.targetValue);
      // this.sequelize.modelManager.removeModel(this.sequelize.model(model.entityName));
      // const newModel=
      // this.sqlUuidEntities[currentUpdate.entityUuid] = {entityName:currentUpdate.targetValue,sequelizeModel:this.sqlUuidEntities[currentUpdate.entityUuid].sequelizeModel}
      await this.localUuidIndexedDb.putValue(
        currentUpdate.equivalentModelCUDUpdates[0].objects[0].instances[0].entityUuid,
        currentUpdate.equivalentModelCUDUpdates[0].objects[0].instances[0],
      );
      const updatedValue = await this.localUuidIndexedDb.getValue(currentUpdate.equivalentModelCUDUpdates[0].objects[0].instances[0].entityUuid,currentUpdate.equivalentModelCUDUpdates[0].objects[0].instances[0].uuid);
      console.log('IndexedDbDataStore SqlDbServer applyModelStructureUpdates done',currentUpdate.equivalentModelCUDUpdates[0].objects[0].instances[0].entityUuid,updatedValue);

    } else {
      console.warn('IndexedDbDataStore SqlDbServer entity uuid',currentUpdate.entityUuid,'name',currentUpdate.entityName,'not found!');
      
    }
  }
}