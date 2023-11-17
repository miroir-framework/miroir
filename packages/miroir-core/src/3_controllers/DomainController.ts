import { v4 as uuidv4 } from 'uuid';

import { MetaEntity, Uuid } from '../0_interfaces/1_core/EntityDefinition.js';
import { ApplicationSection, EntityInstanceCollection } from '../0_interfaces/1_core/Instance.js';
import { MiroirApplicationModel } from "../0_interfaces/1_core/Model";
import { MiroirApplicationVersion } from '../0_interfaces/1_core/ModelVersion';
import {
  CRUDActionName,
  CRUDActionNamesArray, DomainAction,
  DomainControllerInterface,
  DomainDataAction,
  DomainTransactionalAction,
  DomainTransactionalReplayableAction,
  LocalCacheInfo
} from "../0_interfaces/2_domain/DomainControllerInterface";
import { WrappedTransactionalEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";

import { MiroirContextInterface } from '../0_interfaces/3_controllers/MiroirContextInterface';
import { LocalCacheInterface } from '../0_interfaces/4-services/localCache/LocalCacheInterface';
import { RemoteDataStoreInterface, RemoteStoreCRUDAction } from '../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js';

import { ModelEntityUpdateConverter } from "../2_domain/ModelEntityUpdateConverter.js";

import applicationDeploymentMiroir from '../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
import instanceConfigurationReference from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityApplicationVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityDefinitionEntityDefinition from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";

import { LoggerInterface } from '../0_interfaces/4-services/LoggerInterface';
import { MiroirLoggerFactory } from '../4_services/Logger';
import { circularReplacer, getLoggerName } from '../tools';
import { throwExceptionIfError } from './ErrorHandling/ErrorUtils.js';
import { metaModelEntities, miroirModelEntities } from './ModelInitializer';
import { packageName } from '../constants.js';
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
  constructor(
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private remoteStore: RemoteDataStoreInterface
  ) {}

  // ########################################################################################
  currentTransaction(): DomainTransactionalReplayableAction[] {
    return this.localCache.currentTransaction();
  }

  // ########################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.localCache.currentInfo();
  }

  // ########################################################################################
  async handleDomainTransactionalAction(
    deploymentUuid:Uuid,
    domainModelAction: DomainTransactionalAction,
    currentModel:MiroirApplicationModel,
  ): Promise<void> {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainTransactionalAction start actionName",
      domainModelAction['actionName'],
      "deployment", deploymentUuid,
      "action",
      domainModelAction
    );
    // await this.dataController.handleRemoteStoreModelAction(domainAction);
    try {
      switch (domainModelAction.actionName) {
        case "rollback": {
          await this.loadConfigurationFromRemoteDataStore(deploymentUuid);
          break;
        }
        case "undo":
        case "redo": {
          this.localCache.handleLocalCacheModelAction(deploymentUuid, domainModelAction);
          break;
        }
        case "initModel": 
        case "resetData": 
        case "resetModel": {
          await this.remoteStore.handleRemoteStoreModelActionWithDeployment(deploymentUuid,domainModelAction);
          break;
        }
        case "commit": {
          log.debug(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit",
            this.localCache.currentTransaction()
          );
  
          if (!currentModel) {
            throw new Error('commit operation did not receive current model. It requires the current model, to access the pre-existing transactions.');
          } else {
            const sectionOfapplicationEntities: ApplicationSection = deploymentUuid== applicationDeploymentMiroir.uuid?'data':'model';
            const newModelVersionUuid = uuidv4();
            const newModelVersion:MiroirApplicationVersion = {
              uuid:newModelVersionUuid,
              conceptLevel:'Data',
              parentName:entityApplicationVersion?.name,
              parentUuid: entityApplicationVersion?.uuid,
              description: domainModelAction.label,
              name: domainModelAction.label?domainModelAction.label:'No label was given to this version.',
              previousVersion: currentModel?.configuration[0]?.definition?.currentModelVersion,
              // branch: applicationModelBranchMiroirMasterBranch.uuid,
              branch: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              // application:applicationMiroir.uuid, // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              application:'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // TODO: this is wrong, application, application version, etc. must be passed as parameters!!!!!!!!!!!!!!!!!!!!
              modelStructureMigration: this.localCache.currentTransaction().map((t)=>t.update)
            };
    
            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit create new version", newModelVersion);
            const newModelVersionAction: RemoteStoreCRUDAction = {
              actionType: 'RemoteStoreCRUDAction',
              actionName: "create",
              objects: [newModelVersion],
            };
    
            // in the case of the Miroir app, this should be done in the 'data' section
            await this.remoteStore.handleRemoteStoreCRUDActionWithDeployment(deploymentUuid, sectionOfapplicationEntities, newModelVersionAction);
    
            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit new version created", newModelVersion);
    
            for (const replayAction of this.localCache.currentTransaction()) {
              log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit replayAction", replayAction);
              if (replayAction.actionName == "updateEntity") {
                await this.remoteStore.handleRemoteStoreModelActionWithDeployment(deploymentUuid,replayAction);
              } else {
                // for (const instances of replayAction["objects"]) {
                  // TODO: replace with parallel implementation Promise.all?
                  await this.remoteStore.handleRemoteStoreCRUDActionWithDeployment(
                    deploymentUuid,
                    replayAction.update.objects[0].applicationSection,
                    {
                    actionType:'RemoteStoreCRUDAction',
                    actionName: replayAction.update.updateActionName.toString() as CRUDActionName,
                    parentName: replayAction.update.objects[0].parentName,
                    parentUuid: replayAction.update.objects[0].parentUuid,
                    objects: replayAction.update.objects[0].instances,
                  });
                // }
              }
            }
    
            log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit actions replayed",this.localCache.currentTransaction());
    
            this.localCache.handleLocalCacheAction(
              deploymentUuid,
              {
                actionName:'create',
                actionType: 'DomainDataAction',
                objects:[{parentUuid:newModelVersion.parentUuid, applicationSection:sectionOfapplicationEntities, instances: [newModelVersion]}]
              }
            );
    
            this.localCache.handleLocalCacheAction(deploymentUuid, domainModelAction);// commit clears transaction information, locally.
    
            const updatedConfiguration = Object.assign({},instanceConfigurationReference,{definition:{"currentModelVersion": newModelVersionUuid}})
            log.debug('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit updating configuration',updatedConfiguration)
            const newStoreBasedConfiguration: RemoteStoreCRUDAction = {
              actionType:'RemoteStoreCRUDAction',
              actionName: "update",
              objects: [
                updatedConfiguration
              ],
            };
            // TODO: in the case of the Miroir app, this should be in the 'data'section
            await this.remoteStore.handleRemoteStoreCRUDActionWithDeployment(deploymentUuid, sectionOfapplicationEntities, newStoreBasedConfiguration);
          }
          break;
        }
        case "UpdateMetaModelInstance": {
          this.localCache.handleLocalCacheAction(deploymentUuid, domainModelAction);
          break;
        }
        case "updateEntity": {
          log.debug(
            "DomainController updateModel for model entity update",
            domainModelAction?.update.modelEntityUpdate,
            "entities",
            currentModel.entities,
            "entity definitions",
            currentModel.entityDefinitions
          );
          const cudUpdate = ModelEntityUpdateConverter.modelEntityUpdateToModelCUDUpdate(domainModelAction?.update.modelEntityUpdate, currentModel);
          log.trace('DomainController updateModel correspondingCUDUpdate',cudUpdate);

          const structureUpdatesWithCUDUpdates: WrappedTransactionalEntityUpdateWithCUDUpdate = {
            updateActionName: 'WrappedTransactionalEntityUpdateWithCUDUpdate',
            modelEntityUpdate:domainModelAction?.update.modelEntityUpdate,
            equivalentModelCUDUpdates: cudUpdate?[cudUpdate]:[],
          };
          log.trace('structureUpdatesWithCUDUpdates',structureUpdatesWithCUDUpdates);
          
  
          this.localCache.handleLocalCacheAction(
            deploymentUuid,
            {...domainModelAction,update:structureUpdatesWithCUDUpdates}
          );
          break;
        }
  
        default: {
          log.warn("DomainController handleDomainTransactionalAction cannot handle action name for", domainModelAction);
          break;
        }
      }
    } catch (error) {
      log.warn(
        "DomainController handleDomainTransactionalAction caught exception",
        domainModelAction["actionName"],
        "deployment",
        deploymentUuid,
        "action",
        domainModelAction,
        "exception",
        error
      );
    }
    return Promise.resolve();
  }

  // ########################################################################################
  async handleDomainNonTransactionalAction(deploymentUuid:Uuid, domainAction: DomainDataAction): Promise<void> {
    log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction", domainAction.actionName, domainAction.objects);
    // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)
    if (CRUDActionNamesArray.map((a) => a.toString()).includes(domainAction.actionName)) {
      // CRUD actions. The same action is performed on the local cache and on the remote store for Data Instances,
      // and only on the local cache for Model Instances (Model instance CRUD actions are grouped in transactions)
      for (const instances of domainAction.objects) {
        // TODO: replace with parallel implementation Promise.all?
        log.debug(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction sending to remote storage instances",
          instances.parentName, instances.instances
        );
        await this.remoteStore.handleRemoteStoreCRUDActionWithDeployment(
          deploymentUuid,
          'data',
          {
            actionType: 'RemoteStoreCRUDAction',
            actionName: domainAction.actionName.toString() as CRUDActionName,
            parentName: instances.parentName,
            objects: instances.instances,
          });
      }
      log.debug(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction calling handleLocalCacheDataAction", domainAction
      );
      await this.localCache.handleLocalCacheDataAction(deploymentUuid, domainAction);
      log.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction end", domainAction);
    } else {
      log.error(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction could not handle action name",
        domainAction.actionName,
        "for action",
        domainAction
      );
    }
    return Promise.resolve();
  }

    //####################################################################################
  /**
   * performs remote update before local update, so that whenever remote update fails, local value is not modified (going into the "catch").
   * @returns undefined when loading is finished
   */
  public async loadConfigurationFromRemoteDataStore(
    deploymentUuid: string,
  ): Promise<void> {
    log.info("DomainController loadConfigurationFromRemoteDataStore for deployment",deploymentUuid);
    try {
      const dataEntitiesFromModelSection: EntityInstanceCollection | void = await throwExceptionIfError(
        this.miroirContext.errorLogService,
        this.remoteStore.handleRemoteStoreCRUDActionWithDeployment,
        this.remoteStore, //this
        deploymentUuid,
        "model",
        {
          actionName: "read",
          parentName: entityEntity.name,
          parentUuid: entityEntity.uuid,
        }
      );

      if (!dataEntitiesFromModelSection) {
        throw new Error("DomainController loadConfigurationFromRemoteDataStore could not fetch entity instance list");
        
      }
      log.trace(
        "DomainController loadConfigurationFromRemoteDataStore for deployment",
        deploymentUuid,
        "found data entities from Model Section",
        dataEntitiesFromModelSection
      );

      const modelEntitiesToFetch: MetaEntity[] =
        deploymentUuid == applicationDeploymentMiroir.uuid
          ? miroirModelEntities
          : metaModelEntities
      ;
          
      const dataEntitiesToFetch = 
        deploymentUuid == applicationDeploymentMiroir.uuid?
          dataEntitiesFromModelSection.instances.filter(
            (de) => modelEntitiesToFetch.filter((me) => de.uuid == me.uuid).length == 0
          )
        :
        dataEntitiesFromModelSection.instances
      ; // hack, hack, hack

      log.debug(
        "DomainController loadConfigurationFromRemoteDataStore for deployment",
        deploymentUuid,
        "found data entities to fetch",
        dataEntitiesToFetch,
        "model entities to fetch",
        modelEntitiesToFetch,
      );

      // const modelEntities = [entityReport].filter(me=>dataEntities.instances.filter(de=>de.uuid == me.uuid).length == 0)
      const toFetchEntities: { section: ApplicationSection; entity: MetaEntity }[] = [
        ...modelEntitiesToFetch.map((e) => ({ section: "model" as ApplicationSection, entity: e })),
        ...dataEntitiesToFetch.map((e) => ({ section: "data" as ApplicationSection, entity: e as MetaEntity })),
      ];


      let instances: EntityInstanceCollection[] = []; //TODO: replace with functional implementation
      for (const e of toFetchEntities) {
        // makes sequetial calls to interface. Make parallel calls instead using Promise.all?
        log.trace(
          "DomainController loadConfigurationFromRemoteDataStore fecthing instances from server for entity",
          (e as any)["name"]
        );
        const entityInstanceCollection: EntityInstanceCollection | void = await throwExceptionIfError(
          this.miroirContext.errorLogService,
          this.remoteStore.handleRemoteStoreCRUDActionWithDeployment,
          this.remoteStore, // this
          deploymentUuid,
          e.section,
          {
            actionName: "read",
            parentName: e.entity.name,
            parentUuid: e.entity.uuid,
          }
        );
        log.trace(
          "DomainController loadConfigurationFromRemoteDataStore found instances for entity",
          e.entity["name"],
          entityInstanceCollection
        );
        if (entityInstanceCollection) {
          instances.push(entityInstanceCollection);
        } else {
          log.warn("DomainController loadConfigurationFromRemoteDataStore could not find instances for entity",e.entity["name"]);
        }
      }

      log.trace(
        "DomainController loadConfigurationFromRemoteDataStore all instances fetched from server",
        instances
      );
      this.localCache.handleLocalCacheModelAction(deploymentUuid, {
        actionName: "replaceLocalCache",
        actionType: "DomainTransactionalAction",
        objects: instances,
      });

      log.debug(
        "DomainController loadConfigurationFromRemoteDataStore",
        deploymentUuid,
        "all instances stored:",
        JSON.stringify(this.localCache.getState(), circularReplacer())
      );

      return Promise.resolve();
    } catch (error) {
      log.warn("DomainController loadConfigurationFromRemoteDataStore", error);
    }
  }

  // ########################################################################################
  // TODO: useless??????????????????????????????????????????????????????????????????????
  async handleDomainAction(
    deploymentUuid:Uuid,
    domainAction: DomainAction,
    currentModel:MiroirApplicationModel,
  ): Promise<void> {
    let entityDomainAction:DomainAction | undefined = undefined;
    let otherDomainAction:DomainAction | undefined = undefined;
    const ignoredActionNames:string[] = ['UpdateMetaModelInstance','updateEntity','resetModel','resetData','initModel','commit','rollback','replace','undo','redo'];
    log.info(
      "handleDomainAction",
      "deploymentUuid",
      deploymentUuid,
      "actionName",
      domainAction?.actionName,
      "actionType",
      domainAction?.actionType,
      "objects",
      JSON.stringify((domainAction as any)["objects"], null, 2)
    );

    // if (domainAction.actionName!="updateEntity"){
    if (!ignoredActionNames.includes(domainAction.actionName)){
      const entityObjects = Array.isArray((domainAction as any)['objects'])?(domainAction as any)['objects'].filter((a:any)=>a.parentUuid == entityDefinitionEntityDefinition.uuid):[];
      const otherObjects = Array.isArray((domainAction as any)['objects'])?(domainAction as any)['objects'].filter((a:any)=>a.parentUuid !== entityDefinitionEntityDefinition.uuid):[];

      if(entityObjects.length > 0){
        entityDomainAction = {
          actionType: domainAction.actionType,
          actionName: domainAction.actionName,
          objects: entityObjects
        } as DomainAction
      }
      if(otherObjects.length > 0){
        otherDomainAction = {
          actionType: domainAction.actionType,
          actionName: domainAction.actionName,
          objects: otherObjects
        } as DomainAction
      }
    } else {
      otherDomainAction = domainAction;
    }
    log.debug('handleDomainAction entityDomainAction',entityDomainAction);
    log.debug('handleDomainAction otherDomainAction',otherDomainAction);
     
    switch (domainAction.actionType) {
      case "DomainDataAction": {
        if (!!entityDomainAction) {
          await this.handleDomainNonTransactionalAction(deploymentUuid, entityDomainAction as DomainDataAction);
        }
        if (!!otherDomainAction) {
          await this.handleDomainNonTransactionalAction(deploymentUuid, otherDomainAction as DomainDataAction);
        }
        return Promise.resolve()
      }
      case "DomainTransactionalAction": {
        if (!!entityDomainAction) {
            await this.handleDomainTransactionalAction(deploymentUuid, entityDomainAction as DomainTransactionalAction, currentModel);
        }
        if (!!otherDomainAction) {
          await this.handleDomainTransactionalAction(deploymentUuid, otherDomainAction as DomainTransactionalAction, currentModel);
        }
        return Promise.resolve()
      }
      default:
        log.error(
          "DomainController handleDomainAction action could not be taken into account, unkown action",
          domainAction
        );
    }
  }
}
