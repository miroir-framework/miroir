import { type ZodTypeAny } from "zod";

import {
  type Action2ReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  endpointActionPayloadZodSchema,
  ENDPOINT_ACTION_PAYLOAD_VALIDATION_MAX_DEPTH,
  getEndpointActions,
  redactCredentialSecretsFromValue,
  type EndpointDefinition,
  type SelfApplication,
} from "@miroir-framework/core";
import { mlElementToJsonSchema } from "./mlElementToJsonSchema.js";


const packageName = "miroir-mcp";
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, "info", "mcpHandlersForEndpoint");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});


export const MCP_PAYLOAD_VALIDATION_MAX_DEPTH = ENDPOINT_ACTION_PAYLOAD_VALIDATION_MAX_DEPTH;

function mcpTextResult(subObject: Record<string, any>): McpTextResult {
  const redactedSubObject = redactCredentialSecretsFromValue(subObject) as Record<string, any>;
  return {
    content: [
      {
        type: "text",
        parsed: redactedSubObject,
        text: JSON.stringify(redactedSubObject, null, 2),
      },
    ],
  };
}

export type McpTextResult = { content: Array<{ type: string; text: string; parsed: Record<string, any> }> };

/**
 * Validates a tool's arguments against its payload schema, runs `execute` on the validated payload,
 * and formats the result for MCP, with credential secrets redacted. `execute` is where the action
 * runs (the endpoint action catalog's executor, #627).
 */
export async function handleMcpAction(
  toolName: string,
  params: unknown,
  schema: ZodTypeAny,
  execute: (validatedParams: any) => Promise<Action2ReturnType>,
): Promise<McpTextResult> {
  try {
    log.info(`${toolName} - received params:`, JSON.stringify(redactCredentialSecretsFromValue(params), null, 2));
    const parsedParams = schema.safeParse(params);
    if (!parsedParams.success) {
      const message = parsedParams.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      log.info(`${toolName} - validation failed:`, message);
      return mcpTextResult({ status: "error", action: toolName, error: { type: "validation_error", message } });
    }
    const result = await execute(parsedParams.data);
    log.info(`${toolName} - result:`, JSON.stringify(redactCredentialSecretsFromValue(result), null, 2));
    if (result.status === "ok") {
      return mcpTextResult({
        status: "success",
        action: toolName,
        result: "returnedDomainElement" in result ? result.returnedDomainElement : undefined,
      });
    }
    return mcpTextResult({
      status: "error",
      action: toolName,
      error: {
        type: "errorType" in result ? result.errorType : "unknown",
        message: "errorMessage" in result ? result.errorMessage : "Action failed",
        stack: "errorStack" in result ? result.errorStack : undefined,
        context: "errorContext" in result ? result.errorContext : undefined,
      },
    });
  } catch (error) {
    log.error(`${toolName} - exception:`, error);
    return mcpTextResult({
      status: "error",
      action: toolName,
      error: { type: "validation_error", message: error instanceof Error ? error.message : String(error) },
    });
  }
}

// ################################################################################################
// Tool to schema and action mapping
// ################################################################################################
export type McpToolDescriptionPropertyObject = {
  type: "object";
  description?: string;
  properties: Record<string, McpToolDescriptionProperty>;
  required: string[];
  additionalProperties?: boolean;
  /** Shared definitions when ML schemaReferences are emitted as `$ref` (#248). */
  $defs?: Record<string, unknown>;
};

export type McpToolDescriptionPropertyRef = {
  $ref: string;
  $defs?: Record<string, unknown>;
};

export type McpToolDescriptionPropertyArray = {
  type: "array";
  description?: string;
  items: McpToolDescriptionProperty;
};
export type McpToolDescriptionPropertyString = {
      type: "string";
      description: string;
      enum?: string[];
    }
export type McpToolDescriptionProperty =
  | McpToolDescriptionPropertyString
  | McpToolDescriptionPropertyObject
  | McpToolDescriptionPropertyArray
  | McpToolDescriptionPropertyRef;

  export type McpToolDescription = {
  name: string;
  description?: string;
  /** JSON Schema for tool args; may be a root object or a root `$ref` with `$defs` (#248). */
  inputSchema: McpToolDescriptionPropertyObject | McpToolDescriptionPropertyRef;
};

export type McpRequestHandler<T extends McpToolDescription> = {
  mcpToolDescription: T;
  payloadZodSchema: ZodTypeAny;
  actionLabel: string;
};

// ################################################################################################
/** The MCP description and payload validator of one endpoint action. */
export function mcpToolEntry(
  endpoint: EndpointDefinition,
  actionType: string,
  toolName: string,
): McpRequestHandler<any> {
  const actionDef = getEndpointActions(endpoint)?.find(
    (action: any) => action.actionParameters.actionType.definition === actionType
  );
  if (!actionDef) {
    throw new Error(`Action definition not found for action type: ${actionType}`);
  }
  if (!actionDef.actionParameters.payload) {
    throw new Error(`Payload definition not found for action type: ${actionType}`);
  }
  const mlPayload = actionDef.actionParameters.payload;
  const actionDescription = actionDef.actionParameters.actionType.tag?.value?.description
    || actionDef.actionParameters.actionType.tag?.value?.defaultLabel
    || `Execute ${actionType} action on ${endpoint.name || endpoint.uuid}`;

  log.debug(`Creating MCP tool ${toolName} for action ${actionType} on endpoint ${endpoint.name}`);

  let payloadZodSchema: ZodTypeAny | undefined;
  return {
    mcpToolDescription: {
      name: toolName,
      description: actionDescription,
      inputSchema: mlElementToJsonSchema(mlPayload) as McpToolDescriptionPropertyObject,
    },
    get payloadZodSchema() {
      if (!payloadZodSchema) {
        payloadZodSchema = endpointActionPayloadZodSchema(mlPayload);
      }
      return payloadZodSchema;
    },
    actionLabel: `MCP: ${actionType.replace(/([A-Z])/g, " $1").trim()}`,
  };
}
