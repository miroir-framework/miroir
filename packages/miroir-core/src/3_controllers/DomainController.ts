import { v4 as uuidv4 } from 'uuid';

import { RemoteStoreCRUDAction } from 'src/0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js';
import { MiroirModel, MiroirModelVersion } from "../0_interfaces/1_core/ModelInterface";
import {
  CRUDActionName,
  CRUDActionNamesArray, DomainAction,
  DomainControllerInterface,
  DomainDataAction,
  DomainModelAction,
  DomainModelEntityUpdateAction,
  DomainModelReplayableAction
} from "../0_interfaces/2_domain/DomainControllerInterface";
import { ModelEntityUpdateWithCUDUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface";
import { LocalAndRemoteControllerInterface } from "../0_interfaces/3_controllers/LocalAndRemoteControllerInterface";
import { LocalCacheInfo } from "../0_interfaces/4-services/localCache/LocalCacheInterface";
import { ModelEntityUpdateConverter } from "../2_domain/ModelUpdateConverter";
import entityEntity from "../assets/entities/Entity.json";
import entityModelVersion from "../assets/entities/ModelVersion.json";
import instanceConfigurationReference from '../assets/instances/StoreBasedConfiguration - reference.json';

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
    currentModel?:MiroirModel,
  ): Promise<void> {
    console.log(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainModelAction actionName",
      domainModelAction['actionName'],
      "action",
      domainModelAction
    );
    // await this.dataController.handleRemoteStoreModelAction(domainAction);

    switch (domainModelAction.actionName) {
      case "replace": {
        await this.LocalAndRemoteController.loadConfigurationFromRemoteDataStore();
        break;
      }
      case "undo":
      case "redo": {
        this.LocalAndRemoteController.handleLocalCacheModelAction(domainModelAction);
        break;
      }
      case "resetModel": {
        this.LocalAndRemoteController.handleRemoteStoreModelAction(domainModelAction);
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
        const newModelVersion:MiroirModelVersion = {
          uuid:newModelVersionUuid,
          previousVersionUuid: currentModel.configuration[0].definition.currentModelVersion,
          conceptLevel:'Data',
          entity:entityModelVersion.name,
          entityUuid: entityModelVersion.uuid,
          description: domainModelAction.label,
          name: domainModelAction.label?domainModelAction.label:'No label was given to this commit.',
          // modelStructureMigration: this.LocalAndRemoteController.currentLocalCacheTransaction().flatMap((t:DomainModelEntityUpdateAction)=>t.update)
          modelUpdates: this.LocalAndRemoteController.currentLocalCacheTransaction().map((t)=>t.update)
        };

        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit create new version", newModelVersion);
        const newModelVersionAction: RemoteStoreCRUDAction = {
          actionType: 'RemoteStoreCRUDAction',
          actionName: "create",
          objects: [newModelVersion],
        };

        await this.LocalAndRemoteController.handleRemoteStoreCRUDAction(newModelVersionAction);

        for (const replayAction of this.LocalAndRemoteController.currentLocalCacheTransaction()) {
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit replayAction", replayAction);
          if (replayAction.actionName == "updateModel") {
            await this.LocalAndRemoteController.handleRemoteStoreModelAction(replayAction);
          } else {
            // for (const instances of replayAction["objects"]) {
              // TODO: replace with parallel implementation Promise.all?
              await this.LocalAndRemoteController.handleRemoteStoreCRUDAction({
                actionType:'RemoteStoreCRUDAction',
                actionName: replayAction.update.updateActionName.toString() as CRUDActionName,
                entityName: replayAction.update.objects[0].entity,
                entityUuid: replayAction.update.objects[0].entityUuid,
                objects: replayAction.update.objects[0].instances,
              });
            // }
          }
        }

        this.LocalAndRemoteController.handleLocalCacheAction(
          {
            actionName:'create',
            actionType: 'DomainDataAction',
            objects:[{entityUuid:newModelVersion.entityUuid, instances: [newModelVersion]}]
          }
        );

        this.LocalAndRemoteController.handleLocalCacheAction(domainModelAction);// commit clears transaction information, locally.

        const updatedConfiguration = Object.assign({},instanceConfigurationReference,{definition:{"currentModelVersion": newModelVersionUuid}})
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit updating configuration',updatedConfiguration)
        const newStoreBasedConfiguration: RemoteStoreCRUDAction = {
          actionType:'RemoteStoreCRUDAction',
          actionName: "update",
          objects: [
            // Object.assign({},instanceConfigurationReference,{definition:{"currentModelVersion": newModelVersion.uuid}})
            updatedConfiguration
          ],
        };

        await this.LocalAndRemoteController.handleRemoteStoreCRUDAction(newStoreBasedConfiguration);

        break;
      }
      // case "create":
      // case "update":
      // case "delete": {
      //   // transactional modification: the changes are done only locally, until commit
      //   this.LocalAndRemoteController.handleLocalCacheAction(
      //     domainModelAction
      //   );
      //   break;
      // }
      case "CUDupdateModel": {
        this.LocalAndRemoteController.handleLocalCacheAction(
          domainModelAction
        );
        break;
      }
      case "updateModel": {
        console.log('DomainController updateModel correspondingCUDUpdate',domainModelAction,currentModel);
        // const correspondingCUDUpdate: ModelCUDUpdate = ModelEntityUpdateConverter.modelEntityUpdateToModelCUDUpdate(domainModelAction.updates[0],currentModel);
        
        const structureUpdatesWithCUDUpdates: ModelEntityUpdateWithCUDUpdate = {
          updateActionName: 'ModelEntityUpdateWithCUDUpdate',
          modelEntityUpdate:domainModelAction?.update.modelEntityUpdate,
          equivalentModelCUDUpdates: [
            ModelEntityUpdateConverter.modelEntityUpdateToModelCUDUpdate(domainModelAction?.update.modelEntityUpdate, currentModel),
          ],
        };
        console.log('structureUpdatesWithCUDUpdates',structureUpdatesWithCUDUpdates);
        

        this.LocalAndRemoteController.handleLocalCacheAction(
          {...domainModelAction,update:structureUpdatesWithCUDUpdates}
        );
        break;
      }

      default: {
        // await this.dataController.handleRemoteStoreModelAction(domainModelAction);
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
          instances.entity, instances.instances
        );
        await this.LocalAndRemoteController.handleRemoteStoreCRUDAction({
          actionType: 'RemoteStoreCRUDAction',
          actionName: domainAction.actionName.toString() as CRUDActionName,
          entityName: instances.entity,
          objects: instances.instances,
        });
      }
      console.log(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction calling handleLocalCacheDataAction", domainAction
      );
      this.LocalAndRemoteController.handleLocalCacheDataAction(domainAction);
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
    currentModel?:MiroirModel,
  ): Promise<void> {
    let entityDomainAction:DomainAction = undefined;
    let otherDomainAction:DomainAction = undefined;
    const ignoredActionNames:string[] = ['CUDupdateModel','updateModel','resetModel','commit','replace','undo','redo'];
    console.log('handleDomainAction actionName',domainAction?.actionName, 'actionType',domainAction?.actionType,'objects',domainAction['objects']);

    // if (domainAction.actionName!="updateModel"){
    if (!ignoredActionNames.includes(domainAction.actionName)){
      const entityObjects = Array.isArray(domainAction['objects'])?domainAction['objects'].filter(a=>a.entityUuid == entityEntity.uuid):[];
      const otherObjects = Array.isArray(domainAction['objects'])?domainAction['objects'].filter(a=>a.entityUuid !== entityEntity.uuid):[];

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
          return this.handleDomainModelAction(otherDomainAction as DomainModelAction, currentModel);
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
