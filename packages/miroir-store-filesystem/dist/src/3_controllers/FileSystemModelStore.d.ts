import { DataStoreApplicationType, EntityDefinition, EntityInstance, EntityInstanceCollection, MetaEntity, MiroirMetaModel, ModelReplayableUpdate, WrappedModelEntityUpdateWithCUDUpdate, ModelStoreInterface, DataStoreInterface } from "miroir-core";
export declare class FileSystemModelStore implements ModelStoreInterface {
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
