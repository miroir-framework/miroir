import { Uuid } from "../0_interfaces/1_core/EntityVersion";
import {
  InstanceAction,
  MetaModel,
  ModelAction,
  type Entity,
  type EntityInstance
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { TransformerFailure, type TransformerReturnType } from "../0_interfaces/2_domain/DomainElement";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";

import { entityEntity } from "miroir-test-app_deployment-miroir";

import { applyMlSchemaColumnChanges } from "../1_core/modelEntityDualWrite";
import { findEntityFromUuid } from "../tools";
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
  ):TransformerReturnType<InstanceAction[]> {
    switch (modelAction.actionType) {
      case "createEntity": {
        return [
          {
            actionType: "createInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: modelAction.payload.application,
              applicationSection: "model",
              objects: modelAction.payload.entities as EntityInstance[],
            }
          }
        ];
      }
      case "dropEntity": {
        if (!modelAction.payload.entityUuid) {
          return new TransformerFailure({
            queryFailure: "FailedTransformer",
            failureMessage:
              "modelActionToInstanceAction dropEntity missing entityUuid",
            query: { modelAction } as any,
          });
        }
        // #220 — Entity-only drop; do not delete EntityVersion instances.
        return [
          {
            actionType: "deleteInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: modelAction.payload.application,
              applicationSection: "model",
              objects: [
                { parentUuid: entityEntity.uuid, uuid: modelAction.payload.entityUuid },
              ],
            }
          },
        ];
      }
      case "renameEntity":
      {
        const entityToRename: Entity | undefined = findEntityFromUuid(currentModel, modelAction.payload.entityUuid);
  
        if (!entityToRename) {
          throw new Error(`modelActionToInstanceAction renameEntity could not rename entity ${modelAction.payload.entityUuid} not found in model`);
        }
  
        // #220 — Entity-only rename
        const objects: Entity[] = [
          {
            ...entityToRename,
            name: modelAction.payload.targetValue,
          },
        ];
        return [
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
      }
      case "alterEntityAttribute": {
        log.info("modelActionToInstanceAction currentModel ", JSON.stringify(currentModel));

        const entityToAlter: Entity | undefined = findEntityFromUuid(currentModel, modelAction.payload.entityUuid);
        if (!entityToAlter) {
          throw new Error(`modelActionToInstanceAction alterEntityAttribute could not alter entity ${modelAction.payload.entityUuid} not found in model`);
        }
        const objects: Entity[] = [
          {
            ...entityToAlter,
            mlSchema: applyMlSchemaColumnChanges(
              entityToAlter.mlSchema, {
              addColumns: modelAction.payload.addColumns,
              removeColumns: modelAction.payload.removeColumns,
            }),
          },
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
      }
    }
  }
}
