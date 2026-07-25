import {
  ACTION_OK,
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2VoidReturnType,
  Domain2ElementFailed,
  Entity,
  EntityDefinition,
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
  applyRenameEntityPair,
  entityDefinitionWithResolvedMLSchema,
  normalizeCreateEntityPair,
  persistEntityThenEntityDefinition,
} from "miroir-core";
import { entityEntity, entityEntityDefinition } from "miroir-test-app_deployment-miroir";
import { EntityUuidIndexedSequelizeModel, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "../utils";
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
    getAccessToModelSectionEntity(
      entity: Entity,
      entityDefinition: EntityDefinition
    ): EntityUuidIndexedSequelizeModel {
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
    existsEntity(entityUuid: string): boolean {
      return this.dataStore.getEntityUuids().includes(entityUuid);
    }

    // ##############################################################################################
    // #217 Phase 6: Entity then EntityDefinition inside a Sequelize transaction when possible.
    async createEntity(
      entity: Entity,
      entityDefinition: EntityDefinition
    ): Promise<Action2VoidReturnType> {
      log.info(
        this.logHeader,
        "createEntity input: entity",
        entity,
        "entityDefinition",
        entityDefinition,
        "sqlEntities",
        this.dataStore.getEntityUuids()
      );
      if (entity.uuid != entityDefinition.entityUuid) {
        log.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityDefinition is not related to given entity."
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToCreateStore",
            "createEntity failed: inconsistent input, given entityDefinition is not related to given entity.",
            undefined, // errorStack
            undefined, // innerError,
            { entity, entityDefinition } // errorContext
          ),
        );
      }

      const pair = normalizeCreateEntityPair(entity, entityDefinition);
      const localEntityDefinition = pair.entityDefinition.mlSchema?.extend
        ? entityDefinitionWithResolvedMLSchema(pair.entityDefinition as EntityDefinition)
        : pair.entityDefinition;
      
      await this.dataStore.createStorageSpaceForInstancesOfEntity(
        pair.entity,
        localEntityDefinition as EntityDefinition,
      );

      if (!this.sqlSchemaTableAccess?.[entityEntity.uuid] || !this.sqlSchemaTableAccess?.[entityEntityDefinition.uuid]) {
        log.error(
          this.logHeader,
          "createEntity",
          "could not insert in model schema for entity / entityDefinition",
          pair.entity,
          pair.entityDefinition,
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToCreateStore",
            "createEntity failed: could not insert in model schema for entity or entityDefinition.",
            undefined,
            undefined,
            { entity: pair.entity, entityDefinition: pair.entityDefinition },
          ),
        );
      }

      try {
        await this.sequelize.transaction(async (transaction: any) => {
          await this.sqlSchemaTableAccess![entityEntity.uuid].sequelizeModel.upsert(
            pair.entity as any,
            { transaction },
          );
          await this.sqlSchemaTableAccess![entityEntityDefinition.uuid].sequelizeModel.upsert(
            pair.entityDefinition as any,
            { transaction },
          );
        });
      } catch (error) {
        return Promise.resolve(
          new Action2Error(
            "FailedToCreateStore",
            `createEntity transactional dual-write failed: ${(error as Error).message}`,
            ["createEntity", "transaction"],
            undefined,
            { entity: pair.entity, entityDefinition: pair.entityDefinition, error },
          ),
        );
      }
      log.debug(this.logHeader, "createEntity", "done for", pair.entity.name);
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async createEntities(
      entities: {
        entity: Entity;
        entityDefinition: EntityDefinition;
      }[]
    ): Promise<Action2VoidReturnType> {
      for (const e of entities) {
        await this.createEntity(e.entity, e.entityDefinition);
      }
      return Promise.resolve(ACTION_OK);
    }

    // ##############################################################################################
    async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
      log.info("dropEntity entityUuid", entityUuid);
      if ([entityEntity.uuid, entityEntityDefinition.uuid].includes(entityUuid)) {
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
          //remove all entity definitions for the dropped entity
          const entityDefinitions: Action2EntityInstanceCollectionOrFailure =
            await this.getInstances(entityEntityDefinition.uuid);

          log.trace(
            "dropEntity entityUuid",
            entityUuid,
            "found Entity Definitions:",
            entityDefinitions
          );
          if (entityDefinitions instanceof Action2Error) {
            return Promise.resolve(
              new Action2Error(
                "FailedToDeleteStore",
                `dropEntity failed for section: data, entityUuid ${entityUuid}, error: ${entityDefinitions.errorMessage}`
              )
            );
          }
          if (entityDefinitions.returnedDomainElement instanceof Domain2ElementFailed) {
            return Promise.resolve(
              new Action2Error(
                "FailedToDeleteStore",
                `dropEntity failed for section: data, entityUuid ${entityUuid}, error: ${entityDefinitions.returnedDomainElement.queryFailure}, ${entityDefinitions.returnedDomainElement.failureMessage}`
              )
            );
          }

          for (const entityDefinition of entityDefinitions.returnedDomainElement.instances.filter(
            (i: EntityInstance) => (i as EntityDefinition).entityUuid == entityUuid
          )) {
            await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
          }

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
    async renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType> {
      // TODO: identical to IndexedDbModelStoreSection implementation!
      log.info(this.logHeader, "renameEntityClean", update);
      const currentEntity: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.payload.entityUuid
      );
      if (currentEntity instanceof Action2Error) {
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

      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        update.payload.entityDefinitionUuid
      );

      if (currentEntityDefinition instanceof Action2Error) {
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
      const previousEntity = currentEntity.returnedDomainElement as Entity;
      const previousEntityDefinition =
        currentEntityDefinition.returnedDomainElement as EntityDefinition;
      const pair = applyRenameEntityPair(
        previousEntity,
        previousEntityDefinition,
        update.payload.targetValue,
      );

      const persistResult = await persistEntityThenEntityDefinition(
        pair,
        {
          writeEntity: (nextEntity) => this.upsertInstance(entityEntity.uuid, nextEntity),
          writeEntityDefinition: (nextEntityDefinition) =>
            this.upsertInstance(entityEntityDefinition.uuid, nextEntityDefinition),
          restoreEntity: (entityToRestore) =>
            this.upsertInstance(entityEntity.uuid, entityToRestore),
        },
        { failurePolicy: { kind: "compensate" }, previousEntity },
      );
      if (persistResult instanceof Action2Error) {
        return persistResult;
      }

      await this.dataStore.renameStorageSpaceForInstancesOfEntity(
        (previousEntity as EntityInstanceWithName).name,
        update.payload.targetValue,
        pair.entity,
        pair.entityDefinition
      );
      return Promise.resolve(ACTION_OK);
    }

    // ############################################################################################
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
      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        update.payload.entityDefinitionUuid
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
      const previousEntity = currentEntity.returnedDomainElement as Entity;
      const previousEntityDefinition =
        currentEntityDefinition.returnedDomainElement as EntityDefinition;
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
            this.upsertInstance(entityEntityDefinition.uuid, nextEntityDefinition),
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
        JSON.stringify(pair.entityDefinition, null, 2)
      );

      // TODO: relies on implementation, IT SHOULD NOT! does side effect, to worsen the insult
      (this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess = {
        ...(this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess,
        ...(this.dataStore as any as SqlDbStoreSection).getAccessToDataSectionEntity(
          pair.entity,
          pair.entityDefinition
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
