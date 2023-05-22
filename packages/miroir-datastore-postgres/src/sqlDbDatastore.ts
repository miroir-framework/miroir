import {
  DataStoreApplicationType,
  DataStoreInterface,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaEntity,
  Uuid
} from "miroir-core";
import { Sequelize } from "sequelize";
import { SqlUuidEntityDefinition, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "./utils.js";


export class SqlDbDataStore implements DataStoreInterface {
  private sqlDataSchemaTableAccess: SqlUuidEntityDefinition = {};
  private logHeader: string;
  public dataSequelize: Sequelize;

  // ##############################################################################################
  constructor(
    // seq: any,
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    public dataConnectionString:string,
    public dataSchema:string,
    // private dataSequelize: Sequelize,
  ) {
    this.logHeader = 'SqlDbDataStore' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
    this.dataSequelize = new Sequelize(dataConnectionString,{schema:dataSchema}) // Example for postgres
  }

  // ##############################################################################################
  public async connect():Promise<void> {
    try {
      await this.dataSequelize.authenticate();
      console.log('Application',this.applicationName,'dataStoreType',this.dataStoreType,'data Connection to postgres data schema', this.dataSchema, 'has been established successfully.');
    } catch (error) {
      console.error('Unable to connect data', this.dataSchema, ' to the postgres database:', error);
    }
  }

  // ##############################################################################################
  async getState():Promise<{[uuid:string]:EntityInstanceCollection}>{ // TODO: same implementation as in IndexedDbStoreController
    let result = {};
    console.log(this.logHeader,'getState this.getEntities()',this.getEntityUuids());
    
    for (const parentUuid of this.getEntityUuids()) {
      console.log(this.logHeader,'getState getting instances for',parentUuid);
      const instances:EntityInstanceCollection = {parentUuid:parentUuid, applicationSection:'data',instances:await this.getDataInstances(parentUuid)};
      console.log(this.logHeader,'getState found instances',parentUuid,instances);
      
      Object.assign(result,{[parentUuid]:instances});
    }
    return Promise.resolve(result);
  }

  // ##############################################################################################
  getEntityNames():string[] {
    return Object.keys(this.dataSequelize.models);
  }

  // ##############################################################################################
  getEntityUuids():string[] {
    return Object.keys(this.sqlDataSchemaTableAccess);
  }

  // ##############################################################################################
  getAccessToDataSectionEntity(entity: MetaEntity,entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    // TODO: does side effect => refactor!
    return {
      [entity.uuid]: {
        parentName: entity.parentName,
        sequelizeModel: this.dataSequelize.define(
          entity.name,
          fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
          {
            freezeTableName: true,
            schema: this.dataSchema,
          }
        ),
      },
    };
  }

  // ##############################################################################################
  async getDataInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    if (this.sqlDataSchemaTableAccess && this.sqlDataSchemaTableAccess[parentUuid]) {
      const result:EntityInstance = (await this.sqlDataSchemaTableAccess[parentUuid].sequelizeModel.findByPk(uuid))?.dataValues;
      return Promise.resolve(result);
    } else {
      console.warn('getDataInstance',this.applicationName,this.dataStoreType,'could not find entityUuid',parentUuid);
      return Promise.resolve(undefined);
    }
  }

  // ##############################################################################################
  // async getDataInstances(parentUuid: string, sqlEntities?: SqlUuidEntityDefinition): Promise<EntityInstance[]> {
  async getDataInstances(parentUuid: string): Promise<EntityInstance[]> {
    let result;
    if (this.sqlDataSchemaTableAccess) {
      if (this.sqlDataSchemaTableAccess[parentUuid]) {
        console.log('getDataInstances calling this.sqlEntities findall', parentUuid);

        result = this.sqlDataSchemaTableAccess[parentUuid]?.sequelizeModel?.findAll()
      } else {
        result = []
      }
    } else {
      result = []
    }
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async upsertDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log("upsertDataInstance application",this.applicationName,"upserting into Parent", instance["parentUuid"], 'named', instance["parentName"], 'existing data schema entities', Object.keys(this.sqlDataSchemaTableAccess?this.sqlDataSchemaTableAccess:{}),'instance',instance);
    // return this.sqlUuidEntities[instance.parentUuid].sequelizeModel.create(instance as any);
    return this.sqlDataSchemaTableAccess[instance.parentUuid].sequelizeModel.upsert(instance as any);
  }

  // ##############################################################################################
  async deleteDataInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    for (const instance of instances) {
      await this.deleteDataInstance(parentUuid,instance);
    }
    return Promise.resolve();
  }


  // ##############################################################################################
  async deleteDataInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log('deleteDataInstance', parentUuid,instance);
    await this.sqlDataSchemaTableAccess[parentUuid].sequelizeModel.destroy({where:{uuid:instance.uuid}});
    return Promise.resolve();
  }

  // ##############################################################################################
  async dropData(
    // metaModel:MiroirMetaModel,
  ):Promise<void> {
    // drop data anq model Entities
    // await this.modelSequelize.drop();
    await this.dataSequelize.drop();

    // this.sqlModelSchemaTableAccess = {};
    this.sqlDataSchemaTableAccess = {};
    console.log(this.logHeader,'dropData done, entities',this.getEntityNames());
    
    return Promise.resolve();
  }
  

  // ##############################################################################################
  async bootFromPersistedState(
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ): Promise<void> {
    this.sqlDataSchemaTableAccess = entities
      .filter(e=>['Entity','EntityDefinition'].indexOf(e.name)==-1)
      .reduce(
        (prev, curr: MetaEntity) => {
          const entityDefinition = entityDefinitions.find(e=>e.entityUuid==curr.uuid);
          console.log(this.logHeader,"bootFromPersistedState start sqlDataSchemaTableAccess init initializing entity", curr.name,curr.parentUuid);
          if (entityDefinition) {
            return Object.assign(prev, this.getAccessToDataSectionEntity(curr,entityDefinition));
          } else {
            return prev;
          }
        }, {}
      )
    ;
    return Promise.resolve();
  }

  // ##############################################################################################
  async createStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void> {
    this.sqlDataSchemaTableAccess = Object.assign(
      {},
      this.sqlDataSchemaTableAccess,
      this.getAccessToDataSectionEntity(entity, entityDefinition)
    );
    console.log(this.logHeader,'createStorageSpaceForInstancesOfEntity','Application',this.applicationName,'dataStoreType',this.dataStoreType,'creating data schema table',entity.name);
    await this.sqlDataSchemaTableAccess[entity.uuid].sequelizeModel.sync({ force: true }); // TODO: replace sync!
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
    await this.dataSequelize.getQueryInterface().renameTable({tableName:oldName,schema:this.dataSchema}, newName);
    // console.log(this.logHeader, 'renameEntity renameTable done.');
    // removing dataSequelize model with old name
    this.dataSequelize.modelManager.removeModel(this.dataSequelize.model(oldName));
    // creating dataSequelize model for the renamed entity
    Object.assign(
      this.sqlDataSchemaTableAccess,
      this.getAccessToDataSectionEntity( // TODO: decouple from ModelUpdateConverter implementation
        entity,
        entityDefinition
      )
    );
  }

  // ##############################################################################################
  async dropStorageSpaceForInstancesOfEntity(
    entityUuid:Uuid,
  ): Promise<void> {
    if (this.sqlDataSchemaTableAccess && this.sqlDataSchemaTableAccess[entityUuid]) {
      const model = this.sqlDataSchemaTableAccess[entityUuid];
      console.log(this.logHeader,"dropStorageSpaceForInstancesOfEntity entityUuid", entityUuid, 'parentName',model.parentName);
      // this.sequelize.modelManager.removeModel(this.sequelize.model(model.parentName));
      await model.sequelizeModel.drop();
      delete this.sqlDataSchemaTableAccess[entityUuid];
    } else {
      console.warn("dropStorageSpaceForInstancesOfEntity entityUuid", entityUuid, "NOT FOUND.");
    }
  }

  // ##############################################################################################
  async close() {
    await this.dataSequelize.close();
    return Promise.resolve();
    // disconnect from DB?
  }
  

}