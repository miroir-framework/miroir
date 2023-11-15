import { EntityInstance, IAbstractInstanceStore, LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core"
import { MixableSqlDbStore, SqlDbStore } from "./SqlDbStore.js"

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbInstanceStoreMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const MixedSqlDbInstanceStore = SqlDbInstanceStoreMixin(SqlDbStore)


export function SqlDbInstanceStoreMixin<TBase extends MixableSqlDbStore>(Base: TBase) {
  return class MixedIndexedDbInstanceStore extends Base implements IAbstractInstanceStore {
    // ##############################################################################################
    constructor(
      // actual arguments are:
      // public applicationName: string,
      // public dataStoreType: DataStoreApplicationType,
      // public dataConnectionString:string,
      // public dataSchema:string,
      // public logHeader: string,
      ...args:any[]
    ) {
      super(...args)
    }

    // ##############################################################################################
    async getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
      try {
        if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[parentUuid]) {
          const result:EntityInstance = (await this.sqlSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid))?.dataValues;
          return Promise.resolve(result);
        } else {
          log.warn('getInstance',this.applicationName,this.dataStoreType,'could not find entityUuid',parentUuid);
          return Promise.resolve(undefined);
        }
      } catch (error) {
        log.warn('getInstance',this.applicationName,this.dataStoreType,'could not fetch instance from db: parentId',parentUuid,"uuid",uuid);
        return Promise.resolve(undefined);
      }
    }

    // ##############################################################################################
    async getInstances(parentUuid: string): Promise<EntityInstance[]> {
      let result: EntityInstance[] = [];
      if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[parentUuid] && this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel) {
        log.log('getInstances calling this.sqlEntities findall', parentUuid);
        try {
          result = (await this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel?.findAll()) as unknown as EntityInstance[]
        } catch (e) {
          log.warn('getInstances',this.applicationName,this.dataStoreType,'failed to fetch instances of entityUuid',parentUuid);
        }
      } else {
        log.warn('getInstances',this.applicationName,this.dataStoreType,'could not find entity in database: entityUuid',parentUuid);
      }
      return Promise.resolve(result);
    }

    // ##############################################################################################
    async upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
      const tmp = await this.sqlSchemaTableAccess[instance.parentUuid].sequelizeModel.upsert(instance as any);
      log.debug(
        "upsertInstance application",
        this.applicationName,
        "upserting into Parent",
        instance["parentUuid"],
        "named",
        instance["parentName"],
        "existing data schema entities",
        Object.keys(this.sqlSchemaTableAccess ? this.sqlSchemaTableAccess : {}),
        "instance",
        instance,
        "db upsert result (not returned)", tmp,
      );
      return Promise.resolve();
    }

    // ##############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
      for (const instance of instances) {
        await this.deleteInstance(parentUuid,instance);
      }
      return Promise.resolve();
    }


    // ##############################################################################################
    async deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
      log.debug('deleteDataInstance', parentUuid,instance);
      await this.sqlSchemaTableAccess[parentUuid].sequelizeModel.destroy({where:{uuid:instance.uuid}});
      return Promise.resolve();
    }
  }
}