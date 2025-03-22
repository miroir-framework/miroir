import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { EntityInstanceWithName } from "../0_interfaces/1_core/Instance";
import {
  ApplicationSection,
  EntityDefinition,
  EntityInstanceCollection,
  InstanceAction,
  MetaModel,
  ModelAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";

const entityEntity = require("../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json");
const entityEntityDefinition = require("../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json");

import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ModelEntityActionTransformer")
).then((logger: LoggerInterface) => {log = logger});


export class ModelEntityActionTransformer{

  // ###################################################################################################
  static modelActionToInstanceAction(
    deploymentUuid: Uuid,
    modelAction:ModelAction,
    currentModel: MetaModel,
  ):InstanceAction[] {
    log.info("modelActionToLocalCacheInstanceAction called ", deploymentUuid, modelAction)
    switch (modelAction.actionName) {
      case "createEntity": {
        return [
          {
            actionType: "instanceAction",
            actionName: "createInstance",
            deploymentUuid: modelAction.deploymentUuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            applicationSection: "model",
            objects: [
              ...modelAction.entities.flatMap(
                a => [
                  {
                    parentName:entityEntity.name,
                    parentUuid:entityEntity.uuid,
                    applicationSection:'model' as ApplicationSection,
                    instances:[a.entity]
                  },
                  {
                    parentName:entityEntityDefinition.name,
                    parentUuid:entityEntityDefinition.uuid,
                    applicationSection:'model' as ApplicationSection, 
                    instances:[a.entityDefinition]
                  },
                ]
              )
            ]
          }
        ];
        break;
      }
      case "dropEntity": {
        return [
          {
            actionType: "instanceAction",
            actionName: "deleteInstance",
            deploymentUuid: modelAction.deploymentUuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
        ];
        break;
      }
      case "renameEntity":
      {
        log.info("modelActionToLocalCacheInstanceAction currentModel ", JSON.stringify(currentModel));

        const currentEntity = currentModel.entities.find(e=>e.uuid==modelAction.entityUuid);
        const currentEntityDefinition = currentModel.entityDefinitions.find(e=>e.uuid==modelAction.entityDefinitionUuid);
        log.info("modelActionToLocalCacheInstanceAction found currentEntity ", currentEntity, "currentEntityDefinition", currentEntityDefinition);
        const modifiedEntity:EntityInstanceWithName = Object.assign({},currentEntity,{name:modelAction.targetValue});
        const modifiedEntityDefinition:EntityInstanceWithName = Object.assign({},currentEntityDefinition,{name:modelAction.targetValue});
        if (currentEntity && currentEntityDefinition) {
          const objects: EntityInstanceCollection[] = [
            {
              parentName: currentEntity.parentName,
              parentUuid: currentEntity.parentUuid,
              applicationSection: "model",
              instances: [modifiedEntity],
            },
            {
              parentName: currentEntityDefinition.parentName,
              parentUuid: currentEntityDefinition.parentUuid,
              applicationSection: "model",
              instances: [modifiedEntityDefinition],
            },
          ];
          const result: InstanceAction[] = [
            {
              actionType: "instanceAction",
              actionName: "updateInstance",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              deploymentUuid,
              applicationSection: "model",
              objects
            },
          ];
          log.info("modelActionToLocalCacheInstanceAction returning for ", deploymentUuid, modelAction,"result=", result)

          return result;
        } else {
          log.error('modelActionToLocalCacheInstanceAction renameEntity could not rename',modelAction);
          return [];
        }
        break;
      }
      case "alterEntityAttribute": {
        log.info("modelActionToLocalCacheInstanceAction currentModel ", JSON.stringify(currentModel));

        const currentEntity = currentModel.entities.find(e=>e.uuid==modelAction.entityUuid);
        const currentEntityDefinition = currentModel.entityDefinitions.find(e=>e.uuid==modelAction.entityDefinitionUuid);
        // log.info(
        //   "modelActionToLocalCacheInstanceAction alterEntityAttribute found currentEntity ",
        //   currentEntity,
        //   "currentEntityDefinition",
        //   currentEntityDefinition
        // );
        if (currentEntity && currentEntityDefinition) {
          const localEntityJzodSchemaDefinition =
            modelAction.removeColumns != undefined && Array.isArray(modelAction.removeColumns)
              ? Object.fromEntries(
                  Object.entries(currentEntityDefinition.jzodSchema.definition).filter(
                    (i) => modelAction.removeColumns ?? ([] as string[]).includes(i[0])
                  )
                )
              : currentEntityDefinition.jzodSchema.definition;
          const modifiedEntityDefinition: EntityDefinition = Object.assign({}, currentEntityDefinition, {
            jzodSchema: {
              type: "object",
              definition: {
                ...localEntityJzodSchemaDefinition,
                ...(modelAction.addColumns
                  ? Object.fromEntries(modelAction.addColumns.map((c) => [c.name, c.definition]))
                  : {}),
              },
            },
          });
    
          const objects: EntityInstanceCollection[] = [
            // {parentName:currentEntity.parentName, parentUuid:currentEntity.parentUuid, applicationSection:'model', instances:[modifiedEntity]},
            {
              parentName: currentEntityDefinition.parentName,
              parentUuid: currentEntityDefinition.parentUuid,
              applicationSection: "model",
              instances: [modifiedEntityDefinition],
            },
          ];
          const result: InstanceAction[] = [
            {
              actionType: "instanceAction",
              actionName: "updateInstance",
              deploymentUuid: modelAction.deploymentUuid,
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              applicationSection: "model",
              objects
            },
          ];
          log.info("modelActionToLocalCacheInstanceAction returning for ", deploymentUuid, modelAction,"result=", JSON.stringify(result, null, 2))

          return result;
        } else {
          log.error('modelActionToLocalCacheInstanceAction alterEntityAttribute could not rename',modelAction);
          return [];
        }
      }
      case "initModel":
      case "remoteLocalCacheRollback":
      case "commit":
      case "rollback":
      case "resetModel":
      case "resetData": {
        log.warn("modelActionToLocalCacheInstanceAction nothing to do for action", JSON.stringify(modelAction, undefined, 2))
        return []
      }
      default: {
        throw new Error("modelActionToLocalCacheInstanceAction could not handle action " + JSON.stringify(modelAction, undefined, 2));
        break;
      }
    }
    return [];
  }
}