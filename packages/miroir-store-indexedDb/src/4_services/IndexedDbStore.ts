import { DataStoreApplicationType, IDataSectionStore, EntityDefinition, EntityInstance, IAbstractEntityStore, IAbstractInstanceStore, IAbstractStore, MetaEntity, WrappedTransactionalEntityUpdateWithCUDUpdate, entityEntity, entityEntityDefinition } from "miroir-core";
import { IndexedDb } from "./indexedDb.js";

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableIndexedDbStore = GConstructor<IndexedDbStore>;

// base class for IndexedDb store mixins
export class IndexedDbStore implements IAbstractStore {
  public applicationName: string;
  public dataStoreType: DataStoreApplicationType;
  public localUuidIndexedDb: IndexedDb;
  public logHeader: string;

  // ##############################################################################################
  constructor(
    // public applicationName: string;
    // public dataStoreType: DataStoreApplicationType;
    // public localUuidIndexedDb: IndexedDb;
    // public logHeader: string;
    ...args:any[] // mixin constructors are limited to args:any[] parameters
  ) {
    this.applicationName = args[0];
    this.dataStoreType = args[1];
    this.localUuidIndexedDb = args[2];
    this.logHeader = args[3];
    // console.log(this.logHeader,'IndexedDbStore constructor','this.localUuidIndexedDb',this.localUuidIndexedDb)
  }
  
  // ##################################################################################################
  async open(): Promise<void> {
    console.log(this.logHeader,'open(): opening');
    await this.localUuidIndexedDb.openObjectStore();
    console.log(this.logHeader,'open(): opened');
    return Promise.resolve();
  }

  // ##############################################################################################
  async close():Promise<void> {
    console.log(this.logHeader,'close(): closing');
    await this.localUuidIndexedDb.closeObjectStore();
    console.log(this.logHeader,'close(): closed');
      return Promise.resolve();
  }

  // ##################################################################################################
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    console.log(this.logHeader,'bootFromPersistedState does nothing!');
    return Promise.resolve();
  }
}


