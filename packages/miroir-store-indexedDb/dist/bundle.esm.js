import { entityEntity, entityEntityDefinition, entityDefinitionEntityDefinition } from 'miroir-core';
import { Level } from 'level';

class IndexedDbDataStore {
    constructor(applicationName, dataStoreType, localUuidIndexedDb) {
        this.applicationName = applicationName;
        this.dataStoreType = dataStoreType;
        this.localUuidIndexedDb = localUuidIndexedDb;
        this.logHeader =
            "IndexedDbDataStore" + " Application " + this.applicationName + " dataStoreType " + this.dataStoreType;
    }
    async connect() {
        console.log(this.logHeader, "connect(): opening");
        await this.localUuidIndexedDb.openObjectStore();
        console.log(this.logHeader, "connect(): opened");
        return Promise.resolve();
    }
    async close() {
        console.log(this.logHeader, "close(): closing");
        await this.localUuidIndexedDb.closeObjectStore();
        console.log(this.logHeader, "close(): closed");
        return Promise.resolve();
    }
    async bootFromPersistedState(entities, entityDefinitions) {
        console.log(this.logHeader, "bootFromPersistedState does nothing!");
        return Promise.resolve();
    }
    async createStorageSpaceForInstancesOfEntity(entity, entityDefinition) {
        var _a;
        console.log(this.logHeader, "createStorageSpaceForInstancesOfEntity", "input: entity", entity, "entityDefinition", entityDefinition, "Entities", this.localUuidIndexedDb.getSubLevels());
        if (entity.uuid != entityDefinition.entityUuid) {
            console.error(this.logHeader, "createStorageSpaceForInstancesOfEntity", "Application", this.applicationName, "dataStoreType", this.dataStoreType, "inconsistent input: given entityDefinition is not related to given entity.");
        }
        else {
            if (!this.localUuidIndexedDb.hasSubLevel(entity.uuid)) {
                this.localUuidIndexedDb.addSubLevels([entity.uuid]);
            }
            else {
                (_a = this.localUuidIndexedDb.db) === null || _a === void 0 ? void 0 : _a.sublevel(entity.uuid).clear();
                console.log(this.logHeader, "createStorageSpaceForInstancesOfEntity", "input: entity", entity, "entityDefinition", entityDefinition, "already has entity. Existing entities:", this.localUuidIndexedDb.getSubLevels());
            }
        }
        return Promise.resolve();
    }
    async dropStorageSpaceForInstancesOfEntity(entityUuid) {
        if (!this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
            await this.localUuidIndexedDb.removeSubLevels([entityUuid]);
        }
        else {
            console.log(this.logHeader, "createStorageSpaceForInstancesOfEntity", "input: entity", entityUuid, "not found. Existing entities:", this.localUuidIndexedDb.getSubLevels());
        }
        return Promise.resolve();
    }
    renameStorageSpaceForInstancesOfEntity(oldName, newName, entity, entityDefinition) {
        console.warn(this.logHeader, "renameStorageSpaceForInstancesOfEntity does nothing for entity", oldName, ", since Entities are indexed by Uuid! Existing entities:", this.localUuidIndexedDb.getSubLevels());
        return Promise.resolve();
    }
    getEntityNames() {
        throw new Error("Method not implemented.");
    }
    getEntityUuids() {
        return this.localUuidIndexedDb.getSubLevels();
    }
    async getState() {
        let result = {};
        console.log(this.logHeader, "getState this.getEntities()", this.getEntityUuids());
        for (const parentUuid of this.getEntityUuids()) {
            console.log(this.logHeader, "getState getting instances for", parentUuid);
            const instances = await this.getInstances(parentUuid);
            console.log(this.logHeader, "getState found instances", parentUuid, instances);
            Object.assign(result, { [parentUuid]: instances });
        }
        return Promise.resolve(result);
    }
    async getInstance(parentUuid, uuid) {
        const result = await this.localUuidIndexedDb.getValue(parentUuid, uuid);
        return Promise.resolve(result);
    }
    async getInstances(parentUuid) {
        const result = await this.localUuidIndexedDb.getAllValue(parentUuid);
        return Promise.resolve(result);
    }
    async upsertInstance(parentUuid, instance) {
        console.log(this.logHeader, "upsertInstance", instance.parentUuid, instance);
        if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
            await this.localUuidIndexedDb.putValue(parentUuid, instance);
        }
        else {
            console.error(this.logHeader, "upsertInstance", instance.parentUuid, "does not exists.");
        }
        return Promise.resolve();
    }
    async deleteInstances(parentUuid, instances) {
        console.log(this.logHeader, "deleteInstances", parentUuid, instances);
        for (const o of instances) {
            await this.deleteInstance(parentUuid, { uuid: o.uuid });
        }
        return Promise.resolve();
    }
    async deleteInstance(parentUuid, instance) {
        console.log(this.logHeader, "deleteDataInstance", parentUuid, instance);
        await this.localUuidIndexedDb.deleteValue(parentUuid, instance.uuid);
        return Promise.resolve();
    }
    async dropData() {
        await this.localUuidIndexedDb.removeSubLevels(this.getEntityUuids());
        return Promise.resolve();
    }
}

