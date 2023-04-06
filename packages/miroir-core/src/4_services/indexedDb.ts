import { Level } from 'level';
import entityDefinitionEntityDefinition from "../assets/entityDefinitions/EntityDefinition.json";

export class IndexedDb {
  public db: Level = undefined;
  private subLevels: Map<string, Level> = new Map();

  // #############################################################################################
  constructor(private databaseName: string) {
  }

  public getdb():any{
    return this.db;
  }
  // #############################################################################################
  public async closeObjectStore():Promise<void> {
    await this.db?.close();
    this.db = undefined;
    this.subLevels?.clear();
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  public async openObjectStore():Promise<void> {
    console.log('IndexedDb openObjectStore');
    
    return this.db?.open();
  }

  // #############################################################################################
  public async clearObjectStore():Promise<void> {
    return this.db?.clear();
  }

  // #############################################################################
  public async createObjectStore(tableNames: string[]):Promise<Level> {
    try {
      if(this.db !== undefined) {
        await this.db.open();
        console.log('createObjectStore opened db')
        this.subLevels = this.createSubLevels(this.db,tableNames);
        return Promise.resolve(undefined);
      } else {
        this.db = new Level<string, any>(this.databaseName, {valueEncoding: 'json'})
        this.subLevels = this.createSubLevels(this.db,tableNames);
        console.log('createObjectStore created db with sublevels',tableNames,this.subLevels)
        console.log('createObjectStore db',this.db)
        console.log('createObjectStore hasSublevel',entityDefinitionEntityDefinition.uuid, this.hasSubLevel(entityDefinitionEntityDefinition.uuid))
        return Promise.resolve(undefined);
      }
    } catch (error) {
      console.error('could not create Level DB', this.databaseName)
      return Promise.resolve(undefined);
    }
  }

  // #############################################################################
  private createSubLevels(db: Level, tableNames:string[]) {
    return new Map<string, any>([
      ...tableNames.map(
          (tableName: string) => {
          const result: [string, any] = [
            tableName,
            <any>db.sublevel(tableName),
          ];
          result[1].clear();
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
  }
  // #############################################################################
  public addSubLevels(tableNames:string[]) {
    console.log('indexedDb addSubLevels:',tableNames,'existing sublevels',this.getSubLevels());
    console.log('indexedDb addSubLevels db:',this.db);
    this.subLevels = new Map<string, any>([
      ...this.subLevels.entries(),
      ...tableNames.filter(n=>!this.hasSubLevel(n)).map(
          (tableName: string) => {
          const result: [string, any] = [
            tableName,
            <any>this.db.sublevel(tableName),
          ];
          result[1].clear();
          console.log('indexedDb added sublevel:',result[0]);
          
          return result;
        }
      ),
    ]);
  }

  // #############################################################################################
  public async getValue(entityDefinitionUuid: string, instanceUuid: string): Promise<any> {
    const table = this.subLevels.get(entityDefinitionUuid)
    console.log('IndexedDb getValue for entity',entityDefinitionUuid,'instance uuid',instanceUuid,table);
    let result = {};
    if (table) {
      result = await table.get(instanceUuid, {valueEncoding: 'json'});
    } else {
      console.error('IndexedDb getValue table for entityDefinitionUuid not found:',entityDefinitionUuid);
    }
    // console.log('IndexedDb getValue ', tableName, result);
    return Promise.resolve(result);
  }

  // #############################################################################################
  public async getAllValue(entityDefinitionUuid: string):Promise<any> {
    console.log('IndexedDb getAllValue', entityDefinitionUuid);
    const store = this.subLevels.get(entityDefinitionUuid);
    const result = store?store.values({valueEncoding: 'json'}).all():[];
    return Promise.resolve(result);
  }

  // #############################################################################################
  public async putValue(entityDefinitionUuid: string, value: any) {
    const store = this.subLevels.get(entityDefinitionUuid);
    // console.log('IndexedDb in store',store,'hasSubLevel(',entityDefinitionUuid,')', this.hasSubLevel(entityDefinitionUuid),'PutValue of entity', entityDefinitionUuid, 'value',value);
    const result1 = store?await store.put(value.uuid, value, {valueEncoding: 'json'}):[];
    // console.log('IndexedDb PutValue written', tableName,);
    return Promise.resolve(result1);
  }

  // #############################################################################################
  public async putBulkValue(tableName: string, values: any[]) {
    // const tx = this.db.transaction(tableName, 'readwrite');
    const store = this.subLevels.get(tableName);
    for (const value of values) {
      const result = await store.put(value.uuid,value, {valueEncoding: 'json'});
      console.log('IndexedDb PutBulkValue ', JSON.stringify(result));
    }
    return this.getAllValue(tableName); // TODO: do not return the full table!
  }

  // #############################################################################################
  public async deleteValue(tableUuid: string, uuid: string):Promise<any> {
    // const tx = this.db.transaction(tableName, 'readwrite');
    const store = this.subLevels.get(tableUuid);
    const result = await store.get(uuid);
    if (!result) {
      console.warn('IndexedDb deleteValue Id not found', uuid);
      return Promise.resolve(result);
    }
    await store.del(uuid);
    console.log('IndexedDb DeleteValue', uuid);
    return uuid;
  }
}

export default {};