import { DataStoreInterface, DataStoreApplicationType, MetaEntity, EntityDefinition, EntityInstanceCollection, EntityInstance, ModelStoreInterface, WrappedModelEntityUpdateWithCUDUpdate, MiroirMetaModel } from 'miroir-core';
import { Level } from 'level';

declare class IndexedDb {
    private databaseName;
    db: Level | undefined;
    private subLevels;
    private logHeader;
    constructor(databaseName: string);
    closeObjectStore(): Promise<void>;
    openObjectStore(): Promise<void>;
    clearObjectStore(): Promise<void>;
    createObjectStore(tableNames: string[]): Promise<void>;
    addSubLevels(tableNames: string[]): void;
    private createSubLevels;
    hasSubLevel(tableName: string): boolean;
    getSubLevels(): string[];
    removeSubLevels(tableNames: string[]): Promise<void>;
    getValue(parentUuid: string, instanceUuid: string): Promise<any>;
    getAllValue(parentUuid: string): Promise<any[]>;
    putValue(parentUuid: string, value: any): Promise<any>;
    putBulkValue(tableName: string, values: any[]): Promise<any>;
    deleteValue(tableUuid: string, uuid: string): Promise<any>;
}

declare class IndexedDbDataStore implements DataStoreInterface {
    applicationName: string;
    dataStoreType: DataStoreApplicationType;
    private localUuidIndexedDb;
    private logHeader;
    constructor(applicationName: string, dataStoreType: DataStoreApplicationType, localUuidIndexedDb: IndexedDb);
    connect(): Promise<void>;
    close(): Promise<void>;
    bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void>;
    createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void>;
    dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void>;
    renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void>;
    getEntityNames(): string[];
    getEntityUuids(): string[];
    getState(): Promise<{
        [uuid: string]: EntityInstanceCollection;
    }>;
    getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined>;
    getInstances(parentUuid: string): Promise<any>;
    upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any>;
    deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any>;
    deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any>;
    dropData(): Promise<void>;
}

declare class IndexedDbModelStore implements ModelStoreInterface {
    applicationName: string;
    dataStoreType: DataStoreApplicationType;
    private localUuidIndexedDb;
    private dataStore;
    private logHeader;
    constructor(applicationName: string, dataStoreType: DataStoreApplicationType, localUuidIndexedDb: IndexedDb, dataStore: DataStoreInterface);
    close(): Promise<void>;
    connect(): Promise<void>;
    bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void>;
    getEntities(): string[];
    existsEntity(entityUuid: string): boolean;
    createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void>;
    createEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void>;
    renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate): Promise<void>;
    dropEntity(entityUuid: string): Promise<void>;
    dropEntities(entityUuids: string[]): Promise<void>;
    dropModelAndData(metaModel: MiroirMetaModel): Promise<void>;
    getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined>;
    getInstances(parentUuid: string): Promise<any>;
    upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any>;
    deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any>;
    deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any>;
}

declare function miroirStoreIndexedDbStartup(): void;

export { IndexedDb, IndexedDbDataStore, IndexedDbModelStore, miroirStoreIndexedDbStartup };
