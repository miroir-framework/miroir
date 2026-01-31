import * as miroir_core from 'miroir-core';
import { ApplicationSection, Action2VoidReturnType, PersistenceStoreAbstractInterface, PersistenceStoreAbstractSectionInterface, StorageSpaceHandlerInterface, MetaEntity, EntityDefinition, ExtractorTemplateRunnerInMemory, ExtractorRunnerInMemory, RunBoxedExtractorAction, ApplicationDeploymentMap, Action2ReturnType, RunBoxedQueryAction, RunBoxedQueryTemplateAction, RunBoxedExtractorTemplateAction, RunBoxedQueryTemplateOrBoxedExtractorTemplateAction, Action2EntityInstanceReturnType, Action2EntityInstanceCollectionOrFailure, EntityInstance, PersistenceStoreDataSectionInterface, EntityInstanceCollection, Entity, ModelActionRenameEntity, ModelActionAlterEntityAttribute, PersistenceStoreModelSectionInterface } from 'miroir-core';
import { MongoClient, Db } from 'mongodb';

declare class MongoDb {
    applicationSection: ApplicationSection;
    private connectionString;
    private databaseName;
    client: MongoClient | undefined;
    db: Db | undefined;
    private collections;
    private logHeader;
    constructor(applicationSection: ApplicationSection, connectionString: string, databaseName: string);
    closeObjectStore(): Promise<void>;
    openObjectStore(): Promise<void>;
    clearObjectStore(): Promise<void>;
    addCollections(collectionNames: string[]): void;
    hasCollection(collectionName: string): boolean;
    getCollections(): string[];
    removeCollections(collectionNames: string[]): Promise<void>;
    getInstance(parentUuid: string, instanceUuid: string): Promise<any>;
    getAllInstances(parentUuid: string): Promise<any[]>;
    putInstance(parentUuid: string, value: any): Promise<Action2VoidReturnType>;
    putBulkInstances(parentUuid: string, values: any[]): Promise<Action2VoidReturnType>;
    deleteInstance(parentUuid: string, instanceUuid: string): Promise<Action2VoidReturnType>;
}

declare class MongoDbStore implements PersistenceStoreAbstractInterface {
    mongoDbStoreName: string;
    localUuidMongoDb: MongoDb;
    logHeader: string;
    constructor(mongoDbStoreName: string, localUuidMongoDb: MongoDb, logHeader: string);
    getStoreName(): string;
    open(): Promise<Action2VoidReturnType>;
    close(): Promise<Action2VoidReturnType>;
}

declare class MongoDbStoreSection extends MongoDbStore implements PersistenceStoreAbstractSectionInterface, StorageSpaceHandlerInterface {
    constructor(...args: any[]);
    bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<Action2VoidReturnType>;
    clear(): Promise<Action2VoidReturnType>;
    getEntityUuids(): string[];
    createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<Action2VoidReturnType>;
    dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<Action2VoidReturnType>;
    renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition): Promise<Action2VoidReturnType>;
}

declare const MixedMongoDbInstanceStoreSection: {
    new (...args: any[]): {
        extractorTemplateRunner: ExtractorTemplateRunnerInMemory;
        extractorRunner: ExtractorRunnerInMemory;
        handleBoxedExtractorAction(query: RunBoxedExtractorAction, applicationDeploymentMap: ApplicationDeploymentMap): Promise<Action2ReturnType>;
        handleBoxedQueryAction(query: RunBoxedQueryAction, applicationDeploymentMap: ApplicationDeploymentMap): Promise<Action2ReturnType>;
        handleQueryTemplateActionForServerONLY(query: RunBoxedQueryTemplateAction, applicationDeploymentMap: ApplicationDeploymentMap): Promise<Action2ReturnType>;
        handleBoxedExtractorTemplateActionForServerONLY(query: RunBoxedExtractorTemplateAction, applicationDeploymentMap: ApplicationDeploymentMap): Promise<Action2ReturnType>;
        handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction, applicationDeploymentMap: ApplicationDeploymentMap): Promise<Action2ReturnType>;
        getInstance(parentUuid: string, uuid: string): Promise<Action2EntityInstanceReturnType>;
        getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure>;
        upsertInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType>;
        deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<Action2VoidReturnType>;
        deleteInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType>;
        bootFromPersistedState(entities: miroir_core.MetaEntity[], entityDefinitions: miroir_core.EntityDefinition[]): Promise<Action2VoidReturnType>;
        clear(): Promise<Action2VoidReturnType>;
        getEntityUuids(): string[];
        createStorageSpaceForInstancesOfEntity(entity: miroir_core.MetaEntity, entityDefinition: miroir_core.EntityDefinition): Promise<Action2VoidReturnType>;
        dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<Action2VoidReturnType>;
        renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: miroir_core.MetaEntity, entityDefinition: miroir_core.EntityDefinition): Promise<Action2VoidReturnType>;
        mongoDbStoreName: string;
        localUuidMongoDb: MongoDb;
        logHeader: string;
        getStoreName(): string;
        open(): Promise<Action2VoidReturnType>;
        close(): Promise<Action2VoidReturnType>;
    };
} & typeof MongoDbStoreSection;

