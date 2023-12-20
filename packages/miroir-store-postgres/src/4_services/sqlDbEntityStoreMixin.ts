import {
  EntityDefinition,
  EntityInstance,
  IAbstractEntityStore,
  IAbstractInstanceStore,
  IDataSectionStore,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
  entityEntity,
  entityEntityDefinition,
  getLoggerName,
} from "miroir-core";
import { SqlDbStore } from "./SqlDbStore.js";
import { MixedSqlDbInstanceStore, SqlDbInstanceStoreMixin } from "./sqlDbInstanceStoreMixin.js";
import { SqlUuidEntityDefinition, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "../utils.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SqlDbEntityStoreMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const MixedSqlDbEntityAndInstanceStore = SqlDbEntityStoreMixin(SqlDbInstanceStoreMixin(SqlDbStore));

export function SqlDbEntityStoreMixin<TBase extends typeof MixedSqlDbInstanceStore>(Base: TBase) {
  return class MixedSqlDbEntityStore extends Base implements IAbstractEntityStore, IAbstractInstanceStore {
    public dataStore: IDataSectionStore;

    constructor(
      //   applicationName: string,
      //   dataStoreType: DataStoreApplicationType,
      // dataConnectionString:string,
      // dataSchema:string,
      // logHeader:string,
      //   public dataStore: IDataSectionStore,
      ...args: any[]
    ) {
      super(...args.slice(0, 5));
      this.dataStore = args[5];
      // log.log(this.logHeader,'MixedIndexedDbEntityStore constructor',this.dataStore);
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
    async createEntity(entity: MetaEntity, entityDefinition: EntityDefinition) {
      log.log(
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
            "Application",
            this.applicationName,
            "dataStoreType",
            this.dataStoreType,
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
            "Application",
            this.applicationName,
            "dataStoreType",
            this.dataStoreType,
            "could not insert in model schema for entityDefinition",
            entityDefinition
          );
        }
        // }
      }
      log.debug(this.logHeader, "createEntity", "done for", entity.name);
      return Promise.resolve();
    }

    // ##############################################################################################
    async dropEntity(entityUuid: string) {
      log.log("dropEntity entityUuid", entityUuid);
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
          const entityDefinitions = (
            (await this.getInstances(entityEntityDefinition.uuid)) as EntityDefinition[]
          ).filter((i) => i.entityUuid == entityUuid);
          log.trace("dropEntity entityUuid", entityUuid, "found Entity Definitions:", entityDefinitions);

          for (const entityDefinition of entityDefinitions) {
            await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
          }

          await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);
        } else {
          log.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
        }
      }
      return Promise.resolve();
    }
    // ##############################################################################################
    async dropEntities(entityUuids: string[]) {
      log.log("dropEntities parentUuid", entityUuids);
      for (const e of entityUuids) {
        await this.dropEntity(e);
      }
      return Promise.resolve();
    }
    // ##############################################################################################
    async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate) {
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
      return Promise.resolve();
    }
  };
}
