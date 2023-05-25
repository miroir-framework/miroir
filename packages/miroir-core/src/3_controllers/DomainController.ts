import { v4 as uuidv4 } from 'uuid';

import { RemoteStoreCRUDAction } from '../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js';
import { MiroirMetaModel } from "../0_interfaces/1_core/Model";
import {
  CRUDActionName,
  CRUDActionNamesArray, DomainAction,
  DomainControllerInterface,
  DomainDataAction,
  DomainTransactionalAction,
  DomainTransactionalReplayableAction
} from "../0_interfaces/2_domain/DomainControllerInterface";
import { MiroirApplicationVersion } from '../0_interfaces/1_core/ModelVersion';
import { ModelEntityUpdateConverter } from "../2_domain/ModelUpdateConverter";
import { WrappedTransactionalEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { LocalAndRemoteControllerInterface } from "../0_interfaces/3_controllers/LocalAndRemoteControllerInterface";
import { LocalCacheInfo } from "../0_interfaces/4-services/localCache/LocalCacheInterface";
import { Uuid } from '../0_interfaces/1_core/EntityDefinition.js';

import entityApplicationVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityDefinitionEntityDefinition from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";
import instanceConfigurationReference from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import { ApplicationSection } from '../0_interfaces/1_core/Instance.js';
import applicationDeploymentMiroir from '../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';

/**
 * domain level contains "business" logic related to concepts defined whithin the
 * application: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class DomainController implements DomainControllerInterface {
  constructor(private LocalAndRemoteController: LocalAndRemoteControllerInterface) {}

  // ########################################################################################
  currentTransaction(): DomainTransactionalReplayableAction[] {
    return this.LocalAndRemoteController.currentLocalCacheTransaction();
  }

  // ########################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.LocalAndRemoteController.currentLocalCacheInfo();
  }

  // ########################################################################################
  async handleDomainTransactionalAction(
    deploymentUuid:Uuid,
    domainModelAction: DomainTransactionalAction,
    currentModel:MiroirMetaModel,
  ): Promise<void> {
    console.log(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainTransactionalAction start actionName",
      domainModelAction['actionName'],
      "deployment", deploymentUuid,
      "action",
      domainModelAction
    );
    // await this.dataController.handleRemoteStoreModelAction(domainAction);

    switch (domainModelAction.actionName) {
      case "rollback": {
        await this.LocalAndRemoteController.loadConfigurationFromRemoteDataStore(deploymentUuid);
        break;
      }
      case "undo":
      case "redo": {
        await this.LocalAndRemoteController.handleLocalCacheModelAction(deploymentUuid, domainModelAction);
        break;
      }
      case "initModel": 
      case "resetModel": {
        await this.LocalAndRemoteController.handleRemoteStoreModelActionWithDeployment(deploymentUuid,domainModelAction);
        break;
      }
      case "commit": {
        console.log(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit",
          this.LocalAndRemoteController.currentLocalCacheTransaction()
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
            // modelStructureMigration: this.LocalAndRemoteController.currentLocalCacheTransaction().flatMap((t:DomainTransactionalEntityUpdateAction)=>t.update)
            modelStructureMigration: this.LocalAndRemoteController.currentLocalCacheTransaction().map((t)=>t.update)
          };
  
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit create new version", newModelVersion);
          const newModelVersionAction: RemoteStoreCRUDAction = {
            actionType: 'RemoteStoreCRUDAction',
            actionName: "create",
            objects: [newModelVersion],
          };
  
          // in the case of the Miroir app, this should be done in the 'data' section
          await this.LocalAndRemoteController.handleRemoteStoreCRUDActionWithDeployment(deploymentUuid, sectionOfapplicationEntities, newModelVersionAction);
  
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit new version created", newModelVersion);
  
          for (const replayAction of this.LocalAndRemoteController.currentLocalCacheTransaction()) {
            console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit replayAction", replayAction);
            if (replayAction.actionName == "updateEntity") {
              // await this.LocalAndRemoteController.handleRemoteStoreModelAction(replayAction);
              await this.LocalAndRemoteController.handleRemoteStoreModelActionWithDeployment(deploymentUuid,replayAction);
            } else {
              // for (const instances of replayAction["objects"]) {
                // TODO: replace with parallel implementation Promise.all?
                await this.LocalAndRemoteController.handleRemoteStoreCRUDActionWithDeployment(
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
  
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit actions replayed",this.LocalAndRemoteController.currentLocalCacheTransaction());
  
          await this.LocalAndRemoteController.handleLocalCacheAction(
            deploymentUuid,
            {
              actionName:'create',
              actionType: 'DomainDataAction',
              objects:[{parentUuid:newModelVersion.parentUuid, applicationSection:sectionOfapplicationEntities, instances: [newModelVersion]}]
            }
          );
  
          await this.LocalAndRemoteController.handleLocalCacheAction(deploymentUuid, domainModelAction);// commit clears transaction information, locally.
  
          const updatedConfiguration = Object.assign({},instanceConfigurationReference,{definition:{"currentModelVersion": newModelVersionUuid}})
          console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit updating configuration',updatedConfiguration)
          const newStoreBasedConfiguration: RemoteStoreCRUDAction = {
            actionType:'RemoteStoreCRUDAction',
            actionName: "update",
            objects: [
              updatedConfiguration
            ],
          };
          // TODO: in the case of the Miroir app, this should be in the 'data'section
          await this.LocalAndRemoteController.handleRemoteStoreCRUDActionWithDeployment(deploymentUuid, sectionOfapplicationEntities, newStoreBasedConfiguration);
        }
        break;
      }
      case "UpdateMetaModelInstance": {
        await this.LocalAndRemoteController.handleLocalCacheAction(deploymentUuid, domainModelAction);
        break;
      }
      case "updateEntity": {
        console.log('DomainController updateModel correspondingCUDUpdate',domainModelAction,currentModel);
        
        const cudUpdate = ModelEntityUpdateConverter.modelEntityUpdateToModelCUDUpdate(domainModelAction?.update.modelEntityUpdate, currentModel);
        const structureUpdatesWithCUDUpdates: WrappedTransactionalEntityUpdateWithCUDUpdate = {
          updateActionName: 'WrappedTransactionalEntityUpdateWithCUDUpdate',
          modelEntityUpdate:domainModelAction?.update.modelEntityUpdate,
          equivalentModelCUDUpdates: cudUpdate?[cudUpdate]:[],
        };
        console.log('structureUpdatesWithCUDUpdates',structureUpdatesWithCUDUpdates);
        

        await this.LocalAndRemoteController.handleLocalCacheAction(
          deploymentUuid,
          {...domainModelAction,update:structureUpdatesWithCUDUpdates}
        );
        break;
      }

      default: {
        console.warn("DomainController handleDomainTransactionalAction cannot handle action name for", domainModelAction);
        break;
      }
    }

  }

  // ########################################################################################
  async handleDomainNonTransactionalAction(deploymentUuid:Uuid, domainAction: DomainDataAction): Promise<void> {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction", domainAction.actionName, domainAction.objects);
    // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)
    if (CRUDActionNamesArray.map((a) => a.toString()).includes(domainAction.actionName)) {
      // CRUD actions. The same action is performed on the local cache and on the remote store for Data Instances,
      // and only on the local cache for Model Instances (Model instance CRUD actions are grouped in transactions)
      for (const instances of domainAction.objects) {
        // TODO: replace with parallel implementation Promise.all?
        console.log(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction sending to remote storage instances",
          instances.parentName, instances.instances
        );
        await this.LocalAndRemoteController.handleRemoteStoreCRUDActionWithDeployment(
          deploymentUuid,
          'data',
          {
            actionType: 'RemoteStoreCRUDAction',
            actionName: domainAction.actionName.toString() as CRUDActionName,
            parentName: instances.parentName,
            objects: instances.instances,
          });
      }
      console.log(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction calling handleLocalCacheDataAction", domainAction
      );
      await this.LocalAndRemoteController.handleLocalCacheDataAction(deploymentUuid, domainAction);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction end", domainAction);
    } else {
      console.error(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController deployment",deploymentUuid,"handleDomainNonTransactionalAction could not handle action name",
        domainAction.actionName,
        "for action",
        domainAction
      );
    }
    return Promise.resolve();
  }

  // ########################################################################################
  async handleDomainAction(
    deploymentUuid:Uuid,
    domainAction: DomainAction,
    currentModel:MiroirMetaModel,
  ): Promise<void> {
    let entityDomainAction:DomainAction | undefined = undefined;
    let otherDomainAction:DomainAction | undefined = undefined;
    const ignoredActionNames:string[] = ['UpdateMetaModelInstance','updateEntity','resetModel','initModel','commit','rollback','replace','undo','redo'];
    console.log('handleDomainAction','deploymentUuid',deploymentUuid,'actionName',domainAction?.actionName, 'actionType',domainAction?.actionType,'objects',domainAction['objects']);

    // if (domainAction.actionName!="updateEntity"){
    if (!ignoredActionNames.includes(domainAction.actionName)){
      const entityObjects = Array.isArray(domainAction['objects'])?domainAction['objects'].filter(a=>a.parentUuid == entityDefinitionEntityDefinition.uuid):[];
      const otherObjects = Array.isArray(domainAction['objects'])?domainAction['objects'].filter(a=>a.parentUuid !== entityDefinitionEntityDefinition.uuid):[];

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
    console.log('handleDomainAction entityDomainAction',entityDomainAction);
    console.log('handleDomainAction otherDomainAction',otherDomainAction);
     
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
        console.error(
          "DomainController handleDomainAction action could not be taken into account, unkown action",
          domainAction
        );
    }
  }
}
