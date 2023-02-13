import * as level from 'level';
import { Level } from 'level';

declare class IndexedDb {
    private databaseName;
    private db;
    private subLevels;
    constructor(database: string);
    closeObjectStore(): Promise<any>;
    openObjectStore(): Promise<void>;
    createObjectStore(tableNames: string[]): Promise<Level>;
    getValue(tableName: string, id: string): Promise<any>;
    getAllValue(tableName: string): Promise<any>;
    putValue(tableName: string, value: any): Promise<void>;
    deleteValue(tableName: string, id: string): Promise<any>;
}

declare class IndexedDbObjectStore {
    private rootApiUrl;
    localIndexedStorage: IndexedDb;
    constructor(rootApiUrl: string);
    createObjectStore(tableNames: string[]): Promise<level.Level<string, string>>;
    closeObjectStore(): Promise<any>;
    openObjectStore(): Promise<void>;
    handlers: any[];
}

export { IndexedDb, IndexedDbObjectStore };
