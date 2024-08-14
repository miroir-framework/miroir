import {
  ACTION_OK,
  PersistenceStoreEntitySectionAbstractInterface,
  PersistenceStoreInstanceSectionAbstractInterface,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionVoidReturnType,
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
  entityEntity,
  entityEntityDefinition,
  getLoggerName
} from "miroir-core";
import { EntityUuidIndexedSequelizeModel, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "../utils.js";
import { SqlDbStoreSection } from "./SqlDbStoreSection.js";
import { MixedSqlDbInstanceStoreSection, SqlDbInstanceStoreSectionMixin } from "./sqlDbInstanceStoreSectionMixin.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbEntityStoreSectionMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const MixedSqlDbEntityAndInstanceStoreSection = SqlDbEntityStoreSectionMixin(SqlDbInstanceStoreSectionMixin(SqlDbStoreSection));

export function SqlDbEntityStoreSectionMixin<TBase extends typeof MixedSqlDbInstanceStoreSection>(Base: TBase) {
  return class MixedSqlDbEntityStoreSection extends Base implements PersistenceStoreEntitySectionAbstractInterface, PersistenceStoreInstanceSectionAbstractInterface {
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
    getAccessToModelSectionEntity(entity: MetaEntity, entityDefinition: EntityDefinition): EntityUuidIndexedSequelizeModel {
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
    async createEntity(entity: Entity, entityDefinition: EntityDefinition): Promise<ActionVoidReturnType> {
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
    async createEntities(
      entities: {
        entity:Entity,
        entityDefinition: EntityDefinition,
      }[]
    ): Promise<ActionVoidReturnType> {
      for (const e of entities) {
        await this.createEntity(e.entity, e.entityDefinition);
      }
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
  
          for (const entityDefinition of entityDefinitions.returnedDomainElement.elementValue.instances.filter(
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
    
    // ############################################################################################
    async alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<ActionVoidReturnType> {
      log.info(this.logHeader, "alterEntityAttribute", update);
      const currentEntity: ActionEntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.entityUuid
      );
      if (currentEntity.status != "ok") {
        // todo: THROW???
        return currentEntity;
      }
      const currentEntityDefinition: ActionEntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        update.entityDefinitionUuid
      );
      if (currentEntityDefinition.status != "ok") {
        // todo: THROW???
        return currentEntityDefinition;
      }
      const localEntityDefinition: EntityDefinition = currentEntityDefinition.returnedDomainElement
        .elementValue as EntityDefinition;
      const localEntityJzodSchemaDefinition =
        update.removeColumns != undefined && Array.isArray(update.removeColumns)
          ? Object.fromEntries(
              Object.entries(localEntityDefinition.jzodSchema.definition).filter(
                (i) => update.removeColumns ?? ([] as string[]).includes(i[0])
              )
            )
          : localEntityDefinition.jzodSchema.definition;
      const modifiedEntityDefinition: EntityDefinition = Object.assign({}, localEntityDefinition, {
        jzodSchema: {
          type: "object",
          definition: {
            ...localEntityJzodSchemaDefinition,
            ...(update.addColumns ? Object.fromEntries(update.addColumns.map((c) => [c.name, c.definition])) : {}),
          },
        },
      });

      log.info("alterEntityAttribute modifiedEntityDefinition", JSON.stringify(modifiedEntityDefinition, undefined, 2));

      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);
      // TODO: HACK HACK HACK UGLY!!!! add applicationSection to update action?
      // const queryInterface =
      //   update.deploymentUuid == adminConfigurationDeploymentMiroir.uuid
      //     ? this.sequelize.getQueryInterface()
      //     : (this.dataStore as any).sequelize.getQueryInterface()
      // ;

      log.info(
        "alterEntityAttribute table",
        update.entityName,
        "addColumns",
        JSON.stringify(update.addColumns, null, 2)
      );
      // for (const c of update.addColumns ?? []) {
      //   const columnOptions = fromMiroirAttributeDefinitionToSequelizeModelAttributeColumnOptions(c.definition);
      //   log.info("alterEntityAttribute adding column", c.name, "options", JSON.stringify(columnOptions, null, 2));
      //   await queryInterface.addColumn(update.entityName, c.name, columnOptions.options);
      // }

      // TODO: relies on implementation, IT SHOULD NOT! does side effect, to worsen the insult
      (this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess = {
        ...(this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess,
        ...(this.dataStore as any as SqlDbStoreSection).getAccessToDataSectionEntity(
          currentEntity.returnedDomainElement.elementValue as MetaEntity,
          modifiedEntityDefinition
        ),
      };
      log.info("alterEntityAttribute added columns", update.addColumns, this.sequelize.json);

      await(this.dataStore as any as SqlDbStoreSection).sqlSchemaTableAccess[
        currentEntity.returnedDomainElement.elementValue.uuid
      ].sequelizeModel.sync({ alter: true }); // TODO: replace sync!

      // } else {
      //   // throw new Error("");
      //   return Promise.resolve({
      //     status: "error",
      //     error: {
      //       errorType: "FailedToCreateStore", // TODO: put the right errorType
      //       errorMessage: "alterEntityAttribute could not handle wanted attribute modification: " + JSON.stringify(update.update)
      //     }
      //   });

      // }
      // if (update.entityAttributeRename) {
      //   await queryInterface.renameColumn(update.entityName, update.entityAttributeName, update.entityAttributeRename)

      // }

      // }
      // await this.dataStore.createStorageSpaceForInstancesOfEntity(
      //   // (currentEntity.returnedDomainElement.elementValue as EntityInstanceWithName).name,
      //   // update.targetValue,
      //   currentEntity.returnedDomainElement as any as MetaEntity,
      //   modifiedEntityDefinition
      // );
      return Promise.resolve(ACTION_OK);
    }
    
  };
}
