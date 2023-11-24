import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { MiroirApplicationModel } from "../0_interfaces/1_core/Model.js";
import { EntityInstanceCollection } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { CUDActionName, ModelCUDInstanceUpdate, ModelEntityUpdate, ModelEntityUpdateCreateMetaModelInstance } from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";

import entityEntity from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"ModelEntityUpdateConverter");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export class ModelEntityUpdateConverter{

  static modelEntityUpdateToCUDUpdate(
    modelUpdate:ModelEntityUpdate,
    entities: MetaEntity[],
    entityDefinitions: EntityDefinition[],
  ):{actionName:CUDActionName,objects:EntityInstanceCollection[]} | undefined {
    let domainActionCUDUpdate: {actionName:CUDActionName,objects:EntityInstanceCollection[]} | undefined = undefined;
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
          domainActionCUDUpdate = {
            actionName: "update",
            objects
          }
        } else {
          log.error('modelEntityUpdateToCUDUpdate renameEntity could not rename',modelUpdate);
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
        domainActionCUDUpdate = {
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
        domainActionCUDUpdate = {
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
    return domainActionCUDUpdate;
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