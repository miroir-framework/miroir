import { type ZodTypeAny } from "zod";
import {
  Action2VoidReturnType,
  ApplicationDeploymentMap,
  DomainControllerInterface,
  InstanceAction,
  LoggerInterface,
  MiroirLoggerFactory,
  UuidSchema,
  instanceEndpointV1,
  miroirFundamentalJzodSchema,
  resolveJzodSchemaReferenceInContext,
  JzodElement,
  JzodReference,
  MlSchema,
  type JzodObject,
  type EndpointDefinition,
} from "miroir-core";
import { jzodToZodTextAndZodSchema, type ZodTextAndZodSchema } from "@miroir-framework/jzod";
import { jzodElementToJsonSchema } from "./jzodElementToJsonSchema.js";
import type { E } from "vitest/dist/chunks/environment.d.cL3nLXbE.js";


const packageName = "miroir-mcp";
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, "info", "toolHandlers")
).then((logger: LoggerInterface) => {
  log = logger;
});

export type ToolHandler = (
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) => Promise<{ content: Array<{ type: string; text: string }> }>


// Constants for InstanceEndpoint
const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MIROIR_APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";

/**
 * Helper function to convert a Jzod payload schema to a Zod schema
 * Recursively resolves all schema references before conversion to avoid reference resolution errors
 * @param jzodPayload - The Jzod schema definition from actionParameters.payload
 * @returns The Zod schema for validation
 */
function jzodPayloadToZodSchema(jzodPayload: JzodObject): ZodTypeAny {
  // Recursively resolve all schema references in the Jzod schema
  // schemaReferences in jzodToZodTextAndZodSchema are not closures, they depend on the resolved schema names
  // that are found in miroirFundamentalType.ts.
  // with eager resolution here, we avoid issues with unresolved references during conversion
  // this leads to problems with recursive references, but those are not used in MCP tool payloads currently.
  const resolvedJzodSchema = resolveAllReferences(jzodPayload);
  
  // Convert the resolved Jzod schema to Zod
  const zodTextAndSchema: ZodTextAndZodSchema = jzodToZodTextAndZodSchema(resolvedJzodSchema as any);
  return zodTextAndSchema.zodSchema as any;
}

/**
 * Recursively resolves all schema references in a Jzod schema element
 * @param element - The Jzod element to resolve
 * @returns A Jzod element with all references resolved
 */
function resolveAllReferences(element: JzodElement): JzodElement {
  if (!element || typeof element !== 'object') {
    return element;
  }

  // Handle schema references
  if (element.type === 'schemaReference') {
    const resolvedSchema = resolveJzodSchemaReferenceInContext(
      element as JzodReference,
      element.context || {},
      {
        miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
        endpointsByUuid: {}
      }
    );
    // Recursively resolve the resolved schema (it might contain more references)
    return resolveAllReferences(resolvedSchema);
  }

  // Handle objects - recursively resolve all properties
  if (element.type === 'object' && element.definition) {
    return {
      ...element,
      definition: Object.fromEntries(
        Object.entries(element.definition).map(([key, value]) => [
          key,
          resolveAllReferences(value as any)
        ])
      )
    };
  }

  // Handle arrays - recursively resolve the item schema
  if (element.type === 'array' && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition)
    };
  }

  // Handle unions - recursively resolve all union members
  if (element.type === 'union' && element.definition && Array.isArray(element.definition)) {
    return {
      ...element,
      definition: element.definition.map((member: any) => resolveAllReferences(member))
    };
  }

  // Handle records - recursively resolve the value schema
  if (element.type === 'record' && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition)
    };
  }

  // For other types, return as is
  return element;
}

/**
 * Base handler that wraps tool invocation with common logic:
 * - Parameter validation
 * - Action construction
 * - DomainController invocation
 * - Response formatting
 */
export async function handleInstanceAction(
  toolName: string,
  params: unknown,
  schema: any,
  actionBuilder: (validatedParams: any) => InstanceAction,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    log.info(`${toolName} - received params:`, params);
    
    // Validate parameters
    const validatedParams = schema.parse(params);
    log.info(`${toolName} - validated params:`, validatedParams);

    // Build the action
    const action = actionBuilder(validatedParams);
    log.info(`${toolName} - constructed action:`, JSON.stringify(action, null, 2));

    // Execute via DomainController
    const result: Action2VoidReturnType = await domainController.handleAction(
      action,
      applicationDeploymentMap
    );

    log.info(`${toolName} - result:`, JSON.stringify(result, null, 2));

    // Format response for MCP
    if (result.status === "ok") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                action: toolName,
                result: "returnedDomainElement" in result ? result.returnedDomainElement : undefined,
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      // Error response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "error",
                action: toolName,
                error: {
                  type: "errorType" in result ? result.errorType : "unknown",
                  message: "errorMessage" in result ? result.errorMessage : "Action failed",
                  stack: "errorStack" in result ? result.errorStack : undefined,
                  context: "errorContext" in result ? result.errorContext : undefined,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  } catch (error) {
    log.error(`${toolName} - exception:`, error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "error",
              action: toolName,
              error: {
                type: "validation_error",
                message: error instanceof Error ? error.message : String(error),
              },
            },
            null,
            2
          ),
        },
      ],
    };
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
  | McpToolDescriptionPropertyArray;

  export type McpToolDescription = {
  name: string;
  description?: string;
  inputSchema: McpToolDescriptionPropertyObject;
};

