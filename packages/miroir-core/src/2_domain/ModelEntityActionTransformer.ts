import { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceWithName } from "../0_interfaces/1_core/Instance.js";
import {
  ModelAction,
  EntityDefinition,
  EntityInstanceCollection,
  MetaModel,
  Entity,
  ModelActionCreateEntity,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainDataAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import {
  CUDActionName,
  ModelEntityInstanceCUDUpdate,
  ModelActionEntityUpdate,
} from "../0_interfaces/2_domain/ModelUpdateInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { LocalCacheCUDActionWithDeployment } from "../0_interfaces/4-services/LocalCacheInterface.js";
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
    modelUpdate:ModelActionEntityUpdate,
    entities: Entity[],
    entityDefinitions: EntityDefinition[],
  ):{actionName:CUDActionName,objects:EntityInstanceCollection[]} | undefined {
    let domainActionCUDUpdate: {actionName:CUDActionName,objects:EntityInstanceCollection[]} | undefined = undefined;
    switch (modelUpdate.actionName) {
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
      case "dropEntity":
      // {
      //   const currentEntity = entityDefinitions.find(e=>e.uuid==modelUpdate.entityUuid);
      //   const currentEntityDefinitions = entityDefinitions.filter(e=>e.entityUuid==modelUpdate.entityUuid);
      //   const definitionsToRemove:EntityInstanceCollection[] = currentEntityDefinitions.map(ed => ({
      //     parentName: entityEntityDefinition.name, parentUuid:entityEntityDefinition.uuid, applicationSection:'model', instances:[{uuid: ed.uuid} as EntityInstanceWithName]
      //   }));
      //   // const castUpdate = modelUpdate as ModelEntityUpdateDeleteMetaModelInstance;
      //   domainActionCUDUpdate = {
      //     actionName: "delete",
      //     objects: [
      //       {
      //         parentName: entityEntity.name,
      //         parentUuid: entityEntity.uuid,
      //         applicationSection: "model",
      //         instances: [{ uuid: modelUpdate.entityUuid } as EntityInstanceWithName],
      //       },
      //       ...definitionsToRemove,
      //     ],
      //   };
      //   break;
      // }
      case "createEntity":
      // {
      //   const castUpdate = modelUpdate as ModelActionCreateEntity;
      //   domainActionCUDUpdate = {
      //     actionName: "create",
      //     objects:[
      //       {
      //         parentName:entityEntity.name,
      //         parentUuid:entityEntity.uuid,
      //         applicationSection:'model',
      //         instances:[castUpdate.entity]
      //       },
      //       {
      //         parentName:entityEntityDefinition.name,
      //         parentUuid:entityEntityDefinition.uuid,
      //         applicationSection:'model', 
      //         instances:[castUpdate.entityDefinition]
      //       },
      //     ]
      //   };
      //   break;
      // }
      case "alterEntityAttribute": {
        throw new Error("modelEntityUpdateToCUDUpdate could not handle " + modelUpdate.actionName);
        break;
      }
      default:
      break;
    }
    return domainActionCUDUpdate;
  }

  // ###################################################################################################
  static modelActionToInstanceAction(
    deploymentUuid: Uuid,
    modelAction:ModelAction,
    currentModel: MetaModel,
  ):LocalCacheCUDActionWithDeployment[] {
    log.info("modelActionToInstanceAction called ", deploymentUuid, modelAction)
    switch (modelAction.actionName) {
      case "createEntity": {
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
                  instances:[modelAction.entity]
                },
                {
                  parentName:entityEntityDefinition.name,
                  parentUuid:entityEntityDefinition.uuid,
                  applicationSection:'model', 
                  instances:[modelAction.entityDefinition]
                },
              ]
            }
          }
        ];
        break;
      }
      case "dropEntity": {
        return [
          {
            actionType: "LocalCacheCUDActionWithDeployment",
            deploymentUuid,
            instanceCUDAction: {
              actionType: "InstanceCUDAction",
              actionName: "delete",
              applicationSection: "model",
              objects: [
                {
                  parentName: entityEntity.name,
                  parentUuid: entityEntity.uuid,
                  applicationSection: "model",
                  instances: [{ parentUuid: entityEntity.uuid, uuid: modelAction.entityUuid }],
                },
                {
                  parentName: entityEntityDefinition.name,
                  parentUuid: entityEntityDefinition.uuid,
                  applicationSection: "model",
                  instances: [{ parentUuid: entityEntityDefinition.uuid, uuid: modelAction.entityDefinitionUuid }],
                },
              ],
            },
          },
        ];
        break;
      }
      case "renameEntity":
      {
        log.info("modelActionToInstanceAction currentModel ", JSON.stringify(currentModel));

        const currentEntity = currentModel.entities.find(e=>e.uuid==modelAction.entityUuid);
        const currentEntityDefinition = currentModel.entityDefinitions.find(e=>e.uuid==modelAction.entityDefinitionUuid);
        log.info("modelActionToInstanceAction found currentEntity ", currentEntity, "currentEntityDefinition", currentEntityDefinition);
        const modifiedEntity:EntityInstanceWithName = Object.assign({},currentEntity,{name:modelAction.targetValue});
        const modifiedEntityDefinition:EntityInstanceWithName = Object.assign({},currentEntityDefinition,{name:modelAction.targetValue});
        if (currentEntity && currentEntityDefinition) {
          const objects:EntityInstanceCollection[] = [
            {parentName:currentEntity.parentName, parentUuid:currentEntity.parentUuid, applicationSection:'model', instances:[modifiedEntity]},
            {parentName:currentEntityDefinition.parentName, parentUuid:currentEntityDefinition.parentUuid, applicationSection:'model', instances:[modifiedEntityDefinition]},
          ];
          const result: LocalCacheCUDActionWithDeployment[] = [
            {
              actionType: "LocalCacheCUDActionWithDeployment",
              deploymentUuid,
              instanceCUDAction: {
                actionType: "InstanceCUDAction",
                actionName: "update",
                applicationSection: "model",
                objects
              },
            },
          ];
          log.info("modelActionToInstanceAction returning for ", deploymentUuid, modelAction,"result=", result)

          return result;

          // domainActionCUDUpdate = {
          //   actionName: "update",
          //   objects
          // }
        } else {
          log.error('modelEntityUpdateToCUDUpdate renameEntity could not rename',modelAction);
          return [];
        }
        break;
      }
      case "alterEntityAttribute": {
        log.info("modelActionToInstanceAction currentModel ", JSON.stringify(currentModel));

        const currentEntity = currentModel.entities.find(e=>e.uuid==modelAction.entityUuid);
        const currentEntityDefinition = currentModel.entityDefinitions.find(e=>e.uuid==modelAction.entityDefinitionUuid);
        log.info("modelActionToInstanceAction alterEntityAttribute found currentEntity ", currentEntity, "currentEntityDefinition", currentEntityDefinition);
        if (currentEntity && currentEntityDefinition) {
          // const localEntityDefinition: EntityDefinition = currentEntityDefinition.returnedDomainElement.elementValue as EntityDefinition;
          const localEntityJzodSchemaDefinition = modelAction.removeColumns != undefined && Array.isArray(modelAction.removeColumns)?
            Object.fromEntries(
              Object.entries(currentEntityDefinition.jzodSchema.definition).filter((i) => modelAction.removeColumns??([] as string[]).includes(i[0]))
            )
            : currentEntityDefinition.jzodSchema.definition;
          const modifiedEntityDefinition: EntityDefinition = Object.assign(
            {},
            currentEntityDefinition,
            {
              jzodSchema: {
                type: "object",
                definition: {
                  ...localEntityJzodSchemaDefinition,
                  ...(modelAction.addColumns?Object.fromEntries(modelAction.addColumns.map(c=>[c.name, c.definition])):{})
                },
              },
            }
          );
    
          const objects:EntityInstanceCollection[] = [
            // {parentName:currentEntity.parentName, parentUuid:currentEntity.parentUuid, applicationSection:'model', instances:[modifiedEntity]},
            {parentName:currentEntityDefinition.parentName, parentUuid:currentEntityDefinition.parentUuid, applicationSection:'model', instances:[modifiedEntityDefinition]},
          ];
          const result: LocalCacheCUDActionWithDeployment[] = [
            {
              actionType: "LocalCacheCUDActionWithDeployment",
              deploymentUuid,
              instanceCUDAction: {
                actionType: "InstanceCUDAction",
                actionName: "update",
                applicationSection: "model",
                objects
              },
            },
          ];
          log.info("modelActionToInstanceAction returning for ", deploymentUuid, modelAction,"result=", JSON.stringify(result, null, 2))

          return result;

          // domainActionCUDUpdate = {
          //   actionName: "update",
          //   objects
          // }
        } else {
          log.error('modelEntityUpdateToCUDUpdate alterEntityAttribute could not rename',modelAction);
          return [];
        }
      }
      case "initModel":
      case "commit":
      case "rollback":
      case "resetModel":
      case "resetData": {
        log.warn("modelActionToInstanceAction nothing to do for action", JSON.stringify(modelAction, undefined, 2))
        return []
      }
      default: {
        throw new Error("modelActionToInstanceAction could not handle action " + JSON.stringify(modelAction, undefined, 2));
        break;
      }
    }
    return [];
  }

  // ###################################################################################################
  static modelEntityUpdateToLocalCacheCUDUpdate(
    entities: MetaEntity[],
    entityDefinitions: EntityDefinition[],
    modelUpdate:ModelActionEntityUpdate,
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
  static modelEntityUpdateToModelInstanceCUDUpdate(
    modelUpdate:ModelActionEntityUpdate,
    currentModel: MetaModel,
  ):ModelEntityInstanceCUDUpdate | undefined {
    const o = ModelEntityActionTransformer.modelEntityUpdateToCUDUpdate(
      modelUpdate,
      currentModel.entities,
      currentModel.entityDefinitions,
    );
    if (o) {
      return {
        actionType:"ModelEntityInstanceCUDUpdate",
        actionName:o.actionName,
        objects: o.objects
      } as ModelEntityInstanceCUDUpdate;
    } else {
      return undefined
    }
  }
}