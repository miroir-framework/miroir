import { EntityDefinition, EntityInstance, IAbstractInstanceStore, MetaEntity, Uuid } from "miroir-core"
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
      // this.logHeader = 'SqlDbDataStore' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
      // this.dataSequelize = new Sequelize(dataConnectionString,{schema:dataSchema}) // Example for postgres
    }

    // ######################################################################################
    async clear(): Promise<void> {
      // drop data anq model Entities
      // await this.modelSequelize.drop();
      await this.sequelize.drop();

      // this.sqlModelSchemaTableAccess = {};
      this.sqlSchemaTableAccess = {};
      console.log(this.logHeader,'clear done, entities',this.getEntityUuids());
      
      return Promise.resolve();
    }
    // ##############################################################################################
    async createStorageSpaceForInstancesOfEntity(
      entity:MetaEntity,
      entityDefinition: EntityDefinition,
    ): Promise<void> {
      this.sqlSchemaTableAccess = Object.assign(
        {},
        this.sqlSchemaTableAccess,
        this.getAccessToDataSectionEntity(entity, entityDefinition)
      );
      console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'creating data schema table',entity.name);
      await this.sqlSchemaTableAccess[entity.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!
      console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'done creating data schema table',entity.name);
      return Promise.resolve();
    }

    // ##############################################################################################
    async renameStorageSpaceForInstancesOfEntity(
      oldName: string,
      newName: string,
      entity: MetaEntity,
      entityDefinition: EntityDefinition,
    ): Promise<void> {
      await this.sequelize.getQueryInterface().renameTable({tableName:oldName,schema:this.schema}, newName);
      // console.log(this.logHeader, 'renameEntity renameTable done.');
      // removing dataSequelize model with old name
      this.sequelize.modelManager.removeModel(this.sequelize.model(oldName));
      // creating dataSequelize model for the renamed entity
      Object.assign(
        this.sqlSchemaTableAccess,
        this.getAccessToDataSectionEntity( // TODO: decouple from ModelUpdateConverter implementation
          entity,
          entityDefinition
        )
      );
      return Promise.resolve();
    }

    // ##############################################################################################
    async dropStorageSpaceForInstancesOfEntity(
      entityUuid:Uuid,
    ): Promise<void> {
      if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[entityUuid]) {
        const model = this.sqlSchemaTableAccess[entityUuid];
        console.log(this.logHeader,"dropStorageSpaceForInstancesOfEntity entityUuid", entityUuid, 'parentName',model.parentName);
        // this.sequelize.modelManager.removeModel(this.sequelize.model(model.parentName));
        await model.sequelizeModel.drop();
        delete this.sqlSchemaTableAccess[entityUuid];
      } else {
        console.warn("dropStorageSpaceForInstancesOfEntity entityUuid", entityUuid, "NOT FOUND.");
      }
      return Promise.resolve();
    }

    // ##############################################################################################
    getEntityUuids():string[] {
      return Object.keys(this.sqlSchemaTableAccess);
    }

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
      return Promise.resolve(result);
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