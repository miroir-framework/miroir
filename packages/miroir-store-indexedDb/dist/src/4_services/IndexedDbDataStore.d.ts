import { DataStoreApplicationType, DataStoreInterface, EntityDefinition, EntityInstance, EntityInstanceCollection, MetaEntity } from "miroir-core";
import { IndexedDb } from "./indexedDb.js";
export declare class IndexedDbDataStore implements DataStoreInterface {
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
