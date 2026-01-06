import * as fs from "fs";
import * as path from "path";

import {
  ACTION_OK,
  Action2EntityInstanceCollectionOrFailure,
  Action2ReturnType,
  Action2VoidReturnType,
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
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  Action2EntityInstanceReturnType,
  Action2Error,
  defaultMetaModelEnvironment
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
    async handleBoxedExtractorAction(query: RunBoxedExtractorAction): Promise<Action2ReturnType> {
      log.info(this.logHeader,'handleBoxedExtractorAction', 'query',query);
      
      const result: Action2ReturnType = await this.extractorRunner.handleBoxedExtractorAction(
        query,
        query.payload.query.applicationDeploymentMap,
        defaultMetaModelEnvironment
      );

      log.info(this.logHeader,'handleBoxedExtractorAction DONE','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleBoxedQueryAction(query: RunBoxedQueryAction): Promise<Action2ReturnType> {
      log.info(this.logHeader,'handleBoxedQueryAction', 'query',query);
      
      const result: Action2ReturnType = await this.extractorRunner.handleBoxedQueryAction(
        query,
        query.payload.query.applicationDeploymentMap,
        defaultMetaModelEnvironment
      );

      log.info(this.logHeader,'handleBoxedQueryAction DONE','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleQueryTemplateActionForServerONLY(query: RunBoxedQueryTemplateAction): Promise<Action2ReturnType> {
      log.info(this.logHeader,'handleQueryTemplateActionForServerONLY', 'query',query);
      
      const result: Action2ReturnType = await this.extractorTemplateRunner.handleQueryTemplateActionForServerONLY(
        query,
        query.payload.query.applicationDeploymentMap,
        defaultMetaModelEnvironment
      );

      log.info(this.logHeader,'handleQueryTemplateActionForServerONLY','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleBoxedExtractorTemplateActionForServerONLY(query: RunBoxedExtractorTemplateAction): Promise<Action2ReturnType> {
      log.info(this.logHeader,'handleBoxedExtractorTemplateActionForServerONLY', 'query',query);
      
      const result: Action2ReturnType = await this.extractorTemplateRunner.handleBoxedExtractorTemplateActionForServerONLY(
        query,
        query.payload.query.applicationDeploymentMap,
        defaultMetaModelEnvironment
      );

      log.info(this.logHeader,'handleBoxedExtractorTemplateActionForServerONLY','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction): Promise<Action2ReturnType> {
      log.info(this.logHeader,'handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY', 'query',query);
      
      const result: Action2ReturnType = await this.extractorTemplateRunner.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
        query,
        query.payload.query.applicationDeploymentMap,
        defaultMetaModelEnvironment
      );

      log.info(this.logHeader,'handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    getInstance(entityUuid: string, uuid: string): Promise<Action2EntityInstanceReturnType> {
      const entityInstancePath = path.join(this.directory, entityUuid, fullName(uuid));
      try {
        const fileContents = fs.readFileSync(entityInstancePath, { encoding: "utf-8"}).toString();
        return Promise.resolve({
          status: "ok",
          // returnedDomainElement: { elementType: "instance", elementValue: JSON.parse(fileContents) },
          returnedDomainElement: JSON.parse(fileContents),
        });
      } catch (error) {
        return Promise.resolve(new Action2Error(
          "FailedToGetInstance",
          `failed to get instance ${uuid} of entity ${entityUuid}`
        ));
      }
    }

    // #########################################################################################
    async getInstances(entityUuid: string): Promise<Action2EntityInstanceCollectionOrFailure> {
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
        return Promise.resolve(new Action2Error(
          "FailedToGetInstances",
          `FileSystemInstanceStore getInstances entityUuid ${entityUuid} could not find path ${entityInstancesPath}`
        ));
      }

      try {
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
          returnedDomainElement: entityInstances
        });
      } catch (error) {
        return Promise.resolve(new Action2Error(
          "FailedToGetInstances",
          `FileSystemInstanceStore getInstances entityUuid ${entityUuid} failed to read directory ${entityInstancesPath}`
        ));
      }
    }
    // #########################################################################################
    upsertInstance(entityUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType> {
      try {
        const filePath = path.join(this.directory, entityUuid, fullName(instance.uuid));
        log.info(
          this.logHeader,
          "upsertInstance called",
          "entityUuid", entityUuid,
          "instance", instance,
          "filePath", filePath
        );
        fs.writeFileSync(filePath, JSON.stringify(instance, undefined, 2), { encoding: "utf-8" });
        return Promise.resolve(ACTION_OK);
      } catch (error) {
        log.error(
          this.logHeader,
          "upsertInstance failed",
          "entityUuid", entityUuid,
          "instance", instance,
          "error", error
        );
        return Promise.resolve(new Action2Error(
          "FailedToUpdateInstance",
          `failed to upsert instance ${instance.uuid} of entity ${entityUuid}`
        ));
      }
    }

    // #############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "deleteInstances", parentUuid, instances);
      // TODO: delete in parallel, not sequentially
      for (const o of instances) {
        // TODO: send back a proper "FailedToDeleteInstances" error if one of the deletes fails, with the details of the failed delete as payload
        const tmpResult = await this.deleteInstance(parentUuid, { uuid: o.uuid } as EntityInstance);
        if (tmpResult.status !== "ok") {
          return tmpResult;
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // #############################################################################################
    deleteInstance(entityUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType> {
      const filePath = path.join(this.directory, entityUuid, fullName(instance.uuid));
      try {
        if (fs.existsSync(filePath)) {
          fs.rmSync(filePath);
        } else {
          log.error(
            "deleteInstance could not find file to delete:",
            filePath,
            "entityUuid",
            entityUuid,
            "instance",
            instance
          );
          const entityPath = path.join(this.directory, entityUuid);
          if (!fs.existsSync(filePath)) {
            return Promise.resolve(new Action2Error(
              "FailedToDeleteInstance",
              // `could not find file to delete: ${filePath} entityUuid ${entityUuid} instance ${instance}`
              `could not find entity ${entityUuid}`
            ));
          }
        }
        return Promise.resolve(ACTION_OK);
      } catch (error) {
        return Promise.resolve(new Action2Error(
          "FailedToDeleteInstance",
          `failed to delete instance ${instance.uuid} of entity ${entityUuid}`
        ));
      }
    }
  // };
  };
}
