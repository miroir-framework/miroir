import { DataStoreApplicationType, EntityDefinition, IAbstractStore, IStorageSpaceHandler, MetaEntity, Uuid } from "miroir-core";
import { Sequelize } from "sequelize";
import { SqlUuidEntityDefinition, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "./utils.js";

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableSqlDbStore = GConstructor<SqlDbStore>;


export class SqlDbStore implements IAbstractStore, IStorageSpaceHandler{
  // public logHeader: string;
  public applicationName: string;
  public dataStoreType: DataStoreApplicationType;
  public connectionString:string;
  public schema:string;

  public sqlSchemaTableAccess: SqlUuidEntityDefinition = {};
  public sequelize: Sequelize;
  public logHeader: string;

  // ##############################################################################################
  constructor(
    // public applicationName: string,
    // public dataStoreType: DataStoreApplicationType,
    // public connectionString:string,
    // public schema:string,
    // public logHeader: string,
    ...args:any[] // mixin constructors are limited to args:any[] parameters
  ) {
    this.applicationName = args[0];
    this.dataStoreType = args[1];
    this.connectionString = args[2];
    this.schema = args[3];
    this.logHeader = args[4];
    // this.logHeader = 'SqlDbDataStore' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
    this.sequelize = new Sequelize(this.connectionString,{schema:this.schema}) // Example for postgres
  }
  
  // ##############################################################################################
  public async open():Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('Application',this.applicationName,'dataStoreType',this.dataStoreType,'data Connection to postgres data schema', this.schema, 'has been established successfully.');
    } catch (error) {
      console.error('Unable to connect data', this.schema, ' to the postgres database:', error);
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async close(): Promise<void> {
    await this.sequelize.close();
    return Promise.resolve();
    // disconnect from DB?
  }

  // ##############################################################################################
  getEntityUuids():string[] {
    return Object.keys(this.sqlSchemaTableAccess);
  }
  
  // ######################################################################################
  async clear(): Promise<void> {
    await this.sequelize.drop();
    this.sqlSchemaTableAccess = {};
    console.log(this.logHeader,'clear done, entities',this.getEntityUuids());
    
    return Promise.resolve();
  }

  // ##############################################################################################
  async bootFromPersistedState(
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ): Promise<void> {
    this.sqlSchemaTableAccess = entities
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
  getAccessToDataSectionEntity(entity: MetaEntity,entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
    // TODO: does side effect => refactor!
    return {
      [entity.uuid]: {
        parentName: entity.parentName,
        sequelizeModel: this.sequelize.define(
          entity.name,
          fromMiroirEntityDefinitionToSequelizeEntityDefinition(entityDefinition),
          {
            freezeTableName: true,
            schema: this.schema,
          }
        ),
      },
    };
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
  
}