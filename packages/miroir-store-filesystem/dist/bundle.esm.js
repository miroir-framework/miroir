import * as fs from 'fs';
import * as path from 'path';
import { entityEntity, entityEntityDefinition, ConfigurationService, ErrorModelStore, ErrorDataStore } from 'miroir-core';

class FileSystemDataStore {
    constructor(applicationName, dataStoreType, directory) {
        this.applicationName = applicationName;
        this.dataStoreType = dataStoreType;
        this.directory = directory;
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FileSystemEntityDataStore constructor');
        this.logHeader = 'FileSystemModelStore ' + applicationName + ' dataStoreType ' + dataStoreType;
        this.targetPath = path.parse(directory);
        const files = fs.readdirSync(this.directory);
        console.log(this.logHeader, 'constructor found entities', files);
    }
    connect() {
        console.log(this.logHeader, 'connect does nothing!');
        return Promise.resolve();
    }
    close() {
        console.log(this.logHeader, 'close does nothing!');
        return Promise.resolve();
    }
    bootFromPersistedState(entities, entityDefinitions) {
        console.log(this.logHeader, 'bootFromPersistedState does nothing!');
        return Promise.resolve();
    }
    createStorageSpaceForInstancesOfEntity(entity, entityDefinition) {
        const entityInstancesPath = path.join(this.directory, entity.uuid);
        if (!fs.existsSync(entityInstancesPath)) {
            fs.mkdirSync(entityInstancesPath);
        }
        else {
            console.log(this.logHeader, 'createStorageSpaceForInstancesOfEntity storage space already exists for', entity.uuid);
        }
        return Promise.resolve();
    }
    dropStorageSpaceForInstancesOfEntity(entityUuid) {
        const entityInstancesPath = path.join(this.directory, entityUuid);
        if (fs.existsSync(entityInstancesPath)) {
            fs.rmSync(entityInstancesPath, { recursive: true, force: true });
        }
        else {
            console.log(this.logHeader, 'dropStorageSpaceForInstancesOfEntity storage space does not exist for', entityUuid);
        }
        return Promise.resolve();
    }
    renameStorageSpaceForInstancesOfEntity(oldName, newName, entity, entityDefinition) {
        console.log(this.logHeader, 'renameStorageSpaceForInstancesOfEntity does nothing!');
        return Promise.resolve();
    }
    async dropData() {
        console.log(this.logHeader, 'dropData this.getEntities()', this.getEntityUuids());
        for (const parentUuid of this.getEntityUuids()) {
            console.log(this.logHeader, 'dropData for entity', parentUuid);
            await this.dropStorageSpaceForInstancesOfEntity(parentUuid);
        }
        return Promise.resolve();
    }
    getEntityNames() {
        throw new Error("Method not implemented.");
    }
    getEntityUuids() {
        const files = fs.readdirSync(this.directory);
        return files;
    }
    async getState() {
        let result = {};
        console.log(this.logHeader, 'getState this.getEntities()', this.getEntityUuids());
        for (const parentUuid of this.getEntityUuids()) {
            console.log(this.logHeader, 'getState getting instances for', parentUuid);
            const instances = await this.getInstances(parentUuid);
            console.log(this.logHeader, 'getState found instances', parentUuid, instances);
            Object.assign(result, { [parentUuid]: instances });
        }
        return Promise.resolve(result);
    }
    getInstance(entityUuid, uuid) {
        const entityInstancePath = path.join(this.directory, entityUuid, uuid);
        return Promise.resolve(JSON.parse(fs.readFileSync(entityInstancePath).toString()));
    }
    async getInstances(entityUuid) {
        console.log('FileSystemEntityDataStore getInstances application', this.applicationName, 'dataStoreType', this.dataStoreType, 'entityUuid', entityUuid, 'directory', this.directory);
        const entityInstancesPath = path.join(this.directory, entityUuid);
        if (fs.existsSync(entityInstancesPath)) {
            const entityInstancesUuid = fs.readdirSync(entityInstancesPath);
            console.log('FileSystemEntityDataStore getInstances application', this.applicationName, 'dataStoreType', this.dataStoreType, 'entityUuid', entityUuid, 'directory', this.directory, 'found entity instances', entityInstancesUuid);
            const entityInstances = { parentUuid: entityUuid, instances: entityInstancesUuid.map(e => JSON.parse(fs.readFileSync(path.join(entityInstancesPath, e)).toString())) };
            console.log('FileSystemEntityDataStore getInstances application', this.applicationName, 'dataStoreType', this.dataStoreType, 'entityUuid', entityUuid, 'directory', this.directory, 'found entity instances', entityInstances);
            return Promise.resolve(entityInstances.instances);
        }
        else {
            console.warn('FileSystemEntityDataStore getInstances application', this.applicationName, 'dataStoreType', this.dataStoreType, 'entityUuid', entityUuid, 'could not find path', entityInstancesPath);
            return Promise.resolve([]);
        }
    }
    upsertInstance(entityUuid, instance) {
        const filePath = path.join(this.directory, entityUuid, instance.uuid);
        fs.writeFileSync(filePath, JSON.stringify(instance, undefined, 2));
        return Promise.resolve(undefined);
    }
    async deleteInstances(parentUuid, instances) {
        console.log(this.logHeader, 'deleteInstances', parentUuid, instances);
        for (const o of instances) {
            await this.deleteInstance(parentUuid, { uuid: o.uuid });
        }
        return Promise.resolve();
    }
    deleteInstance(entityUuid, instance) {
        const filePath = path.join(this.directory, entityUuid, instance.uuid);
        fs.rmSync(filePath);
        return Promise.resolve();
    }
}

