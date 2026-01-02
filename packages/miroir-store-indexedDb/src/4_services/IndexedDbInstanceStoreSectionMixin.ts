import {
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2ReturnType,
  Action2VoidReturnType,
  ACTION_OK,
  defaultMetaModelEnvironment,
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
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  type ApplicationDeploymentMap
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
  return class MixedIndexedDbInstanceStoreSection
    extends Base
    implements PersistenceStoreInstanceSectionAbstractInterface
  {
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
      this.extractorTemplateRunner = new ExtractorTemplateRunnerInMemory(
        this,
        this.extractorRunner
      ); // TODO: extractorRunner has its own extractorTemplateRunner, this means 2 instances of ExtractorTemplateRunnerInMemory are created here
      // log.info(this.logHeader,'MixedIndexedDbInstanceStoreSection constructor','this.localUuidIndexedDb',this.localUuidIndexedDb)
    }

    // #############################################################################################
    async handleBoxedExtractorAction(
      query: RunBoxedExtractorAction,
      applicationDeploymentMap: ApplicationDeploymentMap
    ): Promise<Action2ReturnType> {
      log.info(this.logHeader, "handleBoxedExtractorAction", "query", query);

      const result: Action2ReturnType = await this.extractorRunner.handleBoxedExtractorAction(
        query,
        applicationDeploymentMap,
        defaultMetaModelEnvironment
      );

      log.info(this.logHeader, "handleBoxedExtractorAction", "query", query, "result", result);
      return result;
    }

    // #############################################################################################
    async handleBoxedQueryAction(
      query: RunBoxedQueryAction,
      applicationDeploymentMap: ApplicationDeploymentMap
    ): Promise<Action2ReturnType> {
      log.info(this.logHeader, "handleBoxedQueryAction", "query", query);

      const result: Action2ReturnType = await this.extractorRunner.handleBoxedQueryAction(
        query,
        applicationDeploymentMap,
        defaultMetaModelEnvironment
      );

      log.info(this.logHeader, "handleBoxedQueryAction", "query", query, "result", result);
      return result;
    }

    // #############################################################################################
    async handleQueryTemplateActionForServerONLY(
      query: RunBoxedQueryTemplateAction,
      applicationDeploymentMap: ApplicationDeploymentMap
    ): Promise<Action2ReturnType> {
      log.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "query", query);

      const result: Action2ReturnType =
        await this.extractorTemplateRunner.handleQueryTemplateActionForServerONLY(
          query,
          applicationDeploymentMap,
          defaultMetaModelEnvironment
        );

      log.info(
        this.logHeader,
        "handleQueryTemplateActionForServerONLY",
        "query",
        query,
        "result",
        result
      );
      return result;
    }

    // #############################################################################################
    async handleBoxedExtractorTemplateActionForServerONLY(
      query: RunBoxedExtractorTemplateAction,
      applicationDeploymentMap: ApplicationDeploymentMap
    ): Promise<Action2ReturnType> {
      log.info(this.logHeader, "handleBoxedExtractorTemplateActionForServerONLY", "query", query);

      const result: Action2ReturnType =
        await this.extractorTemplateRunner.handleBoxedExtractorTemplateActionForServerONLY(
          query,
          applicationDeploymentMap,
          defaultMetaModelEnvironment
        );

      log.info(
        this.logHeader,
        "handleBoxedExtractorTemplateActionForServerONLY",
        "query",
        query,
        "result",
        result
      );
      return result;
    }

    // #############################################################################################
    async handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
      query: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
      applicationDeploymentMap: ApplicationDeploymentMap
    ): Promise<Action2ReturnType> {
      log.info(
        this.logHeader,
        "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
        "query",
        query
      );

      const result: Action2ReturnType =
        await this.extractorTemplateRunner.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
          query,
          applicationDeploymentMap,
          defaultMetaModelEnvironment
        );

      log.info(
        this.logHeader,
        "handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY",
        "query",
        query,
        "result",
        result
      );
      return result;
    }

    // #############################################################################################
    async getInstance(parentUuid: string, uuid: string): Promise<Action2EntityInstanceReturnType> {
      try {
        const result = await this.localUuidIndexedDb.resolvePathOnObject(parentUuid, uuid);
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: result,
        });
      } catch (error) {
        return Promise.resolve(
          new Action2Error(
            "FailedToGetInstance",
            `getInstance could not retrieve instance ${uuid} of entity ${parentUuid}: ` + error
          )
        );
      }
    }

    // #############################################################################################
    async getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure> {
      try {
        const result: EntityInstance[] = await this.localUuidIndexedDb.getAllValue(parentUuid);
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: {
            parentUuid,
            applicationSection: this.localUuidIndexedDb.applicationSection,
            instances: result,
          },
        });
      } catch (error) {
        return Promise.resolve(
          new Action2Error("FailedToGetInstances", `getInstances error: ${error}`)
        );
      }
    }

    // #############################################################################################
    async upsertInstance(
      parentUuid: string,
      instance: EntityInstance
    ): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "upsertInstance called", instance.parentUuid, instance);

      try {
        if (this.localUuidIndexedDb.hasSubLevel(instance.parentUuid)) {
          // const upsertResult = await this.localUuidIndexedDb.putValue(instance.parentUuid, instance);
          return this.localUuidIndexedDb.putValue(instance.parentUuid, instance);
          log.info(this.logHeader, "upsertInstance", instance.parentUuid, "done");
          // const tmp = await this.getInstances(instance.parentUuid);
          // log.debug(this.logHeader, "upsertInstance", instance.parentUuid, "found existing", tmp);
          // ret
        } else {
          log.error(this.logHeader, "upsertInstance", instance.parentUuid, "does not exists.");
          // return Promise.resolve(new Action2Error("FailedToUpdateInstance", `upsertInstance could not update instance ${instance.uuid} of entity ${parentUuid}`));
          return Promise.resolve(
            new Action2Error(
              "FailedToUpdateInstance",
              `failed to upsert instance ${instance.uuid} of entity ${parentUuid}`
            )
          );
        }
        // return Promise.resolve( { status: "ok", returnedDomainElement: { elementType: "void", elementValue: undefined } } );
      } catch (error) {
        log.error(
          this.logHeader,
          "upsertInstance",
          instance.parentUuid,
          "could not upsert instance",
          instance,
          error
        );
        // return Promise.resolve(new Action2Error("FailedToUpdateInstance", `upsertInstance could not update instance ${instance.uuid} of entity ${parentUuid}: `,error as any));
        return Promise.resolve(
          new Action2Error(
            "FailedToUpdateInstance",
            `failed to upsert instance ${instance.uuid} of entity ${parentUuid}: `,
            error as any
          )
        );
      }
    }

    // #############################################################################################
    async deleteInstances(
      parentUuid: string,
      instances: EntityInstance[]
    ): Promise<Action2VoidReturnType> {
      log.info(this.logHeader, "deleteInstances", parentUuid, instances);
      for (const o of instances) {
        try {
          await this.deleteInstance(parentUuid, { uuid: o.uuid } as EntityInstance);
        } catch (error) {
          log.error(
            this.logHeader,
            "deleteInstances",
            parentUuid,
            "could not delete instance",
            o,
            error
          );
          return Promise.resolve(
            new Action2Error(
              "FailedToDeleteInstance",
              `deleteInstances could not delete instance ${o.uuid} of entity ${parentUuid}`
            )
          );
        }
      }
      return Promise.resolve(ACTION_OK);
    }

    // #############################################################################################
    async deleteInstance(
      parentUuid: string,
      instance: EntityInstance
    ): Promise<Action2VoidReturnType> {
      log.debug(
        this.logHeader,
        "deleteInstance started.",
        "entity",
        parentUuid,
        "instance",
        instance
      );
      try {
        // const deleteResult = await this.localUuidIndexedDb.deleteEntityInstance(parentUuid, instance.uuid);
        return this.localUuidIndexedDb.deleteEntityInstance(parentUuid, instance.uuid);
        // if (deleteResult. === false) {
        //   log.error(this.logHeader, "deleteInstance failed.", "entity", parentUuid, "instance", instance);
        //   return Promise.resolve({
        //     status: "error",
        //     error: {
        //       errorType: "FailedToDeleteInstance",
        //       errorMessage: `deleteInstance could not delete instance ${instance.uuid} of entity ${parentUuid}`,
        //     },

        // }
        // log.debug(this.logHeader, "deleteInstance done.", parentUuid, instance);
        // return Promise.resolve(ACTION_OK);
      } catch (error) {
        log.error(
          this.logHeader,
          "deleteInstance failed.",
          "entity",
          parentUuid,
          "instance",
          instance,
          "error",
          error
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToDeleteInstance",
            `deleteInstance could not delete instance ${instance.uuid} of entity ${parentUuid}: ` +
              error
          )
        );
      }
    }
  };
}
