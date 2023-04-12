import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model.js";
import { DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { ModelCUDInstanceUpdate, ModelEntityUpdate, ModelEntityUpdateCreateMetaModelInstance } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import entityDefinitionEntityDefinition from "../assets/entityDefinitions/EntityDefinitionEntityDefinition.json";
import entityEntity from "../assets/entities/EntityEntity.json"
import entityEntityDefinition  from "../assets/entities/EntityEntityDefinition.json";

export class ModelEntityUpdateConverter{

  // ###################################################################################################
  static modelEntityUpdateToLocalCacheUpdate(
    entities: MetaEntity[],
    entityDefinitions: EntityDefinition[],
    modelUpdate:ModelEntityUpdate,
  ):DomainDataAction{
    let domainDataAction: DomainDataAction;
    switch (modelUpdate.updateActionName) {
      case "renameEntity":{
        const currentEntity = entities.find(e=>e.uuid==modelUpdate.entityUuid);
        const currentEntityDefinition = entityDefinitions.find(e=>e.entityUuid==modelUpdate.entityUuid);
        const modifiedEntity:EntityInstanceWithName = Object.assign(currentEntity,{name:modelUpdate.targetValue});
        const modifiedEntityDefinition:EntityInstanceWithName = Object.assign(currentEntityDefinition,{name:modelUpdate.targetValue});
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName: "update",
          objects:[
            {parentName:currentEntity.parentName, parentUuid:currentEntity.parentUuid, instances:[modifiedEntity]},
            {parentName:currentEntityDefinition.parentName, parentUuid:currentEntityDefinition.parentUuid, instances:[modifiedEntityDefinition]},
          ]
        }
        break;
      }
      case "DeleteEntity": {
        const currentEntity = entityDefinitions.find(e=>e.uuid==modelUpdate.entityUuid);
        const currentEntityDefinitions = entityDefinitions.filter(e=>e.entityUuid==modelUpdate.entityUuid);
        const definitionsToRemove = currentEntityDefinitions.map(ed => ({
          parentName: entityEntityDefinition.name, parentUuid:entityEntityDefinition.uuid, instances:[{uuid: ed.uuid} as EntityInstanceWithName]
        }));
        // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
        domainDataAction = {
          actionType:"DomainDataAction",
          actionName:"delete",
          // objects:[{parentName: currentEntity.name, parentUuid:currentEntity.uuid, instances:[{uuid: modelUpdate.instanceUuid} as EntityInstanceWithName]}]
          objects:[
            {parentName: entityEntity.name, parentUuid:entityEntity.uuid, instances:[{uuid: modelUpdate.entityUuid} as EntityInstanceWithName]},
            ...definitionsToRemove
          ]
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
        const currentEntity = currentModel.entities.find(e=>e.uuid==modelUpdate.entityUuid);
        const modifiedEntity:EntityInstanceWithName = Object.assign({...currentEntity},{name:modelUpdate.targetValue});
        modelCUDUpdate = {
          updateActionType:"ModelCUDInstanceUpdate",
          updateActionName:"update",
          objects:[{parentName: entityDefinitionEntityDefinition.name, parentUuid:entityDefinitionEntityDefinition.uuid, instances:[modifiedEntity]}]
        }
        break;
      }
      case "DeleteEntity": {
        const currentEntity = currentModel.entities.find(e=>e.uuid==modelUpdate.entityUuid);
        const currentEntityDefinitions = currentModel.entityDefinitions.filter(e=>e.entityUuid==modelUpdate.entityUuid);
        const definitionsToRemove = currentEntityDefinitions.map(ed => ({
          parentName: entityEntityDefinition.name, parentUuid:entityEntityDefinition.uuid, instances:[{uuid: ed.uuid} as EntityInstanceWithName]
        }));

        // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
        modelCUDUpdate = {
          updateActionType:"ModelCUDInstanceUpdate",
          updateActionName:"delete",
          objects:[
            {parentName: entityEntity.name, parentUuid:entityEntity.uuid, instances:[{uuid: modelUpdate.entityUuid} as EntityInstanceWithName]},
            ...definitionsToRemove
          ]
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