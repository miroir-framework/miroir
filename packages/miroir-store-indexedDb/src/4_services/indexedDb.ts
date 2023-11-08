import { Level } from 'level';
import { entityDefinitionEntityDefinition } from 'miroir-core';

export class IndexedDb {
  public db: Level | undefined = undefined;
  private subLevels: Map<string, Level> = new Map();
  private logHeader: string;

  // #############################################################################################
  constructor(private databaseName: string) {
    this.logHeader = 'IndexedDb ' + databaseName;
  }

  // #############################################################################################
  public async closeObjectStore():Promise<void> {
    if (this.db?.status =='open' ) {
      console.log(this.logHeader,'closeObjectStore closing db...', this.db?.status);
      await this.db?.close();
    } else {
      console.log(this.logHeader, 'closeObjectStore db already closed...', this.db?.status);
    }
    // console.log('IndexedDb closeObjectStore db closed!');
    this.db = undefined;
    this.subLevels?.clear();
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  public async openObjectStore():Promise<void> {
    console.log(this.logHeader, 'openObjectStore');
    if(this.db !== undefined) {
      await this.db?.open();
    } else {
      this.db = new Level<string, any>(this.databaseName, {valueEncoding: 'json'})
    }
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  public async clearObjectStore():Promise<void> {
    console.log(this.logHeader, 'clearObjectStore, does nothing! (missing API to list all existing sublevels)');
    // return this.db?.clear();
    return Promise.resolve(undefined);
  }

  // #############################################################################
  public async createObjectStore(tableNames: string[]):Promise<void> {
    try {
      if(this.db !== undefined) {
        await this.db.open();
        console.log(this.logHeader, 'createObjectStore opened db')
        this.subLevels = this.createSubLevels(this.db,tableNames);
        return Promise.resolve(undefined);
      } else {
        this.db = new Level<string, any>(this.databaseName, {valueEncoding: 'json'})
        this.subLevels = this.createSubLevels(this.db,tableNames);
        console.log(this.logHeader, 'createObjectStore created db with sublevels',tableNames,this.subLevels)
        console.log(this.logHeader, 'createObjectStore db',this.db)
        console.log(this.logHeader, 'createObjectStore hasSublevel',entityDefinitionEntityDefinition.uuid, this.hasSubLevel(entityDefinitionEntityDefinition.uuid))
        return Promise.resolve(undefined);
      }
    } catch (error) {
      console.error('could not create Level DB', this.databaseName)
      return Promise.resolve(undefined);
    }
  }

  // #############################################################################
  public addSubLevels(tableNames:string[]) {
    console.log(this.logHeader, 'addSubLevels:',tableNames,'existing sublevels',this.getSubLevels());
    // console.log('indexedDb addSubLevels db:',this.db);
    this.subLevels = new Map<string, any>([
      ...this.subLevels.entries(),
      ...tableNames.filter(n=>!this.subLevels.has(n)).map(
        (tableName: string) => {
          const result: [string, any] = [
            tableName,
            <any>this.db?.sublevel(tableName),
          ];
          console.log(this.logHeader, 'adding sublevel:',tableName);
          result[1]?.clear();
          console.log(this.logHeader, 'addSubLevels added and cleared sublevel:',result[0]);
          
          return result;
        }
      ),
    ]);
  }

  // #############################################################################
  private createSubLevels(db: Level, tableNames:string[]) {
    console.log(this.logHeader, 'createSublevels',db,tableNames)
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
  public async removeSubLevels(tableNames:string[]):Promise<void> {
    this.subLevels = new Map<string, any>([
      ...Array.from(this.subLevels.entries()).filter(s=>!tableNames.includes(s[0]))
    ]);
    for (const tableName of tableNames) {
      await this.db?.sublevel(tableName).clear()
    }
    return Promise.resolve();
  }

  // #############################################################################################
  public async getValue(parentUuid: string, instanceUuid: string): Promise<any> {
    const table = this.subLevels.get(parentUuid)
    console.log(this.logHeader, 'getValue for entity',parentUuid,'instance uuid',instanceUuid,table);
    let result = {};
    if (table) {
      result = await table.get(instanceUuid, {valueEncoding: 'json'});
    } else {
      console.error(this.logHeader, 'getValue table for parentUuid not found:',parentUuid);
    }
    // console.log('IndexedDb getValue ', tableName, result);
    return Promise.resolve(result);
  }

  // #############################################################################################
  public async getAllValue(parentUuid: string):Promise<any[]> {
    const store = this.subLevels.get(parentUuid);
    const result =  store?(await store.values({valueEncoding: 'json'}).all()):[];
    console.log(this.logHeader, 'getAllValue', parentUuid, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  public async putValue(parentUuid: string, value: any):Promise<any> {
    const store = this.subLevels.get(parentUuid);
    // console.log('IndexedDb in store',store,'hasSubLevel(',parentUuid,')', this.hasSubLevel(parentUuid),'PutValue of entity', parentUuid, 'value',value);
    const result1 = store?await store.put(value.uuid, value, {valueEncoding: 'json'}):[];
    // console.log('IndexedDb PutValue written', tableName,);
    return Promise.resolve(result1);
  }

  // #############################################################################################
  public async putBulkValue(tableName: string, values: any[]):Promise<any> {
    // const tx = this.db.transaction(tableName, 'readwrite');
    const store = this.subLevels.get(tableName);
    for (const value of values) {
      const result = await store?.put(value.uuid,value, {valueEncoding: 'json'});
      console.log(this.logHeader, 'PutBulkValue ', JSON.stringify(result));
    }
    return this.getAllValue(tableName); // TODO: do not return the full table!
  }

  // #############################################################################################
  public async deleteValue(tableUuid: string, uuid: string):Promise<any> {
    // const tx = this.db.transaction(tableName, 'readwrite');
    console.log(this.logHeader, 'deleteValue called for entity', tableUuid, "instance", uuid);
    if (this.getSubLevels().includes(tableUuid)) {
      const store = this.subLevels.get(tableUuid);
      try {
        const instance = await store?.get(uuid);
        if (!instance) {
          console.warn(this.logHeader, 'deleteValue Id not found', uuid);
          return Promise.resolve(undefined);
        } else {
          await store?.del(uuid);
          console.log(this.logHeader, 'DeleteValue done for entity', tableUuid, "instance with uuid", uuid);
          return Promise.resolve(uuid);
        }
      } catch (error) {
        console.error(this.logHeader, "deleteValue could not find instance of entity: " + tableUuid + " with uuid: ", uuid);
      }
    } else {
      console.error(this.logHeader, "deleteValue could not find sublevel: " + tableUuid + " existing sublevels: ", this.getSubLevels());
      
    }
  }
}

export default {};