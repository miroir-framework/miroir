import {
  ACTION_OK,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2VoidReturnType,
  Domain2ElementFailed,
  Entity,
  EntityInstance,
  EntityInstanceWithName,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreEntitySectionAbstractInterface,
  PersistenceStoreInstanceSectionAbstractInterface,
  applyEntityOnlyRename,
  applyMlSchemaColumnChanges,
  createEntitiesStrictly,
  isHttpExternalEntity,
  isSqlExternalEntity,
  readEntityRowUuids,
  type StrictEntityCreationStore,
} from "@miroir-framework/core";
import { entityEntity } from "@miroir-framework/core/meta-model";
import { EntityUuidIndexedSequelizeModel, fromMiroirPresentModelToSequelizeEntityDefinition } from "../utils";
import { SqlDbStoreSection } from "./SqlDbStoreSection";
import { MixedSqlDbInstanceStoreSection, SqlDbInstanceStoreSectionMixin } from "./sqlDbInstanceStoreSectionMixin";

import { packageName } from "../constants.js";

/** #745 D7: `errorContext.reason` of a refused SQL alter or rename. */
export const SQL_TABLE_REFUSALS = {
  columnExists: "columnExists",
  columnMissing: "columnMissing",
  tableExists: "tableExists",
} as const;
import { cleanLevel } from "./constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "sqlDbEntityStoreSectionMixin");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});


export const MixedSqlDbEntityAndInstanceStoreSection = SqlDbEntityStoreSectionMixin(SqlDbInstanceStoreSectionMixin(SqlDbStoreSection));

