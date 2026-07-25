import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  EntityDefinition,
  InstanceAction,
  MetaModel,
  ModelAction,
  type Entity,
  type EntityInstance
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { TransformerFailure, type TransformerReturnType } from "../0_interfaces/2_domain/DomainElement";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";

import { entityEntity, entityEntityDefinition } from "miroir-test-app_deployment-miroir";

import {
  applyAlterEntityAttributePair,
  applyRenameEntityPair,
  normalizeCreateEntityPair,
} from "../1_core/modelEntityDualWrite.js";
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
        const normalizedPairs = modelAction.payload.entities.map((pair) =>
          normalizeCreateEntityPair(pair.entity as Entity, pair.entityDefinition as EntityDefinition),
        );
        return [
          {
            actionType: "createInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: modelAction.payload.application,
              applicationSection: "model",
              objects: [
                ...normalizedPairs.flatMap((pair) => [
                  pair.entity as EntityInstance,
                  pair.entityDefinition as EntityInstance,
                ]),
              ],
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
        // Drops the live Entity and its current redundant EntityDefinition only.
        // Historical EntityVersion copies (other UUIDs) are not referenced here.
        return [
          {
            actionType: "deleteInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: modelAction.payload.application,
              applicationSection: "model",
              objects: [
                { parentUuid: entityEntity.uuid, uuid: modelAction.payload.entityUuid },
                { parentUuid: entityEntityDefinition.uuid, uuid: modelAction.payload.entityDefinitionUuid },
              ],
            }
          },
        ];
        break;
      }
      case "renameEntity":
      {
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
  
        if (currentEntity && currentEntityDefinition) {
          const pair = applyRenameEntityPair(
            currentEntity as Entity,
            currentEntityDefinition as EntityDefinition,
            modelAction.payload.targetValue,
          );
          const objects: EntityInstance[] = [
            pair.entity as EntityInstance,
            pair.entityDefinition as EntityInstance,
          ];
          const result: InstanceAction[] = [
            {
              actionType: "updateInstance",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              payload: {
                application: modelAction.payload.application,
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
        if (currentEntity && currentEntityDefinition) {
          const pair = applyAlterEntityAttributePair(
            currentEntity as Entity,
            currentEntityDefinition as EntityDefinition,
            {
              addColumns: modelAction.payload.addColumns,
              removeColumns: modelAction.payload.removeColumns,
            },
          );
    
          const objects: EntityInstance[] = [
            pair.entity as EntityInstance,
            pair.entityDefinition as EntityInstance,
          ];
          const result: InstanceAction[] = [
            {
              actionType: "updateInstance",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              payload: {
                application: modelAction.payload.application,
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
          log.error('modelActionToInstanceAction alterEntityAttribute could not alter',modelAction);
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
