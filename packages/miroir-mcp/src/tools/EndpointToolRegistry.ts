import {
  currentApplicationDeploymentMap,
  endpointActionFingerprint,
  executeEndpointAction,
  listEndpointActions,
  type ApplicationDeploymentMap,
  type AuthPrincipal,
  type DomainControllerInterface,
  type EndpointActionEntry,
  type LoadedAccessDirectory,
  type LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";

import {
  handleMcpAction,
  mcpToolEntry,
  type McpRequestHandler,
  type McpToolDescription,
} from "./mcpHandlersForEndpoint.js";

export {
  MCP_TOOL_NAME_MAX_LENGTH,
  sanitizeToolNamePart,
  toolNameFor,
  truncateToolName,
} from "./toolNameFor.js";

const packageName = "miroir-mcp";
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, "info", "EndpointToolRegistry");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// EndpointToolRegistry
// ################################################################################################
export type McpToolResult = {
  content: Array<{ type: string; text: string; parsed: Record<string, any> }>;
};

/**
 * #263: who calls a tool. Without it (or with `enabled: false`) tool calls are not access-checked,
 * as before the gate. With it, a call runs only on applications the principal may access.
 */
export type McpCallContext = {
  enabled: boolean;
  principal: AuthPrincipal | undefined;
  access: LoadedAccessDirectory | undefined;
};

function toolErrorResult(toolName: string, type: string, message: string): McpToolResult {
  const subObject = { status: "error", action: toolName, error: { type, message } };
  return { content: [{ type: "text", parsed: subObject, text: JSON.stringify(subObject, null, 2) }] };
}

/**
 * The MCP tool surface, computed live from the endpoint action catalog (#627): one tool per
 * (application, endpoint, action) of every deployed application.
 */
export class EndpointToolRegistry {
  private handlers: Record<string, { entry: EndpointActionEntry; handler: McpRequestHandler<any> }> = {};
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
  private computeFingerprint(): string {
    return endpointActionFingerprint(this.domainController.getLocalCache(), this.seedApplicationDeploymentMap);
  }

  // ##############################################################################################
  /** The seed map extended with the deployments of the Admin data section; seed entries win. */
  resolveCurrentApplicationDeploymentMap(): ApplicationDeploymentMap {
    return currentApplicationDeploymentMap(this.domainController.getLocalCache(), this.seedApplicationDeploymentMap);
  }

  // ##############################################################################################
  async listTools(): Promise<McpToolDescription[]> {
    const entries = listEndpointActions(this.domainController.getLocalCache(), this.seedApplicationDeploymentMap);
    const tools: McpToolDescription[] = [];
    const handlers: Record<string, { entry: EndpointActionEntry; handler: McpRequestHandler<any> }> = {};
    for (const entry of entries) {
      try {
        const handler = mcpToolEntry(entry.endpoint, entry.actionType, entry.name);
        tools.push(handler.mcpToolDescription);
        handlers[entry.name] = { entry, handler };
      } catch (error) {
        log.error(
          `listTools: skipping action ${entry.actionType} of endpoint ${entry.endpoint.name} (${entry.endpoint.uuid}): ${error}`,
        );
      }
    }
    this.handlers = handlers;
    return tools;
  }

  // ##############################################################################################
  async callTool(name: string, args: unknown, context?: McpCallContext): Promise<McpToolResult> {
    if (Object.keys(this.handlers).length === 0) {
      await this.listTools();
    }
    const registered = this.handlers[name];
    if (!registered) {
      return toolErrorResult(name, "unknown_tool", `Unknown tool: ${name}`);
    }
    const applicationDeploymentMap = this.resolveCurrentApplicationDeploymentMap();
    return handleMcpAction(name, args, registered.handler.payloadZodSchema, (payload) =>
      executeEndpointAction(registered.entry, payload, {
        domainController: this.domainController,
        applicationDeploymentMap,
        actionLabel: registered.handler.actionLabel,
        context,
      }),
    );
  }
}
