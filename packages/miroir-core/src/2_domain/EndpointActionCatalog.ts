import { entityEndpointVersion } from "miroir-app-miroir";

import { getEndpointActions } from "../0_interfaces/1_core/endpointDefinition.js";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import type {
  Action,
  EndpointDefinition,
  MlElement,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { Action2Error, type Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { LocalCacheInterface } from "../0_interfaces/4-services/LocalCacheInterface";
import {
  ADMIN_APPLICATION_UUID,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENTITY_DEPLOYMENT_UUID,
  MIROIR_APPLICATION_UUID,
} from "../1_core/authentication/AccessPolicy";
import { authorizeDeployment, type LoadedAccessDirectory } from "../1_core/authentication/AccessGate";
import type { AuthPrincipal } from "../1_core/authentication/AuthenticationPolicy";
import { deploymentUuidsFromHttpRequest } from "../1_core/authentication/deploymentUuidFromHttpRequest";
import { rejectInstancesNotMatchingTheirEntity } from "../1_core/Entity/instanceSchemaGuard";
import { metaModelEntities } from "../1_core/Model";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const loggerName: string = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "EndpointActionCatalog");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(loggerName);
MiroirLoggerFactory.registerLoggerToStart(loggerName).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// #627: the Endpoint actions of every deployed application, read live from the local cache, with
// one name per action shared by every surface (MCP tools, CLI commands, CopilotKit actions).
// ################################################################################################

/** The applications of the framework itself, whose actions only the MCP and CLI surfaces expose. */
export const FRAMEWORK_APPLICATION_UUIDS: readonly string[] = [MIROIR_APPLICATION_UUID, ADMIN_APPLICATION_UUID];

export interface EndpointActionEntry {
  /** Unique across the catalog, at most ENDPOINT_ACTION_NAME_MAX_LENGTH characters of [a-zA-Z0-9_-]. */
  name: string;
  applicationUuid: string;
  applicationName: string;
  /** True for the Miroir and Admin applications. */
  frameworkApplication: boolean;
  endpoint: EndpointDefinition;
  actionType: string;
  action: Action;
  payload: MlElement;
  description: string;
}

// ################################################################################################
// Names
// ################################################################################################
export const ENDPOINT_ACTION_NAME_MAX_LENGTH = 64;
const FORBIDDEN_NAME_CHARACTERS = /[^a-zA-Z0-9_-]/g;

export function sanitizeEndpointActionNamePart(part: string): string {
  return part.replace(FORBIDDEN_NAME_CHARACTERS, "_");
}

/** 32-bit FNV-1a, as 8 hex digits: browser-safe, stable across runs. */
function fnv1aHex(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** Names longer than the limit keep a prefix and get a hash of the full name, so distinct names stay distinct. */
export function truncateEndpointActionName(name: string): string {
  if (name.length <= ENDPOINT_ACTION_NAME_MAX_LENGTH) {
    return name;
  }
  return `${name.slice(0, ENDPOINT_ACTION_NAME_MAX_LENGTH - 9)}_${fnv1aHex(name)}`;
}

/**
 * `<applicationName>_<actionType>`, or `<applicationName>_<endpointName>_<actionType>[_n]` when that
 * name is taken. `takenNames` holds the names already given in the current enumeration; candidates
 * are compared once truncated, as they are returned.
 */
export function endpointActionName(
  applicationName: string,
  endpointName: string,
  actionType: string,
  takenNames: ReadonlySet<string>,
): string {
  const application = sanitizeEndpointActionNamePart(applicationName);
  const action = sanitizeEndpointActionNamePart(actionType);
  const base = truncateEndpointActionName(`${application}_${action}`);
  if (!takenNames.has(base)) {
    return base;
  }
  const withEndpoint = `${application}_${sanitizeEndpointActionNamePart(endpointName)}_${action}`;
  let candidate = truncateEndpointActionName(withEndpoint);
  for (let i = 2; takenNames.has(candidate); i++) {
    candidate = truncateEndpointActionName(`${withEndpoint}_${i}`);
  }
  return candidate;
}

// ################################################################################################
// Applications
// ################################################################################################
function adminDataSection(localCache: LocalCacheInterface, seedMap: ApplicationDeploymentMap, entityUuid: string) {
  const adminDeploymentUuid = seedMap[ADMIN_APPLICATION_UUID];
  if (!adminDeploymentUuid) {
    return {};
  }
  return (localCache.getDomainState() as any)[adminDeploymentUuid]?.["data"]?.[entityUuid] ?? {};
}

/**
 * The seed application/deployment map, extended with the deployments of the Admin data section.
 * Seed entries win over discovered ones.
 */
export function currentApplicationDeploymentMap(
  localCache: LocalCacheInterface,
  seedMap: ApplicationDeploymentMap,
): ApplicationDeploymentMap {
  const result: ApplicationDeploymentMap = { ...seedMap };
  for (const deployment of Object.values(adminDataSection(localCache, seedMap, ENTITY_DEPLOYMENT_UUID)) as any[]) {
    if (deployment?.selfApplication && deployment?.uuid && !result[deployment.selfApplication]) {
      result[deployment.selfApplication] = deployment.uuid;
    }
  }
  return result;
}

/** AdminApplication names first, then each application's SelfApplication name; the uuid otherwise. */
function applicationNames(
  localCache: LocalCacheInterface,
  map: ApplicationDeploymentMap,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const adminApplication of Object.values(
    adminDataSection(localCache, map, ENTITY_ADMIN_APPLICATION_UUID),
  ) as any[]) {
    if (adminApplication?.selfApplication && adminApplication?.name) {
      result[adminApplication.selfApplication] = adminApplication.name;
    }
  }
  for (const applicationUuid of Object.keys(map)) {
    if (result[applicationUuid]) {
      continue;
    }
    try {
      const selfApplication = (localCache.currentModel(applicationUuid, map).applications ?? []).find(
        (application: any) => application.uuid === applicationUuid,
      );
      result[applicationUuid] = selfApplication?.name ?? applicationUuid;
    } catch (error) {
      result[applicationUuid] = applicationUuid;
    }
  }
  return result;
}

// ################################################################################################
// Catalog
// ################################################################################################
function actionTypeOf(action: Action): string | undefined {
  const actionType = (action as any)?.actionParameters?.actionType?.definition;
  return typeof actionType === "string" ? actionType : undefined;
}

function descriptionOf(action: Action, actionType: string, endpoint: EndpointDefinition): string {
  const tag = (action as any)?.actionParameters?.actionType?.tag?.value;
  return tag?.description || tag?.defaultLabel || `Execute ${actionType} action on ${endpoint.name || endpoint.uuid}`;
}

/**
 * One entry per (application, endpoint, action) of every application of the current map, from the
 * live model. Applications sorted by uuid, endpoints by uuid, actions by action type, so names are
 * stable. Malformed endpoints and actions without an action type or a payload are skipped.
 */
export function listEndpointActions(
  localCache: LocalCacheInterface,
  seedMap: ApplicationDeploymentMap,
): EndpointActionEntry[] {
  const map = currentApplicationDeploymentMap(localCache, seedMap);
  const names = applicationNames(localCache, map);
  const takenNames = new Set<string>();
  const entries: EndpointActionEntry[] = [];

  for (const applicationUuid of Object.keys(map).sort()) {
    let endpoints: EndpointDefinition[];
    try {
      endpoints = localCache.currentModel(applicationUuid, map).endpoints ?? [];
    } catch (error) {
      log.warn(`listEndpointActions: no current model for application ${applicationUuid}, skipped: ${error}`);
      continue;
    }
    const applicationName = names[applicationUuid] ?? applicationUuid;
    const wellFormed = endpoints.filter((endpoint) => endpoint?.uuid && endpoint?.name && getEndpointActions(endpoint));
    for (const endpoint of [...wellFormed].sort((a, b) => a.uuid.localeCompare(b.uuid))) {
      const actions = [...(getEndpointActions(endpoint) ?? [])].sort((a, b) =>
        String(actionTypeOf(a)).localeCompare(String(actionTypeOf(b))),
      );
      for (const action of actions) {
        const actionType = actionTypeOf(action);
        const payload = (action as any)?.actionParameters?.payload as MlElement | undefined;
        if (!actionType || !payload) {
          continue;
        }
        const name = endpointActionName(applicationName, endpoint.name, actionType, takenNames);
        takenNames.add(name);
        entries.push({
          name,
          applicationUuid,
          applicationName,
          frameworkApplication: FRAMEWORK_APPLICATION_UUIDS.includes(applicationUuid),
          endpoint,
          actionType,
          action,
          payload,
          description: descriptionOf(action, actionType, endpoint),
        });
      }
    }
  }
  return entries;
}

/**
 * Changes whenever an endpoint instance (any deployment, model or data section) or the Admin
 * deployment registry changes; cheap enough to compute on every store notification.
 */
export function endpointActionFingerprint(
  localCache: LocalCacheInterface,
  seedMap: ApplicationDeploymentMap,
): string {
  const domainState = localCache.getDomainState() as any;
  const parts: string[] = [];
  for (const deploymentUuid of Object.keys(domainState).sort()) {
    const sections = domainState[deploymentUuid] ?? {};
    const endpointInstances = [
      ...Object.values(sections["model"]?.[entityEndpointVersion.uuid] ?? {}),
      ...Object.values(sections["data"]?.[entityEndpointVersion.uuid] ?? {}),
    ] as { uuid: string; version?: string }[];
    parts.push(
      `${deploymentUuid}:[${endpointInstances
        .map((endpoint) => `${endpoint.uuid}@${endpoint.version ?? ""}`)
        .sort()
        .join(",")}]`,
    );
  }
  parts.push(
    `admin:[${(Object.values(adminDataSection(localCache, seedMap, ENTITY_DEPLOYMENT_UUID)) as any[])
      .map((deployment) => `${deployment.uuid}->${deployment.selfApplication}`)
      .sort()
      .join(",")}]`,
  );
  return parts.join("|");
}

// ################################################################################################
// Execution
// ################################################################################################
/** #263: who calls. Without it (or with `enabled: false`) a call is not access-checked. */
export type EndpointActionCallContext = {
  enabled: boolean;
  principal: AuthPrincipal | undefined;
  access: LoadedAccessDirectory | undefined;
};

/**
 * The application whose model a call runs with: the application a Miroir Endpoint action names in
 * its payload (`createInstance` on a Library Book runs with the Library model), when it is deployed;
 * the endpoint's own application otherwise.
 */
export function endpointActionTargetApplication(
  entry: Pick<EndpointActionEntry, "applicationUuid">,
  payload: unknown,
  applicationDeploymentMap: ApplicationDeploymentMap,
): string {
  const named = (payload as { application?: unknown } | undefined)?.application;
  if (
    entry.applicationUuid === MIROIR_APPLICATION_UUID &&
    typeof named === "string" &&
    applicationDeploymentMap[named]
  ) {
    return named;
  }
  return entry.applicationUuid;
}

/**
 * Runs one catalog action with an already validated payload: access check when a context is given,
 * the target application's model environment, #558 rejection of instances that do not match their
 * Entity, then the DomainController, as the context's principal.
 */
export async function executeEndpointAction(
  entry: EndpointActionEntry,
  payload: unknown,
  options: {
    domainController: DomainControllerInterface;
    applicationDeploymentMap: ApplicationDeploymentMap;
    actionLabel?: string;
    context?: EndpointActionCallContext;
  },
): Promise<Action2ReturnType> {
  const { domainController, applicationDeploymentMap, context } = options;
  if (context?.enabled) {
    // the action's own application, and any other deployment its payload names (#263)
    const deployments = [
      applicationDeploymentMap[entry.applicationUuid],
      ...deploymentUuidsFromHttpRequest({ body: { action: { payload }, applicationDeploymentMap } }),
    ];
    const access = authorizeDeployment(true, context, deployments as string[]);
    if (!access.allowed) {
      log.warn(
        `executeEndpointAction ${entry.name}: access denied for ${context.principal?.username ?? "anonymous"} on deployments ${deployments.join(",")}`,
      );
      return new Action2Error(access.body.errorType as any, "Access denied");
    }
  }
  const action = {
    actionType: entry.actionType,
    actionLabel: options.actionLabel ?? entry.name,
    endpoint: entry.endpoint.uuid,
    payload,
  } as any;
  const targetApplication = endpointActionTargetApplication(entry, payload, applicationDeploymentMap);
  const modelEnvironment: MiroirModelEnvironment = domainController
    .getLocalCache()
    .currentModelEnvironment(targetApplication, applicationDeploymentMap);
  // #558: refused before any store is touched, against the model the instances belong to
  const rejected = rejectInstancesNotMatchingTheirEntity(
    action,
    [...(modelEnvironment.currentModel?.entities ?? []), ...metaModelEntities],
    modelEnvironment,
  );
  if (rejected) {
    return rejected;
  }
  return domainController.handleAction(
    action,
    applicationDeploymentMap,
    modelEnvironment,
    undefined,
    undefined,
    context?.principal,
  );
}
