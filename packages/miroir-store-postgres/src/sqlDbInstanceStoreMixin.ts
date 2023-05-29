import { EntityInstance, IAbstractInstanceStore } from "miroir-core"
import { MixableSqlDbStore, SqlDbStore } from "./SqlDbStore.js"

export const MixedSqlDbInstanceStore = SqlDbInstanceStoreMixin(SqlDbStore)


export function SqlDbInstanceStoreMixin<TBase extends MixableSqlDbStore>(Base: TBase) {
  return class MixedIndexedDbInstanceStore extends Base implements IAbstractInstanceStore {
    // ##############################################################################################
    constructor(
      // public applicationName: string,
      // public dataStoreType: DataStoreApplicationType,
      // public dataConnectionString:string,
      // public dataSchema:string,
      // public logHeader: string,
      ...args:any[]
    ) {
      super(...args)
    }

    // // ######################################################################################
    // async clear(): Promise<void> {
    //   await this.sequelize.drop();
    //   this.sqlSchemaTableAccess = {};
    //   console.log(this.logHeader,'clear done, entities',this.getEntityUuids());
      
    //   return Promise.resolve();
    // }

    // // ##############################################################################################
    // getEntityUuids():string[] {
    //   return Object.keys(this.sqlSchemaTableAccess);
    // }

    // ##############################################################################################
    async getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
      if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[parentUuid]) {
        const result:EntityInstance = (await this.sqlSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid))?.dataValues;
        return Promise.resolve(result);
      } else {
        console.warn('getInstance',this.applicationName,this.dataStoreType,'could not find entityUuid',parentUuid);
        return Promise.resolve(undefined);
      }
    }

    // ##############################################################################################
    async getInstances(parentUuid: string): Promise<EntityInstance[]> {
      let result;
      if (this.sqlSchemaTableAccess) {
        if (this.sqlSchemaTableAccess[parentUuid]) {
          console.log('getInstances calling this.sqlEntities findall', parentUuid);

          result = this.sqlSchemaTableAccess[parentUuid]?.sequelizeModel?.findAll()
        } else {
          result = []
        }
      } else {
        result = []
      }
      return Promise.resolve(result as EntityInstance[]);
    }

    // ##############################################################################################
    async upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
      console.log("upsertInstance application",this.applicationName,"upserting into Parent", instance["parentUuid"], 'named', instance["parentName"], 'existing data schema entities', Object.keys(this.sqlSchemaTableAccess?this.sqlSchemaTableAccess:{}),'instance',instance);
      return this.sqlSchemaTableAccess[instance.parentUuid].sequelizeModel.upsert(instance as any);
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
      console.log('deleteDataInstance', parentUuid,instance);
      await this.sqlSchemaTableAccess[parentUuid].sequelizeModel.destroy({where:{uuid:instance.uuid}});
      return Promise.resolve();
    }
  }
}