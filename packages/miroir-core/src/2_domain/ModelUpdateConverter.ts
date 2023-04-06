import { EntityDefinition } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model.js";
import { DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { ModelCUDUpdate, ModelEntityUpdate, ModelEntityUpdateCreateMetaModelInstance } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import entityDefinitionEntityDefinition from "../assets/entityDefinitions/EntityDefinition.json";

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
        const modifiedEntity:EntityInstanceWithName = Object.assign(currentEntity,{name:modelUpdate.targetValue});
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName: "update",
          objects:[{entityName:currentEntity.name, entityUuid:currentEntity.uuid, instances:[modifiedEntity]}]
        }
        break;
      }
      case "DeleteEntity": {
        // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName:"delete",
          objects:[{entityName: currentEntity.name, entityUuid:currentEntity.uuid, instances:[{uuid: modelUpdate.instanceUuid} as EntityInstanceWithName]}]
        }
        break;
      }
      case "alterEntityAttribute":
      case "createEntity":{
        const castUpdate = modelUpdate as ModelEntityUpdateCreateMetaModelInstance;
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName: "create",
          objects:[{entityName:currentEntity.name, entityUuid:currentEntity.uuid, instances:castUpdate.instances}]
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
    currentModel: MiroirMetaModel,
  ):ModelCUDUpdate {
    let modelCUDUpdate: ModelCUDUpdate;
    // const currentEntity = currentModel.entities.find(e=>e.name==modelUpdate.entityName);
    const currentEntity = currentModel.entities.find(e=>e.uuid==modelUpdate.entityUuid);
    switch (modelUpdate.updateActionName) {
      case "renameEntity":{
        const modifiedEntity:EntityInstanceWithName = Object.assign({...currentEntity},{name:modelUpdate.targetValue});
        modelCUDUpdate = {
          updateActionType:"ModelCUDUpdate",
          updateActionName:"update",
          objects:[{entityName: entityDefinitionEntityDefinition.name, entityUuid:entityDefinitionEntityDefinition.uuid, instances:[modifiedEntity]}]
        }
        break;
      }
      case "DeleteEntity": {
        // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
        modelCUDUpdate = {
          updateActionType:"ModelCUDUpdate",
          updateActionName:"delete",
          objects:[{entityName: modelUpdate.entityName, entityUuid:modelUpdate.entityUuid, instances:[{uuid: modelUpdate.instanceUuid} as EntityInstanceWithName]}]
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
          objects:[{entityName: castUpdate.entityName, entityUuid:castUpdate.entityUuid, instances:castUpdate.instances}]
        }
        break;
      }
      default:
        break;
    }
    return modelCUDUpdate;
  }
}