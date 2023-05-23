import { DataStoreInterface, DataStoreApplicationType, MetaEntity, EntityDefinition, EntityInstanceCollection, EntityInstance, ModelStoreInterface, MiroirMetaModel, WrappedModelEntityUpdateWithCUDUpdate, ModelReplayableUpdate } from 'miroir-core';

declare class FileSystemDataStore implements DataStoreInterface {
    applicationName: string;
    dataStoreType: DataStoreApplicationType;
    private directory;
    private logHeader;
    private targetPath;
    constructor(applicationName: string, dataStoreType: DataStoreApplicationType, directory: string);
    connect(): Promise<void>;
    close(): Promise<void>;
    bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void>;
    createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void>;
    dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void>;
    renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void>;
    dropData(): Promise<void>;
    getEntityNames(): string[];
    getEntityUuids(): string[];
    getState(): Promise<{
        [uuid: string]: EntityInstanceCollection;
    }>;
    getInstance(entityUuid: string, uuid: string): Promise<EntityInstance | undefined>;
    getInstances(entityUuid: string): Promise<EntityInstance[]>;
    upsertInstance(entityUuid: string, instance: EntityInstance): Promise<any>;
    deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any>;
    deleteInstance(entityUuid: string, instance: EntityInstance): Promise<any>;
}

declare class FileSystemModelStore implements ModelStoreInterface {
    applicationName: string;
    dataStoreType: DataStoreApplicationType;
    private directory;
    private dataStore;
    private targetPath;
    private logHeader;
    constructor(applicationName: string, dataStoreType: DataStoreApplicationType, directory: string, dataStore: DataStoreInterface);
    connect(): Promise<void>;
    getEntityNames(): string[];
    getEntityUuids(): string[];
    bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void>;
    dropModelAndData(metaModel: MiroirMetaModel): Promise<void>;
    open(): Promise<void>;
    close(): Promise<void>;
    getEntities(): string[];
    existsEntity(entityUuid: string): boolean;
    createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void>;
    createEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void>;
    dropEntity(entityUuid: string): Promise<void>;
    dropEntities(entityUuids: string[]): Promise<void>;
    renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate): Promise<void>;
    getInstance(entityUuid: string, uuid: string): Promise<EntityInstance | undefined>;
    getInstances(entityUuid: string): Promise<EntityInstance[]>;
    getState(): Promise<{
        [uuid: string]: EntityInstanceCollection;
    }>;
    upsertInstance(entityUuid: string, instance: EntityInstance): Promise<any>;
    deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any>;
    deleteInstance(entityUuid: string, instance: EntityInstance): Promise<any>;
    applyModelEntityUpdate(update: ModelReplayableUpdate): Promise<undefined>;
}

declare function miroirStoreFileSystemStartup(): void;

export { FileSystemDataStore, FileSystemModelStore, miroirStoreFileSystemStartup };
