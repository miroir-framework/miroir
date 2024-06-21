import { Level } from 'level';
import { ApplicationSection, LoggerInterface, MiroirLoggerFactory, entityDefinitionEntityDefinition, getLoggerName } from "miroir-core";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDb");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class IndexedDb {
  public db: Level | undefined = undefined;
  private subLevels: Map<string, Level> = new Map();
  private logHeader: string;

  // #############################################################################################
  constructor(
    public applicationSection: ApplicationSection,
    private databaseName: string
  ) {
    this.logHeader = 'IndexedDb ' + databaseName;
  }

  // #############################################################################################
  public async closeObjectStore():Promise<void> {
    if (this.db?.status =='open' ) {
      log.info(this.logHeader,'closeObjectStore closing db',this.databaseName, this.applicationSection, '...', this.db?.status);
      await this.db?.close();
    } else {
      log.info(this.logHeader, 'closeObjectStore db already closed',this.databaseName, this.applicationSection,'...', this.db?.status);
    }
    // log.info('IndexedDb closeObjectStore db closed!');
    this.db = undefined;
    this.subLevels?.clear();
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  public async openObjectStore():Promise<void> {
    try {
      log.info('openObjectStore called for', this.databaseName);
      if(this.db !== undefined) {
        if (this.db.status == "closed" || this.db.status == "closing") {
          await this.db?.open();
          log.info(this.logHeader, 'openObjectStore opened exitsting db', this.databaseName)
        } else {
          log.info(this.logHeader, 'openObjectStore existing db already opened', this.databaseName)
        }
      } else {
        // TODO: allow to set path in config!???
        this.db = new Level<string, any>("tests/tmp/" + this.databaseName, {valueEncoding: 'json', })
        await this.db?.open();
        log.info('openObjectStore created and opened db',this.databaseName);
      }
      log.info('openObjectStore done for', this.databaseName);
    } catch (error) {
      log.error('openObjectStore could not open', this.databaseName);
    }
    // if (this.db.status != "open") {
    //   throw new Error("openObjectStore could not open db" + this.databaseName + "!");
    // }
    return Promise.resolve(undefined);
  }

  // #############################################################################################
  public async clearObjectStore():Promise<void> {
    log.info(this.logHeader, 'clearObjectStore, does nothing! (missing API to list all existing sublevels)');
    // return this.db?.clear();
    return Promise.resolve(undefined);
  }

  // #############################################################################
  // NOT USED!?
  public async createObjectStore(tableNames: string[]):Promise<void> {
    try {
      if(this.db !== undefined) {
        if (this.db.status == "closed" || this.db.status == "closing") {
          await this.db.open();
          log.info(this.logHeader, 'createObjectStore opened db')
        } else {
          log.info(this.logHeader, 'createObjectStore db already opened')
        }
        this.subLevels = this.createSubLevels(this.db,tableNames);
        return Promise.resolve(undefined);
      } else {
        this.db = new Level<string, any>(this.databaseName, {valueEncoding: 'json'})
        this.subLevels = this.createSubLevels(this.db,tableNames);
        log.debug(this.logHeader, 'createObjectStore created db with sublevels',tableNames,this.subLevels)
        log.trace(this.logHeader, 'createObjectStore db',this.db)
        log.trace(this.logHeader, 'createObjectStore hasSublevel',entityDefinitionEntityDefinition.uuid, this.hasSubLevel(entityDefinitionEntityDefinition.uuid))
        return Promise.resolve(undefined);
      }
    } catch (error) {
      log.error('could not create Level DB', this.databaseName)
      return Promise.resolve(undefined);
    }
  }

  // #############################################################################
  public addSubLevels(tableNames:string[]) {
    log.info(this.logHeader, 'addSubLevels:',tableNames,'existing sublevels',this.getSubLevels());
    // log.info('indexedDb addSubLevels db:',this.db);
    this.subLevels = new Map<string, any>([
      ...this.subLevels.entries(),
      ...tableNames.filter(n=>!this.subLevels.has(n)).map(
        (tableName: string) => {
          const result: [string, any] = [
            tableName,
            <any>this.db?.sublevel(tableName),
          ];
          log.debug(this.logHeader, 'adding sublevel:',tableName);
          result[1]?.clear();
          log.debug(this.logHeader, 'addSubLevels added and cleared sublevel:',result[0]);
          
          return result;
        }
      ),
    ]);
  }

  // #############################################################################
  private createSubLevels(db: Level, tableNames:string[]) {
    log.debug(this.logHeader, 'createSublevels',db,tableNames)
    return new Map<string, any>([
      ...tableNames.map(
          (tableName: string) => {
          const result: [string, any] = [
            tableName,
            <any>db.sublevel(tableName),
          ];
          result[1].clear();
          log.trace('indexedDb createSubLevels added and cleared sublevel:',result[0]);
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
    log.debug(this.logHeader, 'getValue for entity',parentUuid,'instance uuid',instanceUuid,table);
    let result = {};
    if (table) {
      result = await table.get(instanceUuid, {valueEncoding: 'json'});
    } else {
      log.error(this.logHeader, 'getValue table for parentUuid not found:',parentUuid);
    }
    // log.info('IndexedDb getValue ', tableName, result);
    return Promise.resolve(result);
  }

  // #############################################################################################
  public async getAllValue(parentUuid: string):Promise<any[]> {
    const store = this.subLevels.get(parentUuid);
    if (!store) {
      throw new Error(`Entity ${parentUuid} does not exist!`);
    }
    const result =  await store.values({valueEncoding: 'json'}).all();
    log.trace(this.logHeader, 'getAllValue', parentUuid, "result", JSON.stringify(result));
    return Promise.resolve(result);
  }

  // #############################################################################################
  public async putValue(parentUuid: string, value: any):Promise<any> {
    const store = this.subLevels.get(parentUuid);
    log.debug('IndexedDb in store',store,'hasSubLevel(',parentUuid,')', this.hasSubLevel(parentUuid),'PutValue of entity', parentUuid, 'value',value);
    const result1 = store?await store.put(value.uuid, value, {valueEncoding: 'json'}):[];
    // log.info('IndexedDb PutValue written', tableName,);
    return Promise.resolve(result1);
  }

  // #############################################################################################
  public async putBulkValue(tableName: string, values: any[]):Promise<any> {
    // const tx = this.db.transaction(tableName, 'readwrite');
    const store = this.subLevels.get(tableName);
    for (const value of values) {
      const result = await store?.put(value.uuid,value, {valueEncoding: 'json'});
      log.trace(this.logHeader, 'PutBulkValue ', JSON.stringify(result));
    }
    return this.getAllValue(tableName); // TODO: do not return the full table!
  }

  // #############################################################################################
  public async deleteValue(tableUuid: string, uuid: string):Promise<any> {
    // const tx = this.db.transaction(tableName, 'readwrite');
    log.info(this.logHeader, 'deleteValue called for entity', tableUuid, "instance", uuid);
    if (this.getSubLevels().includes(tableUuid)) {
      const store = this.subLevels.get(tableUuid);
      try {
        const instance = await store?.get(uuid);
        if (!instance) {
          log.warn(this.logHeader, 'deleteValue Id not found', uuid);
          return Promise.resolve(undefined);
        } else {
          await store?.del(uuid);
          log.debug(this.logHeader, 'DeleteValue done for entity', tableUuid, "instance with uuid", uuid);
          return Promise.resolve(uuid);
        }
      } catch (error) {
        log.error(this.logHeader, "deleteValue could not find instance of entity: " + tableUuid + " with uuid: ", uuid);
      }
    } else {
      log.error(this.logHeader, "deleteValue could not find sublevel: " + tableUuid + " existing sublevels: ", this.getSubLevels());
      
    }
  }
}

export default {};