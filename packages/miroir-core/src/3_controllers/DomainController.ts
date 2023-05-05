import { v4 as uuidv4 } from 'uuid';

import { RemoteStoreCRUDAction } from '../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js';
import { MiroirMetaModel } from "../0_interfaces/1_core/Model";
import {
  CRUDActionName,
  CRUDActionNamesArray, DomainAction,
  DomainControllerInterface,
  DomainDataAction,
  DomainModelAction,
  DomainModelReplayableAction
} from "../0_interfaces/2_domain/DomainControllerInterface";
import { WrappedModelEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { LocalAndRemoteControllerInterface } from "../0_interfaces/3_controllers/LocalAndRemoteControllerInterface";
import { LocalCacheInfo } from "../0_interfaces/4-services/localCache/LocalCacheInterface";
import { ModelEntityUpdateConverter } from "../2_domain/ModelUpdateConverter";
import entityDefinitionEntityDefinition from "../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";
import instanceConfigurationReference from '../assets/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import { MiroirApplicationVersion } from '../0_interfaces/1_core/ModelVersion';
import entityApplicationVersion from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
// import entityDefinitionModelVersion from "../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json";
import applicationMiroir from '../assets/a659d350-dd97-4da9-91de-524fa01745dc/21840247-b5b1-4344-baec-f818f4797d92.json';
import applicationDeploymentMiroir from '../assets/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
import applicationModelBranchMiroirMasterBranch from '../assets/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json';
import applicationVersionInitialMiroirVersion from '../assets/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import { applicationDeploymentLibrary } from '../0_interfaces/1_core/StorageConfiguration.js';

/**
 * domain level contains "business" logic related to concepts defined whithin the
 * application: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class DomainController implements DomainControllerInterface {
  constructor(private LocalAndRemoteController: LocalAndRemoteControllerInterface) {}

  // ########################################################################################
  currentTransaction(): DomainModelReplayableAction[] {
    return this.LocalAndRemoteController.currentLocalCacheTransaction();
  }

  // ########################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.LocalAndRemoteController.currentLocalCacheInfo();
  }

  // ########################################################################################
  async handleDomainModelAction(
    domainModelAction: DomainModelAction,
    currentModel?:MiroirMetaModel,
  ): Promise<void> {
    console.log(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainModelAction start actionName",
      domainModelAction['actionName'],
      "action",
      domainModelAction
    );
    // await this.dataController.handleRemoteStoreModelAction(domainAction);

    switch (domainModelAction.actionName) {
      case "replace": {
        await this.LocalAndRemoteController.loadConfigurationFromRemoteDataStore(applicationDeploymentMiroir.uuid);
        // await this.LocalAndRemoteController.loadConfigurationFromRemoteDataStore(applicationDeploymentLibrary.uuid);
        break;
      }
      case "undo":
      case "redo": {
        await this.LocalAndRemoteController.handleLocalCacheModelAction(domainModelAction);
        break;
      }
      case "initModel": 
      case "resetModel": {
        await this.LocalAndRemoteController.handleRemoteStoreModelAction(domainModelAction);
        break;
      }
      case "commit": {
        console.log(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit",
          this.LocalAndRemoteController.currentLocalCacheTransaction()
        );

        if (!currentModel) {
          throw new Error('commit operation did not receive current model. It requires the current model, to access the pre-existing transactions.')
        }

        const newModelVersionUuid = uuidv4();
        // await this.LocalAndRemoteController.handleRemoteStoreCRUDAction({
        const newModelVersion:MiroirApplicationVersion = {
          uuid:newModelVersionUuid,
          conceptLevel:'Data',
          parentName:entityApplicationVersion?.name,
          parentUuid: entityApplicationVersion?.uuid,
          description: domainModelAction.label,
          name: domainModelAction.label?domainModelAction.label:'No label was given to this version.',
          previousVersion: currentModel?.configuration[0]?.definition?.currentModelVersion,
          branch: applicationModelBranchMiroirMasterBranch.uuid,
          application:applicationMiroir.uuid,
          // modelStructureMigration: this.LocalAndRemoteController.currentLocalCacheTransaction().flatMap((t:DomainModelEntityUpdateAction)=>t.update)
          modelStructureMigration: this.LocalAndRemoteController.currentLocalCacheTransaction().map((t)=>t.update)
        };

        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit create new version", newModelVersion);
        const newModelVersionAction: RemoteStoreCRUDAction = {
          actionType: 'RemoteStoreCRUDAction',
          actionName: "create",
          objects: [newModelVersion],
        };

        await this.LocalAndRemoteController.handleRemoteStoreCRUDActionWithDeployment(applicationDeploymentLibrary.uuid,newModelVersionAction);

        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit new version created", newModelVersion);

        for (const replayAction of this.LocalAndRemoteController.currentLocalCacheTransaction()) {
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit replayAction", replayAction);
          if (replayAction.actionName == "updateEntity") {
            // await this.LocalAndRemoteController.handleRemoteStoreModelAction(replayAction);
            await this.LocalAndRemoteController.handleRemoteStoreModelActionWithDeployment(applicationDeploymentLibrary.uuid,replayAction);
          } else {
            // for (const instances of replayAction["objects"]) {
              // TODO: replace with parallel implementation Promise.all?
              await this.LocalAndRemoteController.handleRemoteStoreCRUDActionWithDeployment(
                applicationDeploymentLibrary.uuid,
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
          {
            actionName:'create',
            actionType: 'DomainDataAction',
            objects:[{parentUuid:newModelVersion.parentUuid, instances: [newModelVersion]}]
          }
        );

        await this.LocalAndRemoteController.handleLocalCacheAction(domainModelAction);// commit clears transaction information, locally.

        const updatedConfiguration = Object.assign({},instanceConfigurationReference,{definition:{"currentModelVersion": newModelVersionUuid}})
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit updating configuration',updatedConfiguration)
        const newStoreBasedConfiguration: RemoteStoreCRUDAction = {
          actionType:'RemoteStoreCRUDAction',
          actionName: "update",
          objects: [
            updatedConfiguration
          ],
        };

        await this.LocalAndRemoteController.handleRemoteStoreCRUDActionWithDeployment(applicationDeploymentLibrary.uuid,newStoreBasedConfiguration);

        break;
      }
      case "UpdateMetaModelInstance": {
        await this.LocalAndRemoteController.handleLocalCacheAction(domainModelAction);
        break;
      }
      case "updateEntity": {
        console.log('DomainController updateModel correspondingCUDUpdate',domainModelAction,currentModel);
        
        const structureUpdatesWithCUDUpdates: WrappedModelEntityUpdateWithCUDUpdate = {
          updateActionName: 'WrappedModelEntityUpdateWithCUDUpdate',
          modelEntityUpdate:domainModelAction?.update.modelEntityUpdate,
          equivalentModelCUDUpdates: [
            ModelEntityUpdateConverter.modelEntityUpdateToModelCUDUpdate(domainModelAction?.update.modelEntityUpdate, currentModel),
          ],
        };
        console.log('structureUpdatesWithCUDUpdates',structureUpdatesWithCUDUpdates);
        

        await this.LocalAndRemoteController.handleLocalCacheAction(
          {...domainModelAction,update:structureUpdatesWithCUDUpdates}
        );
        break;
      }

      default: {
        console.warn("DomainController handleDomainModelAction cannot handle action name for", domainModelAction);
        break;
      }
    }

  }

  // ########################################################################################
  async handleDomainDataAction(domainAction: DomainDataAction): Promise<void> {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction", domainAction.actionName, domainAction.objects);
    // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)
    if (CRUDActionNamesArray.map((a) => a.toString()).includes(domainAction.actionName)) {
      // CRUD actions. The same action is performed on the local cache and on the remote store for Data Instances,
      // and only on the local cache for Model Instances (Model instance CRUD actions are grouped in transactions)
      for (const instances of domainAction.objects) {
        // TODO: replace with parallel implementation Promise.all?
        console.log(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction sending to remote storage instances",
          instances.parentName, instances.instances
        );
        await this.LocalAndRemoteController.handleRemoteStoreCRUDActionWithDeployment(
          applicationDeploymentLibrary.uuid,
          {
            actionType: 'RemoteStoreCRUDAction',
            actionName: domainAction.actionName.toString() as CRUDActionName,
            parentName: instances.parentName,
            objects: instances.instances,
          });
      }
      console.log(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction calling handleLocalCacheDataAction", domainAction
      );
      await this.LocalAndRemoteController.handleLocalCacheDataAction(domainAction);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction end", domainAction);
    } else {
      console.error(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction could not handle action name",
        domainAction.actionName,
        "for action",
        domainAction
      );
    }
    return Promise.resolve();
  }

  // ########################################################################################
  async handleDomainAction(
    domainAction: DomainAction,
    currentModel?:MiroirMetaModel,
  ): Promise<void> {
    let entityDomainAction:DomainAction = undefined;
    let otherDomainAction:DomainAction = undefined;
    const ignoredActionNames:string[] = ['UpdateMetaModelInstance','updateEntity','resetModel','initModel','commit','replace','undo','redo'];
    console.log('handleDomainAction actionName',domainAction?.actionName, 'actionType',domainAction?.actionType,'objects',domainAction['objects']);

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
          await this.handleDomainDataAction(entityDomainAction as DomainDataAction);
        }
        if (!!otherDomainAction) {
          await this.handleDomainDataAction(otherDomainAction as DomainDataAction);
        }
        return Promise.resolve()
      }
      case "DomainModelAction": {
        if (!!entityDomainAction) {
            await this.handleDomainModelAction(entityDomainAction as DomainModelAction, currentModel);
        }
        if (!!otherDomainAction) {
          await this.handleDomainModelAction(otherDomainAction as DomainModelAction, currentModel);
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
