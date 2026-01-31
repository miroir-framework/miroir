// src/4_services/MongoDbDataStoreSection.ts
import {
  Action2Error as Action2Error2,
  Domain2ElementFailed,
  MiroirLoggerFactory as MiroirLoggerFactory4
} from "miroir-core";

// src/4_services/MongoDbInstanceStoreSectionMixin.ts
import {
  Action2Error,
  ACTION_OK as ACTION_OK3,
  defaultMetaModelEnvironment,
  ExtractorRunnerInMemory,
  ExtractorTemplateRunnerInMemory,
  MiroirLoggerFactory as MiroirLoggerFactory3
} from "miroir-core";

// src/4_services/MongoDbStoreSection.ts
import {
  ACTION_OK as ACTION_OK2,
  MiroirLoggerFactory as MiroirLoggerFactory2
} from "miroir-core";

// src/constants.ts
var packageName = "miroir-store-mongodb";

// src/4_services/constants.ts
var cleanLevel = "4";

// src/4_services/MongoDbStore.ts
import {
  ACTION_OK,
  MiroirLoggerFactory
} from "miroir-core";
var log = console;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MongoDbStore")
).then((logger) => {
  log = logger;
});
var MongoDbStore = class {
  // ##############################################################################################
  constructor(mongoDbStoreName, localUuidMongoDb, logHeader) {
    this.mongoDbStoreName = mongoDbStoreName;
    this.localUuidMongoDb = localUuidMongoDb;
    this.logHeader = logHeader;
  }
  // #########################################################################################
  getStoreName() {
    return this.mongoDbStoreName;
  }
  // ##################################################################################################
  async open() {
    log.info("open()", this.mongoDbStoreName, ": opening...");
    await this.localUuidMongoDb.openObjectStore();
    log.info("open()", this.mongoDbStoreName, ": opened");
    return Promise.resolve(ACTION_OK);
  }
  // ##############################################################################################
  async close() {
    log.info("close()", this.mongoDbStoreName, ": closing...");
    await this.localUuidMongoDb.closeObjectStore();
    log.info("close()", this.mongoDbStoreName, ": closed");
    return Promise.resolve(ACTION_OK);
  }
};

// src/4_services/MongoDbStoreSection.ts
var log2 = console;
MiroirLoggerFactory2.registerLoggerToStart(
  MiroirLoggerFactory2.getLoggerName(packageName, cleanLevel, "MongoDbStoreSection")
).then((logger) => {
  log2 = logger;
});
var MongoDbStoreSection = class extends MongoDbStore {
  // ##############################################################################################
  constructor(...args) {
    super(args[0], args[1], args[2]);
  }
  // ##################################################################################################
  bootFromPersistedState(entities, entityDefinitions) {
    log2.info(this.logHeader, "bootFromPersistedState does nothing!");
    return Promise.resolve(ACTION_OK2);
  }
  // ##############################################################################################
  async clear() {
    await this.localUuidMongoDb.removeCollections(this.getEntityUuids());
    return Promise.resolve(ACTION_OK2);
  }
  // ##############################################################################################
  getEntityUuids() {
    return this.localUuidMongoDb.getCollections();
  }
  // #############################################################################################
  async createStorageSpaceForInstancesOfEntity(entity, entityDefinition) {
    log2.info(
      this.logHeader,
      "createStorageSpaceForInstancesOfEntity",
      "input: entity",
      entity,
      "entityDefinition",
      entityDefinition,
      "Entities",
      this.localUuidMongoDb.getCollections()
    );
    if (entity.uuid != entityDefinition.entityUuid) {
      log2.error(
        this.logHeader,
        "createStorageSpaceForInstancesOfEntity",
        "inconsistent input: given entityDefinition is not related to given entity."
      );
    } else {
      if (!this.localUuidMongoDb.hasCollection(entity.uuid)) {
        this.localUuidMongoDb.addCollections([entity.uuid]);
      } else {
        if (this.localUuidMongoDb.db) {
          await this.localUuidMongoDb.db.collection(entity.uuid).deleteMany({});
        }
        log2.debug(
          this.logHeader,
          "createStorageSpaceForInstancesOfEntity",
          "input: entity",
          entity,
          "entityDefinition",
          entityDefinition,
          "already has entity. Existing entities:",
          this.localUuidMongoDb.getCollections()
        );
      }
    }
    return Promise.resolve(ACTION_OK2);
  }
  // ##############################################################################################
  async dropStorageSpaceForInstancesOfEntity(entityUuid) {
    if (this.localUuidMongoDb.hasCollection(entityUuid)) {
      await this.localUuidMongoDb.removeCollections([entityUuid]);
      log2.warn(
        this.logHeader,
        "dropStorageSpaceForInstancesOfEntity",
        "input: entity",
        entityUuid,
        "removed collection. Remaining collections:",
        this.localUuidMongoDb.getCollections()
      );
    } else {
      log2.warn(
        this.logHeader,
        "dropStorageSpaceForInstancesOfEntity",
        "input: entity",
        entityUuid,
        "not found. Existing entities:",
        this.localUuidMongoDb.getCollections()
      );
    }
    return Promise.resolve(ACTION_OK2);
  }
  // ##############################################################################################
  renameStorageSpaceForInstancesOfEntity(oldName, newName, entity, entityDefinition) {
    log2.warn(
      this.logHeader,
      "renameStorageSpaceForInstancesOfEntity does nothing for entity",
      oldName,
      ", since Entities are indexed by Uuid! Existing entities:",
      this.localUuidMongoDb.getCollections()
    );
    return Promise.resolve(ACTION_OK2);
  }
};

