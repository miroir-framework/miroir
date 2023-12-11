import { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { MiroirApplicationModel } from "../0_interfaces/1_core/Model.js";
import { EntityActionParams, EntityDefinition, EntityInstanceCollection } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import {
  CUDActionName,
  ModelCUDInstanceUpdate,
  ModelEntityUpdate,
  ModelEntityUpdateCreateMetaModelInstance,
} from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { LocalCacheCUDActionWithDeployment } from "../0_interfaces/4-services/localCache/LocalCacheInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";

import entityEntity from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"ModelEntityActionTransformer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export class ModelEntityActionTransformer{

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
          actionName: "delete",
          objects: [
            {
              parentName: entityEntity.name,
              parentUuid: entityEntity.uuid,
              applicationSection: "model",
              instances: [{ uuid: modelUpdate.entityUuid } as EntityInstanceWithName],
            },
            ...definitionsToRemove,
          ],
        };
        break;
      }
      case "alterEntityAttribute":
      case "createEntity":{
        const castUpdate = modelUpdate as ModelEntityUpdateCreateMetaModelInstance;
        domainActionCUDUpdate = {
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
  static entityActionToInstanceAction(
    deploymentUuid: Uuid,
    entityAction:EntityActionParams,
  ):LocalCacheCUDActionWithDeployment[] {
    return [
      {
        actionType:"LocalCacheCUDActionWithDeployment",
        deploymentUuid,
        instanceCUDAction: {
          actionType: "InstanceCUDAction",
          actionName: "create",
          applicationSection: "model",
          objects: [
            {
              parentName:entityEntity.name,
              parentUuid:entityEntity.uuid,
              applicationSection:'model',
              instances:[entityAction.entity]
            },
            {
              parentName:entityEntityDefinition.name,
              parentUuid:entityEntityDefinition.uuid,
              applicationSection:'model', 
              instances:[entityAction.entityDefinition]
            },
          ]
        }
      }
    ]
  }

  // ###################################################################################################
  static modelEntityUpdateToLocalCacheUpdate(
    entities: MetaEntity[],
    entityDefinitions: EntityDefinition[],
    modelUpdate:ModelEntityUpdate,
  ):DomainDataAction{
    return {
      actionType:"DomainDataAction",
      ...ModelEntityActionTransformer.modelEntityUpdateToCUDUpdate(
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
    const o = ModelEntityActionTransformer.modelEntityUpdateToCUDUpdate(
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