class IndexedDbModelStore {
    constructor(applicationName, dataStoreType, localUuidIndexedDb, dataStore) {
        this.applicationName = applicationName;
        this.dataStoreType = dataStoreType;
        this.localUuidIndexedDb = localUuidIndexedDb;
        this.dataStore = dataStore;
        this.logHeader = "IndexedDbModelStore" + " Application " + this.applicationName + " dataStoreType " + this.dataStoreType;
    }
    async close() {
        console.log(this.logHeader, 'close(): closing');
        await this.localUuidIndexedDb.closeObjectStore();
        console.log(this.logHeader, 'close(): closed');
        return Promise.resolve();
    }
    async connect() {
        console.log(this.logHeader, 'connect(): opening');
        await this.localUuidIndexedDb.openObjectStore();
        console.log(this.logHeader, 'connect(): opened');
        return Promise.resolve();
    }
    bootFromPersistedState(entities, entityDefinitions) {
        console.error(this.logHeader, 'bootFromPersistedState does nothing!');
        return Promise.resolve();
    }
    getEntities() {
        return this.localUuidIndexedDb.getSubLevels();
    }
    existsEntity(entityUuid) {
        return this.localUuidIndexedDb.hasSubLevel(entityUuid);
    }
    async createStorageSpaceForInstancesOfEntity(entity, entityDefinition) {
        var _a;
        if (entity.uuid != entityDefinition.entityUuid) {
            console.error(this.logHeader, 'createStorageSpaceForInstancesOfEntity', 'Application', this.applicationName, 'dataStoreType', this.dataStoreType, 'inconsistent input: given entityDefinition is not related to given entity.');
        }
        else {
            if (!this.localUuidIndexedDb.hasSubLevel(entity.uuid)) {
                this.localUuidIndexedDb.addSubLevels([entity.uuid]);
                console.log(this.logHeader, 'createStorageSpaceForInstancesOfEntity added entity in Model section:', entity.name, entity.uuid, ', existing Entities', this.localUuidIndexedDb.getSubLevels());
            }
            else {
                (_a = this.localUuidIndexedDb.db) === null || _a === void 0 ? void 0 : _a.sublevel(entity.uuid).clear();
                console.log(this.logHeader, 'createStorageSpaceForInstancesOfEntity', 'input: entity', entity, 'entityDefinition', entityDefinition, 'already has entity. Existing entities:', this.localUuidIndexedDb.getSubLevels());
            }
        }
        return Promise.resolve();
    }
    async createEntity(entity, entityDefinition) {
        if (entity.uuid != entityDefinition.entityUuid) {
            console.error(this.logHeader, "createEntity", "inconsistent input: given entityDefinition is not related to given entity.");
        }
        else {
            if (this.dataStore.getEntityUuids().includes(entity.uuid)) {
                console.warn(this.logHeader, 'createEntity', entity.name, 'already existing sublevel', entity.uuid, this.localUuidIndexedDb.hasSubLevel(entity.uuid));
            }
            else {
                await this.dataStore.createStorageSpaceForInstancesOfEntity(entity, entityDefinition);
                await this.upsertInstance(entityEntity.uuid, entity);
                if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
                    await this.upsertInstance(entityEntityDefinition.uuid, entityDefinition);
                }
                else {
                    console.warn(this.logHeader, 'createEntity', entity.name, 'sublevel for entityEntityDefinition does not exist', entityEntityDefinition.uuid, this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid));
                }
            }
        }
    }
    async renameEntity(update) {
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
    async dropEntity(entityUuid) {
        if (this.dataStore.getEntityUuids().includes(entityUuid)) {
            await this.dataStore.dropStorageSpaceForInstancesOfEntity(entityUuid);
        }
        else {
            console.warn(this.logHeader, 'dropEntity entity not found:', entityUuid);
        }
        if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
            await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid });
        }
        else {
            console.warn(this.logHeader, 'dropEntity sublevel for entityEntity does not exist', entityEntity.uuid, this.localUuidIndexedDb.hasSubLevel(entityEntity.uuid));
        }
        if (this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid)) {
            await this.deleteInstance(entityEntity.uuid, { uuid: entityUuid });
            const entityDefinitions = (await this.dataStore.getInstances(entityEntityDefinition.uuid)).filter(i => i.entityUuid == entityUuid);
            for (const entityDefinition of entityDefinitions) {
                await this.dataStore.deleteInstance(entityEntityDefinition.uuid, entityDefinition);
            }
        }
        else {
            console.warn('StoreController dropEntity sublevel for entityEntityDefinition does not exist', entityEntityDefinition.uuid, this.localUuidIndexedDb.hasSubLevel(entityEntityDefinition.uuid));
        }
        return Promise.resolve();
    }
    async dropEntities(entityUuids) {
        for (const entityUuid of entityUuids) {
            await this.dropEntity(entityUuid);
        }
        return Promise.resolve();
    }
    async dropModelAndData(metaModel) {
        await this.dataStore.dropData();
        await this.localUuidIndexedDb.removeSubLevels(this.getEntities());
        console.log(this.logHeader, "dropModelAndData DONE", this.getEntities());
        return Promise.resolve();
    }
    async getInstance(parentUuid, uuid) {
        const result = await this.localUuidIndexedDb.getValue(parentUuid, uuid);
        return Promise.resolve(result);
    }
    async getInstances(parentUuid) {
        let result;
        if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
            result = await this.localUuidIndexedDb.getAllValue(parentUuid);
        }
        else {
            console.error(this.logHeader, 'getModelInstances entity', parentUuid, 'does not exist.');
        }
        return Promise.resolve(result);
    }
    async upsertInstance(parentUuid, instance) {
        console.log(this.logHeader, 'upsertInstance', instance.parentUuid, instance);
        if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
            await this.localUuidIndexedDb.putValue(parentUuid, instance);
        }
        else {
            console.error(this.logHeader, 'upsertInstance', instance.parentUuid, 'does not exist.');
        }
        return Promise.resolve(instance);
    }
    async deleteInstances(parentUuid, instances) {
        console.log(this.logHeader, 'deleteInstances', parentUuid, instances);
        for (const o of instances) {
            await this.localUuidIndexedDb.deleteValue(parentUuid, o.uuid);
        }
        return Promise.resolve();
    }
    async deleteInstance(parentUuid, instance) {
        console.log(this.logHeader, 'deleteInstance', parentUuid, instance);
        await this.localUuidIndexedDb.deleteValue(parentUuid, instance.uuid);
        return Promise.resolve();
    }
}