// src/4_services/MongoDbInstanceStoreSectionMixin.ts
var log3 = console;
MiroirLoggerFactory3.registerLoggerToStart(
  MiroirLoggerFactory3.getLoggerName(packageName, cleanLevel, "MongoDbInstanceStoreSectionMixin")
).then((logger) => {
  log3 = logger;
});
var MixedMongoDbInstanceStoreSection = MongoDbInstanceStoreSectionMixin(MongoDbStoreSection);
function MongoDbInstanceStoreSectionMixin(Base) {
  return class MixedMongoDbInstanceStoreSection extends Base {
    extractorTemplateRunner;
    extractorRunner;
    constructor(...args) {
      super(...args);
      this.extractorRunner = new ExtractorRunnerInMemory(this);
      this.extractorTemplateRunner = new ExtractorTemplateRunnerInMemory(
        this,
        this.extractorRunner
      );
    }
    // #############################################################################################
    async handleBoxedExtractorAction(query, applicationDeploymentMap) {
      log3.info(this.logHeader, "handleBoxedExtractorAction", "query", query);
      const result = await this.extractorRunner.handleBoxedExtractorAction(
        query,
        applicationDeploymentMap,
        defaultMetaModelEnvironment
      );
      log3.info(this.logHeader, "handleBoxedExtractorAction", "query", query, "result", result);
      return result;
    }
    // #############################################################################################
    async handleBoxedQueryAction(query, applicationDeploymentMap) {
      log3.info(this.logHeader, "handleBoxedQueryAction", "query", query);
      const result = await this.extractorRunner.handleBoxedQueryAction(
        query,
        applicationDeploymentMap,
        defaultMetaModelEnvironment
      );
      log3.info(this.logHeader, "handleBoxedQueryAction", "query", query, "result", result);
      return result;
    }
    // #############################################################################################
    async handleQueryTemplateActionForServerONLY(query, applicationDeploymentMap) {
      log3.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "query", query);
      const result = await this.extractorTemplateRunner.handleQueryTemplateActionForServerONLY(
        query,
        applicationDeploymentMap,
        defaultMetaModelEnvironment
      );
      log3.info(
        this.logHeader,
        "handleQueryTemplateActionForServerONLY",
        "query",
        query,
        "result",
        result
      );
      return result;
    }
    // #############################################################################################
    async handleBoxedExtractorTemplateActionForServerONLY(query, applicationDeploymentMap) {
      log3.info(this.logHeader, "handleBoxedExtractorTemplateActionForServerONLY", "query", query);
      const result = await this.extractorTemplateRunner.handleBoxedExtractorTemplateActionForServerONLY(
        query,
        applicationDeploymentMap,
        defaultMetaModelEnvironment
      );
      log3.info(
        this.logHeader,
        "handleBoxedExtractorTemplateActionForServerONLY",
        "query",
        query,
        "result",
        result
      );
      return result;
    }
    // #############################################################################################
    async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query, applicationDeploymentMap) {
      log3.info(
        this.logHeader,
        "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
        "query",
        query
      );
      const result = await this.extractorTemplateRunner.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
        query,
        applicationDeploymentMap,
        defaultMetaModelEnvironment
      );
      log3.info(
        this.logHeader,
        "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
        "query",
        query,
        "result",
        result
      );
      return result;
    }
    // #############################################################################################
    async getInstance(parentUuid, uuid) {
      try {
        const result = await this.localUuidMongoDb.getInstance(parentUuid, uuid);
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: result
        });
      } catch (error) {
        return Promise.resolve(
          new Action2Error(
            "FailedToGetInstance",
            `getInstance could not retrieve instance ${uuid} of entity ${parentUuid}: ` + error
          )
        );
      }
    }
    // #############################################################################################
    async getInstances(parentUuid) {
      try {
        const result = await this.localUuidMongoDb.getAllInstances(parentUuid);
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: {
            parentUuid,
            applicationSection: this.localUuidMongoDb.applicationSection,
            instances: result
          }
        });
      } catch (error) {
        return Promise.resolve(
          new Action2Error("FailedToGetInstances", `getInstances error: ${error}`)
        );
      }
    }
    // #############################################################################################
    async upsertInstance(parentUuid, instance) {
      log3.info(this.logHeader, "upsertInstance called", instance.parentUuid, instance);
      try {
        if (this.localUuidMongoDb.hasCollection(instance.parentUuid)) {
          return this.localUuidMongoDb.putInstance(instance.parentUuid, instance);
        } else {
          log3.error(this.logHeader, "upsertInstance", instance.parentUuid, "does not exist.");
          return Promise.resolve(
            new Action2Error(
              "FailedToUpdateInstance",
              `failed to upsert instance ${instance.uuid} of entity ${parentUuid}`
            )
          );
        }
      } catch (error) {
        log3.error(
          this.logHeader,
          "upsertInstance",
          instance.parentUuid,
          "could not upsert instance",
          instance,
          error
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToUpdateInstance",
            `failed to upsert instance ${instance.uuid} of entity ${parentUuid}: `,
            error
          )
        );
      }
    }
    // #############################################################################################
    async deleteInstances(parentUuid, instances) {
      log3.info(this.logHeader, "deleteInstances", parentUuid, instances);
      for (const o of instances) {
        try {
          await this.deleteInstance(parentUuid, { uuid: o.uuid });
        } catch (error) {
          log3.error(
            this.logHeader,
            "deleteInstances",
            parentUuid,
            "could not delete instance",
            o,
            error
          );
          return Promise.resolve(
            new Action2Error(
              "FailedToDeleteInstance",
              `deleteInstances could not delete instance ${o.uuid} of entity ${parentUuid}`
            )
          );
        }
      }
      return Promise.resolve(ACTION_OK3);
    }
    // #############################################################################################
    async deleteInstance(parentUuid, instance) {
      log3.debug(
        this.logHeader,
        "deleteInstance started.",
        "entity",
        parentUuid,
        "instance",
        instance
      );
      try {
        return this.localUuidMongoDb.deleteInstance(parentUuid, instance.uuid);
      } catch (error) {
        log3.error(
          this.logHeader,
          "deleteInstance",
          parentUuid,
          "could not delete instance",
          instance,
          error
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToDeleteInstance",
            `failed to delete instance ${instance.uuid} of entity ${parentUuid}: ` + error
          )
        );
      }
    }
  };
}

