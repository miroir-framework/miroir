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
  normalizeCreateEntityPair,
} from "../1_core/modelEntityDualWrite.js";
import {
  planAlterEntityAttributeMutation,
  planRenameEntityMutation,
  resolveLiveEntityDefinitionForAction,
  resolveOrSynthesizeEntityDefinitionForCreate,
} from "../1_core/modelEntityActionLiveResolve.js";
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
        const normalizedPairs = modelAction.payload.entities.map((pair) => {
          const entity = pair.entity as Entity;
          const entityDefinition =
            (pair.entityDefinition as EntityDefinition | undefined) ??
            resolveOrSynthesizeEntityDefinitionForCreate(
              entity,
              currentModel.entityDefinitions ?? [],
            );
          // #217 Phase 11 — when caller supplies Entity-only and we synthesized ED,
          // still dual-write for store API compatibility during transition.
          return normalizeCreateEntityPair(entity, entityDefinition);
        });
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
        const liveEntityDefinition = resolveLiveEntityDefinitionForAction(
          currentModel,
          modelAction.payload.entityUuid,
          modelAction.payload.entityDefinitionUuid,
        );
        // Drops the live Entity; deletes redundant live EntityDefinition when present.
        // Historical EntityVersion copies (other UUIDs) are not referenced here.
        const objects: { parentUuid: string; uuid: string }[] = [
          { parentUuid: entityEntity.uuid, uuid: modelAction.payload.entityUuid },
        ];
        if (liveEntityDefinition) {
          objects.push({
            parentUuid: entityEntityDefinition.uuid,
            uuid: liveEntityDefinition.uuid,
          });
        }
        return [
          {
            actionType: "deleteInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: modelAction.payload.application,
              applicationSection: "model",
              objects,
            }
          },
        ];
      }
      case "renameEntity":
      {
        const plan = planRenameEntityMutation(
          currentModel,
          modelAction.payload.entityUuid,
          modelAction.payload.targetValue,
          modelAction.payload.entityDefinitionUuid,
        );
  
        log.info(
          "modelActionToInstanceAction renameEntity plan",
          plan?.mode,
          modelAction.payload.entityUuid,
        );
  
        if (!plan) {
          log.error('modelActionToInstanceAction renameEntity could not rename',modelAction);
          return [];
        }
        const objects: EntityInstance[] =
          plan.mode === "dualWrite"
            ? [plan.pair.entity as EntityInstance, plan.pair.entityDefinition as EntityInstance]
            : [plan.entity as EntityInstance];
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

        const plan = planAlterEntityAttributeMutation(
          currentModel,
          modelAction.payload.entityUuid,
          {
            addColumns: modelAction.payload.addColumns,
            removeColumns: modelAction.payload.removeColumns,
          },
          modelAction.payload.entityDefinitionUuid,
        );
        if (!plan) {
          log.error('modelActionToInstanceAction alterEntityAttribute could not alter',modelAction);
          return [];
        }
        const objects: EntityInstance[] =
          plan.mode === "dualWrite"
            ? [plan.pair.entity as EntityInstance, plan.pair.entityDefinition as EntityInstance]
            : [plan.entity as EntityInstance];
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
