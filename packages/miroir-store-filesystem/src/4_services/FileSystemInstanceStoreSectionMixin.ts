import * as fs from "fs";
import * as path from "path";

import {
  ACTION_OK,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionReturnType,
  ActionVoidReturnType,
  EntityInstance,
  EntityInstanceCollection,
  ExtractorRunnerInMemory,
  ExtractorTemplateRunnerInMemory,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  RunBoxedExtractorAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction
} from "miroir-core";

import { packageName } from "../constants.js";
import { FileSystemStoreSection, MixableFileSystemDbStore } from "./FileSystemStoreSection.js";
import { cleanLevel } from "./constants.js";
// import { FileSystemExtractorTemplateRunner } from "./FileSystemExtractorTemplateRunner.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FileSystemInstanceStoreSectionMixin")
).then((logger: LoggerInterface) => {log = logger});


const fileExt = ".json";
export function fullName(baseName: string) {
  return baseName + fileExt;
}
export function extractName(fullName: string) {
  return fullName.substring(fullName.length - 5);
}

export const MixedFileSystemInstanceStoreSection = FileSystemInstanceStoreSectionMixin(FileSystemStoreSection);

export function FileSystemInstanceStoreSectionMixin<TBase extends MixableFileSystemDbStore>(Base: TBase) {
  return class MixedIndexedDbInstanceStoreSection extends Base implements PersistenceStoreInstanceSectionAbstractInterface {
    public extractorTemplateRunner: ExtractorTemplateRunnerInMemory;
    public extractorRunner: ExtractorRunnerInMemory;

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
      this.extractorRunner = new ExtractorRunnerInMemory(this);
      this.extractorTemplateRunner = new ExtractorTemplateRunnerInMemory(this,this.extractorRunner); // TODO: extractorRunner has its own extractorTemplateRunner, this means 2 instances of ExtractorTemplateRunnerInMemory are created here
    }

    // #############################################################################################
    async handleBoxedExtractorAction(query: RunBoxedExtractorAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleBoxedExtractorAction', 'query',query);
      
      const result: ActionReturnType = await this.extractorRunner.handleBoxedExtractorAction(query);

      log.info(this.logHeader,'handleBoxedExtractorAction DONE','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleBoxedQueryAction(query: RunBoxedQueryAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleBoxedQueryAction', 'query',query);
      
      const result: ActionReturnType = await this.extractorRunner.handleBoxedQueryAction(query);

      log.info(this.logHeader,'handleBoxedQueryAction DONE','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleQueryTemplateActionForServerONLY(query: RunBoxedQueryTemplateAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleQueryTemplateActionForServerONLY', 'query',query);
      
      const result: ActionReturnType = await this.extractorTemplateRunner.handleQueryTemplateActionForServerONLY(query);

      log.info(this.logHeader,'handleQueryTemplateActionForServerONLY','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleBoxedExtractorTemplateActionForServerONLY(query: RunBoxedExtractorTemplateAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleBoxedExtractorTemplateActionForServerONLY', 'query',query);
      
      const result: ActionReturnType = await this.extractorTemplateRunner.handleBoxedExtractorTemplateActionForServerONLY(query);

      log.info(this.logHeader,'handleBoxedExtractorTemplateActionForServerONLY','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY', 'query',query);
      
      const result: ActionReturnType = await this.extractorTemplateRunner.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query);

      log.info(this.logHeader,'handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    getInstance(entityUuid: string, uuid: string): Promise<ActionEntityInstanceReturnType> {
      const entityInstancePath = path.join(this.directory, entityUuid, fullName(uuid));
      try {
        const fileContents = fs.readFileSync(entityInstancePath, { encoding: "utf-8"}).toString();
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
        "applicationSection",
        this.applicationSection,
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
          "applicationSection",
          this.applicationSection,
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
        "applicationSection",
        this.applicationSection,
        "directory",
        this.directory,
        "found entity instances",
        entityInstancesUuid
      );
      const entityInstances: EntityInstanceCollection = {
        parentUuid: entityUuid,
        applicationSection: this.applicationSection,
        instances: entityInstancesUuid.map((e) =>
          JSON.parse(fs.readFileSync(path.join(entityInstancesPath, e),{encoding: "utf-8"}).toString())
        ),
      };
      log.debug(
        this.logHeader,
        "FileSystemInstanceStore getInstances",
        "entityUuid",
        entityUuid,
        "applicationSection",
        this.applicationSection,
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
    upsertInstance(entityUuid: string, instance: EntityInstance): Promise<ActionVoidReturnType> {
      const filePath = path.join(this.directory, entityUuid, fullName(instance.uuid));
      fs.writeFileSync(filePath, JSON.stringify(instance, undefined, 2), { encoding: "utf-8" });

      return Promise.resolve(ACTION_OK);
    }

    // #############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<ActionVoidReturnType> {
      log.info(this.logHeader, "deleteInstances", parentUuid, instances);
      // TODO: delete in parallel, not sequentially
      for (const o of instances) {
        await this.deleteInstance(parentUuid, { uuid: o.uuid } as EntityInstance);
      }
      return Promise.resolve(ACTION_OK);
    }

    // #############################################################################################
    deleteInstance(entityUuid: string, instance: EntityInstance): Promise<ActionVoidReturnType> {
      const filePath = path.join(this.directory, entityUuid, fullName(instance.uuid));
      try {
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
        return Promise.resolve(ACTION_OK);
      } catch (error) {
        return Promise.resolve({
          status: "error",
          error: {
            errorType: "FailedToDeployModule",
            errorMessage: `failed to delete instance ${instance.uuid} of entity ${entityUuid}`,
          },
        });
      }
    }
  // };
  };
}
