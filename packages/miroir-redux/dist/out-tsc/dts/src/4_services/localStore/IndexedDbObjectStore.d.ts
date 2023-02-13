import { IndexedDb } from '../../4_services/localStore/indexedDb';
export declare class IndexedDbObjectStore {
    private rootApiUrl;
    localIndexedStorage: IndexedDb;
    constructor(rootApiUrl: string);
    createObjectStore(tableNames: string[]): Promise<import("level").Level<string, string>>;
    closeObjectStore(): Promise<any>;
    openObjectStore(): Promise<void>;
    handlers: any[];
}
