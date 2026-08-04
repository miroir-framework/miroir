import { createHash } from "node:crypto";

import {
  type ApplicationDeploymentMap,
  type AdminApplication,
  type Deployment,
  type DomainControllerInterface,
  type EndpointDefinition,
  type LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";
import { adminSelfApplication, entityApplicationForAdmin, entityDeployment } from "miroir-test-app_deployment-admin";
import { entityEndpointVersion } from "miroir-test-app_deployment-miroir";

import {
  handleMcpAction,
  mcpToolEntry,
  type McpRequestHandler,
  type McpToolDescription,
} from "./mcpHandlersForEndpoint.js";

const packageName = "miroir-mcp";
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, "info", "EndpointToolRegistry")
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Tool naming
// ################################################################################################
export const MCP_TOOL_NAME_MAX_LENGTH = 64;
const MCP_TOOL_NAME_FORBIDDEN_CHARS = /[^a-zA-Z0-9_-]/g;

export function sanitizeToolNamePart(part: string): string {
  return part.replace(MCP_TOOL_NAME_FORBIDDEN_CHARS, "_");
}

/**
 * MCP tool names are limited to 64 chars; truncation appends a hash of the full name so that
 * distinct full names keep distinct truncated names.
 */
export function truncateToolName(name: string): string {
  if (name.length <= MCP_TOOL_NAME_MAX_LENGTH) {
    return name;
  }
  const hash = createHash("md5").update(name).digest("hex").slice(0, 8);
  return `${name.slice(0, MCP_TOOL_NAME_MAX_LENGTH - 9)}_${hash}`;
}

/**
 * Deterministic tool name for one (application, endpoint, action):
 * `<applicationName>_<actionType>`, disambiguated with the endpoint name on collision.
 * `takenNames` must contain the names already attributed in the current enumeration.
 */
export function toolNameFor(
  applicationName: string,
  endpointName: string,
  actionType: string,
  takenNames: Set<string>,
): string {
  const application = sanitizeToolNamePart(applicationName);
  const action = sanitizeToolNamePart(actionType);
  const base = `${application}_${action}`;
  if (!takenNames.has(base)) {
    return truncateToolName(base);
  }
  const endpoint = sanitizeToolNamePart(endpointName);
  const withEndpoint = `${application}_${endpoint}_${action}`;
  let candidate = withEndpoint;
  for (let i = 2; takenNames.has(candidate); i++) {
    candidate = `${withEndpoint}_${i}`;
  }
  return truncateToolName(candidate);
}

// ################################################################################################
// EndpointToolRegistry
// ################################################################################################
export type McpToolResult = {
  content: Array<{ type: string; text: string; parsed: Record<string, any> }>;
};

/**
 * Computes the MCP tool surface live from the endpoints currently defined in the deployed
 * applications: one tool per (endpoint, action), for every application of the (seed)
 * application/deployment map.
 */
export class EndpointToolRegistry {
  private handlers: Record<
    string,
    { applicationUuid: string; handler: McpRequestHandler<any> }
  > = {};
  private unsubscribeFromStore?: () => void;
  private lastFingerprint?: string;

  constructor(
    private domainController: DomainControllerInterface,
    private seedApplicationDeploymentMap: ApplicationDeploymentMap,
  ) {}

  // ##############################################################################################
  /**
   * Subscribe to local-cache changes; `onChange` fires whenever the set of endpoints (any
   * deployment, model or data section) or the Admin deployment registry changes.
   */
  start(onChange: () => void): void {
    this.stop();
    this.lastFingerprint = this.computeFingerprint();
    const store = this.domainController.getLocalCache().getInnerStore();
    this.unsubscribeFromStore = store.subscribe(() => {
      let newFingerprint: string;
      try {
        newFingerprint = this.computeFingerprint();
      } catch (error) {
        log.error(`start: could not compute endpoint fingerprint: ${error}`);
        return;
      }
      if (newFingerprint !== this.lastFingerprint) {
        this.lastFingerprint = newFingerprint;
        this.handlers = {}; // invalidate cached handlers; rebuilt lazily by callTool/listTools
        try {
          onChange();
        } catch (error) {
          log.error(`start: onChange callback failed: ${error}`);
        }
      }
    });
  }

