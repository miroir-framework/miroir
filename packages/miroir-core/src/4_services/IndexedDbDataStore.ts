
import { ModelStructureUpdate, ModelUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { Instance } from "../0_interfaces/1_core/Instance";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { IndexedDb } from "./indexedDb";

export class IndexedDbDataStore implements DataStoreInterface{
  constructor(
    private localUuidIndexedDb: IndexedDb,
  ){}

  public getdb():any{
    return this.localUuidIndexedDb.db;
  }

  // #############################################################################################
  async dropModel(){
    return this.clear();
  }

  // #############################################################################################
  async init():Promise<void> {
    await this.localUuidIndexedDb.createObjectStore([]);
    return Promise.resolve();
  }

  // #############################################################################################
  addConcepts(conceptsNames:string[]) {
    this.localUuidIndexedDb.addSubLevels(conceptsNames)
  }

  // #############################################################################################
  open():Promise<void> {
    return this.localUuidIndexedDb.openObjectStore();
  }
  
  // ##############################################################################################
  close():Promise<void> {
    return this.localUuidIndexedDb.closeObjectStore();
  }

  // ##############################################################################################
  clear():Promise<void> {
    return this.localUuidIndexedDb.clearObjectStore();
    // this.dropUuidEntities(this.getUuidEntities());
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
  // async applyModelStructureUpdates(updates:ModelStructureUpdate[]){
  async applyModelStructureUpdate(updates:ModelUpdateWithCUDUpdate){
    console.log('IndexedDbDataStore applyModelStructureUpdates',updates);
    const currentUpdate = updates[0];
    const cudUpdate = currentUpdate.equivalentModelCUDUpdates[0];
    const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].entityUuid,cudUpdate.objects[0].instances[0].uuid);
    if (this.localUuidIndexedDb.hasSubLevel(currentUpdate.modelStructureUpdate.entityUuid) && !!currentValue) {
      console.log('IndexedDbDataStore SqlDbServer applyModelStructureUpdates',cudUpdate.objects[0].instances[0].entityUuid,currentValue);
      await this.localUuidIndexedDb.putValue(
        cudUpdate.objects[0].instances[0].entityUuid,
        cudUpdate.objects[0].instances[0],
      );
      const updatedValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].entityUuid,cudUpdate.objects[0].instances[0].uuid);
      console.log('IndexedDbDataStore SqlDbServer applyModelStructureUpdates done',cudUpdate.objects[0].instances[0].entityUuid,updatedValue);

    } else {
      console.warn('IndexedDbDataStore SqlDbServer entity uuid',currentUpdate.modelStructureUpdate.entityUuid,'name',currentUpdate.modelStructureUpdate.entityName,'not found!');
      
    }
  }
}