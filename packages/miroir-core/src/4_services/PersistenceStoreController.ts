import { Uuid } from "../0_interfaces/1_core/EntityVersion";
import {
  ApplicationSection,
  Entity,
  EntityInstance,
  EntityInstanceCollection,
  ModelActionAlterEntityAttribute,
  ModelActionInitModel,
  ModelActionInitModelParams,
  ModelActionRenameEntity,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  SelfApplication,
  StoreSectionConfiguration
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import {
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreControllerAction,
  PersistenceStoreControllerInterface,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
  StoreSectionFactoryRegister,
} from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
// import { applyModelEntityUpdate } from "../3_controllers/ActionRunner";
import {
  projectEntityInstance,
  projectEntityInstancesOnAttributes,
  resolveProjectionIdentityFields,
} from "../1_core/partials/instanceProjection.js";
import { modelInitialize } from "../3_controllers/ModelInitializer";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { MiroirLoggerFactory } from "./MiroirLoggerFactory";

import { entityEntity } from "miroir-test-app_deployment-miroir";
import { EntityInstanceWithName } from "../0_interfaces/1_core/Instance";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import {
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2Error,
  Action2ReturnType,
  Action2VoidReturnType,
  Domain2ElementFailed
} from "../0_interfaces/2_domain/DomainElement";
import { ACTION_OK } from "../1_core/constants";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { resolveInstanceParentUuid } from "../1_core/Entity/EntityPrimaryKey";
import { versionHistoryEntityUuids } from "../1_core/Model.js";
import { getVersionHistoryEntityDefinition } from "../1_core/Model.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceStoreController")
).then((logger: LoggerInterface) => {log = logger});


// #######################################################################################################################
export interface PersistenceStoreControllerFactoryReturnType {
  localMiroirPersistenceStoreController: PersistenceStoreControllerInterface,
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
}


// #######################################################################################################################
export async function storeSectionFactory (
  StoreSectionFactoryRegister:StoreSectionFactoryRegister,
  section:ApplicationSection,
  config: StoreSectionConfiguration,
  filesystemDeploymentRootDirectory: string,
  dataStore?: PersistenceStoreDataSectionInterface,
):Promise<PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface> {
  log.info(
    "PersistenceStoreController storeSectionFactory called for",
    section,
    config,
    StoreSectionFactoryRegister,
  );
  if (section == 'model' && !dataStore) {
    throw new Error('PersistenceStoreController storeSectionFactory model section factory must receive data section store.')
  }
  const storeFactoryRegisterKey:string = JSON.stringify({storageType:config.emulatedServerType,section});
  log.info("PersistenceStoreController storeSectionFactory storeFactoryRegisterKey", storeFactoryRegisterKey);
  const foundStoreSectionFactory = StoreSectionFactoryRegister.get(storeFactoryRegisterKey);
  if (foundStoreSectionFactory) {
    if (section == 'model') {
      return foundStoreSectionFactory(section,config,filesystemDeploymentRootDirectory,dataStore)
    } else {
      return foundStoreSectionFactory(section,config,filesystemDeploymentRootDirectory)
    }
  } else {
    throw new Error('foundStoreFactory is undefined for ' + config.emulatedServerType + ', section ' + section)
  }
}


// #######################################################################################################################
// #######################################################################################################################
// #######################################################################################################################
// #######################################################################################################################
// MAIN CLASS: PersistenceStoreController
// #######################################################################################################################
export class PersistenceStoreController implements PersistenceStoreControllerInterface {
  private logHeader: string;

  constructor(
    private adminStore: PersistenceStoreAdminSectionInterface,
    private modelStoreSection: PersistenceStoreModelSectionInterface,
    private dataStoreSection: PersistenceStoreDataSectionInterface,
    /** #232 — optional; version-history section. Absence causes named error on modelVersion requests. */
    private modelVersionStoreSection?: PersistenceStoreDataSectionInterface,
  ) {
    this.logHeader = "PersistenceStoreController " + modelStoreSection.getStoreName();
  }

