import { EntityDefinition, EntityInstance, IAbstractEntityStore, IAbstractInstanceStore, IDataSectionStore, MetaEntity, WrappedTransactionalEntityUpdateWithCUDUpdate, entityEntity, entityEntityDefinition } from "miroir-core";
import { SqlDbStore } from "./SqlDbStore.js";
import { MixedSqlDbInstanceStore, SqlDbInstanceStoreMixin } from "./sqlDbInstanceStoreMixin.js";
import { SqlUuidEntityDefinition, fromMiroirEntityDefinitionToSequelizeEntityDefinition } from "./utils.js";

export const MixedSqlDbEntityAndInstanceStore = SqlDbEntityStoreMixin(SqlDbInstanceStoreMixin(SqlDbStore))

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
    ...args:any[]
    ) { 
      super(...args.slice(0,5));
      this.dataStore = args[5];
      // console.log(this.logHeader,'MixedIndexedDbEntityStore constructor',this.dataStore);
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
      console.log(
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
        console.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityDefinition is not related to given entity."
        );
      } else {
        await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);

        if (!!this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[entityEntity.uuid]) {
          await this.sqlSchemaTableAccess[entityEntity.uuid].sequelizeModel.upsert(entity as any);
        } else {
          console.error(
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
          await this.sqlSchemaTableAccess[entityEntityDefinition.uuid].sequelizeModel.upsert(
            entityDefinition as any
          );
        } else {
          console.error(
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
      console.log(this.logHeader, "createEntity", "done for", entity.name);
      return Promise.resolve();
    }

    // ##############################################################################################
    async dropEntity(entityUuid: string) {
      if ([entityEntity.uuid, entityEntityDefinition.uuid].includes(entityUuid)) {
        // TODO: UGLY!!!!!!! DOES IT EVEN WORK????
        if (this.sqlSchemaTableAccess && this.sqlSchemaTableAccess[entityUuid]) {
          const model = this.sqlSchemaTableAccess[entityUuid];
          console.log("dropEntity entityUuid", entityUuid, "parentName", model.parentName);
          await model.sequelizeModel.drop();
          delete this.sqlSchemaTableAccess[entityUuid];
        } else {
          console.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
        }
      } else {
        if (this.dataStore.getEntityUuids().includes(entityUuid)) {
          await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
          await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);

          //remove all entity definitions for the dropped entity
          const entityDefinitions = (
            (await this.getInstances(entityEntityDefinition.uuid)) as EntityDefinition[]
          ).filter((i) => i.entityUuid == entityUuid);
          for (const entityDefinition of entityDefinitions) {
            await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
          }
        } else {
          console.warn("dropEntity entityUuid", entityUuid, "NOT FOUND.");
        }
      }
      return Promise.resolve();
    }
    // ##############################################################################################
    async dropEntities(entityUuids: string[]) {
      console.log("dropEntities parentUuid", entityUuids);
      for (const e of entityUuids) {
        await this.dropEntity(e);
      }
      return Promise.resolve();
    }
    // ##############################################################################################
    async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate) {
      if (
        update.equivalentModelCUDUpdates.length 
        && update.equivalentModelCUDUpdates[0]
        && update.equivalentModelCUDUpdates[0].objects?.length
        && update.equivalentModelCUDUpdates[0].objects[0]
        && update.equivalentModelCUDUpdates[0].objects[1]
        && update.equivalentModelCUDUpdates[0].objects[0].instances[0]
        && update.equivalentModelCUDUpdates[0].objects[1].instances[0]
      ) {
        const modelCUDupdate = update.equivalentModelCUDUpdates[0];
        const model = (modelCUDupdate && modelCUDupdate.objects?.length && modelCUDupdate.objects[0])?this.sqlSchemaTableAccess[modelCUDupdate.objects[0].parentUuid]:undefined;
        console.log(this.logHeader,'renameEntity update',update);
        console.log(this.logHeader,'renameEntity model',model);
        
        await this.dataStore.renameStorageSpaceForInstancesOfEntity(
          (update.modelEntityUpdate as any)['entityName'],
          (update.modelEntityUpdate as any)['targetValue'],
          update.equivalentModelCUDUpdates[0].objects[0].instances[0] as MetaEntity,
          update.equivalentModelCUDUpdates[0].objects[1].instances[0] as EntityDefinition
        );

        if (modelCUDupdate.objects && model?.parentName) { // this.modelSequelize indexes tables by name, it has to be updated to stay consistent
          // update the instance in table Entity and EntityDefinition corresponding to the renamed entity
          await this.upsertInstance(modelCUDupdate.objects[0].parentUuid, modelCUDupdate.objects[0].instances[0]);
          await this.upsertInstance(entityEntityDefinition.uuid, modelCUDupdate.objects[1].instances[0]);
          
        } else {
          console.error('renameEntity could not execute update',update);
        }
      } else {
        console.error('renameEntity could not execute update',update);
      }
      console.log(this.logHeader, 'renameEntity done.');
      return Promise.resolve();
    }
  }
}