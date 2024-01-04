import * as fs from "fs";
import * as path from "path";

import {
  EntityInstance,
  EntityInstanceCollection,
  IAbstractInstanceStoreSection,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";

import { packageName } from "../constants.js";
import { FileSystemStoreSection, MixableFileSystemDbStore } from "./FileSystemStoreSection.js";
import { cleanLevel } from "./constants.js";


const loggerName: string = getLoggerName(packageName, cleanLevel,"FileSystemInstanceStoreSectionMixin");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

const fileExt = ".json";
export function fullName(baseName: string) {
  return baseName + fileExt;
}
export function extractName(fullName: string) {
  return fullName.substring(fullName.length - 5);
}

export const MixedFileSystemInstanceStoreSection = FileSystemInstanceStoreSectionMixin(FileSystemStoreSection);

export function FileSystemInstanceStoreSectionMixin<TBase extends MixableFileSystemDbStore>(Base: TBase) {
  return class MixedIndexedDbInstanceStoreSection extends Base implements IAbstractInstanceStoreSection {
    // ##############################################################################################
    constructor(
      // ...args stands for:
      // public filesystemStoreName: string,
      // private directory: string,
      // public logHeader: string,
      ...args: any[]
    ) {
      super(...args);
    }

    // #############################################################################################
    getInstance(entityUuid: string, uuid: string): Promise<EntityInstance | undefined> {
      const entityInstancePath = path.join(this.directory, entityUuid, fullName(uuid));
      return Promise.resolve(JSON.parse(fs.readFileSync(entityInstancePath).toString()) as EntityInstance);
    }

    // #########################################################################################
    async getInstances(entityUuid: string): Promise<EntityInstance[]> {
      log.log(
        this.logHeader,
        "FileSystemInstanceStore getInstances",
        "entityUuid",
        entityUuid,
        "directory",
        this.directory
      );

      const entityInstancesPath = path.join(this.directory, entityUuid);
      if (fs.existsSync(entityInstancesPath)) {
        const entityInstancesUuid = fs.readdirSync(entityInstancesPath);
        log.debug(
          this.logHeader,
          "FileSystemInstanceStore getInstances",
          "entityUuid",
          entityUuid,
          "directory",
          this.directory,
          "found entity instances",
          entityInstancesUuid
        );
        const entityInstances = {
          parentUuid: entityUuid,
          instances: entityInstancesUuid.map((e) =>
            JSON.parse(fs.readFileSync(path.join(entityInstancesPath, e)).toString())
          ),
        } as EntityInstanceCollection;
        log.debug(
          this.logHeader,
          "FileSystemInstanceStore getInstances",
          "entityUuid",
          entityUuid,
          "directory",
          this.directory,
          "found entity instances",
          entityInstances
        );
        return Promise.resolve(entityInstances.instances);
      } else {
        log.warn(
          this.logHeader,
          "FileSystemInstanceStore getInstances",
          "entityUuid",
          entityUuid,
          "could not find path",
          entityInstancesPath
        );
        return Promise.resolve([]);
      }
    }
    // #########################################################################################
    upsertInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
      const filePath = path.join(this.directory, entityUuid, fullName(instance.uuid));
      fs.writeFileSync(filePath, JSON.stringify(instance, undefined, 2));

      return Promise.resolve(undefined);
    }

    // #############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
      log.log(this.logHeader, "deleteInstances", parentUuid, instances);
      for (const o of instances) {
        await this.deleteInstance(parentUuid, { uuid: o.uuid } as EntityInstance);
      }
      return Promise.resolve();
    }

    // #############################################################################################
    deleteInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
      const filePath = path.join(this.directory, entityUuid, fullName(instance.uuid));
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath);
      } else {
        log.debug(
          "deleteInstance could not find file to delete:",
          filePath,
          "entityUuid",
          entityUuid,
          "instance",
          instance
        );
      }
      return Promise.resolve();
    }
  };
}