// src/4_services/MongoDbDataStoreSection.ts
var log4 = console;
MiroirLoggerFactory4.registerLoggerToStart(
  MiroirLoggerFactory4.getLoggerName(packageName, cleanLevel, "MongoDbDataStoreSection")
).then((logger) => {
  log4 = logger;
});
var MongoDbDataStoreSection = class extends MixedMongoDbInstanceStoreSection {
  // ##############################################################################################
  constructor(mongoDbStoreName, localUuidMongoDb) {
    super(
      mongoDbStoreName,
      localUuidMongoDb,
      "MongoDbDataStoreSection " + mongoDbStoreName
    );
  }
  // ##############################################################################################
  async getState() {
    let result = {};
    log4.info(this.logHeader, "getState this.getEntityUuids()", this.getEntityUuids());
    for (const parentUuid of this.getEntityUuids()) {
      log4.debug(this.logHeader, "getState getting instances for", parentUuid);
      const instances = await this.getInstances(parentUuid);
      if (instances instanceof Action2Error2 || instances.returnedDomainElement instanceof Domain2ElementFailed) {
        log4.error(this.logHeader, "getState error getting instances for", parentUuid, instances);
        Object.assign(result, { [parentUuid]: { parentUuid, instances: [] } });
      } else {
        Object.assign(result, { [parentUuid]: instances.returnedDomainElement });
      }
    }
    return Promise.resolve(result);
  }
};