export type McpRequestHandler<T extends McpToolDescription> = {
  mcpToolDescription: T;
  payloadZodSchema: ZodTypeAny;
    actionEnvelope: {
      actionType: string;
      actionLabel: string;
      application: string;
      endpoint: string;
    };
    actionHandler: ToolHandler;

}
export type McpRequestHandlers = Record<string, McpRequestHandler<any>>;

// ################################################################################################
// ################################################################################################
// Generic handler factory
// ################################################################################################
/**
 * Creates a handler function for a given tool name with custom payload building logic
 */
export function createHandler(
  toolName: string,
  payloadBuilder: (validatedParams: any) => any
): (
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) => Promise<{ content: Array<{ type: string; text: string }> }> {
  return async (
    params: unknown,
    domainController: DomainControllerInterface,
    applicationDeploymentMap: ApplicationDeploymentMap
  ) => {
    const config = mcpRequestHandlers[toolName];
    return handleInstanceAction(
      toolName,
      params,
      config.payloadZodSchema,
      (p) =>
        ({
          ...config.actionEnvelope,
          payload: payloadBuilder(p),
        }) as InstanceAction,
      domainController,
      applicationDeploymentMap,
    );
  };
}

// ################################################################################################
function mcpToolEntry(endpoint: EndpointDefinition, actionType: string): McpRequestHandler<any> {
  const actionDef = endpoint.definition.actions.find(
    (action: any) => action.actionParameters.actionType.definition === actionType
  );
  if (!actionDef) {
    throw new Error(`Action definition not found for action type: ${actionType}`);
  }
  if (!actionDef.actionParameters.payload) {
    throw new Error(`Payload definition not found for action type: ${actionType}`);
  }
  const jzodPayload = actionDef.actionParameters.payload;
  return {
    mcpToolDescription: jzodElementToJsonSchema(
      jzodPayload,
    ) as McpToolDescription,
    payloadZodSchema: jzodPayloadToZodSchema(
      jzodPayload
    ),
    actionEnvelope: {
      actionType: actionType,
      actionLabel: `MCP: ${actionType.replace(/([A-Z])/g, ' $1').trim()}`,
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler(`miroir_${actionType}`, (p) => {
      switch (actionType) {
        case "createInstance":
        case "updateInstance":
          return {
            application: p.applicationUuid,
            applicationSection: p.applicationSection,
            objects: p.instances,
          };
        case "getInstance":
          return {
            application: p.application,
            applicationSection: p.applicationSection,
            parentUuid: p.parentUuid,
            uuid: p.uuid,
          };
        case "getInstances":
          return {
            application: p.application,
            applicationSection: p.applicationSection,
            parentUuid: p.parentUuid,
          };
        case "deleteInstance":
        case "deleteInstanceWithCascade":
          return {
            application: p.applicationUuid,
            applicationSection: p.applicationSection,
            objects: [
              {
                parentName: p.parentName,
                parentUuid: p.parentUuid,
                applicationSection: p.applicationSection,
                instances: [{ uuid: p.uuid, parentUuid: p.parentUuid }],
              },
            ],
          };
        case "loadNewInstancesInLocalCache":
          return {
            application: p.applicationUuid,
            applicationSection: p.applicationSection,
            objects: p.instances,
          };
        default:
          throw new Error(`Unhandled action type: ${actionType}`);
      }
    }),
  };
}
export const mcpRequestHandlers: McpRequestHandlers = {
  miroir_createInstance: mcpToolEntry(instanceEndpointV1, "createInstance"),
  miroir_getInstance: mcpToolEntry(instanceEndpointV1, "getInstance"),
  miroir_getInstances: mcpToolEntry(instanceEndpointV1, "getInstances"),
  miroir_updateInstance: mcpToolEntry(instanceEndpointV1, "updateInstance"),
  miroir_deleteInstance: mcpToolEntry(instanceEndpointV1, "deleteInstance"),
  miroir_deleteInstanceWithCascade: mcpToolEntry(instanceEndpointV1, "deleteInstanceWithCascade"),
  miroir_loadNewInstancesInLocalCache: mcpToolEntry(instanceEndpointV1, "loadNewInstancesInLocalCache"),
};

export const allInstanceActionTools = Object.values(mcpRequestHandlers).map((t) => t.mcpToolDescription);
