import { Level } from 'level';
import entityDefinitionEntityDefinition from "../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";

export class IndexedDb {
  public db: Level | undefined = undefined;
  private subLevels: Map<string, Level> = new Map();

  // #############################################################################################
  constructor(private databaseName: string) {
  }

  // #############################################################################################
  public async closeObjectStore():Promise<void> {
    if (this.db?.status =='open' ) {
      console.log('IndexedDb closeObjectStore closing db...', this.db?.status);
      await this.db?.close();
    } else {
      console.log('IndexedDb closeObjectStore db already closed...', this.db?.status);
    }
    // console.log('IndexedDb closeObjectStore db closed!');
    this.db = undefined;
    this.subLevels?.clear();
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  public async openObjectStore():Promise<void> {
    console.log('IndexedDb openObjectStore');
    if(this.db !== undefined) {
      await this.db?.open();
    } else {
      this.db = new Level<string, any>(this.databaseName, {valueEncoding: 'json'})
    }
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  public async clearObjectStore():Promise<void> {
    console.log('IndexedDb clearObjectStore, does nothing! (missing API to list all existing sublevels)');
    // return this.db?.clear();
  }

  // #############################################################################
  public async createObjectStore(tableNames: string[]):Promise<void> {
    try {
      if(this.db !== undefined) {
        await this.db.open();
        console.log('indexedDb createObjectStore opened db')
        this.subLevels = this.createSubLevels(this.db,tableNames);
        return Promise.resolve(undefined);
      } else {
        this.db = new Level<string, any>(this.databaseName, {valueEncoding: 'json'})
        this.subLevels = this.createSubLevels(this.db,tableNames);
        console.log('indexedDb createObjectStore created db with sublevels',tableNames,this.subLevels)
        console.log('indexedDb createObjectStore db',this.db)
        console.log('indexedDb createObjectStore hasSublevel',entityDefinitionEntityDefinition.uuid, this.hasSubLevel(entityDefinitionEntityDefinition.uuid))
        return Promise.resolve(undefined);
      }
    } catch (error) {
      console.error('could not create Level DB', this.databaseName)
      return Promise.resolve(undefined);
    }
  }

  // #############################################################################
  public addSubLevels(tableNames:string[]) {
    console.log('indexedDb addSubLevels:',tableNames,'existing sublevels',this.getSubLevels());
    // console.log('indexedDb addSubLevels db:',this.db);
    this.subLevels = new Map<string, any>([
      ...this.subLevels.entries(),
      ...tableNames.filter(n=>!this.subLevels.has(n)).map(
        (tableName: string) => {
          const result: [string, any] = [
            tableName,
            <any>this.db?.sublevel(tableName),
          ];
          console.log('indexedDb adding sublevel:',tableName,'result',result);
          result[1].clear();
          console.log('indexedDb addSubLevels added and cleared sublevel:',result[0]);
          
          return result;
        }
      ),
    ]);
  }

  // #############################################################################
  private createSubLevels(db: Level, tableNames:string[]) {
    console.log('indexedDb createSublevels',db,tableNames)
    return new Map<string, any>([
      ...tableNames.map(
          (tableName: string) => {
          const result: [string, any] = [
            tableName,
            <any>db.sublevel(tableName),
          ];
          result[1].clear();
          console.log('indexedDb createSubLevels added and cleared sublevel:',result[0]);
          return result;
        }
      ),
    ]);
  }

  // #############################################################################
  public hasSubLevel(tableName:string):boolean {
    return this.subLevels.has(tableName);
  }

  // #############################################################################
  public getSubLevels():string[] {
    return Array.from(this.subLevels.keys());
  }

  // #############################################################################
  public removeSubLevels(tableNames:string[]) {
    this.subLevels = new Map<string, any>([
      ...Array.from(this.subLevels.entries()).filter(s=>!tableNames.includes(s[0]))
    ]);
    for (const tableName of tableNames) {
      this.db?.sublevel(tableName).clear()
    }
    
  }

  // #############################################################################################
  public async getValue(parentUuid: string, instanceUuid: string): Promise<any> {
    const table = this.subLevels.get(parentUuid)
    console.log('IndexedDb getValue for entity',parentUuid,'instance uuid',instanceUuid,table);
    let result = {};
    if (table) {
      result = await table.get(instanceUuid, {valueEncoding: 'json'});
    } else {
      console.error('IndexedDb getValue table for parentUuid not found:',parentUuid);
    }
    // console.log('IndexedDb getValue ', tableName, result);
    return Promise.resolve(result);
  }

  // #############################################################################################
  public async getAllValue(parentUuid: string):Promise<any[]> {
    console.log('IndexedDb getAllValue', parentUuid);
    const store = this.subLevels.get(parentUuid);
    const result = store?store.values({valueEncoding: 'json'}).all():[];
    return Promise.resolve(result);
  }

  // #############################################################################################
  public async putValue(parentUuid: string, value: any) {
    const store = this.subLevels.get(parentUuid);
    // console.log('IndexedDb in store',store,'hasSubLevel(',parentUuid,')', this.hasSubLevel(parentUuid),'PutValue of entity', parentUuid, 'value',value);
    const result1 = store?await store.put(value.uuid, value, {valueEncoding: 'json'}):[];
    // console.log('IndexedDb PutValue written', tableName,);
    return Promise.resolve(result1);
  }

  // #############################################################################################
  public async putBulkValue(tableName: string, values: any[]) {
    // const tx = this.db.transaction(tableName, 'readwrite');
    const store = this.subLevels.get(tableName);
    for (const value of values) {
      const result = await store?.put(value.uuid,value, {valueEncoding: 'json'});
      console.log('IndexedDb PutBulkValue ', JSON.stringify(result));
    }
    return this.getAllValue(tableName); // TODO: do not return the full table!
  }

  // #############################################################################################
  public async deleteValue(tableUuid: string, uuid: string):Promise<any> {
    // const tx = this.db.transaction(tableName, 'readwrite');
    const store = this.subLevels.get(tableUuid);
    const result = await store?.get(uuid);
    if (!result) {
      console.warn('IndexedDb deleteValue Id not found', uuid);
      return Promise.resolve(result);
    }
    await store?.del(uuid);
    console.log('IndexedDb DeleteValue', uuid);
    return uuid;
  }
}

export default {};