// src/4_services/MongoDbModelStoreSection.ts
import {
  Action2Error as Action2Error4,
  Domain2ElementFailed as Domain2ElementFailed3,
  MiroirLoggerFactory as MiroirLoggerFactory6
} from "miroir-core";

// src/4_services/MongoDbEntityStoreSectionMixin.ts
import {
  ACTION_OK as ACTION_OK4,
  Action2Error as Action2Error3,
  Domain2ElementFailed as Domain2ElementFailed2,
  MiroirLoggerFactory as MiroirLoggerFactory5,
  entityEntity,
  entityEntityDefinition
} from "miroir-core";
var log5 = console;
MiroirLoggerFactory5.registerLoggerToStart(
  MiroirLoggerFactory5.getLoggerName(packageName, cleanLevel, "MongoDbEntityStoreSectionMixin")
).then((logger) => {
  log5 = logger;
});
var MixedMongoDbEntityAndInstanceStoreSection = MongoDbEntityStoreSectionMixin(
  MongoDbInstanceStoreSectionMixin(MongoDbStoreSection)
);
function MongoDbEntityStoreSectionMixin(Base) {
  return class MixedMongoDbEntityStoreSection extends Base {
    dataStore;
    constructor(...args) {
      super(...args.slice(0, 3));
      this.dataStore = args[3];
    }
    // ##############################################################################################
    async clear() {
      log5.info("clearing data for entities:", this.getEntityUuids());
      await this.localUuidMongoDb.removeCollections(this.getEntityUuids());
      log5.info(this.logHeader, "clear DONE", this.getEntityUuids());
      return Promise.resolve(ACTION_OK4);
    }
    // ##################################################################################################
    getEntityUuids() {
      return this.localUuidMongoDb.getCollections();
    }
    // ##################################################################################################
    existsEntity(entityUuid) {
      return this.localUuidMongoDb.hasCollection(entityUuid);
    }
    // #############################################################################################
    async createEntity(entity, entityDefinition) {
      if (entity.uuid != entityDefinition.entityUuid) {
        log5.error(
          this.logHeader,
          "createEntity",
          "inconsistent input: given entityDefinition is not related to given entity."
        );
      } else {
        if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
          log5.warn(
            this.logHeader,
            "createEntity",
            entity.name,
            "already existing collection",
            entity.uuid,
            this.localUuidMongoDb.hasCollection(entity.uuid)
          );
        } else {
          await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
          await this.upsertInstance(entityEntity.uuid, entity);
          if (this.localUuidMongoDb.hasCollection(entityEntityDefinition.uuid)) {
            await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
          } else {
            log5.warn(
              this.logHeader,
              "createEntity",
              entity.name,
              "collection for entityEntityDefinition does not exist",
              entityEntityDefinition.uuid,
              this.localUuidMongoDb.hasCollection(entityEntityDefinition.uuid)
            );
          }
        }
      }
      return Promise.resolve(ACTION_OK4);
    }
    // ##############################################################################################
    async createEntities(entities) {
      for (const e of entities) {
        await this.createEntity(e.entity, e.entityDefinition);
      }
      return Promise.resolve(ACTION_OK4);
    }
    // #########################################################################################
    async renameEntityClean(update) {
      log5.info(this.logHeader, "renameEntityClean", update);
      const currentEntity = await this.getInstance(
        entityEntity.uuid,
        update.payload.entityUuid
      );
      if (currentEntity instanceof Action2Error3) {
        return currentEntity;
      }
      if (currentEntity.returnedDomainElement instanceof Domain2ElementFailed2) {
        return Promise.resolve(
          new Action2Error3(
            "FailedToDeployModule",
            `renameEntityClean failed for section: data, entityUuid ${update.payload.entityUuid}, error: ${currentEntity.returnedDomainElement.queryFailure}, ${currentEntity.returnedDomainElement.failureMessage}`
          )
        );
      }
      const currentEntityDefinition = await this.getInstance(
        entityEntityDefinition.uuid,
        update.payload.entityDefinitionUuid
      );
      if (currentEntityDefinition instanceof Action2Error3) {
        return currentEntityDefinition;
      }
      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed2) {
        return Promise.resolve(new Action2Error3(
          "FailedToDeployModule",
          `renameEntityClean failed for section: data, entityUuid ${update.payload.entityDefinitionUuid}, error: ${currentEntityDefinition.returnedDomainElement.queryFailure}, ${currentEntityDefinition.returnedDomainElement.failureMessage}`
        ));
      }
      const modifiedEntity = Object.assign({}, currentEntity.returnedDomainElement, { name: update.payload.targetValue });
      const modifiedEntityDefinition = Object.assign({}, currentEntityDefinition.returnedDomainElement, { name: update.payload.targetValue });
      await this.upsertInstance(entityEntity.uuid, modifiedEntity);
      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);
      await this.dataStore.renameStorageSpaceForInstancesOfEntity(
        currentEntity.returnedDomainElement.name,
        update.payload.targetValue,
        modifiedEntity,
        modifiedEntityDefinition
      );
      return Promise.resolve(ACTION_OK4);
    }
    // ############################################################################################
    async alterEntityAttribute(update) {
      log5.info(this.logHeader, "alterEntityAttribute", update);
      const currentEntityDefinition = await this.getInstance(
        entityEntityDefinition.uuid,
        update.payload.entityDefinitionUuid
      );
      if (currentEntityDefinition instanceof Action2Error3) {
        return currentEntityDefinition;
      }
      if (currentEntityDefinition.returnedDomainElement instanceof Domain2ElementFailed2) {
        return Promise.resolve(new Action2Error3(
          "FailedToDeployModule",
          `alterEntityAttribute failed for section: data, entityUuid ${update.payload.entityDefinitionUuid}, error: ${currentEntityDefinition.returnedDomainElement.queryFailure}, ${currentEntityDefinition.returnedDomainElement.failureMessage}`
        ));
      }
      const localEntityDefinition = currentEntityDefinition.returnedDomainElement;
      const localEntityJzodSchemaDefinition = update.payload.removeColumns != void 0 && Array.isArray(update.payload.removeColumns) ? Object.fromEntries(
        Object.entries(localEntityDefinition.mlSchema.definition).filter(
          (e) => !update.payload.removeColumns?.includes(e[0])
        )
      ) : update.payload.addColumns != void 0 && Array.isArray(update.payload.addColumns) ? {
        ...localEntityDefinition.mlSchema.definition,
        ...Object.fromEntries(
          update.payload.addColumns.map((c) => [c.name, c.definition])
        )
      } : localEntityDefinition.mlSchema.definition;
      const modifiedEntityDefinition = Object.assign({}, localEntityDefinition, {
        mlSchema: { definition: localEntityJzodSchemaDefinition }
      });
      await this.upsertInstance(entityEntityDefinition.uuid, modifiedEntityDefinition);
      return Promise.resolve(ACTION_OK4);
    }
    // #########################################################################################
    async dropEntity(entityUuid) {
      log5.info(this.logHeader, "dropEntity", entityUuid);
      const entity = await this.getInstance(entityEntity.uuid, entityUuid);
      if (entity instanceof Action2Error3) {
        return entity;
      }
      await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid });
      await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
      return Promise.resolve(ACTION_OK4);
    }
    // #########################################################################################
    async dropEntities(entityUuids) {
      for (const entityUuid of entityUuids) {
        await this.dropEntity(entityUuid);
      }
      return Promise.resolve(ACTION_OK4);
    }
  };
}