declare class MongoDbDataStoreSection extends MixedMongoDbInstanceStoreSection implements PersistenceStoreDataSectionInterface {
    constructor(mongoDbStoreName: string, localUuidMongoDb: MongoDb);
    getState(): Promise<{
        [uuid: string]: EntityInstanceCollection;
    }>;
}

declare const MixedMongoDbEntityAndInstanceStoreSection: {
    new (...args: any[]): {
        dataStore: PersistenceStoreDataSectionInterface;
        clear(): Promise<Action2VoidReturnType>;
        getEntityUuids(): string[];
        existsEntity(entityUuid: string): boolean;
        createEntity(entity: Entity, entityDefinition: EntityDefinition): Promise<Action2VoidReturnType>;
        createEntities(entities: {
            entity: Entity;
            entityDefinition: EntityDefinition;
        }[]): Promise<Action2VoidReturnType>;
        renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType>;
        alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<Action2VoidReturnType>;
        dropEntity(entityUuid: string): Promise<Action2VoidReturnType>;
        dropEntities(entityUuids: string[]): Promise<Action2VoidReturnType>;
        extractorTemplateRunner: miroir_core.ExtractorTemplateRunnerInMemory;
        extractorRunner: miroir_core.ExtractorRunnerInMemory;
        handleBoxedExtractorAction(query: miroir_core.RunBoxedExtractorAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        handleBoxedQueryAction(query: miroir_core.RunBoxedQueryAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        handleQueryTemplateActionForServerONLY(query: miroir_core.RunBoxedQueryTemplateAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        handleBoxedExtractorTemplateActionForServerONLY(query: miroir_core.RunBoxedExtractorTemplateAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query: miroir_core.RunBoxedQueryTemplateOrBoxedExtractorTemplateAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        getInstance(parentUuid: string, uuid: string): Promise<Action2EntityInstanceReturnType>;
        getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure>;
        upsertInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType>;
        deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<Action2VoidReturnType>;
        deleteInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType>;
        bootFromPersistedState(entities: miroir_core.MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<Action2VoidReturnType>;
        createStorageSpaceForInstancesOfEntity(entity: miroir_core.MetaEntity, entityDefinition: EntityDefinition): Promise<Action2VoidReturnType>;
        dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<Action2VoidReturnType>;
        renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: miroir_core.MetaEntity, entityDefinition: EntityDefinition): Promise<Action2VoidReturnType>;
        mongoDbStoreName: string;
        localUuidMongoDb: MongoDb;
        logHeader: string;
        getStoreName(): string;
        open(): Promise<Action2VoidReturnType>;
        close(): Promise<Action2VoidReturnType>;
    };
} & {
    new (...args: any[]): {
        extractorTemplateRunner: miroir_core.ExtractorTemplateRunnerInMemory;
        extractorRunner: miroir_core.ExtractorRunnerInMemory;
        handleBoxedExtractorAction(query: miroir_core.RunBoxedExtractorAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        handleBoxedQueryAction(query: miroir_core.RunBoxedQueryAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        handleQueryTemplateActionForServerONLY(query: miroir_core.RunBoxedQueryTemplateAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        handleBoxedExtractorTemplateActionForServerONLY(query: miroir_core.RunBoxedExtractorTemplateAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query: miroir_core.RunBoxedQueryTemplateOrBoxedExtractorTemplateAction, applicationDeploymentMap: miroir_core.ApplicationDeploymentMap): Promise<miroir_core.Action2ReturnType>;
        getInstance(parentUuid: string, uuid: string): Promise<Action2EntityInstanceReturnType>;
        getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure>;
        upsertInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType>;
        deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<Action2VoidReturnType>;
        deleteInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType>;
        bootFromPersistedState(entities: miroir_core.MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<Action2VoidReturnType>;
        clear(): Promise<Action2VoidReturnType>;
        getEntityUuids(): string[];
        createStorageSpaceForInstancesOfEntity(entity: miroir_core.MetaEntity, entityDefinition: EntityDefinition): Promise<Action2VoidReturnType>;
        dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<Action2VoidReturnType>;
        renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: miroir_core.MetaEntity, entityDefinition: EntityDefinition): Promise<Action2VoidReturnType>;
        mongoDbStoreName: string;
        localUuidMongoDb: MongoDb;
        logHeader: string;
        getStoreName(): string;
        open(): Promise<Action2VoidReturnType>;
        close(): Promise<Action2VoidReturnType>;
    };
} & typeof MongoDbStoreSection;

declare class MongoDbModelStoreSection extends MixedMongoDbEntityAndInstanceStoreSection implements PersistenceStoreModelSectionInterface {
    constructor(mongoDbStoreName: string, localUuidMongoDb: MongoDb, dataStore: PersistenceStoreDataSectionInterface);
    getState(): Promise<{
        [uuid: string]: EntityInstanceCollection;
    }>;
}

declare function miroirMongoDbStoreSectionStartup(): void;

export { MongoDb, MongoDbDataStoreSection, MongoDbModelStoreSection, miroirMongoDbStoreSectionStartup };