export function SqlDbEntityStoreSectionMixin<TBase extends typeof MixedSqlDbInstanceStoreSection>(
  Base: TBase
) {
  return class MixedSqlDbEntityStoreSection
    extends Base
    implements
      PersistenceStoreEntitySectionAbstractInterface,
      PersistenceStoreInstanceSectionAbstractInterface
  {
    public dataStore: PersistenceStoreDataSectionInterface;

    constructor(
      // applicationSection: ApplicationSection,
      // sqlDbStoreName: string,
      // dataConnectionString:string,
      // dataSchema:string,
      // logHeader:string,
      // forceNullOptionalAttributeToUndefined: boolean,
      // dataStore: PersistenceStoreDataSectionInterface,
      ...args: any[]
    ) {
      super(...args.slice(0, 6));
      this.dataStore = args[6];
      // log.info(this.logHeader,'MixedIndexedDbEntityStoreSection constructor',this.dataStore);
    }

    // ##############################################################################################
    // TODO: does side effect => refactor!
    getAccessToModelSectionEntity(entity: Entity): EntityUuidIndexedSequelizeModel {
      return {
        [entity.uuid]: {
          parentName: entity.parentName,
          sequelizeModel: this.sequelize.define(
            entity.name,
            fromMiroirPresentModelToSequelizeEntityDefinition(entity),
            {
              freezeTableName: true,
              schema: this.schema,
            }
          ),
        },
      };
    }

    // ##############################################################################################
    existsEntity(entityUuid: string): boolean {
      return this.dataStore.getEntityUuids().includes(entityUuid);
    }

    // ##############################################################################################
    /** #745 D4: the checks and writes of a strict `createEntity` on this store. */
    strictEntityCreationStore(): StrictEntityCreationStore {
      return {
        storeLabel: this.logHeader,
        entityRowUuids: () => readEntityRowUuids(this, entityEntity.uuid),
        // The model and data sections share one schema. A table the model section registers for this very Entity
        // (an application keeps its version-history Entities in its model section) is the model's storage, not
        // storage left behind: the data section uses it as it is, keeping its rows, instead of dropping it.
        storageSpaceExists: this.dataStore.storageSpaceExists
          ? async (entity) => !this.modelRegistersTableOf(entity) && (await this.dataStore.storageSpaceExists!(entity))
          : undefined,
        createStorageSpace: async (entity) => {
          try {
            return this.modelRegistersTableOf(entity) && this.dataStore.createStorageSpaceForInstancesOfEntityIfMissing
              ? await this.dataStore.createStorageSpaceForInstancesOfEntityIfMissing(entity)
              : await this.dataStore.createStorageSpaceForInstancesOfEntity(entity);
          } catch (error) {
            return new Action2Error("FailedToCreateStore", `could not create the table of Entity ${entity.name}: ${(error as Error).message}`);
          }
        },
        writeEntityRow: (entity) => this.writeEntityRow(entity),
      };
    }

    // ##############################################################################################
    /** #745 D4: whether the model section registers the table of this Entity, under its name. */
    modelRegistersTableOf(entity: Entity): boolean {
      return this.sqlSchemaTableAccess?.[entity.uuid]?.sequelizeModel.tableName === entity.name;
    }

    // ##############################################################################################
    // #220 — createEntity is Entity-only (complete present model on Entity required).
    // #745 D4 — fails when the Entity's row or table exists, before writing anything.
    async createEntity(entity: Entity): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "createEntity input: entity", entity, "sqlEntities", this.dataStore.getEntityUuids());
      return createEntitiesStrictly(this.strictEntityCreationStore(), [entity]);
    }

    // ##############################################################################################
    async writeEntityRow(entity: Entity): Promise<Action2VoidReturnType> {
      if (!this.sqlSchemaTableAccess?.[entityEntity.uuid]) {
        return Promise.resolve(
          new Action2Error(
            "FailedToCreateStore",
            "createEntity failed: could not insert Entity in model schema.",
            undefined,
            undefined,
            { entity },
          ),
        );
      }
      try {
        await this.sqlSchemaTableAccess[entityEntity.uuid].sequelizeModel.upsert(entity as any);
      } catch (error) {
        return Promise.resolve(
          new Action2Error(
            "FailedToCreateStore",
            `createEntity Entity-only write failed: ${(error as Error).message}`,
            ["createEntity"],
            undefined,
            { entity, error },
          ),
        );
      }
      log.debug(this.logHeader, "createEntity", "done Entity-only for", entity.name);
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async createEntities(entities: Entity[]): Promise<Action2VoidReturnType> {
      return createEntitiesStrictly(this.strictEntityCreationStore(), entities);
    }

    // ##############################################################################################
    // #220 — Entity-only drop: remove Entity + storage space; do not touch EntityVersions.
    async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
      log.info("dropEntity entityUuid", entityUuid);
      if ([entityEntity.uuid, entityEntity.uuid].includes(entityUuid)) {
        // TODO: UGLY!!!!!!! DOES IT EVEN WORK????
        if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[entityUuid]) {
          const model = this.sqlSchemaTableAccess[entityUuid];
          log.debug("dropEntity entityUuid", entityUuid, "parentName", model.parentName);
          await model.sequelizeModel.drop();
          delete this.sqlSchemaTableAccess[entityUuid];
        } else {
          log.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
        }
      } else {
        if (this.dataStore.getEntityUuids().includes(entityUuid)) {
          await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
          await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);
        } else {
          log.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
        }
      }
      return Promise.resolve(ACTION_OK);
    }
    // ##############################################################################################
    async dropEntities(entityUuids: string[]): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "dropEntities parentUuid", entityUuids);
      for (const e of entityUuids) {
        await this.dropEntity(e);
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    // #220 — Entity-only rename; never dual-write EntityVersion.
    async renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "renameEntityClean", update);
      const previousEntity = await this.storedEntity(update.payload.entityUuid, "renameEntity");
      if (previousEntity instanceof Action2Error) {
        return previousEntity;
      }
      // #220 — Entity-only rename; do not dual-write EntityVersion.
      const entityOnly = applyEntityOnlyRename(previousEntity, update.payload.targetValue);
      if (!isHttpExternalEntity(previousEntity)) {
        // #745 D7: check, rename (its result checked), then write the row
        const { schema } = this.tableOf(previousEntity);
        const queryInterface = this.sequelize.getQueryInterface();
        if (await queryInterface.tableExists({ tableName: update.payload.targetValue, schema })) {
          return this.tableRefusal(
            "renameEntity",
            SQL_TABLE_REFUSALS.tableExists,
            previousEntity,
            `table ${schema}.${update.payload.targetValue} exists; Entity ${previousEntity.name} is not renamed`,
            { table: update.payload.targetValue },
          );
        }
        try {
          const renamed = await this.dataStore.renameStorageSpaceForInstancesOfEntity(
            (previousEntity as EntityInstanceWithName).name,
            update.payload.targetValue,
            entityOnly,
          );
          if (renamed instanceof Action2Error) {
            return renamed;
          }
        } catch (error) {
          return new Action2Error(
            "FailedToDeployModule",
            `renameEntity: could not rename the table of Entity ${previousEntity.name} to ${update.payload.targetValue}: ${(error as Error).message}`,
            ["renameEntity"],
          );
        }
      }
      return this.upsertInstance(entityEntity.uuid, entityOnly);
    }

    // ############################################################################################
    // #220 — Entity-only alter; never dual-write EntityVersion.
    // #745 D7 — checks first, then adds and removes only the named columns (in one transaction), then writes
    // the Entity row. A column the Entity row does not declare is kept, with its values.
    async alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "alterEntityAttribute", update);
      const previousEntity = await this.storedEntity(update.payload.entityUuid, "alterEntityAttribute");
      if (previousEntity instanceof Action2Error) {
        return previousEntity;
      }
      const alteredEntity: Entity = {
        ...previousEntity,
        mlSchema: applyMlSchemaColumnChanges(previousEntity.mlSchema, {
          addColumns: update.payload.addColumns,
          removeColumns: update.payload.removeColumns,
        }),
      };
      if (isHttpExternalEntity(previousEntity)) {
        return this.upsertInstance(entityEntity.uuid, alteredEntity);
      }
      const table = this.tableOf(previousEntity);
      const queryInterface = this.sequelize.getQueryInterface();
      let columns: Record<string, unknown>;
      try {
        columns = await queryInterface.describeTable(table);
      } catch (error) {
        return new Action2Error(
          "FailedToDeployModule",
          `alterEntityAttribute: could not read the columns of table ${table.schema}.${table.tableName}: ${(error as Error).message}`,
          ["alterEntityAttribute"],
        );
      }
      // virtual attributes have no column: the definitions of the altered Entity name the columns to add
      const alteredColumns = fromMiroirPresentModelToSequelizeEntityDefinition(alteredEntity) as Record<string, any>;
      const previousColumns = fromMiroirPresentModelToSequelizeEntityDefinition(previousEntity) as Record<string, any>;
      const added = (update.payload.addColumns ?? []).map((column) => column.name).filter((name) => alteredColumns[name] !== undefined);
      const removed = (update.payload.removeColumns ?? []).filter((name) => previousColumns[name] !== undefined);
      const existing = added.find((name) => columns[name] !== undefined);
      if (existing) {
        return this.tableRefusal(
          "alterEntityAttribute",
          SQL_TABLE_REFUSALS.columnExists,
          previousEntity,
          `column ${existing} of table ${table.schema}.${table.tableName} exists; nothing is changed`,
          { column: existing },
        );
      }
      const missing = removed.find((name) => columns[name] === undefined);
      if (missing) {
        return this.tableRefusal(
          "alterEntityAttribute",
          SQL_TABLE_REFUSALS.columnMissing,
          previousEntity,
          `column ${missing} of table ${table.schema}.${table.tableName} does not exist; nothing is changed`,
          { column: missing },
        );
      }
      try {
        await this.sequelize.transaction(async (transaction) => {
          for (const name of added) {
            const { primaryKey: _primaryKey, ...definition } = alteredColumns[name];
            await queryInterface.addColumn(table, name, definition, { transaction });
          }
          for (const name of removed) {
            await queryInterface.removeColumn(table, name, { transaction });
          }
        });
      } catch (error) {
        return new Action2Error(
          "FailedToDeployModule",
          `alterEntityAttribute: could not change the columns of table ${table.schema}.${table.tableName}; nothing is changed: ${(error as Error).message}`,
          ["alterEntityAttribute"],
        );
      }
      // the data section's Sequelize model follows the altered Entity
      const dataStore = this.sqlDataStore();
      dataStore.sqlSchemaTableAccess = {
        ...dataStore.sqlSchemaTableAccess,
        ...dataStore.getAccessToDataSectionEntity(alteredEntity),
      };
      return this.upsertInstance(entityEntity.uuid, alteredEntity);
    }

    // ############################################################################################
    /** The data section, as the SQL store section it is. */
    sqlDataStore(): SqlDbStoreSection {
      return this.dataStore as unknown as SqlDbStoreSection;
    }

    // ############################################################################################
    /** The table of an Entity's instances: its own schema and name for an external SQL Entity. */
    tableOf(entity: Entity): { tableName: string; schema: string } {
      const dataStore = this.sqlDataStore();
      const access = dataStore.sqlSchemaTableAccess[entity.uuid];
      if (access) {
        return { tableName: access.sequelizeModel.tableName, schema: access.effectiveSchema ?? dataStore.schema };
      }
      return isSqlExternalEntity(entity)
        ? {
            tableName: entity.externalDataSource?.tableName ?? entity.name,
            schema: entity.externalDataSource?.schema ?? dataStore.schema,
          }
        : { tableName: entity.name, schema: dataStore.schema };
    }

    // ############################################################################################
    /** The stored Entity row, or an error naming the action. */
    async storedEntity(entityUuid: string, actionType: string): Promise<Entity | Action2Error> {
      const currentEntity: Action2EntityInstanceReturnType = await this.getInstance(entityEntity.uuid, entityUuid);
      if (currentEntity instanceof Action2Error) {
        return currentEntity;
      }
      if (currentEntity.returnedDomainElement instanceof Domain2ElementFailed || !currentEntity.returnedDomainElement) {
        return new Action2Error(
          "FailedToDeployModule",
          `${actionType}: no Entity ${entityUuid} in the model section${
            currentEntity.returnedDomainElement instanceof Domain2ElementFailed
              ? `: ${currentEntity.returnedDomainElement.queryFailure}, ${currentEntity.returnedDomainElement.failureMessage}`
              : ""
          }`,
        );
      }
      return currentEntity.returnedDomainElement as Entity;
    }

    // ############################################################################################
    tableRefusal(actionType: string, reason: string, entity: Entity, message: string, context: Record<string, unknown>): Action2Error {
      return new Action2Error("FailedToDeployModule", `${actionType} on Entity ${entity.name}: ${message}`, [actionType], undefined, {
        reason,
        entity: entity.uuid,
        entityName: entity.name,
        ...context,
      });
    }
  };
}
