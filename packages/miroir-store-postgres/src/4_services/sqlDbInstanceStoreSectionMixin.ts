import { EntityInstance, IAbstractInstanceStoreSection, LoggerInterface, MiroirLoggerFactory, getLoggerName } from "miroir-core"
import { MixableSqlDbStoreSection, SqlDbStoreSection } from "./SqlDbStoreSection.js"

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const consoleLog:any = console.log.bind(console, packageName,cleanLevel,"SqlDbInstanceStoreSectionMixin")
const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbInstanceStoreSectionMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const MixedSqlDbInstanceStoreSection = SqlDbInstanceStoreSectionMixin(SqlDbStoreSection)


export function SqlDbInstanceStoreSectionMixin<TBase extends MixableSqlDbStoreSection>(Base: TBase) {
  return class MixedIndexedDbInstanceStoreSection extends Base implements IAbstractInstanceStoreSection {
    // ##############################################################################################
    constructor(
      // actual arguments are:
      // public applicationName: string, // used only for debugging purposes
      // public dataStoreType: DataStoreApplicationType, // used only for debugging purposes
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
          console.warn(this.logHeader, 'getInstance','could not find entityUuid',parentUuid);
          return Promise.resolve(undefined);
        }
      } catch (error) {
        console.warn(this.logHeader, 'getInstance', 'could not fetch instance from db: parentId',parentUuid,"uuid",uuid);
        return Promise.resolve(undefined);
      }
    }

    // ##############################################################################################
    async getInstances(parentUuid: string): Promise<EntityInstance[]> {
      let rawResult: any[] = [];
      let cleanResult: EntityInstance[] = [];
      if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[parentUuid] && this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel) {
        consoleLog('getInstances calling this.sqlEntities findall', parentUuid);
        try {
          const sequelizeModel = this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel;
          rawResult = (await sequelizeModel?.findAll()) as unknown as EntityInstance[]
          cleanResult = rawResult.map(i => i["dataValues"])
          consoleLog('getInstances result', cleanResult);
        } catch (e) {
          console.warn(this.logHeader, 'getInstances', 'failed to fetch instances of entityUuid',parentUuid);
        }
      } else {
        console.warn(this.logHeader, 'getInstances', 'could not find entity in database: entityUuid',parentUuid);
      }
      return Promise.resolve(cleanResult);
    }

    // ##############################################################################################
    async upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
      const sequelizeModel = this.sqlSchemaTableAccess[instance.parentUuid].sequelizeModel
      const tmp = await sequelizeModel.upsert(instance as any);
      console.debug(
        this.logHeader, 
        "upsertInstance",
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
      console.debug(this.logHeader, 'deleteDataInstance', parentUuid,instance);
      const sequelizeModel = this.sqlSchemaTableAccess[parentUuid].sequelizeModel
      await sequelizeModel.destroy({where:{uuid:instance.uuid}});
      return Promise.resolve();
    }
  }
}