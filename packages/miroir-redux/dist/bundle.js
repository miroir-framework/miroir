import { Level } from 'level';
import { rest } from 'msw';

var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class IndexedDb {
    constructor(database) {
        this.db = undefined;
        this.databaseName = database;
    }
    closeObjectStore() {
        var _a, _b;
        return __awaiter$1(this, void 0, void 0, function* () {
            yield ((_a = this.db) === null || _a === void 0 ? void 0 : _a.close());
            this.db = undefined;
            (_b = this.subLevels) === null || _b === void 0 ? void 0 : _b.clear();
            return Promise.resolve(undefined);
        });
    }
    openObjectStore() {
        var _a;
        return __awaiter$1(this, void 0, void 0, function* () {
            return (_a = this.db) === null || _a === void 0 ? void 0 : _a.open();
        });
    }
    createObjectStore(tableNames) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const createSubLevels = () => new Map([
                ...(tableNames.map((tableName) => {
                    const result = [
                        tableName,
                        this.db.sublevel(tableName)
                    ];
                    return result;
                }))
            ]);
            try {
                if (this.db !== undefined) {
                    yield this.db.open();
                    console.log('createObjectStore opened db');
                    this.subLevels = createSubLevels();
                    return Promise.resolve(undefined);
                }
                else {
                    this.db = new Level(this.databaseName, { valueEncoding: 'json' });
                    this.subLevels = createSubLevels();
                    console.log('createObjectStore created db');
                    return Promise.resolve(undefined);
                }
            }
            catch (error) {
                console.error('could not open Level DB', this.databaseName);
                return Promise.resolve(undefined);
            }
        });
    }
    getValue(tableName, id) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const table = this.subLevels.get(tableName);
            const result = yield (table === null || table === void 0 ? void 0 : table.get(id, { valueEncoding: 'json' }));
            return Promise.resolve(result);
        });
    }
    getAllValue(tableName) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const store = this.subLevels.get(tableName);
            const result = store.values({ valueEncoding: 'json' }).all();
            return Promise.resolve(result);
        });
    }
    putValue(tableName, value) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const store = this.subLevels.get(tableName);
            console.log('IndexedDb PutValue ', tableName, value);
            const result1 = yield store.put(value.uuid, value, { valueEncoding: 'json' });
            return Promise.resolve(result1);
        });
    }
    deleteValue(tableName, id) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const store = this.subLevels.get(tableName);
            const result = yield store.get(id);
            if (!result) {
                console.warn('IndexedDb deleteValue Id not found', id);
                return Promise.resolve(result);
            }
            yield store.del(id);
            console.log('IndexedDb DeleteValue', id);
            return id;
        });
    }
}

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const ARTIFICIAL_DELAY_MS = 100;
class IndexedDbObjectStore {
    constructor(rootApiUrl) {
        this.rootApiUrl = rootApiUrl;
        this.localIndexedStorage = new IndexedDb('miroir');
        this.handlers = [
            rest.get(this.rootApiUrl + '/' + 'Entity/all', (req, res, ctx) => __awaiter(this, void 0, void 0, function* () {
                console.log('Entity/all started');
                const localData = yield this.localIndexedStorage.getAllValue('Entity');
                console.log('server Entity/all', localData);
                return res(ctx.json(localData));
            })),
            rest.get(this.rootApiUrl + '/' + 'Report/all', (req, res, ctx) => __awaiter(this, void 0, void 0, function* () {
                const localData = yield this.localIndexedStorage.getAllValue('Report');
                return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(localData));
            })),
        ];
    }
    createObjectStore(tableNames) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.localIndexedStorage.createObjectStore(tableNames);
        });
    }
    closeObjectStore() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.localIndexedStorage.closeObjectStore();
        });
    }
    openObjectStore() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.localIndexedStorage.openObjectStore();
        });
    }
}

export { IndexedDb, IndexedDbObjectStore };
