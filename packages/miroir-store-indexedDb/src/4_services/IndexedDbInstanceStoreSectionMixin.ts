import {
  ACTION_OK,
  PersistenceStoreInstanceSectionAbstractInterface,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionReturnType,
  ActionVoidReturnType,
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory,
  RunQueryTemplateOrExtractorTemplateAction,
  getLoggerName,
  ExtractorTemplateRunnerInMemory,
  ExtractorRunnerInMemory,
  RunExtractorOrQueryAction,
  RunExtractorAction,
  RunQueryAction,
} from "miroir-core";
import { IndexedDbStoreSection, MixableIndexedDbStoreSection } from "./IndexedDbStoreSection.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "IndexedDbInstanceStoreSectionMixin");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
    async handleExtractorAction(query: RunExtractorAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleExtractorAction', 'query',query);
      
      const result: ActionReturnType = await this.extractorRunner.handleExtractorAction(query);

      log.info(this.logHeader,'handleExtractorAction','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleQueryAction(query: RunQueryAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleQueryAction', 'query',query);
      
      const result: ActionReturnType = await this.extractorRunner.handleQueryAction(query);

      log.info(this.logHeader,'handleQueryAction','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleExtractorOrQueryAction(query: RunExtractorOrQueryAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleExtractorOrQueryAction', 'query',query);
      
      const result: ActionReturnType = await this.extractorRunner.handleExtractorOrQueryAction(query);

      log.info(this.logHeader,'handleExtractorOrQueryAction','query',query, "result", result);
      return result;
    }
    
    // #############################################################################################
    async handleQueryTemplateForServerONLY(query: RunQueryTemplateOrExtractorTemplateAction): Promise<ActionReturnType> {
      log.info(this.logHeader,'handleQueryTemplateForServerONLY', 'query',query);
      
      const result: ActionReturnType = await this.extractorTemplateRunner.handleQueryTemplateForServerONLY(query);

      log.info(this.logHeader,'handleQueryTemplateForServerONLY','query',query, "result", result);
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
