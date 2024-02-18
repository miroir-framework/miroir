import {
  DataStoreApplicationType,
  EntityDefinition,
  AbstractStoreSectionInterface,
  StorageSpaceHandlerInterface,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  Uuid,
  getLoggerName,
  AbstractStoreInterface,
  ActionReturnType,
  ActionVoidReturnType,
  ACTION_OK,
} from "miroir-core";
import { Sequelize } from "sequelize";
import { EntityUuidIndexedSequelizeModel, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "../utils.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { SqlDbStore } from "./SqlDbStore.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "SqlDbStoreSection");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableSqlDbStoreSection = GConstructor<SqlDbStoreSection>;


// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
export class SqlDbStoreSection extends SqlDbStore implements AbstractStoreSectionInterface, StorageSpaceHandlerInterface {

  // ##############################################################################################
  constructor(
    // applicationSection: ApplicationSection,
    // sqlDbStoreName: string,
    // dataConnectionString:string,
    // dataSchema:string,
    // logHeader:string,
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(
      args[0],
      args[1],
      args[2],
      args[3],
      args[4],
    )
  }

  // ##############################################################################################
  getEntityUuids(): string[] {
    return Object.keys(this.sqlSchemaTableAccess);
  }

  // ######################################################################################
  async clear(): Promise<ActionVoidReturnType> {
    log.info(this.logHeader, "clear start, entities", this.getEntityUuids());
    await this.sequelize.drop();
    this.sqlSchemaTableAccess = {};
    log.info(this.logHeader, "clear done, entities", this.getEntityUuids());

    return Promise.resolve( ACTION_OK );
  }

  // ##############################################################################################
  async bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<ActionVoidReturnType> {
    log.info(
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
      return Promise.resolve( ACTION_OK );
    }

  // ##############################################################################################
  getAccessToDataSectionEntity(entity: MetaEntity, entityDefinition: EntityDefinition): EntityUuidIndexedSequelizeModel {
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
  async createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<ActionVoidReturnType> {
    this.sqlSchemaTableAccess = Object.assign(
      {},
      this.sqlSchemaTableAccess,
      this.getAccessToDataSectionEntity(entity, entityDefinition)
    );
    log.info(
      this.logHeader,
      "createStorageSpaceForInstancesOfEntity",
      "creating data schema table",
      entity.name
    );
    const sequelizeModel = this.sqlSchemaTableAccess[entity.uuid].sequelizeModel
    await sequelizeModel.sync({ force: true }); // TODO: replace sync!
    log.debug(
      this.logHeader,
      "createStorageSpaceForInstancesOfEntity",
      "done creating data schema table",
      entity.name
    );
    return Promise.resolve( ACTION_OK );
  }

  // ##############################################################################################
  async renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<ActionVoidReturnType> {
    const queryInterface = this.sequelize.getQueryInterface();
    await queryInterface.renameTable({ tableName: oldName, schema: this.schema }, newName);
    // log.info(this.logHeader, 'renameEntity renameTable done.');
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
    return Promise.resolve( ACTION_OK );
  }

  // // ##############################################################################################
  // async alterStorageSpaceForInstancesOfEntity(
  //   entity: MetaEntity,
  //   entityDefinition: EntityDefinition
  // ): Promise<ActionVoidReturnType> {
  //   const queryInterface = this.sequelize.getQueryInterface();
  //   await queryInterface.renameTable({ tableName: oldName, schema: this.schema }, newName);
  //   // log.info(this.logHeader, 'renameEntity renameTable done.');
  //   // removing dataSequelize model with old name
  //   this.sequelize.modelManager.removeModel(this.sequelize.model(oldName));
  //   // creating dataSequelize model for the renamed entity
  //   Object.assign(
  //     this.sqlSchemaTableAccess,
  //     this.getAccessToDataSectionEntity(
  //       // TODO: decouple from ModelUpdateConverter implementation
  //       entity,
  //       entityDefinition
  //     )
  //   );
  //   return Promise.resolve( ACTION_OK );
  // }

  // ##############################################################################################
  async dropStorageSpaceForInstancesOfEntity(entityUuid: Uuid): Promise<ActionVoidReturnType> {
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
    return Promise.resolve( ACTION_OK );
  }
}
