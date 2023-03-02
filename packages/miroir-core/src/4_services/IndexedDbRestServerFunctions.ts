import { IndexedDb } from "./indexedDb";
import { Instance } from "../0_interfaces/1_core/Instance";

export async function getInstances(localIndexedDb: IndexedDb, entityName:string):Promise<any> {
  return localIndexedDb.getAllValue(entityName);
}

export async function upsertInstance(localIndexedDb: IndexedDb, entityName:string, instance:Instance):Promise<any> {

  if (entityName == "Entity") {
    localIndexedDb.addSubLevels([entityName]);
  }

  return localIndexedDb.putValue(entityName,instance);
}

export async function deleteInstances(localIndexedDb: IndexedDb, entityName:string, instances:Instance[]):Promise<any> {
  for (const o of instances) {
    await localIndexedDb.deleteValue(entityName, o["uuid"]);
  }
  return Promise.resolve();
}