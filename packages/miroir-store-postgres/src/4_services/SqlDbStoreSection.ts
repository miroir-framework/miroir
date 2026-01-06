import {
  ACTION_OK,
  Action2VoidReturnType,
  EntityDefinition,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  PersistenceStoreAbstractSectionInterface,
  StorageSpaceHandlerInterface,
  Uuid
} from "miroir-core";
import { EntityUuidIndexedSequelizeModel, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "../utils";

import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { SqlDbStore } from "./SqlDbStore";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbStoreSection")
).then((logger: LoggerInterface) => {log = logger});

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableSqlDbStoreSection = GConstructor<SqlDbStoreSection>;


// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
export class SqlDbStoreSection
  extends SqlDbStore
  implements PersistenceStoreAbstractSectionInterface, StorageSpaceHandlerInterface
{
  // ##############################################################################################
  constructor(
    // applicationSection: ApplicationSection,
    // sqlDbStoreName: string,
    // dataConnectionString:string,
    // dataSchema:string,
    // logHeader:string,
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2], args[3], args[4]);
  }

  // ##############################################################################################
  getEntityUuids(): string[] {
    return Object.keys(this.sqlSchemaTableAccess);
  }

  // ######################################################################################
  async clear(): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "clear start, entities", this.getEntityUuids());
    await this.sequelize.drop();
    this.sqlSchemaTableAccess = {};
    log.info(this.logHeader, "clear done, entities", this.getEntityUuids());

    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async bootFromPersistedState(
    entities: MetaEntity[],
    entityDefinitions: EntityDefinition[]
  ): Promise<Action2VoidReturnType> {
    log.info(
      this.logHeader,
      "bootFromPersistedState called!",
      entities.map((e) => e.name + ":" + e.uuid)
    );
    // const wrongDefinitions = entityDefinitions.filter((ed=>!ed.entityUuid));
    // log.info(
    //   this.logHeader,
    //   "bootFromPersistedState wrongDefinitions",
    //   JSON.stringify(wrongDefinitions, null, 2)
    // );
    this.sqlSchemaTableAccess = entities
      // .filter(e=>['Entity','EntityDefinition'].indexOf(e.name)==-1)
      .reduce((prev, curr: MetaEntity) => {
        const entityDefinition = entityDefinitions.find((e) => e.entityUuid == curr.uuid);
        log.info(
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
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  getAccessToDataSectionEntity(
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): EntityUuidIndexedSequelizeModel {
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
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<Action2VoidReturnType> {
    this.sqlSchemaTableAccess = Object.assign(
      {},
      this.sqlSchemaTableAccess,
      this.getAccessToDataSectionEntity(entity, entityDefinition)
    );
    log.info(this.logHeader, "createStorageSpaceForInstancesOfEntity", "creating data schema table", entity.name);
    const sequelizeModel = this.sqlSchemaTableAccess[entity.uuid].sequelizeModel;
    await sequelizeModel.sync({ force: true }); // TODO: replace sync!
    log.debug(this.logHeader, "createStorageSpaceForInstancesOfEntity", "done creating data schema table", entity.name);
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<Action2VoidReturnType> {
    const queryInterface = this.sequelize.getQueryInterface();
    await queryInterface.renameTable({ tableName: oldName, schema: this.schema }, newName);
    // log.info(this.logHeader, 'renameStorageSpaceForInstancesOfEntity renameTable done.');
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
    return Promise.resolve(ACTION_OK);
  }

  // // ##############################################################################################
  // async alterStorageSpaceForInstancesOfEntity(
  //   entity: MetaEntity,
  //   entityDefinition: EntityDefinition
  // ): Promise<Action2VoidReturnType> {
  //   const queryInterface = this.sequelize.getQueryInterface();
  //   await queryInterface.renameTable({ tableName: oldName, schema: this.schema }, newName);
  //   // log.info(this.logHeader, 'alterStorageSpaceForInstancesOfEntity renameTable done.');
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
  async dropStorageSpaceForInstancesOfEntity(entityUuid: Uuid): Promise<Action2VoidReturnType> {
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
    return Promise.resolve(ACTION_OK);
  }
}
