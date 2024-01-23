import * as fs from "fs";
import * as path from "path";

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
  ActionEntityInstanceReturnType,
} from "miroir-core";
import { FileSystemStoreSection } from "./FileSystemStoreSection.js";
import { FileSystemInstanceStoreSectionMixin, MixedFileSystemInstanceStoreSection } from "./FileSystemInstanceStoreSectionMixin.js";


import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"FileSystemEntityStoreMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const MixedFileSystemDbEntityAndInstanceStoreSection = FileSystemDbEntityStoreSectionMixin(
  FileSystemInstanceStoreSectionMixin(FileSystemStoreSection)
);

export function FileSystemDbEntityStoreSectionMixin<TBase extends typeof MixedFileSystemInstanceStoreSection>(
  Base: TBase
) {
  return class MixedSqlDbEntityStoreSection extends Base implements AbstractEntityStoreSectionInterface, AbstractInstanceStoreSectionInterface {
    public dataStore: StoreDataSectionInterface;

    constructor(
      // applicationSection: ApplicationSection,
      // filesystemStoreName: string,
      // directory: string,
      // logHeader: string,
      // dataStore: StoreDataSectionInterface,
      ...args: any[]
    ) {
      super(
        // public filesystemStoreName: string, // used only for debugging purposes
        // private directory: string,
        // public logHeader: string;
        ...args.slice(0, 4)
      );
      this.dataStore = args[4];
      log.info(this.logHeader, "MixedIndexedDbEntityStoreSection constructor", args);
    }

    // #########################################################################################
    existsEntity(entityUuid: string): boolean {
      const entityDirectories = fs.readdirSync(this.directory);
      return entityDirectories.includes(entityUuid);
    }

    // #########################################################################################
    async createEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<ActionReturnType> {
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
            "already existing entity",
            entity.uuid,
            "existing entities",
            this.dataStore.getEntityUuids()
          );
        } else {
          await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
          await this.upsertInstance(entityEntity.uuid, entity);
          await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
        }
      }

      const entities = fs.readdirSync(this.directory);

      if (!entities.includes(entity.uuid)) {
        fs.mkdirSync(path.join(this.directory, entity.uuid));
      }

      await this.upsertInstance(entityEntity.uuid, entity);
      await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
      // fs.writeFileSync(path.join(this.directory,entityEntity.uuid,fullName(entity.uuid)),JSON.stringify(entity))
      // fs.writeFileSync(path.join(this.directory,entityEntityDefinition.uuid,fullName(entityDefinition.uuid)),JSON.stringify(entityDefinition))
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    async dropEntity(entityUuid: string): Promise<ActionReturnType> {
      // TODO: implementation ~ indexedDb case. share it?
      if (this.dataStore.getEntityUuids().includes(entityUuid)) {
        // this.localUuidIndexedDb.removeSubLevels([entityUuid]);
        await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
      } else {
        log.warn(this.logHeader, "dropEntity entity not found:", entityUuid);
      }

      if (this.getEntityUuids().includes(entityEntityDefinition.uuid)) {
        await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);
      } else {
        log.warn(
          this.logHeader,
          "dropEntity sublevel for entityEntity does not exist",
          entityEntity.uuid,
          "existing entities",
          this.getEntityUuids()
        );
      }

      if (this.getEntityUuids().includes(entityEntityDefinition.uuid)) {
        await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid } as EntityInstance);

        const entityDefinitions: ActionEntityInstanceCollectionReturnType = await this.dataStore.getInstances(entityEntityDefinition.uuid);
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

        
        for (const entityDefinition of entityDefinitions.returnedDomainElement.elementValue.instances.filter((i:EntityDefinition) => i.entityUuid == entityUuid)) {
          await this.dataStore.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
        }
      } else {
        log.warn(
          "StoreController dropEntity entity entityEntityDefinition does not exist",
          entityEntityDefinition.uuid,
          "existing entities",
          this.getEntityUuids()
        );
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    async dropEntities(entityUuids: string[]): Promise<ActionReturnType> {
      log.info(this.logHeader, "dropEntities", entityUuids);
      for (const entityUuid of entityUuids) {
        await this.dropEntity(entityUuid);
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    async renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate): Promise<ActionReturnType> {
      // TODO: identical to IndexedDbModelStoreSection implementation!
      log.info(this.logHeader, "renameEntity", update);
      // const currentValue = await this.localUuidIndexedDb.getValue(cudUpdate.objects[0].instances[0].parentUuid,cudUpdate.objects[0].instances[0].uuid);
      if (
        update.equivalentModelCUDUpdates.length &&
        update.equivalentModelCUDUpdates[0] &&
        update.equivalentModelCUDUpdates[0].objects?.length &&
        update.equivalentModelCUDUpdates[0].objects[0] &&
        update.equivalentModelCUDUpdates[0].objects[1] &&
        update.equivalentModelCUDUpdates[0].objects[0].instances[0] &&
        update.equivalentModelCUDUpdates[0].objects[1].instances[0]
        // cudUpdate
        // && cudUpdate.objects[0].instances[0].parentUuid
        // && cudUpdate.objects[0].instances[0].parentUuid == entityEntity.uuid
        // && cudUpdate.objects[0].instances[0].uuid
      ) {
        const cudUpdate = update.equivalentModelCUDUpdates[0];
        const currentValue: ActionEntityInstanceReturnType = await this.getInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0].uuid);
        log.debug(this.logHeader, "renameEntity", cudUpdate.objects[0].instances[0].parentUuid, currentValue);
        await this.upsertInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0]);
        const updatedValue: ActionEntityInstanceReturnType = await this.getInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0].uuid);
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
      return Promise.resolve(ACTION_OK);
    }
  };
}
