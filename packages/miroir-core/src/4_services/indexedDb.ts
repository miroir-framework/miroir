import { Level } from 'level';

export class IndexedDb {
  private databaseName: string;
  private db: Level = undefined;
  private subLevels: Map<string, Level> = new Map();

  constructor(database: string) {
    this.databaseName = database;
  }

  public async closeObjectStore() {
    await this.db?.close();
    this.db = undefined;
    this.subLevels?.clear();
    return Promise.resolve(undefined);
  }

  public async openObjectStore() {
    return this.db?.open();
  }

  public async clearObjectStore() {
    return this.db?.clear();
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
    console.log('indexedDb addSubLevels:',tableNames,this.getSubLevels());
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
        console.log('createObjectStore created db')
        return Promise.resolve(undefined);
      }
    } catch (error) {
      console.error('could not open Level DB', this.databaseName)
      return Promise.resolve(undefined);
    }
  }

  public async getValue(tableName: string, id: string): Promise<any> {
    const table = this.subLevels.get(tableName)
    // console.log('IndexedDb getValue ',tableName);
    const result = await table?.get(id, {valueEncoding: 'json'});
    // console.log('IndexedDb getValue ', tableName, result);
    return Promise.resolve(result);
  }

  public async getAllValue(tableName: string):Promise<any> {
    const store = this.subLevels.get(tableName);
    const result = store.values({valueEncoding: 'json'}).all();
    // console.log('IndexedDb getAllValue', JSON.stringify(result));
    return Promise.resolve(result);
  }

  public async putValue(tableName: string, value: any) {
    const store = this.subLevels.get(tableName);
    console.log('IndexedDb PutValue ', tableName, value);
    const result1 = await store.put(value.uuid, value, {valueEncoding: 'json'});
    // console.log('IndexedDb PutValue written', tableName,);
    return Promise.resolve(result1);
  }

  public async putBulkValue(tableName: string, values: any[]) {
    // const tx = this.db.transaction(tableName, 'readwrite');
    const store = this.subLevels.get(tableName);
    for (const value of values) {
      const result = await store.put(value.uuid,value, {valueEncoding: 'json'});
      console.log('IndexedDb PutBulkValue ', JSON.stringify(result));
    }
    return this.getAllValue(tableName); // TODO: do not return the full table!
  }

  public async deleteValue(tableName: string, id: string):Promise<any> {
    // const tx = this.db.transaction(tableName, 'readwrite');
    const store = this.subLevels.get(tableName);
    const result = await store.get(id);
    if (!result) {
      console.warn('IndexedDb deleteValue Id not found', id);
      return Promise.resolve(result);
    }
    await store.del(id);
    console.log('IndexedDb DeleteValue', id);
    return id;
  }
}

export default {};