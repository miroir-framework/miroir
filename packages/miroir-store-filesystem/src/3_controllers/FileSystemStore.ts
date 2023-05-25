import { DataStoreApplicationType, EntityDefinition, IAbstractStore, MetaEntity } from "miroir-core";

import * as fs from "fs";
import * as path from "path";

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableFileSystemDbStore = GConstructor<FileSystemStore>;


export class FileSystemStore implements IAbstractStore{
  public applicationName: string;
  public dataStoreType: DataStoreApplicationType;
  public directory: string;

  // public sqlSchemaTableAccess: SqlUuidEntityDefinition = {};
  // public sequelize: Sequelize;
  public logHeader: string;

  // ##############################################################################################
  constructor(
    // public applicationName: string,
    // public dataStoreType: DataStoreApplicationType,
    // private directory: string,
    // public logHeader: string;
    ...args:any[] // mixin constructors are limited to args:any[] parameters
  ) {
    this.applicationName = args[0];
    this.dataStoreType = args[1];
    this.directory = args[2];
    this.logHeader = args[3];
  }
  // #########################################################################################
  open(): Promise<void> {
    const entityDirectories = fs.readdirSync(this.directory);
    console.log(this.logHeader, 'open does nothing! existing entities',entityDirectories);
    return Promise.resolve();
  }

  // #############################################################################################
  close(): Promise<void> {
    console.log(this.logHeader, 'close does nothing!');
    return Promise.resolve();
  }
  // #############################################################################################
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    console.log(this.logHeader, 'bootFromPersistedState does nothing!');
    return Promise.resolve();
  }
}