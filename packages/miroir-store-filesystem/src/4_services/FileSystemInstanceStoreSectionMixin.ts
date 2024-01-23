import * as fs from "fs";
import * as path from "path";

import {
  EntityInstance,
  EntityInstanceCollection,
  AbstractInstanceStoreSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  ActionReturnType,
  ActionEntityInstanceCollectionReturnType
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
  return class MixedIndexedDbInstanceStoreSection extends Base implements AbstractInstanceStoreSectionInterface {
    // ##############################################################################################
    constructor(
      // ...args stands for:
      // public applicationSection: ApplicationSection,
      // public filesystemStoreName: string,
      // private directory: string,
      // public logHeader: string,
      ...args: any[]
    ) {
      super(...args);
    }

    // #############################################################################################
    getInstance(entityUuid: string, uuid: string): Promise<ActionReturnType> {
      const entityInstancePath = path.join(this.directory, entityUuid, fullName(uuid));
      try {
        const fileContents = fs.readFileSync(entityInstancePath).toString();
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: { elementType: "instance", elementValue: JSON.parse(fileContents) },
        });
      } catch (error) {
        return Promise.resolve({
          status: "error",
          error: {
            errorType: "FailedToCreateStore",
            errorMessage: `failed to get instance ${uuid} of entity ${entityUuid}`,
          },
        });
      }
    }

    // #########################################################################################
    async getInstances(entityUuid: string): Promise<ActionEntityInstanceCollectionReturnType> {
      log.info(
        this.logHeader,
        "FileSystemInstanceStore getInstances",
        "entityUuid",
        entityUuid,
        "directory",
        this.directory
      );

      const entityInstancesPath = path.join(this.directory, entityUuid);
      if (!fs.existsSync(entityInstancesPath)) {
        log.warn(
          this.logHeader,
          "FileSystemInstanceStore getInstances",
          "entityUuid",
          entityUuid,
          "could not find path",
          entityInstancesPath
        );
        return Promise.resolve({
          status: "error",
          error: {
            errorType: "FailedToGetInstances",
            errorMessage: `FileSystemInstanceStore getInstances entityUuid ${entityUuid} could not find path ${entityInstancesPath}`,
          },
        });
      }

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
      const entityInstances: EntityInstanceCollection = {
        parentUuid: entityUuid,
        applicationSection: this.applicationSection,
        instances: entityInstancesUuid.map((e) =>
          JSON.parse(fs.readFileSync(path.join(entityInstancesPath, e)).toString())
        ),
      };
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
      return Promise.resolve({
        status: "ok",
        returnedDomainElement: {
          elementType: "entityInstanceCollection",
          elementValue: entityInstances
        }
      });
    }
    // #########################################################################################
    upsertInstance(entityUuid: string, instance: EntityInstance): Promise<any> {
      const filePath = path.join(this.directory, entityUuid, fullName(instance.uuid));
      fs.writeFileSync(filePath, JSON.stringify(instance, undefined, 2));

      return Promise.resolve(undefined);
    }

    // #############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
      log.info(this.logHeader, "deleteInstances", parentUuid, instances);
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
