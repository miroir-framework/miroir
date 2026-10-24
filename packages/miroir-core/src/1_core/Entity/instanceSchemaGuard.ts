/**
 * #558 — createInstance / updateInstance refuse an object that does not match its Entity's mlSchema,
 * before the store or the local cache is touched.
 */

import type {
  Entity,
  InstanceAction,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer.js";
import { Action2Error } from "../../0_interfaces/2_domain/DomainElement.js";
import { mlsTypeCheck } from "../mls/mlsTypeCheck.js";
import { getInnermostTypeCheckError } from "../mls/mlsTypeCheckError.js";

/**
 * The first object of a create or update that its Entity's mlSchema rejects, as an Action2Error naming the
 * Entity, the instance, the value path and the type checker's message; undefined when every object matches,
 * or when an object's Entity is not among `entities` or has no mlSchema.
 */
export function rejectInstancesNotMatchingTheirEntity(
  instanceAction: InstanceAction,
  entities: readonly Entity[],
  modelEnvironment: MiroirModelEnvironment,
): Action2Error | undefined {
  if (instanceAction.actionType !== "createInstance" && instanceAction.actionType !== "updateInstance") {
    return undefined;
  }
  for (const instance of instanceAction.payload.objects ?? []) {
    const entityUuid = instance?.parentUuid ?? instanceAction.payload.parentUuid;
    const entity = entities.find((candidate) => candidate.uuid === entityUuid);
    if (!entity?.mlSchema) {
      continue;
    }
    const check = mlsTypeCheck(entity.mlSchema, instance, [], [], modelEnvironment, {});
    if (check.status !== "error") {
      continue;
    }
    const innermost = getInnermostTypeCheckError(check);
    const valuePath = (innermost.valuePath ?? []).join(".") || "(root)";
    return new Action2Error(
      "FailedToHandleAction",
      `${instanceAction.actionType}: ${entity.name ?? entity.uuid} instance ${instance.uuid} does not match the Entity's mlSchema at ${valuePath}: ${innermost.error}`,
    );
  }
  return undefined;
}
