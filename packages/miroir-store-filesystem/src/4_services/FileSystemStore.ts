import * as fs from "fs";
import * as path from "path";

import {
  DataStoreApplicationType,
  EntityDefinition,
  IAbstractStore,
  IStorageSpaceHandler,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  getLoggerName,
} from "miroir-core";


import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"FileSystemStore");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableFileSystemDbStore = GConstructor<FileSystemStore>;


export class FileSystemStore implements IAbstractStore, IStorageSpaceHandler{
  public applicationName: string;
  public dataStoreType: DataStoreApplicationType;
  public directory: string;

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
    log.log(this.logHeader, 'open does nothing! existing entities',entityDirectories);
    return Promise.resolve();
  }

  // #############################################################################################
  close(): Promise<void> {
    log.log(this.logHeader, 'close does nothing!');
    return Promise.resolve();
  }

  // #############################################################################################
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    log.log(this.logHeader, 'bootFromPersistedState does nothing!');
    return Promise.resolve();
  }

  // #############################################################################################
  getEntityUuids(): string[] {
    const files = fs.readdirSync(this.directory);
    return files;
  }

  // #############################################################################################
  async clear(): Promise<void> {
    log.log(this.logHeader, 'clear this.getEntityUuids()',this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader, 'clear for entity',parentUuid);
      await this.dropStorageSpaceForInstancesOfEntity(parentUuid);
    }
    return Promise.resolve();
  }
 
  // #############################################################################################
  createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    log.log(this.logHeader, 'createStorageSpaceForInstancesOfEntity', entity);
    const entityInstancesPath = path.join(this.directory,entity.uuid)
    if (!fs.existsSync(entityInstancesPath)) {
      fs.mkdirSync(entityInstancesPath)
    } else {
      log.debug(this.logHeader,'createStorageSpaceForInstancesOfEntity storage space already exists for',entity.uuid);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void> {
    const entityInstancesPath = path.join(this.directory,entityUuid)
    if (fs.existsSync(entityInstancesPath)) {
      fs.rmSync(entityInstancesPath,{ recursive: true, force: true })
    } else {
      log.debug(this.logHeader,'dropStorageSpaceForInstancesOfEntity storage space does not exist for',entityUuid);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    log.log(this.logHeader, 'renameStorageSpaceForInstancesOfEntity does nothing!');
    return Promise.resolve();
  }
  
}