// src/4_services/MongoDbModelStoreSection.ts
var log6 = console;
MiroirLoggerFactory6.registerLoggerToStart(
  MiroirLoggerFactory6.getLoggerName(packageName, cleanLevel, "MongoDbModelStoreSection")
).then((logger) => {
  log6 = logger;
});
var MongoDbModelStoreSection = class extends MixedMongoDbEntityAndInstanceStoreSection {
  // ##############################################################################################
  constructor(mongoDbStoreName, localUuidMongoDb, dataStore) {
    super(
      mongoDbStoreName,
      localUuidMongoDb,
      "MongoDbModelStoreSection " + mongoDbStoreName,
      // logheader
      dataStore
    );
    log6.info("MongoDbModelStoreSection started for", mongoDbStoreName);
  }
  // ##############################################################################################
  // TODO: also implemented in MongoDbDataStoreSection => mix it up?
  async getState() {
    let result = {};
    log6.info(this.logHeader, "getState this.getEntityUuids()", this.getEntityUuids());
    for (const parentUuid of this.getEntityUuids()) {
      log6.debug(this.logHeader, "getState getting instances for", parentUuid);
      const instances = await this.getInstances(parentUuid);
      if (instances instanceof Action2Error4 || instances.returnedDomainElement instanceof Domain2ElementFailed3) {
        Object.assign(result, { [parentUuid]: { parentUuid, instances: [] } });
      } else if (typeof instances.returnedDomainElement !== "object" || Array.isArray(instances.returnedDomainElement)) {
        Object.assign(result, { [parentUuid]: { parentUuid, instances: [] } });
      } else {
        Object.assign(result, { [parentUuid]: instances.returnedDomainElement });
      }
    }
    return Promise.resolve(result);
  }
};

