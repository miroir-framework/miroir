import {
  ACTION_OK,
  Action2VoidReturnType,
  EntityVersion,
  LoggerInterface,
  Entity,
  MiroirLoggerFactory,
  PersistenceStoreAbstractSectionInterface,
  StorageSpaceHandlerInterface,
  Uuid
} from "miroir-core";
import {
  EntityUuidIndexedSequelizeModel,
  fromMiroirPresentModelToSequelizeEntityDefinition,
  getOptionalNonNullableAttributes,
} from "../utils";

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
    super(args[0], args[1], args[2], args[3], args[4], args[5]);
  }

  // ##############################################################################################
  getEntityUuids(): string[] {
    return Object.keys(this.sqlSchemaTableAccess);
  }

  // ##############################################################################################
  getEntityIdAttribute(entityUuid: string): string | string[] {
    return this.sqlSchemaTableAccess[entityUuid]?.idAttribute ?? "uuid";
  }

  // ##############################################################################################
  /** Optional non-nullable attrs for stripping SQL NULL → absent (forceNullOptionalAttributeToUndefined). */
  getOptionalNonNullableAttributesForEntity(entityUuid: string): string[] | undefined {
    return this.sqlSchemaTableAccess[entityUuid]?.optionalNonNullableAttributes;
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
    entities: Entity[],
    entityVersions: EntityVersion[]
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
      // .filter(e=>['Entity','EntityVersion'].indexOf(e.name)==-1)
      .reduce((prev, curr: Entity) => {
        // #217 Phase 11 — prefer Entity present-model fields; ED only as legacy fill-in.
        const entityVersion = entityVersions.find((e) => e.entityUuid == curr.uuid);
        const presentCarrier: Entity = {
          ...curr,
          ...(curr.mlSchema === undefined && entityVersion?.mlSchema !== undefined
            ? { mlSchema: entityVersion.mlSchema }
            : {}),
          ...(curr.idAttribute === undefined && (entityVersion as any)?.idAttribute !== undefined
            ? { idAttribute: (entityVersion as any).idAttribute }
            : {}),
          ...(curr.externalDataSource === undefined &&
          (entityVersion as any)?.externalDataSource !== undefined
            ? { externalDataSource: (entityVersion as any).externalDataSource }
            : {}),
        };
        if (!presentCarrier.mlSchema) {
          return prev;
        }
        const part = this.getAccessToDataSectionEntity(presentCarrier)
        const result = Object.assign(prev, part);
        log.info(
          this.logHeader,
          "bootFromPersistedState start sqlSchemaTableAccess init initializing entity",
          curr.name,
          curr.uuid,
          "entity configuration",
          JSON.stringify(part[curr.uuid], null, 2)
        );
        return result;
      }, {});
    // Auto-migrate: add missing columns for non-external entities (safe for schema evolution)
    // for (const [entityUuid, access] of Object.entries(this.sqlSchemaTableAccess)) {
    //   if (!access.isExternal) {
    //     try {
    //       await access.sequelizeModel.sync({ alter: true });
    //       log.info(this.logHeader, "bootFromPersistedState sync alter succeeded for entity", entityUuid);
    //     } catch (e) {
    //       log.warn(this.logHeader, "bootFromPersistedState sync alter failed for entity", entityUuid, "error:", e);
    //     }
    //   }
    // }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  getAccessToDataSectionEntity(
    entity: Entity,
  ): EntityUuidIndexedSequelizeModel {
    // #217 Phase 11 — Entity is present-model authority; ED optional legacy fill-in only.
    const schemaSource = {
      name: entity.name,
      mlSchema: entity.mlSchema,
      idAttribute: entity.idAttribute,
      externalDataSource: entity.externalDataSource,
    };
    const idAttribute: string | string[] = schemaSource.idAttribute ?? "uuid";
    const isExternal = entity.conceptLevel === "External" || !!schemaSource.externalDataSource;
    const effectiveSchema = isExternal && schemaSource.externalDataSource?.schema
      ? schemaSource.externalDataSource.schema
      : this.schema;
    const effectiveTableName = isExternal && schemaSource.externalDataSource?.tableName
      ? schemaSource.externalDataSource.tableName
      : entity.name;
    const optionalNonNullableAttributes = this.forceNullOptionalAttributeToUndefined
      ? getOptionalNonNullableAttributes(schemaSource)
      : undefined;
    const result = {
      [entity.uuid]: {
        parentName: entity.parentName,
        idAttribute,
        isExternal,
        effectiveSchema,
        optionalNonNullableAttributes,
        sequelizeModel: this.sequelize.define(
          effectiveTableName,
          fromMiroirPresentModelToSequelizeEntityDefinition(schemaSource),
          {
            freezeTableName: true,
            schema: effectiveSchema,
          }
        ),
      },
    };
    log.info(
      this.logHeader,
      "getAccessToDataSectionEntity for entity",
      entity.name,  
      entity.uuid,
      "isExternal",
      isExternal,
      "effectiveSchema",
      effectiveSchema,
      "effectiveTableName",
      effectiveTableName,
      "this.forceNullOptionalAttributeToUndefined",
      this.forceNullOptionalAttributeToUndefined,
      "optionalNonNullableAttributes",
      optionalNonNullableAttributes,
    );
    return result;
  }

  // ##############################################################################################
  async createStorageSpaceForInstancesOfEntity(
    entity: Entity,
  ): Promise<Action2VoidReturnType> {
    this.sqlSchemaTableAccess = Object.assign(
      {},
      this.sqlSchemaTableAccess,
      this.getAccessToDataSectionEntity(entity)
    );
    if (this.sqlSchemaTableAccess[entity.uuid]?.isExternal) {
      log.info(this.logHeader, "createStorageSpaceForInstancesOfEntity", "skipping table creation for external entity", entity.name);
    } else {
      log.info(this.logHeader, "createStorageSpaceForInstancesOfEntity", "creating data schema table", entity.name);
      const sequelizeModel = this.sqlSchemaTableAccess[entity.uuid].sequelizeModel;
      await sequelizeModel.sync({ force: true }); // TODO: replace sync!
      log.debug(this.logHeader, "createStorageSpaceForInstancesOfEntity", "done creating data schema table", entity.name);
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: Entity,
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
      )
    );
    return Promise.resolve(ACTION_OK);
  }

  // // ##############################################################################################
  // async alterStorageSpaceForInstancesOfEntity(
  //   entity: Entity,
  //   entityVersion: EntityVersion
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
  //       entityVersion
  //     )
  //   );
  //   return Promise.resolve( ACTION_OK );
  // }

  // ##############################################################################################
  async dropStorageSpaceForInstancesOfEntity(entityUuid: Uuid): Promise<Action2VoidReturnType> {
    if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[entityUuid]) {
      const model = this.sqlSchemaTableAccess[entityUuid];
      if (model.isExternal) {
        log.info(this.logHeader, "dropStorageSpaceForInstancesOfEntity", "skipping table drop for external entity", entityUuid);
      } else {
        log.debug(
          this.logHeader,
          "dropStorageSpaceForInstancesOfEntity entityUuid",
          entityUuid,
          "parentName",
          model.parentName
        );
        // this.sequelize.modelManager.removeModel(this.sequelize.model(model.parentName));
        await model.sequelizeModel.drop();
      }
      delete this.sqlSchemaTableAccess[entityUuid];
    } else {
      log.warn("dropStorageSpaceForInstancesOfEntity entityUuid", entityUuid, "NOT FOUND.");
    }
    return Promise.resolve(ACTION_OK);
  }
}
