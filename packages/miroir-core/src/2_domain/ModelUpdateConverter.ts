import { EntityDefinition } from "../0_interfaces/1_core/EntityDefinition.js";
import { InstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { MiroirModel } from "../0_interfaces/1_core/ModelInterface.js";
import { DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { ModelCUDUpdate, ModelEntityUpdate, ModelEntityUpdateCreateMetaModelInstance } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import entityEntity from "../assets/entities/Entity.json";

export class ModelEntityUpdateConverter{

  // ###################################################################################################
  static modelEntityUpdateToLocalCacheUpdate(
    entityDefinitions: EntityDefinition[],
    modelUpdate:ModelEntityUpdate,
  ):DomainDataAction{
    let domainDataAction: DomainDataAction;
    const currentEntity = entityDefinitions.find(e=>e.uuid==modelUpdate.entityUuid);
    switch (modelUpdate.updateActionName) {
      case "renameEntity":{
        const modifiedEntity:InstanceWithName = Object.assign(currentEntity,{name:modelUpdate.targetValue});
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName: "update",
          objects:[{entity:currentEntity.name, entityUuid:currentEntity.uuid, instances:[modifiedEntity]}]
        }
        break;
      }
      case "DeleteEntity": {
        // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName:"delete",
          objects:[{entity: currentEntity.name, entityUuid:currentEntity.uuid, instances:[{uuid: modelUpdate.instanceUuid} as InstanceWithName]}]
        }
        break;
      }
      case "alterEntityAttribute":
      case "createEntity":{
        const castUpdate = modelUpdate as ModelEntityUpdateCreateMetaModelInstance;
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName: "create",
          objects:[{entity:currentEntity.name, entityUuid:currentEntity.uuid, instances:castUpdate.instances}]
        };
        break;
      }
      default:
      break;
    }
    return domainDataAction;
  }

  // ###################################################################################################
  // ###################################################################################################
  static modelEntityUpdateToModelCUDUpdate(
    modelUpdate:ModelEntityUpdate,
    currentModel: MiroirModel,
  ):ModelCUDUpdate {
    let modelCUDUpdate: ModelCUDUpdate;
    // const currentEntity = currentModel.entities.find(e=>e.name==modelUpdate.entityName);
    const currentEntity = currentModel.entities.find(e=>e.uuid==modelUpdate.entityUuid);
    switch (modelUpdate.updateActionName) {
      case "renameEntity":{
        const modifiedEntity:InstanceWithName = Object.assign({...currentEntity},{name:modelUpdate.targetValue});
        modelCUDUpdate = {
          updateActionType:"ModelCUDUpdate",
          updateActionName:"update",
          objects:[{entity: entityEntity.name, entityUuid:entityEntity.uuid, instances:[modifiedEntity]}]
        }
        break;
      }
      case "DeleteEntity": {
        // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
        modelCUDUpdate = {
          updateActionType:"ModelCUDUpdate",
          updateActionName:"delete",
          objects:[{entity: modelUpdate.entityName, entityUuid:modelUpdate.entityUuid, instances:[{uuid: modelUpdate.instanceUuid} as InstanceWithName]}]
        }
        break;
      }
      case "alterEntityAttribute":
      case "createEntity":{
        // const modifiedEntity:InstanceWithName = Object.assign({...currentEntity},{name:modelUpdate.targetValue});
        const castUpdate = modelUpdate as ModelEntityUpdateCreateMetaModelInstance;
        modelCUDUpdate = {
          updateActionType:"ModelCUDUpdate",
          updateActionName:"create",
          objects:[{entity: castUpdate.entityName, entityUuid:castUpdate.entityUuid, instances:castUpdate.instances}]
        }
        break;
      }
      default:
        break;
    }
    return modelCUDUpdate;
  }
}