  // ##############################################################################################
  stop(): void {
    this.unsubscribeFromStore?.();
    this.unsubscribeFromStore = undefined;
  }

  // ##############################################################################################
  /**
   * Cheap change detector over the local cache: endpoint instances (uuid@version) of every
   * deployment + the Admin deployment registry (deployment uuid -> selfApplication).
   */
  private computeFingerprint(): string {
    const domainState = this.domainController.getLocalCache().getDomainState();
    const parts: string[] = [];
    for (const deploymentUuid of Object.keys(domainState).sort()) {
      const sections = (domainState as any)[deploymentUuid] ?? {};
      const endpointInstances = [
        ...Object.values(sections["model"]?.[entityEndpointVersion.uuid] ?? {}),
        ...Object.values(sections["data"]?.[entityEndpointVersion.uuid] ?? {}),
      ] as { uuid: string; version?: string }[];
      parts.push(
        `${deploymentUuid}:[${endpointInstances
          .map((e) => `${e.uuid}@${e.version ?? ""}`)
          .sort()
          .join(",")}]`,
      );
    }
    const adminDeploymentUuid = this.seedApplicationDeploymentMap[adminSelfApplication.uuid];
    const deployments = adminDeploymentUuid
      ? ((domainState as any)[adminDeploymentUuid]?.["data"]?.[entityDeployment.uuid] ?? {})
      : {};
    parts.push(
      `admin:[${Object.values(deployments)
        .map((d: any) => `${d.uuid}->${d.selfApplication}`)
        .sort()
        .join(",")}]`,
    );
    return parts.join("|");
  }

  // ##############################################################################################
  /**
   * The current application/deployment map: the configured seed map, extended with the
   * deployments registered in the Admin deployment data section (dynamic discovery).
   * Seed entries always win over discovered ones.
   */
  resolveCurrentApplicationDeploymentMap(): ApplicationDeploymentMap {
    const domainState = this.domainController.getLocalCache().getDomainState();
    const adminDeploymentUuid = this.seedApplicationDeploymentMap[adminSelfApplication.uuid];
    const result: ApplicationDeploymentMap = { ...this.seedApplicationDeploymentMap };
    if (!adminDeploymentUuid) {
      return result;
    }
    const deployments =
      (domainState as any)[adminDeploymentUuid]?.["data"]?.[entityDeployment.uuid] ?? {};
    for (const instance of Object.values(deployments)) {
      const deployment = instance as Deployment;
      if (deployment.selfApplication && deployment.uuid && !result[deployment.selfApplication]) {
        result[deployment.selfApplication] = deployment.uuid;
      }
    }
    return result;
  }

