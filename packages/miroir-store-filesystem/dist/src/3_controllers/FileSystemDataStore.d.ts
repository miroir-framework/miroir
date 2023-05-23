import { DataStoreApplicationType, DataStoreInterface, EntityDefinition, EntityInstance, EntityInstanceCollection, MetaEntity } from "miroir-core";
export declare class FileSystemDataStore implements DataStoreInterface {
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
