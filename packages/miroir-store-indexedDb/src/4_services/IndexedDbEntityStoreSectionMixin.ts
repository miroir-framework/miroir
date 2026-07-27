import {
  ACTION_OK,
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2VoidReturnType,
  Domain2ElementFailed,
  Entity,
  EntityVersion,
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
  applyEntityOnlyAlterAttribute,
  applyEntityOnlyRename,
  applyRenameEntityPair,
  normalizeCreateEntityPair,
  persistEntityThenEntityDefinition,
} from "miroir-core";
import { IndexedDbInstanceStoreSectionMixin, MixedIndexedDbInstanceStoreSection } from "./IndexedDbInstanceStoreSectionMixin.js";
import { IndexedDbStoreSection } from "./IndexedDbStoreSection.js";
import { entityEntity, entityEntityDefinition } from "miroir-test-app_deployment-miroir";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "IndexedDbEntityStoreSectionMixin")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export const MixedIndexedDbEntityAndInstanceStoreSection = IndexedDbEntityStoreSectionMixin(
  IndexedDbInstanceStoreSectionMixin(IndexedDbStoreSection)
);

// ################################################################################################
export function IndexedDbEntityStoreSectionMixin<TBase extends typeof MixedIndexedDbInstanceStoreSection>(Base: TBase) {
  return class MixedIndexedDbEntityStoreSection
    extends Base
    implements PersistenceStoreEntitySectionAbstractInterface, PersistenceStoreInstanceSectionAbstractInterface
  {
    public dataStore: PersistenceStoreDataSectionInterface;

    constructor(
      //   indexedDbStoreName: string,
      //   localUuidIndexedDb: IndexedDb,
      //   logHeader: string,
      //   public dataStore: PersistenceStoreDataSectionInterface,
      ...args: any[]
    ) {
      super(...args.slice(0, 3));
      this.dataStore = args[3];
      // log.info(this.logHeader,'MixedIndexedDbEntityStoreSection constructor',this.dataStore);
    }

    // ##############################################################################################
    async clear(): Promise<Action2VoidReturnType> {
      // drop data anq model Entities
      // await this.dataStore.clear();
      log.info("clearing data for entities:",this.getEntityUuids())
      await this.localUuidIndexedDb.removeSubLevels(this.getEntityUuids());
      log.info(this.logHeader, "clear DONE", this.getEntityUuids());
      return Promise.resolve(ACTION_OK);
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
    // #217 Phase 6/11: Entity then optional EntityVersion; Entity-only when ED omitted.
    async createEntity(entity: Entity, entityVersion?: EntityVersion): Promise<Action2VoidReturnType> {
      if (entityVersion && entity.uuid != entityVersion.entityUuid) {
        log.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityVersion is not related to given entity."
        );
        return new Action2Error(
          "FailedToCreateStore",
          "createEntity failed: entity.uuid != entityVersion.entityUuid",
        );
      }
      if (!entityVersion) {
        if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
          log.warn(
            this.logHeader,
            "createEntity",
            entity.name,
            "already existing sublevel",
            entity.uuid,
          );
        } else {
          await this.dataStore.createStorageSpaceForInstancesOfEntity(entity);
        }
        return this.upsertInstance(entityEntity.uuid, entity);
      }
      const pair = normalizeCreateEntityPair(entity, entityVersion);
      if (this.dataStore.getEntityUuids().includes(pair.entity.uuid)) {
        log.warn(
          this.logHeader,
          "createEntity",
          pair.entity.name,
          "already existing sublevel",
          pair.entity.uuid,
          this.localUuidIndexedDb.hasSubLevel(pair.entity.uuid)
        );
      } else {
        await this.dataStore.createStorageSpaceForInstancesOfEntity(
          pair.entity,
          pair.entityVersion,
        );
      }
      if (!this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
        log.warn(
          this.logHeader,
          "createEntity",
          pair.entity.name,
          "sublevel for entityEntityDefinition does not exist",
          entityEntityDefinition.uuid,
        );
      }
      return persistEntityThenEntityDefinition(
        pair,
        {
          writeEntity: (nextEntity) => this.upsertInstance(entityEntity.uuid, nextEntity),
          writeEntityDefinition: (nextEntityDefinition) =>
            this.upsertInstance(entityEntityDefinition.uuid, nextEntityDefinition),
          deleteEntity: (writtenEntity) =>
            this.deleteInstance(entityEntity.uuid, writtenEntity),
        },
        { failurePolicy: { kind: "compensate" } },
      );
    }

    // ##############################################################################################
    async createEntities(
      entities: {
        entity:Entity,
        entityVersion?: EntityVersion,
      }[]
    ): Promise<Action2VoidReturnType> {
      for (const e of entities) {
        const result = await this.createEntity(e.entity, e.entityVersion);
        if (result instanceof Action2Error) {
          return result;
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // #########################################################################################
    // #217 Phase 11: Entity-only rename when present model is complete; dual-write only for incomplete Entity.
    async renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType> {
      // TODO: identical to IndexedDbModelStoreSection implementation!
      log.info(this.logHeader, "renameEntityClean", update);
      const currentEntity: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntity.uuid,
        update.payload.entityUuid
      );
      if (currentEntity instanceof Action2Error) {
        return currentEntity
      }
      if (currentEntity.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(
          new Action2Error(
            "FailedToDeployModule",
            `renameEntityClean failed for section: data, entityUuid ${update.payload.entityUuid}, error: ${currentEntity.returnedDomainElement.queryFailure}, ${currentEntity.returnedDomainElement.failureMessage}`
          )
        );
      }
      const previousEntity = currentEntity.returnedDomainElement as Entity;
      const entityOnly = applyEntityOnlyRename(previousEntity, update.payload.targetValue);
      if (entityOnly) {
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

      const entityVersionUuid = update.payload.entityVersionUuid;
      if (!entityVersionUuid) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `renameEntityClean requires entityVersionUuid when Entity present model is incomplete (entityUuid ${update.payload.entityUuid})`
        ));
      }
      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        entityVersionUuid
      );

      if (currentEntityDefinition instanceof Action2Error) {
        return currentEntityDefinition
      }

      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `renameEntityClean failed for section: data, entityUuid ${entityVersionUuid}, error: ${currentEntityDefinition.returnedDomainElement.queryFailure}, ${currentEntityDefinition.returnedDomainElement.failureMessage}`
        ));
      }
      const previousEntityDefinition =
        currentEntityDefinition.returnedDomainElement as EntityVersion;
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
        pair.entityVersion
      );
      return Promise.resolve(ACTION_OK);
    }

    // ############################################################################################
    // #217 Phase 11: Entity-only alter when present model is complete; dual-write only for incomplete Entity.
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
      const entityOnly = applyEntityOnlyAlterAttribute(previousEntity, {
        addColumns: update.payload.addColumns,
        removeColumns: update.payload.removeColumns,
      });
      if (entityOnly) {
        log.info("alterEntityAttribute Entity-only", entityOnly.uuid);
        return this.upsertInstance(entityEntity.uuid, entityOnly);
      }

      const entityVersionUuid = update.payload.entityVersionUuid;
      if (!entityVersionUuid) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `alterEntityAttribute requires entityVersionUuid when Entity present model is incomplete (entityUuid ${update.payload.entityUuid})`
        ));
      }
      const currentEntityDefinition: Action2EntityInstanceReturnType = await this.getInstance(
        entityEntityDefinition.uuid,
        entityVersionUuid
      );
      if (currentEntityDefinition instanceof Action2Error) {
        return currentEntityDefinition
      }
      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed) {
        return Promise.resolve(new Action2Error(
          "FailedToDeployModule",
          `alterEntityAttribute failed for section: data, entityUuid ${entityVersionUuid}, error: ${currentEntityDefinition.returnedDomainElement.queryFailure}, ${currentEntityDefinition.returnedDomainElement.failureMessage}`
        ));
      }
      const previousEntityDefinition =
        currentEntityDefinition.returnedDomainElement as EntityVersion;
      const pair = applyAlterEntityAttributePair(
        previousEntity,
        previousEntityDefinition,
        {
          addColumns: update.payload.addColumns,
          removeColumns: update.payload.removeColumns,
        },
      );

      log.info("alterEntityAttribute dual-write pair", JSON.stringify(pair, undefined, 2));

      return persistEntityThenEntityDefinition(
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
    }
    
    // #############################################################################################
    async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "dropEntity entity", entityEntity.uuid);
      if (this.dataStore.getEntityUuids().includes(entityUuid)) {
        await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
      } else {
        log.warn(this.logHeader, "dropEntity entity not found:", entityUuid);
      }

      if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
        const entityDefinitions: Action2EntityInstanceCollectionOrFailure = await this.getInstances(entityEntityDefinition.uuid);
        if (entityDefinitions instanceof Action2Error) {
          return Promise.resolve(new Action2Error(
            "FailedToDeleteStore",
            `dropEntity failed for section: data, entityUuid ${entityUuid}, error: ${entityDefinitions.errorType}, ${entityDefinitions.errorMessage}`
          ));
        }
        if (entityDefinitions.returnedDomainElement instanceof Domain2ElementFailed) {
          return Promise.resolve(new Action2Error(
            "FailedToDeleteStore",
            `dropEntity failed for section: data, entityUuid ${entityUuid}, error: ${entityDefinitions.returnedDomainElement.queryFailure}, ${entityDefinitions.returnedDomainElement.failureMessage}`
          ));
        }
        log.debug(
          this.logHeader,
          "dropEntity entity",
          entityEntity.uuid,
          "found definitions to delete:",
          entityDefinitions
        );

        for (const entityVersion of entityDefinitions.returnedDomainElement.instances.filter(
          (i: EntityInstance) => (i as EntityVersion).entityUuid == entityUuid
        )) {
          await this.deleteInstance(entityEntityDefinition.uuid, entityVersion);
          // TODO: check for failures!
        }
      } else {
        log.warn(
          "PersistenceStoreController dropEntity sublevel for entityEntityDefinition does not exist",
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

      return Promise.resolve(ACTION_OK);
    }

    // #############################################################################################
    async dropEntities(entityUuids: string[]):Promise<Action2VoidReturnType> {
      for (const entityUuid of entityUuids) {
        await this.dropEntity(entityUuid);
      }
      return Promise.resolve(ACTION_OK);
    }
  };
}
