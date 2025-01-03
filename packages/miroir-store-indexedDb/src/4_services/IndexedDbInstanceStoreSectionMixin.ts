import {
  ACTION_OK,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionReturnType,
  ActionVoidReturnType,
  EntityInstance,
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
import { IndexedDbStoreSection, MixableIndexedDbStoreSection } from "./IndexedDbStoreSection.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "IndexedDbInstanceStoreSectionMixin")
).then((logger: LoggerInterface) => {log = logger});

export const MixedIndexedDbInstanceStoreSection = IndexedDbInstanceStoreSectionMixin(IndexedDbStoreSection);

export function IndexedDbInstanceStoreSectionMixin<TBase extends MixableIndexedDbStoreSection>(Base: TBase) {
  return class MixedIndexedDbInstanceStoreSection extends Base implements PersistenceStoreInstanceSectionAbstractInterface {
    public extractorTemplateRunner: ExtractorTemplateRunnerInMemory;
    public extractorRunner: ExtractorRunnerInMemory;

    constructor(
      // public indexedDbStoreName: string;
      // public localUuidIndexedDb: IndexedDb;
      // public logHeader: string;
      ...args: any[]
    ) {
      super(...args);
      this.extractorRunner = new ExtractorRunnerInMemory(this);
      this.extractorTemplateRunner = new ExtractorTemplateRunnerInMemory(this,this.extractorRunner); // TODO: extractorRunner has its own extractorTemplateRunner, this means 2 instances of ExtractorTemplateRunnerInMemory are created here
      // log.info(this.logHeader,'MixedIndexedDbInstanceStoreSection constructor','this.localUuidIndexedDb',this.localUuidIndexedDb)
    }

    // #############################################################################################
    async handleBoxedExtractorAction(query: RunBoxedExtractorAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleBoxedExtractorAction', 'query',query);
      
      const result: ActionReturnType = await this.extractorRunner.handleBoxedExtractorAction(query);

      log.info(this.logHeader,'handleBoxedExtractorAction','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleBoxedQueryAction(query: RunBoxedQueryAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleBoxedQueryAction', 'query',query);
      
      const result: ActionReturnType = await this.extractorRunner.handleBoxedQueryAction(query);

      log.info(this.logHeader,'handleBoxedQueryAction','query',query, "result", result);
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
      log.info(this.logHeader,'handleQueryTemplateActionForServerONLY', 'query',query);
      
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
    async getInstance(parentUuid: string, uuid: string): Promise<ActionEntityInstanceReturnType> {
      try {
        const result = await this.localUuidIndexedDb.resolvePathOnObject(parentUuid, uuid);
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: { elementType: "instance", elementValue: result },
        });
      } catch (error) {
        return Promise.resolve({
          status: "error",
          error: {
            errorType: "FailedToGetInstance",
            errorMessage: `getInstance could not retrieve instance ${uuid} of entity ${parentUuid}: ` + error,
          },
        });
      }
    }

    // #############################################################################################
    async getInstances(parentUuid: string): Promise<ActionEntityInstanceCollectionReturnType> {
      try {
        const result: EntityInstance[] = await this.localUuidIndexedDb.getAllValue(parentUuid);
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: {
            elementType: "entityInstanceCollection",
            elementValue: { parentUuid, applicationSection: this.localUuidIndexedDb.applicationSection, instances: result },
          },
        });
      } catch (error) {
        return { status: "error", error: { errorType: "FailedToGetInstances", errorMessage: error as string}}
      }
    }

    // #############################################################################################
    async upsertInstance(parentUuid: string, instance: EntityInstance): Promise<ActionVoidReturnType> {
      log.info(this.logHeader, "upsertInstance called", instance.parentUuid, instance);

      if (this.localUuidIndexedDb.hasSubLevel(instance.parentUuid)) {
        await this.localUuidIndexedDb.putValue(instance.parentUuid, instance);
        log.info(this.logHeader, "upsertInstance", instance.parentUuid, "done");
        // const tmp = await this.getInstances(instance.parentUuid);
        // log.debug(this.logHeader, "upsertInstance", instance.parentUuid, "found existing", tmp);
      } else {
        log.error(this.logHeader, "upsertInstance", instance.parentUuid, "does not exists.");
      }
      return Promise.resolve( { status: "ok", returnedDomainElement: { elementType: "void", elementValue: undefined } } );
    }

    // #############################################################################################
    async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<ActionVoidReturnType> {
      log.info(this.logHeader, "deleteInstances", parentUuid, instances);
      for (const o of instances) {
        await this.deleteInstance(parentUuid, { uuid: o.uuid } as EntityInstance);
      }
      return Promise.resolve(ACTION_OK);
    }

    // #############################################################################################
    async deleteInstance(parentUuid: string, instance: EntityInstance): Promise<ActionVoidReturnType> {
      log.debug(this.logHeader, "deleteInstance started.", "entity", parentUuid, "instance", instance);
      await this.localUuidIndexedDb.deleteValue(parentUuid, instance.uuid);
      log.debug(this.logHeader, "deleteInstance done.", parentUuid, instance);
      return Promise.resolve(ACTION_OK);
    }
  };
}
