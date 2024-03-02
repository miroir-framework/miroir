import { v4 as uuidv4 } from 'uuid';

import { MetaEntity, Uuid } from '../0_interfaces/1_core/EntityDefinition.js';
import {
  CRUDActionName,
  DomainControllerInterface,
  LocalCacheInfo
} from "../0_interfaces/2_domain/DomainControllerInterface";

import { MiroirContextInterface } from '../0_interfaces/3_controllers/MiroirContextInterface';
import {
  LocalCacheInterface
} from "../0_interfaces/4-services/LocalCacheInterface.js";
import { RemoteStoreCRUDAction, RemoteStoreInterface } from '../0_interfaces/4-services/RemoteStoreInterface.js';


import applicationDeploymentMiroir from '../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
import instanceConfigurationReference from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityApplicationVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';

import {
  ApplicationSection,
  ApplicationVersion,
  DomainAction,
  EntityInstance,
  EntityInstanceCollection,
  InstanceAction,
  MetaModel,
  ModelAction,
  TransactionalInstanceAction,
  UndoRedoAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from '../0_interfaces/4-services/LoggerInterface';
import { MiroirLoggerFactory } from '../4_services/Logger';
import { packageName } from '../constants.js';
import { getLoggerName } from '../tools';
import { Endpoint } from './Endpoint.js';
import { CallUtils } from './ErrorHandling/CallUtils.js';
import { metaModelEntities, miroirModelEntities } from './ModelInitializer';
import { cleanLevel } from './constants.js';

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);


