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
  MetaEntity,
  MiroirLoggerFactory,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreEntitySectionAbstractInterface,
  PersistenceStoreInstanceSectionAbstractInterface,
  entityEntity,
  entityEntityDefinition
} from "miroir-core";
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
      // dataStore: PersistenceStoreDataSectionInterface,
      ...args: any[]
    ) {
      super(...args.slice(0, 5));
      this.dataStore = args[5];
      // log.info(this.logHeader,'MixedIndexedDbEntityStoreSection constructor',this.dataStore);
    }

    // ##############################################################################################
    // TODO: does side effect => refactor!
    getAccessToModelSectionEntity(
      entity: MetaEntity,
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
    async createEntity(
      entity: Entity,
      entityDefinition: EntityDefinition
    ): Promise<Action2VoidReturnType> {
      log.info(
        this.logHeader,
        "createEntity",
        "input: entity",
        entity,
        "entityDefinition",
        entityDefinition,
        "sqlEntities",
        this.dataStore.getEntityUuids()
      );
      if (entity.uuid != entityDefinition.entityUuid) {
        // inconsistent input, raise exception
        log.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityDefinition is not related to given entity."
        );
      } else {
        await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);

        if (!!this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[entityEntity.uuid]) {
          const sequelizeModel = this.sqlSchemaTableAccess[entityEntity.uuid].sequelizeModel;
          await sequelizeModel.upsert(entity as any);
        } else {
          log.error(
            this.logHeader,
            "createEntity",
            "could not insert in model schema for entity",
            entity
          );
        }
        if (!!this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[entityEntityDefinition.uuid]) {
          const sequelizeModel =
            this.sqlSchemaTableAccess[entityEntityDefinition.uuid].sequelizeModel;
          await sequelizeModel.upsert(entityDefinition as any);
        } else {
          log.error(
            this.logHeader,
            "createEntity",
            "could not insert in model schema for entityDefinition",
            entityDefinition
          );
        }
        // }
      }
      log.debug(this.logHeader, "createEntity", "done for", entity.name);
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
      const modifiedEntity: EntityInstanceWithName = Object.assign(
        {},
        currentEntity.returnedDomainElement,
        { name: update.payload.targetValue }
      );
      const modifiedEntityDefinition: EntityDefinition = Object.assign(
        {},
        currentEntityDefinition.returnedDomainElement as EntityDefinition,
        { name: update.payload.targetValue }
      );

      await this.upsertInstance(entityEntity.uuid, modifiedEntity);
      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);

      await this.dataStore.renameStorageSpaceForInstancesOfEntity(
        (currentEntity.returnedDomainElement as EntityInstanceWithName).name,
        update.payload.targetValue,
        modifiedEntity,
        modifiedEntityDefinition
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
      const localEntityDefinition: EntityDefinition =
        currentEntityDefinition.returnedDomainElement as EntityDefinition;
      const localEntityJzodSchemaDefinition =
        update.payload.removeColumns != undefined && Array.isArray(update.payload.removeColumns)
          ? Object.fromEntries(
              Object.entries(localEntityDefinition.jzodSchema.definition).filter(
                (i) => update.payload.removeColumns ?? ([] as string[]).includes(i[0])
              )
            )
          : localEntityDefinition.jzodSchema.definition;
      const modifiedEntityDefinition: EntityDefinition = Object.assign({}, localEntityDefinition, {
        jzodSchema: {
          type: "object",
          definition: {
            ...localEntityJzodSchemaDefinition,
            ...(update.payload.addColumns
              ? Object.fromEntries(update.payload.addColumns.map((c) => [c.name, c.definition]))
              : {}),
          },
        },
      });

      log.info(
        "alterEntityAttribute modifiedEntityDefinition",
        JSON.stringify(modifiedEntityDefinition, undefined, 2)
      );

      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);

      log.info(
        "alterEntityAttribute table",
        update.payload.entityName,
        "addColumns",
        JSON.stringify(update.payload.addColumns, null, 2)
      );

      // TODO: relies on implementation, IT SHOULD NOT! does side effect, to worsen the insult
      (this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess = {
        ...(this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess,
        ...(this.dataStore as any as SqlDbStoreSection).getAccessToDataSectionEntity(
          currentEntity.returnedDomainElement as MetaEntity,
          modifiedEntityDefinition
        ),
      };
      log.info(
        "alterEntityAttribute added columns",
        update.payload.addColumns,
        this.sequelize.json
      );

      await (this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess[
        currentEntity.returnedDomainElement.uuid
      ].sequelizeModel.sync({ alter: true }); // TODO: replace sync!

      return Promise.resolve(ACTION_OK);
    }
  };
}