// src/4_services/MongoDb.ts
import { MongoClient } from "mongodb";
import {
  ACTION_OK as ACTION_OK5,
  Action2Error as Action2Error5,
  MiroirLoggerFactory as MiroirLoggerFactory7
} from "miroir-core";
var log7 = console;
MiroirLoggerFactory7.registerLoggerToStart(
  MiroirLoggerFactory7.getLoggerName(packageName, cleanLevel, "MongoDb")
).then((logger) => {
  log7 = logger;
});
var MongoDb = class {
  // #############################################################################################
  constructor(applicationSection, connectionString, databaseName) {
    this.applicationSection = applicationSection;
    this.connectionString = connectionString;
    this.databaseName = databaseName;
    this.logHeader = "MongoDb " + databaseName;
  }
  client = void 0;
  db = void 0;
  collections = /* @__PURE__ */ new Map();
  logHeader;
  // #############################################################################################
  async closeObjectStore() {
    if (this.client) {
      log7.info(this.logHeader, "closeObjectStore closing db", this.databaseName, this.applicationSection, "...");
      await this.client.close();
      log7.info(this.logHeader, "closeObjectStore db closed");
    } else {
      log7.info(this.logHeader, "closeObjectStore db already closed", this.databaseName, this.applicationSection);
    }
    this.client = void 0;
    this.db = void 0;
    this.collections.clear();
    return Promise.resolve(void 0);
  }
  // #############################################################################################
  async openObjectStore() {
    try {
      log7.info("openObjectStore called for", this.databaseName);
      if (this.client !== void 0 && this.db !== void 0) {
        log7.info(this.logHeader, "openObjectStore existing db already opened", this.databaseName);
      } else {
        this.client = new MongoClient(this.connectionString);
        await this.client.connect();
        this.db = this.client.db(this.databaseName);
        log7.info("openObjectStore created and connected to db", this.databaseName);
        const existingCollections = await this.db.listCollections().toArray();
        for (const collInfo of existingCollections) {
          if (!this.collections.has(collInfo.name)) {
            const collection = this.db.collection(collInfo.name);
            this.collections.set(collInfo.name, collection);
            log7.debug(this.logHeader, "loaded existing collection:", collInfo.name);
          }
        }
        log7.info(this.logHeader, "openObjectStore loaded existing collections:", this.getCollections());
      }
      log7.info("openObjectStore done for", this.databaseName);
    } catch (error) {
      log7.error("openObjectStore could not open", this.databaseName, error);
      throw error;
    }
    return Promise.resolve(void 0);
  }
  // #############################################################################################
  async clearObjectStore() {
    log7.info(this.logHeader, "clearObjectStore clearing all collections");
    if (this.db) {
      const collectionNames = await this.db.listCollections().toArray();
      for (const collInfo of collectionNames) {
        await this.db.collection(collInfo.name).deleteMany({});
        log7.debug(this.logHeader, "clearObjectStore cleared collection:", collInfo.name);
      }
    }
    this.collections.clear();
    return Promise.resolve(void 0);
  }
  // #############################################################################
  addCollections(collectionNames) {
    log7.info(this.logHeader, "addCollections:", collectionNames, "existing collections", this.getCollections());
    if (!this.db) {
      log7.error(this.logHeader, "addCollections called without open database");
      return;
    }
    for (const collectionName of collectionNames) {
      if (!this.collections.has(collectionName)) {
        const collection = this.db.collection(collectionName);
        this.collections.set(collectionName, collection);
        log7.debug(this.logHeader, "added collection:", collectionName);
      }
    }
  }
  // #############################################################################
  hasCollection(collectionName) {
    return this.collections.has(collectionName);
  }
  // #############################################################################
  getCollections() {
    return Array.from(this.collections.keys());
  }
  // #############################################################################
  async removeCollections(collectionNames) {
    log7.info(this.logHeader, "removeCollections:", collectionNames);
    if (!this.db) {
      log7.error(this.logHeader, "removeCollections called without open database");
      return;
    }
    for (const collectionName of collectionNames) {
      if (this.collections.has(collectionName)) {
        try {
          await this.db.collection(collectionName).drop();
          log7.debug(this.logHeader, "dropped collection:", collectionName);
        } catch (error) {
          if (error.codeName !== "NamespaceNotFound") {
            log7.warn(this.logHeader, "error dropping collection:", collectionName, error);
          }
        }
        this.collections.delete(collectionName);
      }
    }
    return Promise.resolve();
  }
  // #############################################################################################
  async getInstance(parentUuid, instanceUuid) {
    const collection = this.collections.get(parentUuid);
    log7.debug(this.logHeader, "getInstance for entity", parentUuid, "instance uuid", instanceUuid);
    if (collection) {
      const result = await collection.findOne({ _id: instanceUuid });
      if (result) {
        const { _id, ...rest } = result;
        return { uuid: _id, ...rest };
      }
      log7.warn(this.logHeader, "getInstance instance not found:", instanceUuid);
      return void 0;
    } else {
      log7.error(this.logHeader, "getInstance collection for parentUuid not found:", parentUuid);
      throw new Error(`Collection ${parentUuid} does not exist!`);
    }
  }
  // #############################################################################################
  async getAllInstances(parentUuid) {
    const collection = this.collections.get(parentUuid);
    if (!collection) {
      throw new Error(`Entity ${parentUuid} does not exist!`);
    }
    const results = await collection.find({}).toArray();
    const transformedResults = results.map((doc) => {
      const { _id, ...rest } = doc;
      return { uuid: _id, ...rest };
    });
    log7.trace(this.logHeader, "getAllInstances", parentUuid, "result count", transformedResults.length);
    return Promise.resolve(transformedResults);
  }
  // #############################################################################################
  async putInstance(parentUuid, value) {
    const collection = this.collections.get(parentUuid);
    log7.debug(this.logHeader, "putInstance in collection", parentUuid, "hasCollection:", this.hasCollection(parentUuid), "value:", value);
    if (collection) {
      const { uuid, ...rest } = value;
      await collection.replaceOne(
        { _id: uuid },
        { ...rest, parentUuid: value.parentUuid },
        { upsert: true }
      );
      return Promise.resolve(ACTION_OK5);
    } else {
      log7.error(this.logHeader, "putInstance collection not found:", parentUuid);
      return Promise.resolve(
        new Action2Error5("FailedToUpdateInstance", `Collection ${parentUuid} does not exist`)
      );
    }
  }
  // #############################################################################################
  async putBulkInstances(parentUuid, values) {
    const collection = this.collections.get(parentUuid);
    if (collection) {
      const operations = values.map((value) => {
        const { uuid, ...rest } = value;
        return {
          replaceOne: {
            filter: { _id: uuid },
            replacement: { ...rest, parentUuid: value.parentUuid },
            upsert: true
          }
        };
      });
      if (operations.length > 0) {
        await collection.bulkWrite(operations);
      }
      return Promise.resolve(ACTION_OK5);
    } else {
      log7.error(this.logHeader, "putBulkInstances collection not found:", parentUuid);
      return Promise.resolve(
        new Action2Error5("FailedToUpdateInstance", `Collection ${parentUuid} does not exist`)
      );
    }
  }
  // #############################################################################################
  async deleteInstance(parentUuid, instanceUuid) {
    const collection = this.collections.get(parentUuid);
    log7.debug(this.logHeader, "deleteInstance from collection", parentUuid, "instance", instanceUuid);
    if (collection) {
      const result = await collection.deleteOne({ _id: instanceUuid });
      if (result.deletedCount === 0) {
        log7.warn(this.logHeader, "deleteInstance instance not found:", instanceUuid);
      }
      return Promise.resolve(ACTION_OK5);
    } else {
      log7.error(this.logHeader, "deleteInstance collection not found:", parentUuid);
      return Promise.resolve(
        new Action2Error5("FailedToDeleteInstance", `Collection ${parentUuid} does not exist`)
      );
    }
  }
};