class IndexedDb {
    constructor(databaseName) {
        this.databaseName = databaseName;
        this.db = undefined;
        this.subLevels = new Map();
        this.logHeader = 'IndexedDb ' + databaseName;
    }
    async closeObjectStore() {
        var _a, _b, _c, _d, _e;
        if (((_a = this.db) === null || _a === void 0 ? void 0 : _a.status) == 'open') {
            console.log(this.logHeader, 'closeObjectStore closing db...', (_b = this.db) === null || _b === void 0 ? void 0 : _b.status);
            await ((_c = this.db) === null || _c === void 0 ? void 0 : _c.close());
        }
        else {
            console.log(this.logHeader, 'closeObjectStore db already closed...', (_d = this.db) === null || _d === void 0 ? void 0 : _d.status);
        }
        this.db = undefined;
        (_e = this.subLevels) === null || _e === void 0 ? void 0 : _e.clear();
        return Promise.resolve(undefined);
    }
    async openObjectStore() {
        var _a;
        console.log(this.logHeader, 'openObjectStore');
        if (this.db !== undefined) {
            await ((_a = this.db) === null || _a === void 0 ? void 0 : _a.open());
        }
        else {
            this.db = new Level(this.databaseName, { valueEncoding: 'json' });
        }
        return Promise.resolve(undefined);
    }
    async clearObjectStore() {
        console.log(this.logHeader, 'clearObjectStore, does nothing! (missing API to list all existing sublevels)');
        return Promise.resolve(undefined);
    }
    async createObjectStore(tableNames) {
        try {
            if (this.db !== undefined) {
                await this.db.open();
                console.log(this.logHeader, 'createObjectStore opened db');
                this.subLevels = this.createSubLevels(this.db, tableNames);
                return Promise.resolve(undefined);
            }
            else {
                this.db = new Level(this.databaseName, { valueEncoding: 'json' });
                this.subLevels = this.createSubLevels(this.db, tableNames);
                console.log(this.logHeader, 'createObjectStore created db with sublevels', tableNames, this.subLevels);
                console.log(this.logHeader, 'createObjectStore db', this.db);
                console.log(this.logHeader, 'createObjectStore hasSublevel', entityDefinitionEntityDefinition.uuid, this.hasSubLevel(entityDefinitionEntityDefinition.uuid));
                return Promise.resolve(undefined);
            }
        }
        catch (error) {
            console.error('could not create Level DB', this.databaseName);
            return Promise.resolve(undefined);
        }
    }
    addSubLevels(tableNames) {
        console.log(this.logHeader, 'addSubLevels:', tableNames, 'existing sublevels', this.getSubLevels());
        this.subLevels = new Map([
            ...this.subLevels.entries(),
            ...tableNames.filter(n => !this.subLevels.has(n)).map((tableName) => {
                var _a;
                const result = [
                    tableName,
                    (_a = this.db) === null || _a === void 0 ? void 0 : _a.sublevel(tableName),
                ];
                console.log(this.logHeader, 'adding sublevel:', tableName);
                result[1].clear();
                console.log(this.logHeader, 'addSubLevels added and cleared sublevel:', result[0]);
                return result;
            }),
        ]);
    }
    createSubLevels(db, tableNames) {
        console.log(this.logHeader, 'createSublevels', db, tableNames);
        return new Map([
            ...tableNames.map((tableName) => {
                const result = [
                    tableName,
                    db.sublevel(tableName),
                ];
                result[1].clear();
                console.log('indexedDb createSubLevels added and cleared sublevel:', result[0]);
                return result;
            }),
        ]);
    }
    hasSubLevel(tableName) {
        return this.subLevels.has(tableName);
    }
    getSubLevels() {
        return Array.from(this.subLevels.keys());
    }
    async removeSubLevels(tableNames) {
        var _a;
        this.subLevels = new Map([
            ...Array.from(this.subLevels.entries()).filter(s => !tableNames.includes(s[0]))
        ]);
        for (const tableName of tableNames) {
            await ((_a = this.db) === null || _a === void 0 ? void 0 : _a.sublevel(tableName).clear());
        }
        return Promise.resolve();
    }
    async getValue(parentUuid, instanceUuid) {
        const table = this.subLevels.get(parentUuid);
        console.log(this.logHeader, 'getValue for entity', parentUuid, 'instance uuid', instanceUuid, table);
        let result = {};
        if (table) {
            result = await table.get(instanceUuid, { valueEncoding: 'json' });
        }
        else {
            console.error(this.logHeader, 'getValue table for parentUuid not found:', parentUuid);
        }
        return Promise.resolve(result);
    }
    async getAllValue(parentUuid) {
        console.log(this.logHeader, 'getAllValue', parentUuid);
        const store = this.subLevels.get(parentUuid);
        const result = store ? (await store.values({ valueEncoding: 'json' }).all()) : [];
        return Promise.resolve(result);
    }
    async putValue(parentUuid, value) {
        const store = this.subLevels.get(parentUuid);
        const result1 = store ? await store.put(value.uuid, value, { valueEncoding: 'json' }) : [];
        return Promise.resolve(result1);
    }
    async putBulkValue(tableName, values) {
        const store = this.subLevels.get(tableName);
        for (const value of values) {
            const result = await (store === null || store === void 0 ? void 0 : store.put(value.uuid, value, { valueEncoding: 'json' }));
            console.log(this.logHeader, 'PutBulkValue ', JSON.stringify(result));
        }
        return this.getAllValue(tableName);
    }
    async deleteValue(tableUuid, uuid) {
        const store = this.subLevels.get(tableUuid);
        const result = await (store === null || store === void 0 ? void 0 : store.get(uuid));
        if (!result) {
            console.warn(this.logHeader, 'deleteValue Id not found', uuid);
            return Promise.resolve(result);
        }
        await (store === null || store === void 0 ? void 0 : store.del(uuid));
        console.log(this.logHeader, 'DeleteValue', uuid);
        return Promise.resolve(uuid);
    }
}

export { IndexedDb, IndexedDbDataStore, IndexedDbModelStore };
