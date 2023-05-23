import { DataStoreApplicationType, DataStoreInterface, EntityDefinition, EntityInstance, MetaEntity, MiroirMetaModel, ModelStoreInterface, WrappedModelEntityUpdateWithCUDUpdate } from "miroir-core";
import { IndexedDb } from "./indexedDb.js";
export declare class IndexedDbModelStore implements ModelStoreInterface {
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
