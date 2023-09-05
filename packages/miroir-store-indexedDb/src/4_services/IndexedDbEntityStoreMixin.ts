import {
  EntityDefinition,
  EntityInstance,
  IAbstractEntityStore,
  IAbstractInstanceStore,
  IDataSectionStore,
  MetaEntity,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
  entityEntity,
  entityEntityDefinition
} from "miroir-core";
import { IndexedDbInstanceStoreMixin, MixedIndexedDbInstanceStore } from "./IndexedDbInstanceStoreMixin.js";
import { IndexedDbStore } from "./IndexedDbStore.js";

// ################################################################################################
export const MixedIndexedDbEntityAndInstanceStore = IndexedDbEntityStoreMixin(
  IndexedDbInstanceStoreMixin(IndexedDbStore)
);

// ################################################################################################
export function IndexedDbEntityStoreMixin<TBase extends typeof MixedIndexedDbInstanceStore>(Base: TBase) {
  return class MixedIndexedDbEntityStore extends Base implements IAbstractEntityStore, IAbstractInstanceStore {
    public dataStore: IDataSectionStore;

    constructor(
      //   applicationName: string,
      //   dataStoreType: DataStoreApplicationType,
      //   localUuidIndexedDb: IndexedDb,
      //   logHeader: string,
      //   public dataStore: IDataSectionStore,
      ...args: any[]
    ) {
      super(...args.slice(0, 4));
      this.dataStore = args[4];
      // console.log(this.logHeader,'MixedIndexedDbEntityStore constructor',this.dataStore);
    }

    // ##############################################################################################
    async clear(): Promise<void> {
      // drop data anq model Entities
      // await this.dataStore.clear();
      await this.localUuidIndexedDb.removeSubLevels(this.getEntityUuids());
      console.log(this.logHeader, "clear DONE", this.getEntityUuids());
      return Promise.resolve();
    }

    // ##################################################################################################
    getEntityUuids(): string[] {
      return this.localUuidIndexedDb.getSubLevels();
    }

    // ##################################################################################################
    existsEntity(entityUuid: string): boolean {
      return this.localUuidIndexedDb.hasSubLevel(entityUuid);
    }

    // #############################################################################################
    async createEntity(entity: MetaEntity, entityDefinition: EntityDefinition) {
      if (entity.uuid != entityDefinition.entityUuid) {
        // inconsistent input, raise exception
        console.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityDefinition is not related to given entity."
        );
      } else {
        if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
          console.warn(
            this.logHeader,
            "createEntity",
            entity.name,
            "already existing sublevel",
            entity.uuid,
            this.localUuidIndexedDb.hasSubLevel(entity.uuid)
          );
        } else {
          await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
          await this.upsertInstance(entityEntity.uuid, entity);
          if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
            await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
          } else {
            console.warn(
              this.logHeader,
              "createEntity",
              entity.name,
              "sublevel for entityEntityDefinition does not exist",
              entityEntityDefinition.uuid,
              this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)
            );
          }
        }
      }
    }

    // #############################################################################################
    async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate) {
      // TODO: identical to the Filesystem implementation!
      if (
        update.equivalentModelCUDUpdates.length &&
        update.equivalentModelCUDUpdates[0] &&
        update.equivalentModelCUDUpdates[0].objects?.length &&
        update.equivalentModelCUDUpdates[0].objects[0] &&
        update.equivalentModelCUDUpdates[0].objects[1] &&
        update.equivalentModelCUDUpdates[0].objects[0].instances[0] &&
        update.equivalentModelCUDUpdates[0].objects[1].instances[0]
      ) {
        const cudUpdate = update.equivalentModelCUDUpdates[0];
        const currentValue = await this.getInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0].uuid);
        console.log(this.logHeader, "renameEntity", cudUpdate.objects[0].instances[0].parentUuid, currentValue);
        await this.upsertInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0]);
        const updatedValue = await this.getInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0].uuid);
        // TODO: update EntityDefinition, too!
        console.log(this.logHeader, "renameEntity done", cudUpdate.objects[0].instances[0].parentUuid, updatedValue);
        await this.dataStore.renameStorageSpaceForInstancesOfEntity(
          (update.modelEntityUpdate as any)["entityName"],
          (update.modelEntityUpdate as any)["targetValue"],
          update.equivalentModelCUDUpdates[0].objects[0].instances[0] as MetaEntity,
          update.equivalentModelCUDUpdates[0].objects[1].instances[0] as EntityDefinition
        );
      } else {
        throw new Error(this.logHeader + " renameEntity could not execute update " + update);
      }
      return Promise.resolve();
    }

    // #############################################################################################
    async dropEntity(entityUuid: string): Promise<void> {
      if (this.dataStore.getEntityUuids().includes(entityUuid)) {
        // this.localUuidIndexedDb.removeSubLevels([entityUuid]);
        await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
      } else {
        console.warn(this.logHeader, "dropEntity entity not found:", entityUuid);
      }

      if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
        await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);
      } else {
        console.warn(
          this.logHeader,
          "dropEntity sublevel for entityEntity does not exist",
          entityEntity.uuid,
          this.localUuidIndexedDb.hasSubLevel(entityEntity.uuid)
        );
      }

      if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
        await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);

        const entityDefinitions = (
          (await this.dataStore.getInstances(entityEntityDefinition.uuid)) as EntityDefinition[]
        ).filter((i) => i.entityUuid == entityUuid);
        for (const entityDefinition of entityDefinitions) {
          await this.dataStore.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
        }
      } else {
        console.warn(
          "StoreController dropEntity sublevel for entityEntityDefinition does not exist",
          entityEntityDefinition.uuid,
          this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)
        );
      }
      return Promise.resolve();
    }

    // #############################################################################################
    async dropEntities(entityUuids: string[]) {
      for (const entityUuid of entityUuids) {
        await this.dropEntity(entityUuid);
      }
      return Promise.resolve();
    }
  };
}