// src/startup.ts
import {
  ConfigurationService,
  ErrorAdminStore,
  ErrorDataStore,
  ErrorModelStore,
  MiroirLoggerFactory as MiroirLoggerFactory9
} from "miroir-core";

// src/4_services/MongoDbAdminStore.ts
import {
  ACTION_OK as ACTION_OK6,
  MiroirLoggerFactory as MiroirLoggerFactory8
} from "miroir-core";
var log8 = console;
MiroirLoggerFactory8.registerLoggerToStart(
  MiroirLoggerFactory8.getLoggerName(packageName, cleanLevel, "MongoDbAdminStore")
).then((logger) => {
  log8 = logger;
});
var MongoDbAdminStore = class extends MongoDbStore {
  // For the sake of uniformity, we follow the mixin pattern also for this class although it's not mixed in any other class
  // ##############################################################################################
  constructor(...args) {
    super(args[0], args[1], args[2]);
  }
  // ##############################################################################################
  async createStore(config) {
    log8.info(this.logHeader, "createStore called for config:", config);
    return Promise.resolve(ACTION_OK6);
  }
  // ##############################################################################################
  async deleteStore(config) {
    log8.info(this.logHeader, "deleteStore called for config:", config);
    if (this.localUuidMongoDb.db) {
      try {
        await this.localUuidMongoDb.db.dropDatabase();
        log8.info(this.logHeader, "deleteStore dropped database");
      } catch (error) {
        log8.warn(this.logHeader, "deleteStore error dropping database:", error);
      }
    }
    return Promise.resolve(ACTION_OK6);
  }
};

