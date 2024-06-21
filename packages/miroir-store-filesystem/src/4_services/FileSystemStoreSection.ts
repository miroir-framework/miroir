import * as fs from "fs";
import * as path from "path";

import {
  DataStoreApplicationType,
  EntityDefinition,
  AbstractStoreSectionInterface,
  StorageSpaceHandlerInterface,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  getLoggerName,
  ActionReturnType,
  ActionVoidReturnType,
  ACTION_OK,
} from "miroir-core";


import { packageName } from "../constants.js";
import { cleanLevel } from "./constants";
import { FileSystemStore } from "./FileSystemStore";

const loggerName: string = getLoggerName(packageName, cleanLevel,"FileSystemStoreSection");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableFileSystemDbStore = GConstructor<FileSystemStoreSection>;


export class FileSystemStoreSection
  extends FileSystemStore
  implements AbstractStoreSectionInterface, StorageSpaceHandlerInterface
{
  // public filesystemStoreName: string;
  // public directory: string;

  // public logHeader: string;

  // ##############################################################################################
  constructor(
    // public applicationSection: ApplicationSection,
    // public filesystemStoreName: string,
    // private directory: string,
    // public logHeader: string;
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2], args[3]);
  }

  // #############################################################################################
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<ActionVoidReturnType> {
    log.info(this.logHeader, "bootFromPersistedState does nothing!");
    return Promise.resolve(ACTION_OK);
  }

  // #############################################################################################
  getEntityUuids(): string[] {
    const files = fs.readdirSync(this.directory);
    return files;
  }

  // #############################################################################################
  async clear(): Promise<ActionVoidReturnType> {
    log.info(this.logHeader, "clear this.getEntityUuids()", this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      log.debug(this.logHeader, "clear for entity", parentUuid);
      await this.dropStorageSpaceForInstancesOfEntity(parentUuid);
    }
    return Promise.resolve(ACTION_OK);
  }

  // #############################################################################################
  createStorageSpaceForInstancesOfEntity(
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<ActionVoidReturnType> {
    log.info(this.logHeader, "createStorageSpaceForInstancesOfEntity", entity);
    const entityInstancesPath = path.join(this.directory, entity.uuid);
    if (!fs.existsSync(entityInstancesPath)) {
      fs.mkdirSync(entityInstancesPath);
    } else {
      log.debug(this.logHeader, "createStorageSpaceForInstancesOfEntity storage space already exists for", entity.uuid);
    }
    return Promise.resolve(ACTION_OK);
  }

  // #############################################################################################
  dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<ActionVoidReturnType> {
    const entityInstancesPath = path.join(this.directory, entityUuid);
    if (fs.existsSync(entityInstancesPath)) {
      fs.rmSync(entityInstancesPath, { recursive: true, force: true });
    } else {
      log.debug(
        this.logHeader,
        "dropStorageSpaceForInstancesOfEntity storage space does not exist for",
        entityUuid,
        "entityInstancesPath",
        entityInstancesPath
      );
    }
    return Promise.resolve(ACTION_OK);
  }

  // #############################################################################################
  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<ActionVoidReturnType> {
    log.info(this.logHeader, "renameStorageSpaceForInstancesOfEntity does nothing!");
    return Promise.resolve(ACTION_OK);
  }
}