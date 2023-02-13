import { Level } from 'level';
export declare class IndexedDb {
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
declare const _default: {};
export default _default;
