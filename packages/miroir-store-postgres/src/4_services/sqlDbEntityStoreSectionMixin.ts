import {
  ACTION_OK,
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2VoidReturnType,
  Domain2ElementFailed,
  Entity,
  EntityVersion,
  EntityInstance,
  EntityInstanceWithName,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreEntitySectionAbstractInterface,
  PersistenceStoreInstanceSectionAbstractInterface,
  applyAlterEntityAttributePair,
  applyEntityOnlyAlterAttribute,
  applyEntityOnlyRename,
  applyRenameEntityPair,
  persistEntityThenEntityDefinition,
} from "miroir-core";
import { entityEntity, entityEntityDefinition } from "miroir-test-app_deployment-miroir";
import { EntityUuidIndexedSequelizeModel, fromMiroirPresentModelToSequelizeEntityDefinition } from "../utils";
import { SqlDbStoreSection } from "./SqlDbStoreSection";
import { MixedSqlDbInstanceStoreSection, SqlDbInstanceStoreSectionMixin } from "./sqlDbInstanceStoreSectionMixin";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbEntityStoreSectionMixin")
).then((logger: LoggerInterface) => {log = logger});


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
      // #217 / #220 — Entity present-model is authoritative for Sequelize schema.
      const schemaSource = {
        name: entity.name,
        mlSchema: entity.mlSchema,
        idAttribute: entity.idAttribute,
        externalDataSource: entity.externalDataSource,
      };
      return {
        [entity.uuid]: {
          parentName: entity.parentName,
          sequelizeModel: this.sequelize.define(
            entity.name,
            fromMiroirPresentModelToSequelizeEntityDefinition(schemaSource),
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
    // #220 — createEntity is Entity-only (complete present model on Entity required).
    async createEntity(entity: Entity): Promise<Action2VoidReturnType> {
      log.info(
        this.logHeader,
        "createEntity input: entity",
        entity,
        "sqlEntities",
        this.dataStore.getEntityUuids()
      );

      await this.dataStore.createStorageSpaceForInstancesOfEntity(entity);
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
      for (const entity of entities) {
        await this.createEntity(entity);
      }
      return Promise.resolve(ACTION_OK);
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
      const currentEntity: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.payload.entityUuid
      );
      if (currentEntity instanceof Action2Error) {
        return currentEntity
      }
      if (currentEntity.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `renameEntityClean failed for section: data, entityUuid ${update.payload.entityUuid}, error: ${currentEntity.returnedDomainElement.queryFailure}, ${currentEntity.returnedDomainElement.failureMessage}`
        ));
      }
      const previousEntity = currentEntity.returnedDomainElement as Entity;
      // #220 — Entity-only rename; do not dual-write EntityVersion.
      const entityOnly = applyEntityOnlyRename(previousEntity, update.payload.targetValue);
      const upsertResult = await this.upsertInstance(entityEntity.uuid, entityOnly);
      if (upsertResult instanceof Action2Error) {
        return upsertResult;
      }
      await this.dataStore.renameStorageSpaceForInstancesOfEntity(
        (previousEntity as EntityInstanceWithName).name,
        update.payload.targetValue,
        entityOnly,
      );
      return Promise.resolve(ACTION_OK);
    }

    // ############################################################################################
    // #217 Phase 11: Entity-only alter when present model is complete; dual-write only for incomplete Entity.
    async alterEntityAttribute(
      update: ModelActionAlterEntityAttribute
    ): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "alterEntityAttribute", update);
      const currentEntity: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.payload.entityUuid
      );
      if (currentEntity instanceof Action2Error) {
        // todo: THROW???
        return currentEntity;
      }
      if (currentEntity.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(
          new Action2Error(
            "FailedToDeployModule",
            currentEntity.returnedDomainElement.failureMessage
          )
        );
      }
      const previousEntity = currentEntity.returnedDomainElement as Entity;
      const entityOnly = applyEntityOnlyAlterAttribute(previousEntity, {
        addColumns: update.payload.addColumns,
        removeColumns: update.payload.removeColumns,
      });
      if (entityOnly) {
        log.info("alterEntityAttribute Entity-only", entityOnly.uuid);
        return this.upsertInstance(entityEntity.uuid, entityOnly);
      }

      const entityVersionUuid = update.payload.entityVersionUuid;
      if (!entityVersionUuid) {
        return Promise.resolve(
          new Action2Error(
            "FailedToDeployModule",
            `alterEntityAttribute requires entityVersionUuid when Entity present model is incomplete (entityUuid ${update.payload.entityUuid})`
          )
        );
      }
      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        entityVersionUuid
      );
      if (currentEntityDefinition instanceof Action2Error) {
        // todo: THROW???
        return currentEntityDefinition;
      }
      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(
          new Action2Error(
            "FailedToDeployModule",
            currentEntityDefinition.returnedDomainElement.failureMessage
          )
        );
      }
      const previousEntityDefinition =
        currentEntityDefinition.returnedDomainElement as EntityVersion;
      const pair = applyAlterEntityAttributePair(
        previousEntity,
        previousEntityDefinition,
        {
          addColumns: update.payload.addColumns,
          removeColumns: update.payload.removeColumns,
        },
      );

      log.info(
        "alterEntityAttribute dual-write pair",
        JSON.stringify(pair, undefined, 2)
      );

      const persistResult = await persistEntityThenEntityDefinition(
        pair,
        {
          writeEntity: (nextEntity) => this.upsertInstance(entityEntity.uuid, nextEntity),
          writeEntityDefinition: (nextEntityDefinition) =>
            this.upsertInstance(entityEntity.uuid, nextEntityDefinition),
          restoreEntity: (entityToRestore) =>
            this.upsertInstance(entityEntity.uuid, entityToRestore),
        },
        { failurePolicy: { kind: "compensate" }, previousEntity },
      );
      if (persistResult instanceof Action2Error) {
        return persistResult;
      }

      log.info(
        "alterEntityAttribute table",
        update.payload.entityName,
        "addColumns",
        JSON.stringify(update.payload.addColumns, null, 2),
        "modifiedEntityDefinition",
        JSON.stringify(pair.entityVersion, null, 2)
      );

      // TODO: relies on implementation, IT SHOULD NOT! does side effect, to worsen the insult
      (this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess = {
        ...(this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess,
        ...(this.dataStore as any as SqlDbStoreSection).getAccessToDataSectionEntity(
          pair.entity,
          pair.entityVersion
        ),
      };
      log.info(
        "alterEntityAttribute added columns",
        update.payload.addColumns,
        this.sequelize.json
      );

      await (this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess[
        pair.entity.uuid!
      ].sequelizeModel.sync({ alter: true }); // TODO: replace sync!

      return Promise.resolve(ACTION_OK);
    }
  };
}
