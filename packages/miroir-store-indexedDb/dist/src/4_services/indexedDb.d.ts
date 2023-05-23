import { Level } from 'level';
export declare class IndexedDb {
    private databaseName;
    db: Level | undefined;
    private subLevels;
    private logHeader;
    constructor(databaseName: string);
    closeObjectStore(): Promise<void>;
    openObjectStore(): Promise<void>;
    clearObjectStore(): Promise<void>;
    createObjectStore(tableNames: string[]): Promise<void>;
    addSubLevels(tableNames: string[]): void;
    private createSubLevels;
    hasSubLevel(tableName: string): boolean;
    getSubLevels(): string[];
    removeSubLevels(tableNames: string[]): Promise<void>;
    getValue(parentUuid: string, instanceUuid: string): Promise<any>;
    getAllValue(parentUuid: string): Promise<any[]>;
    putValue(parentUuid: string, value: any): Promise<any>;
    putBulkValue(tableName: string, values: any[]): Promise<any>;
    deleteValue(tableUuid: string, uuid: string): Promise<any>;
}
declare const _default: {};
export default _default;