/**
 * domain level contains "business" logic related to concepts defined whithin the
 * application: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class DomainController implements DomainControllerInterface {
  private callUtil: CallUtils;
  constructor(
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private remoteStore: RemoteStoreInterface,
    private endpoint: Endpoint
  ) {
    this.callUtil = new CallUtils(miroirContext.errorLogService, localCache, remoteStore);
  }

  getRemoteStore(): RemoteStoreInterface {
    return this.remoteStore;
  }
  // ##############################################################################################
  currentTransaction(): (TransactionalInstanceAction | ModelAction)[] {
    return this.localCache.currentTransaction();
  }

  // ##############################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.localCache.currentInfo();
  }

  // ##############################################################################################
  // converts a Domain transactional action into a set of local cache actions and remote store actions
  async handleDomainUndoRedoAction(
    deploymentUuid: Uuid,
    undoRedoAction: UndoRedoAction,
    currentModel: MetaModel
  ): Promise<void> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainUndoRedoAction start actionName",
      undoRedoAction["actionName"],
      "deployment",
      deploymentUuid,
      "action",
      undoRedoAction
    );
    try {
      switch (undoRedoAction.actionName) {
        case "undo":
        case "redo": {
          this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // context update
            "handleAction",
            undoRedoAction
          );

          break;
        }
        default: {
          log.warn(
            "DomainController handleDomainUndoRedoAction cannot handle action name for",
            undoRedoAction
          );
          break;
        }
      }
    } catch (error) {
      log.warn(
        "DomainController handleDomainUndoRedoAction caught exception when handling",
        undoRedoAction["actionName"],
        "deployment",
        deploymentUuid,
        "action",
        undoRedoAction,
        "exception",
        error
      );
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async handleInstanceAction(
    deploymentUuid: Uuid,
    instanceAction: InstanceAction
  ): Promise<void> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainNonTransactionalInstanceAction deployment",
      deploymentUuid,
      "instanceAction",
      instanceAction
      // domainDataNonTransactionalCUDAction.actionName,
      // domainDataNonTransactionalCUDAction.objects
    );
    // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)

    // The same action is performed on the local cache and on the remote store for Data Instances.
      await this.callUtil.callRemoteAction(
        {}, // context
        {}, // context update
        "handleRemoteStoreAction",
        deploymentUuid,
        instanceAction
      );
      log.info(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
        deploymentUuid,
        "handleDomainNonTransactionalInstanceAction done calling handleRemoteStoreRestCRUDAction",
        instanceAction
      );
      await this.callUtil.callLocalCacheAction(
        {}, // context
        {}, // context update
        "handleAction",
        instanceAction
      );

      log.info(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",
        deploymentUuid,
        "handleDomainNonTransactionalInstanceAction end",
        instanceAction
      );
    return Promise.resolve();
  }

  // ##############################################################################################
  // converts a Domain model action into a set of local cache actions and remote store actions
  async handleModelAction(
    deploymentUuid: Uuid,
    modelAction: ModelAction,
    currentModel: MetaModel
  ): Promise<void> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction start actionName",
      modelAction["actionName"],
      "deployment",
      deploymentUuid,
      "action",
      modelAction
    );
    try {
      switch (modelAction.actionName) {
        case "rollback": {
          await this.loadConfigurationFromRemoteDataStore(deploymentUuid);
          break;
        }
        case 'alterEntityAttribute':
        case 'createEntity':
        case 'renameEntity':
        case 'dropEntity': {
          await this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // context update
            "handleAction",
              modelAction,
          );
          break;
        }
        case "resetModel":
        case "resetData":
        case "initModel": {
          await this.callUtil.callRemoteAction(
            {}, // context
            {}, // context update
            "handleRemoteStoreAction",
            modelAction.deploymentUuid,
            modelAction
          );
          break;
        }
        case "commit": {
          log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit", this.localCache.currentTransaction());

          if (!currentModel) {
            throw new Error(
              "commit operation did not receive current model. It requires the current model, to access the pre-existing transactions."
            );
          } else {
            const sectionOfapplicationEntities: ApplicationSection =
              modelAction.deploymentUuid == applicationDeploymentMiroir.uuid ? "data" : "model";
            const newModelVersionUuid = uuidv4();
            // const newModelVersion: MiroirApplicationVersionOLD_DO_NOT_USE = {
            const newModelVersion: ApplicationVersion = {
              uuid: newModelVersionUuid,
              // conceptLevel: "Data",
              parentName: entityApplicationVersion?.name,
              parentUuid: entityApplicationVersion?.uuid,
              description: "TODO: no description yet",
              name: "TODO: No label was given to this version.",
              previousVersion: currentModel?.configuration[0]?.definition?.currentApplicationVersion,
              // branch: applicationModelBranchMiroirMasterBranch.uuid,
              branch: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              // application:applicationMiroir.uuid, // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              application: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              modelStructureMigration: this.localCache.currentTransaction(),
              // .map((t: LocalCacheModelActionWithDeployment | DomainTransactionalInstanceAction) =>
              //   t.actionType == "localCacheModelActionWithDeployment" ? t : t.update
              // ),
            };

            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit create new version", newModelVersion);
            const newModelVersionAction: RemoteStoreCRUDAction = {
              actionType: "RemoteStoreCRUDAction",
              actionName: "create",
              section: sectionOfapplicationEntities,
              objects: [newModelVersion],
            };

            // in the case of the Miroir app, this should be done in the 'data' section
            await this.callUtil.callRemoteAction(
              {}, // context
              {}, // context update
              "handleRemoteStoreAction",
              deploymentUuid,
              newModelVersionAction
            );
            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit new version created", newModelVersion);

            for (const replayAction of this.localCache.currentTransaction()) {
              // const localReplayAction: LocalCacheTransactionalInstanceActionWithDeployment | ModelAction = replayAction;
              log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit replayAction", replayAction);
              switch (replayAction.actionType) {
                case "transactionalInstanceAction": {
                  // const localReplayAction: LocalCacheTransactionalInstanceActionWithDeployment = replayAction;
                      //  log.warn("handleModelAction commit ignored transactional action" + replayAction)
                      await this.callUtil.callRemoteAction(
                        {}, // context
                        {}, // context update
                        "handleRemoteStoreAction",
                        deploymentUuid,
                        {
                          actionType: "RemoteStoreCRUDAction",
                          actionName: replayAction.instanceAction.actionName.toString() as CRUDActionName,
                          section: replayAction.instanceAction.applicationSection,
                          parentName: replayAction.instanceAction.objects[0].parentName,
                          parentUuid: replayAction.instanceAction.objects[0].parentUuid,
                          objects: replayAction.instanceAction.objects[0].instances,
                        }
                      );
                  break;
                }
                case "modelAction": {
                  await this.callUtil.callRemoteAction(
                    {}, // context
                    {}, // context update
                    "handleRemoteStoreAction",
                    replayAction.deploymentUuid,
                    replayAction
                  );
                  break;
                }
                default:
                  throw new Error(
                    "DomainController handleModelAction commit could not handle replay action:" +
                      JSON.stringify(replayAction)
                  );
                  break;
              }
            }

            log.debug(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit actions replayed, currentTransaction:",
              this.localCache.currentTransaction()
            );

            await this.callUtil
              .callLocalCacheAction(
                {}, // context
                {}, // context update
                "handleAction",
                {
                  actionType: "modelAction",
                  actionName: "commit",
                  deploymentUuid:modelAction.deploymentUuid,
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                }
              )
              .then((context) => {
                log.debug(
                  "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit actions replayed and notified to local cache, currentTransaction:",
                  this.localCache.currentTransaction()
                );
                return this.callUtil.callLocalCacheAction(
                  {}, // context
                  {}, // context update
                  "handleAction",
                  {
                    actionType: "instanceAction",
                    actionName: "createInstance",
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    deploymentUuid:modelAction.deploymentUuid,
                    applicationSection: "model",
                    objects: [
                      {
                        parentUuid: newModelVersion.parentUuid,
                        applicationSection: sectionOfapplicationEntities,
                        instances: [newModelVersion],
                      },
                    ],
                  }
                );
              })
              .then((context) => {
                const updatedConfiguration = Object.assign({}, instanceConfigurationReference, {
                  definition: { currentApplicationVersion: newModelVersionUuid },
                });
                log.debug(
                  "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit updating configuration",
                  updatedConfiguration
                );
                const newStoreBasedConfiguration: RemoteStoreCRUDAction = {
                  actionType: "RemoteStoreCRUDAction",
                  actionName: "update",
                  section: sectionOfapplicationEntities,
                  objects: [updatedConfiguration],
                };
                // TODO: in the case of the Miroir app, this should be in the 'data'section
                return this.callUtil.callRemoteAction(
                  {}, // context
                  {}, // context update
                  "handleRemoteStoreAction",
                  deploymentUuid,
                  newStoreBasedConfiguration
                );
              });
              log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleModelAction commit done!");

          }
          break;
        }
        default: {
          log.warn("DomainController handleModelAction cannot handle action name for", modelAction);
          break;
        }
      }
    } catch (error) {
      log.warn(
        "DomainController handleModelAction caught exception when handling",
        modelAction["actionName"],
        "deployment",
        deploymentUuid,
        "action",
        modelAction,
        "exception",
        error
      );
    }
    return Promise.resolve();
  }

  //####################################################################################
  //####################################################################################
  //####################################################################################
  //####################################################################################
  /**
   * performs remote update before local update, so that whenever remote update fails, local value is not modified (going into the "catch").
   * @returns undefined when loading is finished
   */
  public async loadConfigurationFromRemoteDataStore(deploymentUuid: string): Promise<void> {
    log.info("DomainController loadConfigurationFromRemoteDataStore called for deployment", deploymentUuid);
    try {
      await this.callUtil
        .callRemoteAction(
          {}, // context
          {
            addResultToContextAsName: "dataEntitiesFromModelSection",
            expectedDomainElementType: "entityInstanceCollection",
          }, // context update
          "handleRemoteStoreAction",
          deploymentUuid,
          {
            actionType: "RemoteStoreCRUDAction",
            actionName: "read",
            parentName: entityEntity.name,
            parentUuid: entityEntity.uuid,
            section: "model",
          }
        )
        .then(async (context) => {
          log.info(
            "DomainController loadConfigurationFromRemoteDataStore fetched list of Entities for deployment",
            deploymentUuid,
            "found data entities from Model Section dataEntitiesFromModelSection",
            context.dataEntitiesFromModelSection
          );

          if (
            !context.dataEntitiesFromModelSection ||
            context.dataEntitiesFromModelSection.status != "ok" ||
            context.dataEntitiesFromModelSection.returnedDomainElement.elementType != "entityInstanceCollection"
          ) {
            throw new Error(
              "DomainController loadConfigurationFromRemoteDataStore could not fetch entity instance list " +
                JSON.stringify(context.dataEntitiesFromModelSection,undefined,2)
            );
          }
          const modelEntitiesToFetch: MetaEntity[] =
            deploymentUuid == applicationDeploymentMiroir.uuid ? miroirModelEntities : metaModelEntities;
          const dataEntitiesToFetch: MetaEntity[] =
            deploymentUuid == applicationDeploymentMiroir.uuid
              ? (context.dataEntitiesFromModelSection.returnedDomainElement?.elementValue.instances ?? []).filter(
                  (dataEntity: EntityInstance) =>
                    modelEntitiesToFetch.filter((modelEntity) => dataEntity.uuid == modelEntity.uuid).length == 0
                )
              : context.dataEntitiesFromModelSection.returnedDomainElement?.elementValue.instances ?? []; // hack, hack, hack
          log.debug(
            "DomainController loadConfigurationFromRemoteDataStore for deployment",
            deploymentUuid,
            "found data entities to fetch",
            dataEntitiesToFetch,
            "model entities to fetch",
            modelEntitiesToFetch
          );

          // const modelEntities = [entityReport].filter(me=>dataEntities.instances.filter(de=>de.uuid == me.uuid).length == 0)
          const toFetchEntities: { section: ApplicationSection; entity: MetaEntity }[] = [
            ...modelEntitiesToFetch.map((e) => ({ section: "model" as ApplicationSection, entity: e })),
            ...dataEntitiesToFetch.map((e) => ({ section: "data" as ApplicationSection, entity: e as MetaEntity })),
          ];
          let instances: EntityInstanceCollection[] = []; //TODO: replace with functional implementation
          for (const e of toFetchEntities) {
            // makes sequential calls to interface. Make parallel calls instead using Promise.all?
            log.info(
              "DomainController loadConfigurationFromRemoteDataStore fecthing instances from server for entity",
              JSON.stringify(e, undefined, 2)
            );
            await this.callUtil
              .callRemoteAction(
                {}, // context
                {
                  addResultToContextAsName: "entityInstanceCollection",
                  expectedDomainElementType: "entityInstanceCollection",
                }, // context update
                "handleRemoteStoreAction",
                deploymentUuid,
                {
                  actionType: "RemoteStoreCRUDAction",
                  actionName: "read",
                  parentName: e.entity.name,
                  parentUuid: e.entity.uuid,
                  section: e.section,
                }
              )
              .then((context: Record<string, any>) => {
                // TODO: is logging whithin this function independent of logging configuration?
                // log.trace(
                //   "DomainController loadConfigurationFromRemoteDataStore found instances for entity",
                //   e.entity["name"],
                //   entityInstanceCollection
                // );
                instances.push(context["entityInstanceCollection"].returnedDomainElement.elementValue);
                return context;
              })
              .then((context: Record<string, any>) =>
                this.callUtil.callLocalCacheAction(
                  context, // context
                  {}, // context update
                  "handleAction",
                  {
                    actionType: "instanceAction",
                    actionName: "replaceLocalCache",
                    deploymentUuid,
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    objects: instances,
                  }
                )
              )
              .then(
                (context: Record<string, any>) =>
                  this.callUtil.callLocalCacheAction(
                    context, // context
                    {}, // context update
                    "handleAction",
                    {
                      actionType: "modelAction",
                      actionName: "rollback",
                      deploymentUuid,
                      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    }
                  )
              )
              .catch((reason) => log.error(reason));
          }

          log.info(
            "DomainController loadConfigurationFromRemoteDataStore done rollback",
            this.currentTransaction()
          );

          log.debug(
            "DomainController loadConfigurationFromRemoteDataStore",
            deploymentUuid,
            "all instances stored!",
            toFetchEntities.map((e) => ({ section: e.section, uuid: e.entity.uuid }))
            // JSON.stringify(this.localCache.getState(), circularReplacer())
          );
          return context;
        });

      return Promise.resolve();
    } catch (error) {
      log.warn("DomainController loadConfigurationFromRemoteDataStore caught error:", error);
    }
  }

  // ##############################################################################################
  async handleAction(domainAction: DomainAction, currentModel: MetaModel): Promise<void> {
    // let entityDomainAction:DomainAction | undefined = undefined;
    log.info(
      "handleAction",
      "deploymentUuid",
      domainAction.deploymentUuid,
      "actionName",
      (domainAction as any).actionName,
      "actionType",
      domainAction?.actionType,
      "objects",
      JSON.stringify((domainAction as any)["objects"], null, 2)
    );

    log.debug("handleAction domainAction", domainAction);

    switch (domainAction.actionType) {
      case "modelAction": {
        await this.handleModelAction(domainAction.deploymentUuid, domainAction, currentModel);
        return Promise.resolve();
      }
      case "instanceAction": {
        await this.handleInstanceAction(
          domainAction.deploymentUuid,
          domainAction
        );
        return Promise.resolve();
      }
      case "undoRedoAction": {
        await this.handleDomainUndoRedoAction(
          domainAction.deploymentUuid,
          domainAction,
          currentModel
        );
        return Promise.resolve();
      }
      case "transactionalInstanceAction": {
        try {
          await this.callUtil.callLocalCacheAction(
            {}, // context
            {}, // context update
            "handleAction",
            domainAction
          );
        } catch (error) {
          log.warn(
            "DomainController handleAction caught exception when handling",
            domainAction.actionType,
            "deployment",
            domainAction.deploymentUuid,
            "action",
            domainAction,
            "exception",
            error
          );
        }
        return Promise.resolve();
        break;
      }
      default:
        log.error(
          "DomainController handleAction action could not be taken into account, unkown action",
          domainAction
        );
    }
  }
}
