import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceCollection, EntityInstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { MiroirApplicationModel } from "../0_interfaces/1_core/Model.js";
import { DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { CUDActionName, ModelCUDInstanceUpdate, ModelEntityUpdate, ModelEntityUpdateCreateMetaModelInstance } from "../0_interfaces/2_domain/ModelUpdateInterface.js";

import entityEntity from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";

export class ModelEntityUpdateConverter{

  static modelEntityUpdateToCUDUpdate(
    modelUpdate:ModelEntityUpdate,
    entities: MetaEntity[],
    entityDefinitions: EntityDefinition[],
  ):{actionName:CUDActionName,objects:EntityInstanceCollection[]} | undefined {
    let domainAction: {actionName:CUDActionName,objects:EntityInstanceCollection[]} | undefined = undefined;
    switch (modelUpdate.updateActionName) {
      case "renameEntity":{
        const currentEntity = entities.find(e=>e.uuid==modelUpdate.entityUuid);
        const currentEntityDefinition = entityDefinitions.find(e=>e.entityUuid==modelUpdate.entityUuid);
        const modifiedEntity:EntityInstanceWithName = Object.assign({},currentEntity,{name:modelUpdate.targetValue});
        const modifiedEntityDefinition:EntityInstanceWithName = Object.assign({},currentEntityDefinition,{name:modelUpdate.targetValue});
        if (currentEntity && currentEntityDefinition) {
          const objects:EntityInstanceCollection[] = [
            {parentName:currentEntity.parentName, parentUuid:currentEntity.parentUuid, applicationSection:'model', instances:[modifiedEntity]},
            {parentName:currentEntityDefinition.parentName, parentUuid:currentEntityDefinition.parentUuid, applicationSection:'model', instances:[modifiedEntityDefinition]},
          ];
          domainAction = {
            actionName: "update",
            objects
          }
        } else {
          console.error('modelEntityUpdateToCUDUpdate renameEntity could not rename',modelUpdate);
        }
        break;
      }
      case "DeleteEntity": {
        const currentEntity = entityDefinitions.find(e=>e.uuid==modelUpdate.entityUuid);
        const currentEntityDefinitions = entityDefinitions.filter(e=>e.entityUuid==modelUpdate.entityUuid);
        const definitionsToRemove:EntityInstanceCollection[] = currentEntityDefinitions.map(ed => ({
          parentName: entityEntityDefinition.name, parentUuid:entityEntityDefinition.uuid, applicationSection:'model', instances:[{uuid: ed.uuid} as EntityInstanceWithName]
        }));
        // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
        domainAction = {
          // actionType:"DomainDataAction",
          actionName:"delete",
          // objects:[{parentName: currentEntity.name, parentUuid:currentEntity.uuid, instances:[{uuid: modelUpdate.instanceUuid} as EntityInstanceWithName]}]
          objects:[
            {parentName: entityEntity.name, parentUuid:entityEntity.uuid, applicationSection:'model', instances:[{uuid: modelUpdate.entityUuid} as EntityInstanceWithName]},
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
              applicationSection:'model',
              instances:castUpdate.entities.map(e=>e.entity)
            },
            {
              parentName:entityEntityDefinition.name,
              parentUuid:entityEntityDefinition.uuid,
              applicationSection:'model', 
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
    currentModel: MiroirApplicationModel,
  ):ModelCUDInstanceUpdate | undefined {
    const o = ModelEntityUpdateConverter.modelEntityUpdateToCUDUpdate(
      modelUpdate,
      currentModel.entities,
      currentModel.entityDefinitions,
    );
    if (o) {
      return {
        updateActionType:"ModelCUDInstanceUpdate",
        updateActionName:o.actionName,
        objects: o.objects
      } as ModelCUDInstanceUpdate;
    } else {
      return undefined
    }
  }
}