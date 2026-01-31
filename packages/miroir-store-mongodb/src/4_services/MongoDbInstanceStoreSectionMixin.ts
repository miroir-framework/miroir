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
import { MongoDbStoreSection, MixableMongoDbStoreSection } from "./MongoDbStoreSection.js";

import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MongoDbInstanceStoreSectionMixin")
).then((logger: LoggerInterface) => {log = logger});

export const MixedMongoDbInstanceStoreSection = MongoDbInstanceStoreSectionMixin(MongoDbStoreSection);

/**
 * Mixin that adds instance CRUD operations to a MongoDB store section.
 * Implements PersistenceStoreInstanceSectionAbstractInterface.
 */
export function MongoDbInstanceStoreSectionMixin<TBase extends MixableMongoDbStoreSection>(Base: TBase) {
  return class MixedMongoDbInstanceStoreSection
    extends Base
    implements PersistenceStoreInstanceSectionAbstractInterface
  {
    public extractorTemplateRunner: ExtractorTemplateRunnerInMemory;
    public extractorRunner: ExtractorRunnerInMemory;

    constructor(
      // public mongoDbStoreName: string;
      // public localUuidMongoDb: MongoDb;
      // public logHeader: string;
      ...args: any[]
    ) {
      super(...args);
      this.extractorRunner = new ExtractorRunnerInMemory(this);
      this.extractorTemplateRunner = new ExtractorTemplateRunnerInMemory(
        this,
        this.extractorRunner
      );
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
        const result = await this.localUuidMongoDb.getInstance(parentUuid, uuid);
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
        const result: EntityInstance[] = await this.localUuidMongoDb.getAllInstances(parentUuid);
        return Promise.resolve({
          status: "ok",
          returnedDomainElement: {
            parentUuid,
            applicationSection: this.localUuidMongoDb.applicationSection,
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
        if (this.localUuidMongoDb.hasCollection(instance.parentUuid)) {
          return this.localUuidMongoDb.putInstance(instance.parentUuid, instance);
        } else {
          log.error(this.logHeader, "upsertInstance", instance.parentUuid, "does not exist.");
          return Promise.resolve(
            new Action2Error(
              "FailedToUpdateInstance",
              `failed to upsert instance ${instance.uuid} of entity ${parentUuid}`
            )
          );
        }
      } catch (error) {
        log.error(
          this.logHeader,
          "upsertInstance",
          instance.parentUuid,
          "could not upsert instance",
          instance,
          error
        );
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
        return this.localUuidMongoDb.deleteInstance(parentUuid, instance.uuid);
      } catch (error) {
        log.error(
          this.logHeader,
          "deleteInstance",
          parentUuid,
          "could not delete instance",
          instance,
          error
        );
        return Promise.resolve(
          new Action2Error(
            "FailedToDeleteInstance",
            `failed to delete instance ${instance.uuid} of entity ${parentUuid}: ` + error
          )
        );
      }
    }
  };
}
