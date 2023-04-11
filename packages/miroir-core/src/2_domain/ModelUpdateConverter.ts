import { entityEntity, entityEntityDefinition } from "src/index.js";
import { EntityDefinition } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model.js";
import { DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { ModelCUDInstanceUpdate, ModelEntityUpdate, ModelEntityUpdateCreateMetaModelInstance } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import entityDefinitionEntityDefinition from "../assets/entityDefinitions/EntityDefinitionEntityDefinition.json";

export class ModelEntityUpdateConverter{

  // ###################################################################################################
  static modelEntityUpdateToLocalCacheUpdate(
    entityDefinitions: EntityDefinition[],
    modelUpdate:ModelEntityUpdate,
  ):DomainDataAction{
    let domainDataAction: DomainDataAction;
    switch (modelUpdate.updateActionName) {
      case "renameEntity":{
        const currentEntity = entityDefinitions.find(e=>e.uuid==modelUpdate.parentUuid);
        const modifiedEntity:EntityInstanceWithName = Object.assign(currentEntity,{name:modelUpdate.targetValue});
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName: "update",
          objects:[{parentName:currentEntity.name, parentUuid:currentEntity.uuid, instances:[modifiedEntity]}]
        }
        break;
      }
      case "DeleteEntity": {
        const currentEntity = entityDefinitions.find(e=>e.uuid==modelUpdate.parentUuid);
        // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName:"delete",
          objects:[{parentName: currentEntity.name, parentUuid:currentEntity.uuid, instances:[{uuid: modelUpdate.instanceUuid} as EntityInstanceWithName]}]
        }
        break;
      }
      case "alterEntityAttribute":
      case "createEntity":{
        const castUpdate = modelUpdate as ModelEntityUpdateCreateMetaModelInstance;
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName: "create",
          objects:[
            {
              parentName:entityEntity.name, 
              parentUuid:entityEntity.uuid, 
              instances:castUpdate.entities.map(e=>e.entity)
            },
            {
              parentName:entityEntityDefinition.name, 
              parentUuid:entityEntityDefinition.uuid, 
              instances:castUpdate.entities.map(e=>e.entityDefinition)
            },
          ]
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
  ):ModelCUDInstanceUpdate {
    let modelCUDUpdate: ModelCUDInstanceUpdate;
    // const currentEntity = currentModel.entities.find(e=>e.name==modelUpdate.parentName);
    switch (modelUpdate.updateActionName) {
      case "renameEntity":{
        const currentEntity = currentModel.entities.find(e=>e.uuid==modelUpdate.parentUuid);
        const modifiedEntity:EntityInstanceWithName = Object.assign({...currentEntity},{name:modelUpdate.targetValue});
        modelCUDUpdate = {
          updateActionType:"ModelCUDInstanceUpdate",
          updateActionName:"update",
          objects:[{parentName: entityDefinitionEntityDefinition.name, parentUuid:entityDefinitionEntityDefinition.uuid, instances:[modifiedEntity]}]
        }
        break;
      }
      case "DeleteEntity": {
        const currentEntity = currentModel.entities.find(e=>e.uuid==modelUpdate.parentUuid);
        // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
        modelCUDUpdate = {
          updateActionType:"ModelCUDInstanceUpdate",
          updateActionName:"delete",
          objects:[{parentName: modelUpdate.parentName, parentUuid:modelUpdate.parentUuid, instances:[{uuid: modelUpdate.instanceUuid} as EntityInstanceWithName]}]
        }
        break;
      }
      case "alterEntityAttribute":
      case "createEntity":{
        const castUpdate = modelUpdate as ModelEntityUpdateCreateMetaModelInstance;
        modelCUDUpdate = {
          updateActionType:"ModelCUDInstanceUpdate",
          updateActionName:"create",
          objects:[
            {
              parentName:entityEntity.name, 
              parentUuid:entityEntity.uuid, 
              instances:castUpdate.entities.map(e=>e.entity)
            },
            {
              parentName:entityEntityDefinition.name, 
              parentUuid:entityEntityDefinition.uuid, 
              instances:castUpdate.entities.map(e=>e.entityDefinition)
            },
          ]
        }
        break;
      }
      default:
        break;
    }
    return modelCUDUpdate;
  }
}