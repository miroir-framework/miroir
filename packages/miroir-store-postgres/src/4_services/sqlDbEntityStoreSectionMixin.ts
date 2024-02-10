import {
  EntityDefinition,
  EntityInstance,
  AbstractEntityStoreSectionInterface,
  AbstractInstanceStoreSectionInterface,
  StoreDataSectionInterface,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
  entityEntity,
  entityEntityDefinition,
  getLoggerName,
  ActionReturnType,
  ACTION_OK,
  ActionEntityInstanceCollectionReturnType,
  ActionVoidReturnType,
  ActionEntityInstanceReturnType,
  EntityInstanceWithName,
  ModelActionRenameEntity,
} from "miroir-core";
import { SqlDbStoreSection } from "./SqlDbStoreSection.js";
import { MixedSqlDbInstanceStoreSection, SqlDbInstanceStoreSectionMixin } from "./sqlDbInstanceStoreSectionMixin.js";
import { SqlUuidEntityDefinition, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "../utils.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbEntityStoreSectionMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const MixedSqlDbEntityAndInstanceStoreSection = SqlDbEntityStoreSectionMixin(SqlDbInstanceStoreSectionMixin(SqlDbStoreSection));

export function SqlDbEntityStoreSectionMixin<TBase extends typeof MixedSqlDbInstanceStoreSection>(Base: TBase) {
  return class MixedSqlDbEntityStoreSection extends Base implements AbstractEntityStoreSectionInterface, AbstractInstanceStoreSectionInterface {
    public dataStore: StoreDataSectionInterface;

    constructor(
      // applicationSection: ApplicationSection,
      // sqlDbStoreName: string,
      // dataConnectionString:string,
      // dataSchema:string,
      // logHeader:string,
      // dataStore: StoreDataSectionInterface,
      ...args: any[]
    ) {
      super(...args.slice(0, 5));
      this.dataStore = args[5];
      // log.info(this.logHeader,'MixedIndexedDbEntityStoreSection constructor',this.dataStore);
    }

    // ##############################################################################################
    // TODO: does side effect => refactor!
    getAccessToModelSectionEntity(entity: MetaEntity, entityDefinition: EntityDefinition): SqlUuidEntityDefinition {
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
    async createEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<ActionVoidReturnType> {
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
          const sequelizeModel = this.sqlSchemaTableAccess[entityEntity.uuid].sequelizeModel
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
          const sequelizeModel = this.sqlSchemaTableAccess[entityEntityDefinition.uuid].sequelizeModel;
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
    async dropEntity(entityUuid: string): Promise<ActionVoidReturnType> {
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
          const entityDefinitions: ActionEntityInstanceCollectionReturnType = await this.getInstances(entityEntityDefinition.uuid);

          log.trace("dropEntity entityUuid", entityUuid, "found Entity Definitions:", entityDefinitions);
          if (entityDefinitions.status != "ok") {
            return Promise.resolve({
              status: "error",
              error: {
                errorType: "FailedToDeleteStore",// TODO: correct errorType
                errorMessage: `dropEntity failed for section: data, entityUuid ${entityUuid}, error: ${entityDefinitions.error.errorType}, ${entityDefinitions.error.errorMessage}`,
              },
            });
          }
          // if (entityDefinitions.returnedDomainElement?.elementType != "entityInstanceCollection") {
          //   return Promise.resolve({
          //     status: "error",
          //     error: {
          //       errorType: "FailedToGetInstances", // TODO: correct errorType
          //       errorMessage: `getInstances failed for section: data, entityUuid ${entityUuid} wrong element type, expected "entityInstanceCollection", got elementType: ${entityDefinitions.returnedDomainElement?.elementType}`,
          //     },
          //   });
          // }
  
          for (const entityDefinition of entityDefinitions.returnedDomainElement.elementValue.instances.filter((i: EntityDefinition) => i.entityUuid == entityUuid)) {
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
    async dropEntities(entityUuids: string[]): Promise<ActionVoidReturnType> {
      log.info(this.logHeader, "dropEntities parentUuid", entityUuids);
      for (const e of entityUuids) {
        await this.dropEntity(e);
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    async renameEntityClean(update: ModelActionRenameEntity): Promise<ActionVoidReturnType> {
      // TODO: identical to IndexedDbModelStoreSection implementation!
      log.info(this.logHeader, "renameEntityClean", update);
      // const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
      const currentEntity: ActionEntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.entityUuid
      );
      if (currentEntity.status != "ok") {
        return currentEntity
      }
      const currentEntityDefinition: ActionEntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        update.entityDefinitionUuid
      );

      if (currentEntity.status != "ok") {
        return currentEntity
      }
      if (currentEntityDefinition.status != "ok") {
        return currentEntityDefinition
      }
      const modifiedEntity:EntityInstanceWithName = Object.assign({},currentEntity.returnedDomainElement.elementValue,{name:update.targetValue});
      const modifiedEntityDefinition:EntityDefinition = Object.assign({},currentEntityDefinition.returnedDomainElement.elementValue as EntityDefinition,{name:update.targetValue});

      await this.upsertInstance(entityEntity.uuid, modifiedEntity);
      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);

      await this.dataStore.renameStorageSpaceForInstancesOfEntity(
        (currentEntity.returnedDomainElement.elementValue as EntityInstanceWithName).name,
        update.targetValue,
        modifiedEntity,
        modifiedEntityDefinition
      );
      return Promise.resolve(ACTION_OK);
    }
    
    // ##############################################################################################
    async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate): Promise<ActionVoidReturnType> {
      if (
        update.equivalentModelCUDUpdates.length &&
        update.equivalentModelCUDUpdates[0] &&
        update.equivalentModelCUDUpdates[0].objects?.length &&
        update.equivalentModelCUDUpdates[0].objects[0] &&
        update.equivalentModelCUDUpdates[0].objects[1] &&
        update.equivalentModelCUDUpdates[0].objects[0].instances[0] &&
        update.equivalentModelCUDUpdates[0].objects[1].instances[0]
      ) {
        const modelCUDupdate = update.equivalentModelCUDUpdates[0];
        const model =
          modelCUDupdate && modelCUDupdate.objects?.length && modelCUDupdate.objects[0]
            ? this.sqlSchemaTableAccess[modelCUDupdate.objects[0].parentUuid]
            : undefined;
        log.debug(this.logHeader, "renameEntity update", update);
        log.debug(this.logHeader, "renameEntity model", model);

        await this.dataStore.renameStorageSpaceForInstancesOfEntity(
          (update.modelEntityUpdate as any)["entityName"],
          (update.modelEntityUpdate as any)["targetValue"],
          update.equivalentModelCUDUpdates[0].objects[0].instances[0] as MetaEntity,
          update.equivalentModelCUDUpdates[0].objects[1].instances[0] as EntityDefinition
        );

        if (modelCUDupdate.objects && model?.parentName) {
          // this.modelSequelize indexes tables by name, it has to be updated to stay consistent
          // update the instance in table Entity and EntityDefinition corresponding to the renamed entity
          await this.upsertInstance(modelCUDupdate.objects[0].parentUuid, modelCUDupdate.objects[0].instances[0]);
          await this.upsertInstance(entityEntityDefinition.uuid, modelCUDupdate.objects[1].instances[0]);
        } else {
          log.error("renameEntity could not execute update", update);
        }
      } else {
        log.error("renameEntity could not execute update", update);
      }
      log.debug(this.logHeader, "renameEntity done.");
      return Promise.resolve(ACTION_OK);
    }
  };
}
