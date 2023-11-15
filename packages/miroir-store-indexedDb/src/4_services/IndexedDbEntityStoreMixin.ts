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
  getLoggerName
} from "miroir-core";
import { IndexedDbInstanceStoreMixin, MixedIndexedDbInstanceStore } from "./IndexedDbInstanceStoreMixin.js";
import { IndexedDbStore } from "./IndexedDbStore.js";

import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDbEntityStoreMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
      // log.log(this.logHeader,'MixedIndexedDbEntityStore constructor',this.dataStore);
    }

    // ##############################################################################################
    async clear(): Promise<void> {
      // drop data anq model Entities
      // await this.dataStore.clear();
      await this.localUuidIndexedDb.removeSubLevels(this.getEntityUuids());
      log.log(this.logHeader, "clear DONE", this.getEntityUuids());
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
        log.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityDefinition is not related to given entity."
        );
      } else {
        if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
          log.warn(
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
            log.warn(
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
        log.log(this.logHeader, "renameEntity", cudUpdate.objects[0].instances[0].parentUuid, currentValue);
        await this.upsertInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0]);
        const updatedValue = await this.getInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0].uuid);
        // TODO: update EntityDefinition, too!
        log.debug(this.logHeader, "renameEntity done", cudUpdate.objects[0].instances[0].parentUuid, updatedValue);
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
      log.log(this.logHeader, "dropEntity entity", entityEntity.uuid);
      if (this.dataStore.getEntityUuids().includes(entityUuid)) {
        await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
      } else {
        log.warn(this.logHeader, "dropEntity entity not found:", entityUuid);
      }

      if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
        const entityDefinitions = (
          (await this.getInstances(entityEntityDefinition.uuid)) as EntityDefinition[]
        ).filter((i) => i.entityUuid == entityUuid);
        log.debug(this.logHeader, "dropEntity entity", entityEntity.uuid,"found definitions to delete:", entityDefinitions);
          
        for (const entityDefinition of entityDefinitions) {
          await this.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
        }
      } else {
        log.warn(
          "StoreController dropEntity sublevel for entityEntityDefinition does not exist",
          entityEntityDefinition.uuid,
          this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)
        );
      }

      if (this.localUuidIndexedDb.hasSubLevel(entityEntity.uuid)) {
        log.debug(this.logHeader, "dropEntity deleting Entity instance for with Entity with uuid", entityUuid);
        await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);
      } else {
        log.warn(
          this.logHeader,
          "dropEntity sublevel for entityEntity does not exist",
          entityEntity.uuid,
          this.localUuidIndexedDb.hasSubLevel(entityEntity.uuid)
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
