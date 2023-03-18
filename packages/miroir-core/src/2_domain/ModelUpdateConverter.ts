import { MiroirModel } from "../0_interfaces/1_core/ModelInterface.js";
import { EntityDefinition } from "../0_interfaces/1_core/EntityDefinition.js";
import { InstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { ModelCUDUpdate, ModelStructureUpdate } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { entityEntity } from "src/index.js";

export class ModelStructureUpdateConverter{
  static modelUpdateToLocalCacheUpdate(
    entityDefinitions: EntityDefinition[],
    modelUpdate:ModelStructureUpdate,
  ):DomainDataAction{
    let domainDataAction: DomainDataAction;
    const currentEntity = entityDefinitions.find(e=>e.uuid==modelUpdate.entityUuid);
    switch (modelUpdate.updateActionName) {
      case "rename":
        const modifiedEntity:InstanceWithName = Object.assign(currentEntity,{name:modelUpdate.targetValue});
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName: "update",
          objects:[{entity:currentEntity.name, entityUuid:currentEntity.uuid, instances:[modifiedEntity]}]
        }
        break;
      default:
        break;
    }
    return domainDataAction;
  }
  static modelStructureUpdateToModelCUDUpdate(
    modelUpdate:ModelStructureUpdate,
    currentModel: MiroirModel,
  ):ModelCUDUpdate {
    let modelCUDUpdate: ModelCUDUpdate;
    // const currentEntity = currentModel.entities.find(e=>e.name==modelUpdate.entityName);
    const currentEntity = currentModel.entities.find(e=>e.uuid==modelUpdate.entityUuid);
    switch (modelUpdate.updateActionName) {
      case "rename":
        const modifiedEntity:InstanceWithName = Object.assign({...currentEntity},{name:modelUpdate.targetValue});
        modelCUDUpdate = {
          updateActionType:"ModelCUDUpdate",
          updateActionName:"update",
          objects:[{entity: entityEntity.name, entityUuid:entityEntity.uuid, instances:[modifiedEntity]}]
        }
        break;
      default:
        break;
    }
    return modelCUDUpdate;
  }
}