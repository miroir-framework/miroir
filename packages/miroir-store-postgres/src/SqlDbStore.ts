import { DataStoreApplicationType, EntityDefinition, IAbstractStore, MetaEntity } from "miroir-core";
import { Sequelize } from "sequelize";
import { SqlUuidEntityDefinition, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "./utils.js";

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableSqlDbStore = GConstructor<SqlDbStore>;


export class SqlDbStore implements IAbstractStore{
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
  
}