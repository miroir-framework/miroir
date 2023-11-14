import { EntityInstance, IAbstractInstanceStore, LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core";
import { IndexedDbStore, MixableIndexedDbStore } from "./IndexedDbStore.js";


import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDbInstanceStoreMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


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
      // log.log(this.logHeader,'MixedIndexedDbInstanceStore constructor','this.localUuidIndexedDb',this.localUuidIndexedDb)
    }

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
      log.log(this.logHeader, "upsertInstance", instance.parentUuid, instance);
  
      if (this.localUuidIndexedDb.hasSubLevel(instance.parentUuid)) {
        await this.localUuidIndexedDb.putValue(instance.parentUuid, instance);
        const tmp = await this.getInstances(instance.parentUuid);
        log.log(this.logHeader, "upsertInstance", instance.parentUuid, "found existing",tmp );
        
      } else {
        log.error(this.logHeader, "upsertInstance", instance.parentUuid, "does not exists.");
      }
      return Promise.resolve();
    }
  
    // #############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
      log.log(this.logHeader, "deleteInstances", parentUuid, instances);
      for (const o of instances) {
        // await this.localUuidIndexedDb.deleteValue(parentUuid, o.uuid);
        await this.deleteInstance(parentUuid, { uuid: o.uuid } as EntityInstance);
      }
      return Promise.resolve();
    }
  
    // #############################################################################################
    async deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
      // for (const o of instances) {
        log.log(this.logHeader, "deleteInstance started.", "entity", parentUuid, "instance", instance);
        await this.localUuidIndexedDb.deleteValue(parentUuid, instance.uuid);
        log.log(this.logHeader, "deleteInstance done.", parentUuid, instance);
      // }
      return Promise.resolve();
    }
  }
}
