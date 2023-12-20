import {
  DataStoreApplicationType,
  EntityDefinition,
  IAbstractStore,
  IStorageSpaceHandler,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  Uuid,
  getLoggerName,
} from "miroir-core";
import { Sequelize } from "sequelize";
import { SqlUuidEntityDefinition, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "../utils.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbStore");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableSqlDbStore = GConstructor<SqlDbStore>;

export class SqlDbStore implements IAbstractStore, IStorageSpaceHandler {
  // public logHeader: string;
  public applicationName: string;
  public dataStoreType: DataStoreApplicationType;
  public connectionString: string;
  public schema: string;

  public sqlSchemaTableAccess: SqlUuidEntityDefinition = {};
  public sequelize: Sequelize;
  public logHeader: string;

  // ##############################################################################################
  constructor(
    // actual arguments are:
    // public applicationName: string,
    // public dataStoreType: DataStoreApplicationType,
    // public connectionString:string,
    // public schema:string,
    // public logHeader: string,
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    this.applicationName = args[0];
    this.dataStoreType = args[1];
    this.connectionString = args[2];
    this.schema = args[3];
    this.logHeader = args[4];
    // this.logHeader = 'SqlDbDataStore' + ' Application '+ this.applicationName +' dataStoreType ' + this.dataStoreType;
    this.sequelize = new Sequelize(this.connectionString, { schema: this.schema }); // Example for postgres
  }

  // ##############################################################################################
  public async open(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      log.log(
        "Application",
        this.applicationName,
        "dataStoreType",
        this.dataStoreType,
        "data Connection to postgres data schema",
        this.schema,
        "has been established successfully."
      );
    } catch (error) {
      log.error("Unable to connect data", this.schema, " to the postgres database:", error);
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
  getEntityUuids(): string[] {
    return Object.keys(this.sqlSchemaTableAccess);
  }

  // ######################################################################################
  async clear(): Promise<void> {
    log.log(this.logHeader, "clear start, entities", this.getEntityUuids());
    await this.sequelize.drop();
    this.sqlSchemaTableAccess = {};
    log.log(this.logHeader, "clear done, entities", this.getEntityUuids());

    return Promise.resolve();
  }

  // ##############################################################################################
  async bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    log.log(
      this.logHeader,
      "bootFromPersistedState called!",
      entities.map((e) => e.name + ":" + e.uuid)
    );
    this.sqlSchemaTableAccess = entities
      // .filter(e=>['Entity','EntityDefinition'].indexOf(e.name)==-1)
      .reduce((prev, curr: MetaEntity) => {
        const entityDefinition = entityDefinitions.find((e) => e.entityUuid == curr.uuid);
        log.debug(
          this.logHeader,
          "bootFromPersistedState start sqlSchemaTableAccess init initializing entity",
          curr.name,
          curr.uuid
        );
        if (entityDefinition) {
          return Object.assign(prev, this.getAccessToDataSectionEntity(curr, entityDefinition));
        } else {
          return prev;
        }
      }, {});
    return Promise.resolve();
  }

  // ##############################################################################################
  getAccessToDataSectionEntity(entity: MetaEntity, entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
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
  async createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    this.sqlSchemaTableAccess = Object.assign(
      {},
      this.sqlSchemaTableAccess,
      this.getAccessToDataSectionEntity(entity, entityDefinition)
    );
    log.log(
      this.logHeader,
      "createStorageSpaceForInstancesOfEntity",
      "Application",
      this.applicationName,
      "dataStoreType",
      this.dataStoreType,
      "creating data schema table",
      entity.name
    );
    const sequelizeModel = this.sqlSchemaTableAccess[entity.uuid].sequelizeModel
    await sequelizeModel.sync({ force: true }); // TODO: replace sync!
    log.debug(
      this.logHeader,
      "createStorageSpaceForInstancesOfEntity",
      "Application",
      this.applicationName,
      "dataStoreType",
      this.dataStoreType,
      "done creating data schema table",
      entity.name
    );
    return Promise.resolve();
  }

  // ##############################################################################################
  async renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<void> {
    const queryInterface = this.sequelize.getQueryInterface();
    await queryInterface.renameTable({ tableName: oldName, schema: this.schema }, newName);
    // log.log(this.logHeader, 'renameEntity renameTable done.');
    // removing dataSequelize model with old name
    this.sequelize.modelManager.removeModel(this.sequelize.model(oldName));
    // creating dataSequelize model for the renamed entity
    Object.assign(
      this.sqlSchemaTableAccess,
      this.getAccessToDataSectionEntity(
        // TODO: decouple from ModelUpdateConverter implementation
        entity,
        entityDefinition
      )
    );
    return Promise.resolve();
  }

  // ##############################################################################################
  async dropStorageSpaceForInstancesOfEntity(entityUuid: Uuid): Promise<void> {
    if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[entityUuid]) {
      const model = this.sqlSchemaTableAccess[entityUuid];
      log.debug(
        this.logHeader,
        "dropStorageSpaceForInstancesOfEntity entityUuid",
        entityUuid,
        "parentName",
        model.parentName
      );
      // this.sequelize.modelManager.removeModel(this.sequelize.model(model.parentName));
      await model.sequelizeModel.drop();
      delete this.sqlSchemaTableAccess[entityUuid];
    } else {
      log.warn("dropStorageSpaceForInstancesOfEntity entityUuid", entityUuid, "NOT FOUND.");
    }
    return Promise.resolve();
  }
}