// src/startup.ts
var log9 = console;
MiroirLoggerFactory9.registerLoggerToStart(
  MiroirLoggerFactory9.getLoggerName(packageName, cleanLevel, "startup")
).then((logger) => {
  log9 = logger;
});
function isMongoDbConfig(config) {
  return config.emulatedServerType === "mongodb" && "connectionString" in config && "database" in config;
}
function miroirMongoDbStoreSectionStartup() {
  ConfigurationService.registerAdminStoreFactory(
    "mongodb",
    async (config) => {
      if (isMongoDbConfig(config)) {
        const mongoDbStoreName = config.database + "-admin";
        return Promise.resolve(new MongoDbAdminStore(
          mongoDbStoreName,
          new MongoDb("data", config.connectionString, mongoDbStoreName),
          "MongoDbAdminStore " + mongoDbStoreName
        ));
      } else {
        return Promise.resolve(new ErrorAdminStore());
      }
    }
  );
  ConfigurationService.registerStoreSectionFactory(
    "mongodb",
    "model",
    async (section, config, dataStore) => {
      log9.info("called registerStoreSectionFactory model function for", section, config.emulatedServerType);
      if (isMongoDbConfig(config) && dataStore) {
        const mongoDbStoreName = config.database + "-model";
        const db = new MongoDbModelStoreSection(
          mongoDbStoreName,
          new MongoDb("model", config.connectionString, mongoDbStoreName),
          dataStore
        );
        return Promise.resolve(db);
      } else {
        log9.warn("called registerStoreSectionFactory model for", section, config, "returns ErrorModelStore!");
        return Promise.resolve(new ErrorModelStore());
      }
    }
  );
  ConfigurationService.registerStoreSectionFactory(
    "mongodb",
    "data",
    async (section, config, dataStore) => {
      if (isMongoDbConfig(config)) {
        log9.info("called registerStoreSectionFactory data function for", section, config);
        const mongoDbStoreName = config.database + "-data";
        const db = new MongoDbDataStoreSection(
          mongoDbStoreName,
          new MongoDb("data", config.connectionString, mongoDbStoreName)
        );
        return Promise.resolve(db);
      } else {
        log9.warn("called registerStoreSectionFactory data for", section, config, "returns ErrorDataStore!");
        return Promise.resolve(new ErrorDataStore());
      }
    }
  );
}
export {
  MongoDb,
  MongoDbDataStoreSection,
  MongoDbModelStoreSection,
  miroirMongoDbStoreSectionStartup
};