  // ##############################################################################################
  async listTools(): Promise<McpToolDescription[]> {
    const localCache = this.domainController.getLocalCache();
    const currentMap = this.resolveCurrentApplicationDeploymentMap();
    const applicationNames = this.resolveApplicationNames(currentMap);
    const tools: McpToolDescription[] = [];
    const takenNames = new Set<string>();
    const handlers: Record<string, { applicationUuid: string; handler: McpRequestHandler<any> }> =
      {};

    for (const applicationUuid of Object.keys(currentMap).sort()) {
      let endpoints: EndpointDefinition[];
      try {
        endpoints =
          localCache.currentModel(applicationUuid, currentMap).endpoints ??
          [];
      } catch (error) {
        log.warn(
          `listTools: could not resolve current model for application ${applicationUuid}, skipping: ${error}`,
        );
        continue;
      }
      const applicationName = applicationNames[applicationUuid] ?? applicationUuid;
      const wellFormedEndpoints = endpoints.filter((endpoint) => {
        const wellFormed = endpoint?.uuid && endpoint?.name && endpoint?.definition?.actions;
        if (!wellFormed) {
          log.warn(
            `listTools: skipping malformed endpoint entry for application ${applicationUuid}: ${JSON.stringify(endpoint)}`,
          );
        }
        return wellFormed;
      });
      const sortedEndpoints = [...wellFormedEndpoints].sort((a, b) => a.uuid.localeCompare(b.uuid));
      for (const endpoint of sortedEndpoints) {
        const sortedActions = [...(endpoint.definition.actions ?? [])].sort((a: any, b: any) =>
          String(a?.actionParameters?.actionType?.definition).localeCompare(
            String(b?.actionParameters?.actionType?.definition),
          ),
        );
        for (const action of sortedActions) {
          const actionType = action?.actionParameters?.actionType?.definition;
          if (!actionType || !action?.actionParameters?.payload) {
            log.info(
              `listTools: skipping action without type or payload on endpoint ${endpoint.name} (${endpoint.uuid})`,
            );
            continue;
          }
          try {
            const toolName = toolNameFor(applicationName, endpoint.name, actionType, takenNames);
            takenNames.add(toolName);
            const handler = mcpToolEntry(endpoint, actionType, toolName);
            tools.push(handler.mcpToolDescription);
            handlers[toolName] = { applicationUuid, handler };
          } catch (error) {
            log.error(
              `listTools: skipping action ${actionType} of endpoint ${endpoint.name} (${endpoint.uuid}): ${error}`,
            );
          }
        }
      }
    }
    this.handlers = handlers;
    return tools;
  }

  // ##############################################################################################
  async callTool(name: string, args: unknown): Promise<McpToolResult> {
    if (Object.keys(this.handlers).length === 0) {
      await this.listTools();
    }
    const entry = this.handlers[name];
    if (!entry) {
      const subObject = {
        status: "error",
        error: {
          type: "unknown_tool",
          message: `Unknown tool: ${name}`,
        },
      };
      return {
        content: [{ type: "text", parsed: subObject, text: JSON.stringify(subObject, null, 2) }],
      };
    }
    const currentMap = this.resolveCurrentApplicationDeploymentMap();
    const modelEnvironment = this.domainController
      .getLocalCache()
      .currentModelEnvironment(entry.applicationUuid, currentMap);
    return handleMcpAction(
      name,
      args,
      entry.handler.payloadZodSchema,
      (payload: any) =>
        ({
          ...entry.handler.actionEnvelope,
          payload,
        }) as any,
      this.domainController,
      currentMap,
      modelEnvironment,
    );
  }

  // ##############################################################################################
  /**
   * Application names are resolved from the AdminApplication instances held in the Admin
   * deployment data section, falling back to the SelfApplication instances of each
   * application's own model; unknown applications fall back to their uuid.
   */
  private resolveApplicationNames(
    currentMap: ApplicationDeploymentMap,
  ): Record<string, string> {
    const localCache = this.domainController.getLocalCache();
    const domainState = localCache.getDomainState();
    const adminDeploymentUuid = currentMap[adminSelfApplication.uuid];
    const result: Record<string, string> = {};
    if (adminDeploymentUuid) {
      const adminApplications =
        (domainState as any)[adminDeploymentUuid]?.["data"]?.[entityApplicationForAdmin.uuid] ?? {};
      for (const instance of Object.values(adminApplications)) {
        const adminApplication = instance as AdminApplication;
        result[adminApplication.selfApplication] = adminApplication.name;
      }
    } else {
      log.warn("resolveApplicationNames: no Admin deployment in applicationDeploymentMap");
    }
    for (const applicationUuid of Object.keys(currentMap)) {
      if (result[applicationUuid]) {
        continue;
      }
      try {
        const applications =
          localCache.currentModel(applicationUuid, currentMap).applications ??
          [];
        const selfApplication = applications.find((a: any) => a.uuid === applicationUuid);
        if (selfApplication?.name) {
          result[applicationUuid] = selfApplication.name;
        }
      } catch (error) {
        log.info(
          `resolveApplicationNames: could not resolve model for application ${applicationUuid}: ${error}`,
        );
      }
    }
    return result;
  }
}
