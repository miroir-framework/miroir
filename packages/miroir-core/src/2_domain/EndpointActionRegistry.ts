import type { Action, EndpointDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { getEndpointActions } from "../0_interfaces/1_core/endpointDefinition";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { MIROIR_APPLICATION_UUID } from "../1_core/authentication/AccessPolicy";

// ################################################################################################
// Issue #504 (analysis #497, D12) — the Endpoint action of an action type, for the block view of
// action sequences: a step's slots are the `actionParameters` of its action, its category the name
// of its Endpoint.
// - The Endpoints are those of the model environment: `endpointsByUuid` (Miroir's, and in the
//   client those of every application of the deployment map), then `currentModel.endpoints`.
// - Miroir's Endpoints come first, then the first Endpoint declaring an action type wins.
// - An external-service Endpoint declares no actions, so it adds nothing.
// ################################################################################################

export interface EndpointActionRegistryEntry {
  endpointUuid: string;
  endpointName: string;
  action: Action;
}

export type EndpointActionRegistry = Record<string, EndpointActionRegistryEntry>;

type EndpointEnvironment = Pick<MiroirModelEnvironment, "endpointsByUuid" | "currentModel">;

const registries = new WeakMap<object, WeakMap<object, EndpointActionRegistry>>();
const noCurrentModel = {};

/** The action type an Endpoint action declares, `undefined` when it is not a literal. */
export function endpointActionType(action: Action): string | undefined {
  const actionType = (action as any)?.actionParameters?.actionType;
  return actionType?.type === "literal" && typeof actionType.definition === "string"
    ? actionType.definition
    : undefined;
}

/** The registry of `endpoints`: Miroir's first, then the first Endpoint declaring an action type wins. */
export function endpointActionRegistryOf(endpoints: EndpointDefinition[] | undefined): EndpointActionRegistry {
  const ordered = [
    ...(endpoints ?? []).filter((endpoint) => endpoint?.application === MIROIR_APPLICATION_UUID),
    ...(endpoints ?? []).filter((endpoint) => endpoint?.application !== MIROIR_APPLICATION_UUID),
  ];
  const registry: EndpointActionRegistry = {};
  for (const endpoint of ordered) {
    for (const action of getEndpointActions(endpoint) ?? []) {
      const actionType = endpointActionType(action);
      if (actionType && !Object.hasOwn(registry, actionType)) {
        registry[actionType] = { endpointUuid: endpoint.uuid, endpointName: endpoint.name, action };
      }
    }
  }
  return registry;
}

/**
 * The registry of `modelEnvironment`. Endpoints and models are immutable state, so the registry is
 * kept per `endpointsByUuid` and `currentModel` objects.
 */
export function endpointActionRegistry(modelEnvironment: EndpointEnvironment | undefined): EndpointActionRegistry {
  const endpointsByUuid = modelEnvironment?.endpointsByUuid ?? {};
  const currentModel: object = modelEnvironment?.currentModel ?? noCurrentModel;
  let byModel = registries.get(endpointsByUuid);
  if (!byModel) {
    byModel = new WeakMap();
    registries.set(endpointsByUuid, byModel);
  }
  const known = byModel.get(currentModel);
  if (known) {
    return known;
  }
  const registry = endpointActionRegistryOf([
    ...(Object.values(endpointsByUuid) as EndpointDefinition[]),
    ...(modelEnvironment?.currentModel?.endpoints ?? []),
  ]);
  byModel.set(currentModel, registry);
  return registry;
}

/** The Endpoint declaring `actionType` in `modelEnvironment`, `undefined` when none does. */
export function endpointOfActionType(
  modelEnvironment: EndpointEnvironment | undefined,
  actionType: string,
): { endpointUuid: string; endpointName: string } | undefined {
  const entry = endpointActionRegistry(modelEnvironment)[actionType];
  return entry ? { endpointUuid: entry.endpointUuid, endpointName: entry.endpointName } : undefined;
}
