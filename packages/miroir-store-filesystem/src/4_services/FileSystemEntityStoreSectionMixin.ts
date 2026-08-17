import * as fs from "fs";
import * as path from "path";

import {
  ACTION_OK,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2VoidReturnType,
  Domain2ElementFailed,
  Entity,
  EntityInstance,
  EntityInstanceWithName,
  LoggerInterface,
  MiroirLoggerFactory,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreEntitySectionAbstractInterface,
  PersistenceStoreInstanceSectionAbstractInterface,
  applyEntityOnlyRename,
  applyMlSchemaColumnChanges
} from "miroir-core";
import { FileSystemInstanceStoreSectionMixin, MixedFileSystemInstanceStoreSection } from "./FileSystemInstanceStoreSectionMixin.js";
import { FileSystemStoreSection } from "./FileSystemStoreSection.js";


import { entityEntity } from "miroir-test-app_deployment-miroir";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FileSystemEntityStoreMixin");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});


export const MixedFileSystemDbEntityAndInstanceStoreSection = FileSystemDbEntityStoreSectionMixin(
  FileSystemInstanceStoreSectionMixin(FileSystemStoreSection)
);

export function FileSystemDbEntityStoreSectionMixin<TBase extends typeof MixedFileSystemInstanceStoreSection>(
  Base: TBase
) {
  return class MixedSqlDbEntityStoreSection
    extends Base
    implements PersistenceStoreEntitySectionAbstractInterface, PersistenceStoreInstanceSectionAbstractInterface
  {
    public dataStore: PersistenceStoreDataSectionInterface;

    constructor(
      // applicationSection: ApplicationSection,
      // filesystemStoreName: string,
      // rootDirectory: string,
      // subDirectory: string,
      // logHeader: string,
      // dataStore: PersistenceStoreDataSectionInterface,
      ...args: any[]
    ) {
      super(
        // public filesystemStoreName: string, // used only for debugging purposes
        // rootDirectory: string,
        // subDirectory: string,
        // public logHeader: string;
        ...args.slice(0, 5)
      );
      this.dataStore = args[5];
      log.info(this.logHeader, "MixedIndexedDbEntityStoreSection constructor", args);
    }

    // #########################################################################################
    existsEntity(entityUuid: string): boolean {
      const entityDirectories = fs.readdirSync(this.directory);
      return entityDirectories.includes(entityUuid);
    }

    // #########################################################################################
    // #220 — createEntity is Entity-only (complete present model on Entity required).
    async createEntity(entity: Entity): Promise<Action2VoidReturnType> {
      if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
        log.warn(
          this.logHeader,
          "createEntity",
          entity.name,
          "already existing entity",
          entity.uuid,
        );
      } else {
        await this.dataStore.createStorageSpaceForInstancesOfEntity(entity);
      }
      const entities = fs.readdirSync(this.directory);
      if (!entities.includes(entity.uuid)) {
        fs.mkdirSync(path.join(this.directory, entity.uuid));
      }
      return this.upsertInstance(entityEntity.uuid, entity);
    }

    // ##############################################################################################
    async createEntities(entities: Entity[]): Promise<Action2VoidReturnType> {
      for (const entity of entities) {
        const result = await this.createEntity(entity);
        if (result instanceof Action2Error) {
          return result;
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    // #220 — Entity-only drop: remove Entity + storage space; do not touch EntityVersions.
    async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
      if (this.getEntityUuids().includes(entityUuid)) {
        await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
      } else {
        log.warn(this.logHeader, "dropEntity entity not found:", entityUuid);
      }

      if (this.getEntityUuids().includes(entityEntity.uuid)) {
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
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    async dropEntities(entityUuids: string[]): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "dropEntities", entityUuids);
      for (const entityUuid of entityUuids) {
        await this.dropEntity(entityUuid);
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
    // #220 — Entity-only alter; never dual-write EntityVersion.
    async alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "alterEntityAttribute", update);
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
            `alterEntityAttribute failed for section: data, entityUuid ${update.payload.entityUuid}, error: ${currentEntity.returnedDomainElement.queryFailure}, ${currentEntity.returnedDomainElement.failureMessage}`
          )
        );
      }
      const previousEntity = currentEntity.returnedDomainElement as Entity;
      const entityOnly: Entity = {
        ...previousEntity,
        mlSchema: applyMlSchemaColumnChanges(previousEntity.mlSchema, 
          {
              addColumns: update.payload.addColumns,
              removeColumns: update.payload.removeColumns,
          }
        )
      }
      if (!entityOnly) {
        return Promise.resolve(
          new Action2Error(
            "FailedToDeployModule",
            `alterEntityAttribute requires complete Entity.mlSchema (entityUuid ${update.payload.entityUuid})`
          )
        );
      }
      log.info("alterEntityAttribute Entity-only", entityOnly.uuid);
      return this.upsertInstance(entityEntity.uuid, entityOnly);
    }
  };
}
