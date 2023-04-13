import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceCollection, EntityInstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { MiroirMetaModel } from "../0_interfaces/1_core/Model.js";
import { CUDActionName, DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { ModelCUDInstanceUpdate, ModelEntityUpdate, ModelEntityUpdateCreateMetaModelInstance } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import entityDefinitionEntityDefinition from "../assets/entityDefinitions/EntityDefinitionEntityDefinition.json";
import entityEntity from "../assets/entities/EntityEntity.json"
import entityEntityDefinition  from "../assets/entities/EntityEntityDefinition.json";

export class ModelEntityUpdateConverter{

  static modelEntityUpdateToCUDUpdate(
    modelUpdate:ModelEntityUpdate,
    entities: MetaEntity[],
    entityDefinitions: EntityDefinition[],
  ):{actionName:CUDActionName,objects:EntityInstanceCollection[]}{
    let domainAction: {actionName:CUDActionName,objects:EntityInstanceCollection[]};
    switch (modelUpdate.updateActionName) {
      case "renameEntity":{
        const currentEntity = entities.find(e=>e.uuid==modelUpdate.entityUuid);
        const currentEntityDefinition = entityDefinitions.find(e=>e.entityUuid==modelUpdate.entityUuid);
        const modifiedEntity:EntityInstanceWithName = Object.assign({},currentEntity,{name:modelUpdate.targetValue});
        const modifiedEntityDefinition:EntityInstanceWithName = Object.assign({},currentEntityDefinition,{name:modelUpdate.targetValue});
        const objects = [
          {parentName:currentEntity.parentName, parentUuid:currentEntity.parentUuid, instances:[modifiedEntity]},
          {parentName:currentEntityDefinition.parentName, parentUuid:currentEntityDefinition.parentUuid, instances:[modifiedEntityDefinition]},
        ];
        domainAction = {
          actionName: "update",
          objects
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
        domainAction = {
          // actionType:"DomainDataAction",
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
        domainAction = {
          // actionType:"DomainDataAction",
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
    return domainAction;
  }
  // ###################################################################################################
  static modelEntityUpdateToLocalCacheUpdate(
    entities: MetaEntity[],
    entityDefinitions: EntityDefinition[],
    modelUpdate:ModelEntityUpdate,
  ):DomainDataAction{
    return {
      actionType:"DomainDataAction",
      ...ModelEntityUpdateConverter.modelEntityUpdateToCUDUpdate(
        modelUpdate,
        entities,
        entityDefinitions,
      )
    } as DomainDataAction
  }

  // ###################################################################################################
  static modelEntityUpdateToModelCUDUpdate(
    modelUpdate:ModelEntityUpdate,
    currentModel: MiroirMetaModel,
  ):ModelCUDInstanceUpdate {
    const o = ModelEntityUpdateConverter.modelEntityUpdateToCUDUpdate(
      modelUpdate,
      currentModel.entities,
      currentModel.entityDefinitions,
    );
    return {
      updateActionType:"ModelCUDInstanceUpdate",
      updateActionName:o.actionName,
      objects: o.objects
    } as ModelCUDInstanceUpdate;
  }
}