  // #########################################################################################
  getStoreName(): string {
    return this.modelStoreSection.getStoreName();
  }

  /**
   * #232 — resolve a section to its backing store, or return Action2Error for an unconfigured
   * modelVersion section (instead of silently falling through to data or model).
   */
  private getSectionInstanceStore(
    section: ApplicationSection,
  ):
    | PersistenceStoreDataSectionInterface
    | PersistenceStoreModelSectionInterface
    | Action2Error {
    if (section === "modelVersion") {
      if (!this.modelVersionStoreSection) {
        return new Action2Error(
          "FailedToOpenStore",
          `modelVersion section is not configured for this deployment (store: ${this.logHeader}). Add a modelVersion section to the deployment configuration to persist version history.`,
        );
      }
      return this.modelVersionStoreSection;
    }
    return section === "model" ? this.modelStoreSection : this.dataStoreSection;
  }

  // #############################################################################################
  async handleBoxedQueryAction(
    action: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType> {
    // TODO: fix applicationSection!!!
    log.info(
      this.logHeader,
      "handleBoxedQueryAction called with RunBoxedQueryAction",
      JSON.stringify(action, null, 2),
      // "applicationDeploymentMap",
      // JSON.stringify(applicationDeploymentMap, null, 2),
    );
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);

    // TODO: composite actions / queries could execute on different sections, how should this be dealt with?
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const section = action.payload.applicationSection;
    if (!section) {
      return new Action2Error(
        "InvalidAction",
        `${this.logHeader} handleBoxedQueryAction missing applicationSection on query payload.`,
      );
    }
    const currentStore = this.getSectionInstanceStore(section);
    if (currentStore instanceof Action2Error) {
      return currentStore;
    }
    const result: Action2ReturnType = await currentStore.handleBoxedQueryAction(
      action,
      applicationDeploymentMap,
      currentModel
    );

    log.info(
      this.logHeader,
      "handleBoxedQueryAction done  for query",
      action,
      "result",
      JSON.stringify(result)
    );
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleQueryTemplateActionForServerONLY(
    action: RunBoxedQueryTemplateAction,
    appliationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType> {
    // TODO: fix applicationSection!!!
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);

    // TODO: composite actions / queries could execute on different sections, how should this be dealt with?
    // RIGHT NOW RESTRICT ALL SUBQUERIES OF A QUERY TO THE SAME SECTION !!!!
    const section = action.payload.applicationSection;
    if (!section) {
      return new Action2Error(
        "InvalidAction",
        `${this.logHeader} handleQueryTemplateActionForServerONLY missing applicationSection on query payload.`,
      );
    }
    const currentStore = this.getSectionInstanceStore(section);
    if (currentStore instanceof Action2Error) {
      return currentStore;
    }

    log.info(this.logHeader, "handleQueryTemplateActionForServerONLY", "query", action, 
      section, currentStore.getStoreName());

    const result: Action2ReturnType = await currentStore.handleQueryTemplateActionForServerONLY(
      action,
      appliationDeploymentMap,
      currentModel
    );

    log.info(
      this.logHeader,
      "handleQueryTemplateActionForServerONLY",
      "query",
      action,
      "result",
      JSON.stringify(result)
    );
    return Promise.resolve(result);
  }

  // #############################################################################################
  async handleAction(
    persistenceStoreControllerAction: PersistenceStoreControllerAction
  ): Promise<Action2ReturnType> {
    switch (persistenceStoreControllerAction.actionType) {
      case "initModel":
      case "commit":
      case "rollback":
      case "remoteLocalCacheRollback":
      case "resetModel":
      case "resetData":
      case "alterEntityAttribute":
      case "renameEntity":
      case "createEntity":
      case "dropEntity": {
        // const storeManagementAction: ModelAction = body;
        // log.info('modelActionStoreRunnerNotUsed action', JSON.stringify(update,undefined,2));
        log.info("handleAction action", persistenceStoreControllerAction);
        switch (persistenceStoreControllerAction.actionType) {
          case "dropEntity": {
            // await targetProxy.dropEntity(update.modelEntityUpdate.entityUuid);
            return this.dropEntity(persistenceStoreControllerAction.payload.entityUuid);
            break;
          }
          case "renameEntity": {
            return this.renameEntityClean(persistenceStoreControllerAction);
            break;
          }
          case "resetModel": {
            log.debug("handleAction resetModel update");
            await this.clear();
            // await appDataStoreProxy.clear();
            log.trace("handleAction resetModel after dropped entities:", this.getEntityUuids());
            break;
          }
          case "alterEntityAttribute": {
            return this.alterEntityAttribute(persistenceStoreControllerAction);
            break;
          }
          case "resetData": {
            log.debug("handleAction resetData update");
            await this.clearDataInstances();
            log.trace(
              "handleAction resetData after cleared data contents for entities:",
              this.getEntityUuids()
            );
            break;
          }
          case "initModel": {
            const modelActionInitModel = persistenceStoreControllerAction as ModelActionInitModel;
            const params: ModelActionInitModelParams = modelActionInitModel.payload.params;
            log.debug("handleAction initModel params", params);

            await this.initApplicationDeploymentStore(params);
            break;
          }
          // case "alterEntityAttribute":
          case "commit":
          case "rollback": {
            throw new Error(
              "handleAction could not handle action" +
                JSON.stringify(persistenceStoreControllerAction)
            );
          }
          case "createEntity": {
            log.debug(
              "handleAction applyModelEntityUpdates createEntity inserting",
              persistenceStoreControllerAction.payload.entities
            );
            // #220: Action payload.entities is Entity[]
            return this.createEntities(persistenceStoreControllerAction.payload.entities);
            break;
          }
          default:
            log.warn("handleAction could not handle action", persistenceStoreControllerAction);
            break;
        }
        break;
      }
      // case "instanceAction": {
      case "createInstance":
      case "updateInstance": {
        for (const instance of persistenceStoreControllerAction.payload.objects) {
          log.info(
            this.logHeader,"handleAction upsertInstance for section: ", persistenceStoreControllerAction.payload.applicationSection,
            "instance", instance
          )
          // for (const instance of instanceCollection.instances) {
            const result = await this.upsertInstance(
              persistenceStoreControllerAction.payload.applicationSection,
              instance,
              persistenceStoreControllerAction.payload.parentUuid
            );
            if (
              result instanceof Action2Error ||
              result.returnedDomainElement instanceof Domain2ElementFailed
            ) {
              log.error(
                this.logHeader,
                "handleAction upsertInstance failed for section: ",
                persistenceStoreControllerAction.payload.applicationSection,
                "instance",
                instance,
                "error:",
                result
              );
              return result;
            // }
          }
        }
        break;
      }
      case "deleteInstance": {
        // for (const instanceCollection of persistenceStoreControllerAction.payload.objects) {
          const result = await this.deleteInstances(
            persistenceStoreControllerAction.payload.applicationSection,
            persistenceStoreControllerAction.payload.objects,
            persistenceStoreControllerAction.payload.parentUuid
          );
          if (
            result instanceof Action2Error ||
            result.returnedDomainElement instanceof Domain2ElementFailed
          ) {
            log.error(
              this.logHeader,
              "handleAction deleteInstances failed for section: ",
              persistenceStoreControllerAction.payload.applicationSection,
              "instances",
              persistenceStoreControllerAction.payload.objects,
              "error:",
              result
            );
            return result;
          }
        // }
        break;
      }
      case "deleteInstanceWithCascade": {
        throw new Error(
          "PersistenceStoreController handleAction can not handle deleteInstanceWithCascade action!"
        );
      }
      case "loadNewInstancesInLocalCache": {
        throw new Error(
          "PersistenceStoreController handleAction can not handle loadNewInstancesInLocalCache action!"
        );
        break;
      }
      case "getInstance": {
        return this.getInstance(
          persistenceStoreControllerAction.payload.applicationSection,
          persistenceStoreControllerAction.payload.parentUuid,
          persistenceStoreControllerAction.payload.uuid,
          (persistenceStoreControllerAction.payload as { attributes?: string[] }).attributes
        );
        break;
      }
      case "getInstances": {
        return this.getInstances(
          persistenceStoreControllerAction.payload.applicationSection,
          persistenceStoreControllerAction.payload.parentUuid,
          (persistenceStoreControllerAction.payload as { attributes?: string[] }).attributes
        );
        break;
      }
      default: {
        throw new Error(
          "PersistenceStoreController handleAction could not handleAction " +
            persistenceStoreControllerAction
        );
        break;
      }
    }
    log.debug("handleAction returning empty response.");
    return Promise.resolve(ACTION_OK);
  }

  // #############################################################################################
  async initApplicationDeploymentStore(params: ModelActionInitModelParams) {
    log.info("ActionRunner.ts initApplicationDeploymentStore model/initModel params", params);
    if (params.dataStoreType == "miroir") {
      // TODO: improve, test is dirty
      // await modelInitialize(
      await this.initApplication(
        params.dataStoreType,
        params.selfApplication,
        params.applicationModelBranch,
        params.applicationVersion,
        // params.metaModel,
      );
      log.info(
        "ActionRunner.ts initApplicationDeploymentStore miroir model/initModel contents",
        await this.getState()
      );
    } else {
      // different Proxy object!!!!!!
      // await modelInitialize(
      await this.initApplication(
        "app",
        params.selfApplication,
        params.applicationModelBranch,
        params.applicationVersion,
        // params.metaModel,
      );
      log.info(
        "ActionRunner.ts initApplicationDeploymentStore app model/initModel contents",
        await this.getState()
      );
    }
    log.debug("server post resetModel after initModel, entities:", this.getEntityUuids());
  }
  // #############################################################################################
  async initApplication(
    dataStoreType: DataStoreApplicationType,
    selfApplication: SelfApplication,
    selfApplicationModelBranch: EntityInstance,
    selfApplicationVersion: EntityInstance,
  ): Promise<Action2ReturnType> {
    return modelInitialize(
      this,
      dataStoreType,
      selfApplication,
      selfApplicationModelBranch,
      selfApplicationVersion,
    );
  }

  // #############################################################################################
  async bootFromPersistedState(
    metaModelEntities: Entity[],
  ): Promise<Action2VoidReturnType> {
    const modelBootFromPersistedState: Action2ReturnType =
      await this.modelStoreSection.bootFromPersistedState(
        metaModelEntities,
        // metaModelEntityDefinitions
      );
    if (modelBootFromPersistedState instanceof Action2Error) {
      return new Action2Error(
        "FailedToGetInstances",
        `bootFromPersistedState failed for section model: ${modelBootFromPersistedState.errorMessage}`
      );
    }
    const dataEntities: Action2EntityInstanceCollectionOrFailure =
      await this.modelStoreSection.getInstances(entityEntity.uuid);

    if (
      dataEntities instanceof Action2Error ||
      dataEntities.returnedDomainElement instanceof Domain2ElementFailed
    ) {
      return new Action2Error(
        "FailedToGetInstances",
        `bootFromPersistedState for entities getInstances(${entityEntity.uuid}) status: ${
          dataEntities.status
        }. Message: ${dataEntities instanceof Action2Error ? dataEntities?.errorMessage : ""}`
      );
    }

    log.info(
      this.logHeader,
      "bootFromPersistedState for data section with dataEntities",
      dataEntities
    );
    const dataBootFromPersistedState = await this.dataStoreSection.bootFromPersistedState(
      ((dataEntities as any).returnedDomainElement?.instances as Entity[]).filter(
        (e) => e.name !== "Entity",
      ),
    );
    if (
      dataBootFromPersistedState instanceof Action2Error ||
      dataBootFromPersistedState.returnedDomainElement instanceof Domain2ElementFailed
    ) {
      return new Action2Error(
        "FailedToGetInstances",
        `bootFromPersistedState failed for section data: ${dataBootFromPersistedState}`
      );
    }

    if (this.modelVersionStoreSection) {
      const modelEntities = ((dataEntities as any).returnedDomainElement?.instances as Entity[]) ?? [];
      const versionHistoryEntities = modelEntities.filter((entity) =>
        versionHistoryEntityUuids.has(entity.uuid!),
      );
      const modelVersionBootFromPersistedState =
        await this.modelVersionStoreSection.bootFromPersistedState(versionHistoryEntities);
      if (modelVersionBootFromPersistedState instanceof Action2Error) {
        return new Action2Error(
          "FailedToGetInstances",
          `bootFromPersistedState failed for section modelVersion: ${modelVersionBootFromPersistedState.errorMessage}`,
        );
      }
    }

    return Promise.resolve(ACTION_OK);
  }

  // #############################################################################################
  async open(): Promise<Action2VoidReturnType> {
    await this.adminStore.open();
    await this.dataStoreSection.open();
    await this.modelStoreSection.open();
    if (this.modelVersionStoreSection) {
      await this.modelVersionStoreSection.open();
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async close(): Promise<Action2VoidReturnType> {
    await this.adminStore.close();
    await this.modelStoreSection.close();
    await this.dataStoreSection.close();
    if (this.modelVersionStoreSection) {
      await this.modelVersionStoreSection.close();
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async createStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    return this.adminStore.createStore(config);
  }

  // ##############################################################################################
  async deleteStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "deleteStore, adminStore.getStoreName()=", this.adminStore.getStoreName());
    await this.close();
    return this.adminStore.deleteStore(config);
  }

  // ##############################################################################################
  async clear(): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "clear", this.getEntityUuids());
    await this.dataStoreSection.clear();
    await this.modelStoreSection.clear();
    if (this.modelVersionStoreSection) {
      await this.modelVersionStoreSection.clear();
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  // TODO: detect & return error, add test for this!
  async clearDataInstances(): Promise<Action2VoidReturnType> {
    log.debug(this.logHeader, "clearDataInstances", this.getEntityUuids());
    const dataSectionEntities: Action2EntityInstanceCollectionOrFailure = await this.getInstances(
      "model",
      entityEntity.uuid
    );
    if (dataSectionEntities instanceof Action2Error) {
      return new Action2Error(
        "FailedToGetInstances",
        `clearDataInstances failed for dataSectionEntities section: model, entityUuid ${entityEntity.uuid}, error: ${dataSectionEntities.errorType}, ${dataSectionEntities.errorMessage}`
      );
    }
    if (dataSectionEntities.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Action2Error(
        "FailedToGetInstances",
        `clearDataInstances failed for dataSectionEntities section: model, entityUuid ${entityEntity.uuid}, error: ${dataSectionEntities}`
      );
    }
    // #222 — Miroir EntityVersion instances live in data (only Entity stays model-only).
    // Other apps may get an unused empty EntityVersion data table; reads still use getApplicationSection.
    const dataSectionFilteredEntities: Entity[] = (
      dataSectionEntities.returnedDomainElement.instances as Entity[]
    ).filter((e: EntityInstanceWithName) => e.name !== "Entity");
    log.trace(
      this.logHeader,
      "clearDataInstances found entities to clear:",
      dataSectionFilteredEntities
    );
    await this.dataStoreSection.clear();

    for (const entity of dataSectionFilteredEntities) {
      // #220 — Entity-only storage space; present model lives on Entity.
      await this.createDataStorageSpaceForInstancesOfEntity(entity);
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  existsEntity(entityUuid: string): boolean {
    return this.modelStoreSection.existsEntity(entityUuid);
  }

  // #############################################################################################
  getEntityUuids(): string[] {
    return this.dataStoreSection.getEntityUuids();
  }

  // #############################################################################################
  getEntityIdAttribute(entityUuid: string): string | string[] {
    return this.dataStoreSection.getEntityIdAttribute(entityUuid);
  }

  // #############################################################################################
  getModelEntities(): string[] {
    return this.modelStoreSection.getEntityUuids();
  }

  // ##############################################################################################
  async createModelStorageSpaceForInstancesOfEntity(
    entity: Entity,
  ): Promise<Action2VoidReturnType> {
    return this.modelStoreSection.createStorageSpaceForInstancesOfEntity(entity);
  }

  // ##############################################################################################
  async createDataStorageSpaceForInstancesOfEntity(
    entity: Entity,
  ): Promise<Action2VoidReturnType> {
    return this.dataStoreSection.createStorageSpaceForInstancesOfEntity(entity);
  }

  /**
   * #232 — SQL (and other structured backends) require entity tables in the modelVersion
   * schema before instance upserts. Filesystem creates directories lazily on upsert.
   * TODO: Filesystem should create directories eagerly on Entity creation
   * TODO: this is called at upsert, this is HIGHLY inefficient. Create operation should void theneed for this.
   */
  private async ensureModelVersionStorageForEntity(
    parentEntityUuid: string,
  ): Promise<Action2VoidReturnType> {
    if (!this.modelVersionStoreSection) {
      return new Action2Error(
        "FailedToUpsertInstance",
        "modelVersion section is not configured for this deployment.",
      );
    }
    if (this.modelVersionStoreSection.getEntityUuids().includes(parentEntityUuid)) {
      return ACTION_OK;
    }
    const entitiesResult = await this.modelStoreSection.getInstances(entityEntity.uuid);
    if (entitiesResult instanceof Action2Error) {
      return entitiesResult;
    }
    const collection = entitiesResult.returnedDomainElement;
    if (!collection || collection instanceof Domain2ElementFailed) {
      return new Action2Error(
        "FailedToUpsertInstance",
        `modelVersion upsert: could not load model Entity catalog for ${parentEntityUuid}.`,
      );
    }
    const entityDef = (collection.instances ?? []).find(
      (candidate) => candidate.uuid === parentEntityUuid,
    ) as Entity | undefined;
    const resolvedEntityDef =
      entityDef ?? getVersionHistoryEntityDefinition(parentEntityUuid);
    if (!resolvedEntityDef) {
      return new Action2Error(
        "FailedToUpsertInstance",
        `modelVersion upsert: Entity ${parentEntityUuid} not registered in model section.`,
      );
    }
    return this.modelVersionStoreSection.createStorageSpaceForInstancesOfEntity(resolvedEntityDef);
  }

  // ##############################################################################################
  async createEntity(entity: Entity): Promise<Action2VoidReturnType> {
    const result = await this.modelStoreSection.createEntity(entity);
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async createEntities(entities: Entity[]): Promise<Action2VoidReturnType> {
    const result = await this.modelStoreSection.createEntities(entities);
    return Promise.resolve(result);
  }

  // ##############################################################################################
  async renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType> {
    return this.modelStoreSection.renameEntityClean(update);
  }

  // ##############################################################################################
  async alterEntityAttribute(
    update: ModelActionAlterEntityAttribute
  ): Promise<Action2VoidReturnType> {
    return this.modelStoreSection.alterEntityAttribute(update);
  }

  // ##############################################################################################
  async dropEntity(entityUuid: string): Promise<Action2VoidReturnType> {
    return this.modelStoreSection.dropEntity(entityUuid);
  }

  // ##############################################################################################
  async dropEntities(entityUuids: string[]): Promise<Action2VoidReturnType> {
    return this.modelStoreSection.dropEntities(entityUuids);
  }

  // ##############################################################################################
  // used only for testing purposes!
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    return this.dataStoreSection.getState();
  }

  // ##############################################################################################
  // used only for testing purposes!
  async getDataState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    return this.dataStoreSection.getState();
  }

  // ##############################################################################################
  // used only for testing purposes!
  async getModelState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    return this.modelStoreSection.getState();
  }

  // #############################################################################################
  async getInstance(
    section: ApplicationSection,
    entityUuid: string,
    instancePrimaryKey: Uuid,
    attributes?: string[],
  ): Promise<Action2EntityInstanceReturnType> {
    log.info(this.logHeader, "getInstance", "section", section, "entity", entityUuid, "instancePrimaryKey", instancePrimaryKey);

    const currentStore = this.getSectionInstanceStore(section);
    if (currentStore instanceof Action2Error) {
      return currentStore;
    }
    const result: Action2EntityInstanceReturnType = await currentStore.getInstance(
      entityUuid,
      instancePrimaryKey,
    );
    log.trace(
      this.logHeader,
      "getInstance",
      "section",
      section,
      "entity",
      entityUuid,
      "instancePrimaryKey",
      instancePrimaryKey,
      "result",
      result
    );
    if (
      attributes &&
      attributes.length > 0 &&
      !(result instanceof Action2Error) &&
      !(result.returnedDomainElement instanceof Domain2ElementFailed) &&
      result.returnedDomainElement &&
      typeof result.returnedDomainElement === "object"
    ) {
      // #220 — PK identity from Entity (via registered idAttribute), not EntityVersion.
      // TODO: enable caching of the current model entities to drastically reduce the lookup time! (use local cache?)
      const identityFields = resolveProjectionIdentityFields({
        idAttribute: this.getEntityIdAttribute(entityUuid),
      });
      return {
        ...result,
        returnedDomainElement: projectEntityInstance(
          result.returnedDomainElement as Record<string, unknown>,
          attributes,
          identityFields
        ) as EntityInstance,
      };
    }
    return result;
  }

  // #############################################################################################
  async getInstances(
    section: ApplicationSection,
    entityUuid: string,
    attributes?: string[],
  ): Promise<Action2EntityInstanceCollectionOrFailure> {
    // TODO: fix applicationSection!!!
    
    const currentStore = this.getSectionInstanceStore(section);
    if (currentStore instanceof Action2Error) {
      return currentStore;
    }
    log.info(
      this.logHeader,
      "getInstances",
      "section",
      section,
      "entity",
      entityUuid,
      "storeName",
      "'" + currentStore.getStoreName() + "'",
    );
    const instances: Action2EntityInstanceCollectionOrFailure = await currentStore.getInstances(
      entityUuid
    );

    if (instances instanceof Action2Error) {
      return new Action2Error(
        "FailedToGetInstances",
        `getInstances failed for section: ${section}, entityUuid ${entityUuid}, error: ${instances.errorType}, ${instances.errorMessage}`
      );
    }
    if (instances.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Action2Error(
        "FailedToGetInstances",
        `getInstances failed for section: ${section}, entityUuid ${entityUuid}, error: ${instances}`
      );
    }

    if (attributes && attributes.length > 0) {
      const collection = instances.returnedDomainElement;
      // #220 — PK identity from Entity (via registered idAttribute), not EntityVersion.
      const identityFields = resolveProjectionIdentityFields({
        idAttribute: this.getEntityIdAttribute(entityUuid),
      });
      return {
        ...instances,
        returnedDomainElement: {
          ...collection,
          instances: projectEntityInstancesOnAttributes(
            (collection.instances ?? []) as Record<string, unknown>[],
            attributes,
            identityFields
          ) as EntityInstance[],
        },
      };
    }

    // log.info(this.logHeader,'getInstances succeeded','section',section,'entity',entityUuid, "result", instances);
    // log.info(this.logHeader,'getInstances succeeded','section',section,'entity',entityUuid, "result", JSON.stringify(instances));
    // log.info(
    //   this.logHeader,
    //   "getInstances succeeded",
    //   "section",
    //   section,
    //   "entity",
    //   entityUuid,
    //   "result",
    //   JSON.stringify(instances)
    // );
    return instances;
  }

  // ##############################################################################################
  async upsertInstance(
    section: ApplicationSection,
    instance: EntityInstance,
    parentUuid?: string
  ): Promise<Action2VoidReturnType> {
    const resolvedParentUuid = resolveInstanceParentUuid(instance, parentUuid);
    if (resolvedParentUuid instanceof Action2Error) {
      log.error(this.logHeader, "upsertInstance failed to resolve parentUuid for instance", instance);
      return resolvedParentUuid;
    }
    log.info(
      this.logHeader,
      "upsertInstance",
      "section",
      section,
      "parentUuid",
      resolvedParentUuid,
      "modelStoreName",
      "'" + this.modelStoreSection.getStoreName() + "'",
      "dataStoreName",
      "'" + this.dataStoreSection.getStoreName() + "'",
      "instance",
      instance,
      "model entities",
      this.getModelEntities(),
      "data entities",
      this.getEntityUuids()
    );

    const currentStore = this.getSectionInstanceStore(section);
    if (currentStore instanceof Action2Error) {
      return currentStore;
    }

    if (section === "modelVersion") {
      const ensureStorage = await this.ensureModelVersionStorageForEntity(resolvedParentUuid);
      if (ensureStorage instanceof Action2Error) {
        return ensureStorage;
      }
      return currentStore.upsertInstance(resolvedParentUuid, instance);
    }

    if (section == "data") {
      if (this.getEntityUuids().indexOf(resolvedParentUuid) == -1) {
        log.error(
          this.logHeader,
          "upsertInstance failed for section: ",
          section,
          "entityUuid",
          resolvedParentUuid,
          "error: Entity not found in data section, existing entities: " + this.getEntityUuids()
        );
        return new Action2Error(
          "FailedToUpsertInstance",
          `upsertInstance failed for section: ${section}, entityUuid ${resolvedParentUuid}, error: Entity not found in data section, existing entities: ${this.getEntityUuids()}.`
        );
      }
      return currentStore.upsertInstance(resolvedParentUuid, instance);
    }

    if (this.getModelEntities().indexOf(resolvedParentUuid) == -1) {
      log.error(
        this.logHeader,
        "upsertInstance failed for section: ",
        section,
        "entityUuid",
        resolvedParentUuid,
        "error: Entity not found in model section."
      );
      return new Action2Error(
        "FailedToUpsertInstance",
        `upsertInstance failed for section: ${section}, entityUuid ${resolvedParentUuid}, error: Entity not found in model section.`
      );
    }
    return currentStore.upsertInstance(resolvedParentUuid, instance);
  }

  // ##############################################################################################
  async deleteInstance(
    section: ApplicationSection,
    instance: EntityInstance,
    parentUuid?: string
  ): Promise<Action2VoidReturnType> {
    const resolvedParentUuid = resolveInstanceParentUuid(instance, parentUuid);
    if (resolvedParentUuid instanceof Action2Error) {
      log.error(this.logHeader, "deleteInstance failed to resolve parentUuid for instance", instance);
      return resolvedParentUuid;
    }
    const currentStore = this.getSectionInstanceStore(section);
    if (currentStore instanceof Action2Error) {
      return currentStore;
    }
    return currentStore.deleteInstance(resolvedParentUuid, instance);
  }

  // ##############################################################################################
  async deleteInstances(
    section: ApplicationSection,
    instances: EntityInstance[],
    payloadParentUuid?: string
  ): Promise<Action2VoidReturnType> {
    for (const instance of instances) {
      const resolvedParentUuid = resolveInstanceParentUuid(instance, payloadParentUuid);
      if (resolvedParentUuid instanceof Action2Error) {
        log.error(this.logHeader, "deleteInstances failed to resolve parentUuid for instance", instance);
        return resolvedParentUuid;
      }
      const currentStore = this.getSectionInstanceStore(section);
      if (currentStore instanceof Action2Error) {
        return currentStore;
      }
      const deleteResult = await currentStore.deleteInstance(resolvedParentUuid, instance);
      if (deleteResult instanceof Action2Error) {
        return deleteResult;
      }
    }
    return Promise.resolve(ACTION_OK);
  }
}