class FileSystemModelStore {
    constructor(applicationName, dataStoreType, directory, dataStore) {
        this.applicationName = applicationName;
        this.dataStoreType = dataStoreType;
        this.directory = directory;
        this.dataStore = dataStore;
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FileSystemEntityDataStore constructor');
        this.targetPath = path.parse(directory);
        const files = fs.readdirSync(this.directory);
        console.log('FileSystemEntityDataStore constructor found entities', files);
        this.logHeader = 'FileSystemModelStore ' + applicationName + ' dataStoreType ' + dataStoreType;
    }
    connect() {
        console.log(this.logHeader, 'connect() does nothing.');
        return Promise.resolve();
    }
    getEntityNames() {
        throw new Error("Method not implemented.");
    }
    getEntityUuids() {
        throw new Error("Method not implemented.");
    }
    bootFromPersistedState(entities, entityDefinitions) {
        console.error(this.logHeader, 'bootFromPersistedState does nothing!');
        return Promise.resolve();
    }
    async dropModelAndData(metaModel) {
        console.log(this.logHeader, 'dropModelAndData');
        await this.dataStore.dropData();
        const files = fs.readdirSync(this.directory);
        console.log(this.logHeader, 'dropModelAndData found entities', files);
        for (const file of files) {
            fs.rmSync(path.join(this.directory, file), { recursive: true, force: true });
        }
        return Promise.resolve();
    }
    open() {
        const files = fs.readdirSync(this.directory);
        console.log(this.logHeader, 'open does nothing! existing entities', files);
        return Promise.resolve();
    }
    close() {
        const files = fs.readdirSync(this.directory);
        console.log(this.logHeader, 'close does nothing! existing entities', files);
        return Promise.resolve();
    }
    getEntities() {
        const files = fs.readdirSync(this.directory);
        return files;
    }
    existsEntity(entityUuid) {
        const files = fs.readdirSync(this.directory);
        return files.includes(entityUuid);
    }
    async createStorageSpaceForInstancesOfEntity(entity, entityDefinition) {
        const entityInstancesPath = path.join(this.directory, entity.uuid);
        if (!fs.existsSync(entityInstancesPath)) {
            fs.mkdirSync(entityInstancesPath);
        }
        else {
            console.log(this.logHeader, 'createStorageSpaceForInstancesOfEntity storage space already exists for', entity.uuid);
            fs.rmSync(entityInstancesPath, { recursive: true, force: true });
            fs.mkdirSync(entityInstancesPath);
        }
        return Promise.resolve();
    }
    async createEntity(entity, entityDefinition) {
        if (entity.uuid != entityDefinition.entityUuid) {
            console.error(this.logHeader, "createEntity", "inconsistent input: given entityDefinition is not related to given entity.");
        }
        else {
            if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
                console.warn(this.logHeader, 'createEntity', entity.name, 'already existing entity', entity.uuid, 'existing entities', this.dataStore.getEntityUuids());
            }
            else {
                await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
                await this.upsertInstance(entityEntity.uuid, entity);
                await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
            }
        }
        const entities = fs.readdirSync(this.directory);
        if (!entities.includes(entity.uuid)) {
            fs.mkdirSync(path.join(this.directory, entity.uuid));
        }
        fs.writeFileSync(path.join(this.directory, entityEntity.uuid, entity.uuid), JSON.stringify(entity));
        fs.writeFileSync(path.join(this.directory, entityEntityDefinition.uuid, entityDefinition.uuid), JSON.stringify(entityDefinition));
        return Promise.resolve();
    }
    async dropEntity(entityUuid) {
        if (this.dataStore.getEntityUuids().includes(entityUuid)) {
            await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
        }
        else {
            console.warn(this.logHeader, 'dropEntity entity not found:', entityUuid);
        }
        if (this.getEntities().includes(entityEntityDefinition.uuid)) {
            await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid });
        }
        else {
            console.warn(this.logHeader, 'dropEntity sublevel for entityEntity does not exist', entityEntity.uuid, 'existing entities', this.getEntities());
        }
        if (this.getEntities().includes(entityEntityDefinition.uuid)) {
            await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid });
            const entityDefinitions = (await this.dataStore.getInstances(entityEntityDefinition.uuid)).filter(i => i.entityUuid == entityUuid);
            for (const entityDefinition of entityDefinitions) {
                await this.dataStore.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
            }
        }
        else {
            console.warn('StoreController dropEntity entity entityEntityDefinition does not exist', entityEntityDefinition.uuid, 'existing entities', this.getEntities());
        }
        return Promise.resolve();
    }
    async dropEntities(entityUuids) {
        entityUuids.forEach(async (e) => await this.dropEntity(e));
        return Promise.resolve();
    }
    async renameEntity(update) {
        console.log(this.logHeader, 'renameEntity', update);
        const cudUpdate = update.equivalentModelCUDUpdates[0];
        if (cudUpdate
            && cudUpdate.objects[0].instances[0].parentUuid
            && cudUpdate.objects[0].instances[0].parentUuid == entityEntity.uuid
            && cudUpdate.objects[0].instances[0].uuid) {
            const currentValue = await this.getInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0].uuid);
            console.log(this.logHeader, 'renameEntity', cudUpdate.objects[0].instances[0].parentUuid, currentValue);
            await this.upsertInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0]);
            const updatedValue = await this.getInstance(entityEntity.uuid, cudUpdate.objects[0].instances[0].uuid);
            console.log(this.logHeader, 'renameEntity done', cudUpdate.objects[0].instances[0].parentUuid, updatedValue);
        }
        else {
            throw new Error(this.logHeader + ' renameEntity incorrect parameter ' + cudUpdate);
        }
        return Promise.resolve();
    }
    getInstance(entityUuid, uuid) {
        const entityInstancePath = path.join(this.directory, entityUuid, uuid);
        return Promise.resolve(JSON.parse(fs.readFileSync(entityInstancePath).toString()));
    }
    async getInstances(entityUuid) {
        console.log('FileSystemEntityDataStore getInstances application', this.applicationName, 'dataStoreType', this.dataStoreType, 'entityUuid', entityUuid, 'directory', this.directory);
        const entityInstancesPath = path.join(this.directory, entityUuid);
        if (fs.existsSync(entityInstancesPath)) {
            const entityInstancesUuid = fs.readdirSync(entityInstancesPath);
            console.log('FileSystemEntityDataStore getInstances application', this.applicationName, 'dataStoreType', this.dataStoreType, 'entityUuid', entityUuid, 'directory', this.directory, 'found entity instances', entityInstancesUuid);
            const entityInstances = { parentUuid: entityUuid, instances: entityInstancesUuid.map(e => JSON.parse(fs.readFileSync(path.join(entityInstancesPath, e)).toString())) };
            console.log('FileSystemEntityDataStore getInstances application', this.applicationName, 'dataStoreType', this.dataStoreType, 'entityUuid', entityUuid, 'directory', this.directory, 'found entity instances', entityInstances);
            return Promise.resolve(entityInstances.instances);
        }
        else {
            console.warn('FileSystemEntityDataStore getInstances application', this.applicationName, 'dataStoreType', this.dataStoreType, 'entityUuid', entityUuid, 'could not find path', entityInstancesPath);
            return Promise.resolve([]);
        }
    }
    getState() {
        return Promise.resolve({});
    }
    upsertInstance(entityUuid, instance) {
        const filePath = path.join(this.directory, entityUuid, instance.uuid);
        fs.writeFileSync(filePath, JSON.stringify(instance, undefined, 2));
        return Promise.resolve(undefined);
    }
    async deleteInstances(parentUuid, instances) {
        console.log(this.logHeader, 'deleteInstances', parentUuid, instances);
        for (const o of instances) {
            await this.deleteInstance(parentUuid, { uuid: o.uuid });
        }
        return Promise.resolve();
    }
    deleteInstance(entityUuid, instance) {
        const filePath = path.join(this.directory, entityUuid, instance.uuid);
        fs.rmSync(filePath);
        return Promise.resolve();
    }
    applyModelEntityUpdate(update) {
        return Promise.resolve(undefined);
    }
}

function miroirStoreFileSystemStartup() {
    ConfigurationService.registerStoreFactory("filesystem", "model", async (appName, dataStoreApplicationType, section, config, dataStore) => {
        console.log('called registerStoreFactory function for filesystem, model');
        return Promise.resolve(config.emulatedServerType == "filesystem" && dataStore
            ? new FileSystemModelStore(appName, dataStoreApplicationType, config.directory, dataStore)
            : new ErrorModelStore());
    });
    ConfigurationService.registerStoreFactory("filesystem", "data", async (appName, dataStoreApplicationType, section, config, dataStore) => Promise.resolve(config.emulatedServerType == "filesystem"
        ? new FileSystemDataStore(appName, dataStoreApplicationType, config.directory)
        : new ErrorDataStore()));
}

export { FileSystemDataStore, FileSystemModelStore, miroirStoreFileSystemStartup };
