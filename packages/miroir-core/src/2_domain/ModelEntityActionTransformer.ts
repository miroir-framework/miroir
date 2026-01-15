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
import { TransformerFailure, type TransformerReturnType } from "../0_interfaces/2_domain/DomainElement";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";

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
  // ):InstanceAction[] {
  ):TransformerReturnType<InstanceAction[]> {
    // log.info("modelActionToInstanceAction called ", deploymentUuid, modelAction)
    switch (modelAction.actionType) {
      case "createEntity": {
        return [
          {
            actionType: "createInstance",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: modelAction.payload.application,
              deploymentUuid: modelAction.payload.deploymentUuid,
              applicationSection: "model",
              parentUuid:entityEntity.uuid,
              objects: [
                ...modelAction.payload.entities.flatMap(
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
          }
        ];
        break;
      }
      case "dropEntity": {
        if (!modelAction.payload.entityUuid || !modelAction.payload.entityDefinitionUuid) {
          return new TransformerFailure({
            queryFailure: "FailedTransformer",
            failureMessage:
              "modelActionToInstanceAction dropEntity missing entityUuid or entityDefinitionUuid",
            query: { modelAction } as any, // TODO: ill-typed
          });
        }
        return [
          {
            // actionType: "instanceAction",
            actionType: "deleteInstance",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: modelAction.payload.application,
              deploymentUuid: modelAction.payload.deploymentUuid,
              applicationSection: "model",
              objects: [
                {
                  parentName: entityEntity.name,
                  parentUuid: entityEntity.uuid,
                  applicationSection: "model",
                  instances: [{ parentUuid: entityEntity.uuid, uuid: modelAction.payload.entityUuid }],
                },
                {
                  parentName: entityEntityDefinition.name,
                  parentUuid: entityEntityDefinition.uuid,
                  applicationSection: "model",
                  instances: [{ parentUuid: entityEntityDefinition.uuid, uuid: modelAction.payload.entityDefinitionUuid }],
                },
              ],
            }
          },
        ];
        break;
      }
      case "renameEntity":
      {
        // log.info("modelActionToInstanceAction currentModel ", JSON.stringify(currentModel));

        const currentEntity = currentModel.entities.find(e=>e.uuid==modelAction.payload.entityUuid);
        const currentEntityDefinition = currentModel.entityDefinitions.find(e=>e.uuid==modelAction.payload.entityDefinitionUuid);
  
        log.info(
          "modelActionToInstanceAction available Entities",
          JSON.stringify(
            currentModel.entities.map((e) => e.name),
            null,
            2
          ),
          "currentEntityDefinition available EntityDefinitions",
          JSON.stringify(
            currentModel.entityDefinitions.map((e) => e.name),
            null,
            2
          )
        );
        log.info("modelActionToInstanceAction found currentEntity ", currentEntity, "currentEntityDefinition", currentEntityDefinition);
  
        const modifiedEntity:EntityInstanceWithName = Object.assign({},currentEntity,{name:modelAction.payload.targetValue});
        const modifiedEntityDefinition:EntityInstanceWithName = Object.assign({},currentEntityDefinition,{name:modelAction.payload.targetValue});
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
              actionType: "updateInstance",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              payload: {
                application: modelAction.payload.application,
                deploymentUuid: modelAction.payload.deploymentUuid,
                applicationSection: "model",
                objects
              }
            },
          ];
          log.info("modelActionToInstanceAction returning for ", deploymentUuid, modelAction,"result=", result)

          return result;
        } else {
          log.error('modelActionToInstanceAction renameEntity could not rename',modelAction);
          return [];
        }
        break;
      }
      case "alterEntityAttribute": {
        log.info("modelActionToInstanceAction currentModel ", JSON.stringify(currentModel));

        const currentEntity = currentModel.entities.find(e=>e.uuid==modelAction.payload.entityUuid);
        const currentEntityDefinition = currentModel.entityDefinitions.find(e=>e.uuid==modelAction.payload.entityDefinitionUuid);
        // log.info(
        //   "modelActionToInstanceAction alterEntityAttribute found currentEntity ",
        //   currentEntity,
        //   "currentEntityDefinition",
        //   currentEntityDefinition
        // );
        if (currentEntity && currentEntityDefinition) {
          const localEntityJzodSchemaDefinition =
            modelAction.payload.removeColumns != undefined && Array.isArray(modelAction.payload.removeColumns)
              ? Object.fromEntries(
                  Object.entries(currentEntityDefinition.mlSchema.definition).filter(
                    (i) => modelAction.payload.removeColumns ?? ([] as string[]).includes(i[0])
                  )
                )
              : currentEntityDefinition.mlSchema.definition;
          const modifiedEntityDefinition: EntityDefinition = Object.assign({}, currentEntityDefinition, {
            mlSchema: {
              type: "object",
              definition: {
                ...localEntityJzodSchemaDefinition,
                ...(modelAction.payload.addColumns
                  ? Object.fromEntries(modelAction.payload.addColumns.map((c) => [c.name, c.definition]))
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
              actionType: "updateInstance",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              payload: {
                application: modelAction.payload.application,
                deploymentUuid: modelAction.payload.deploymentUuid,
                applicationSection: "model",
                objects
              }
            },
          ];
          log.info(
            "modelActionToInstanceAction returning for ",
            deploymentUuid,
            modelAction,
            "result=",
            JSON.stringify(result, null, 2)
          );

          return result;
        } else {
          log.error('modelActionToInstanceAction alterEntityAttribute could not rename',modelAction);
          return [];
        }
      }
      case "initModel":
      case "remoteLocalCacheRollback":
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
}