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
} from "miroir-core";
import { jzodToZodTextAndZodSchema, type ZodTextAndZodSchema } from "@miroir-framework/jzod";
import { jzodElementToJsonSchema } from "./jzodElementToJsonSchema.js";


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
  // const resolvedJzodSchema = resolveAllReferences(jzodPayload);
  
  // Convert the resolved Jzod schema to Zod
  const zodTextAndSchema: ZodTextAndZodSchema = jzodToZodTextAndZodSchema(jzodPayload as any);
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
export const mcpRequestHandlers: McpRequestHandlers = {
  miroir_createInstance: {
    mcpToolDescription: jzodElementToJsonSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "createInstance"
      ).actionParameters.payload,
    ) as McpToolDescription,
    payloadZodSchema: jzodPayloadToZodSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "createInstance"
      ).actionParameters.payload
    ),
    actionEnvelope: {
      actionType: "createInstance",
      actionLabel: "MCP: Create instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_createInstance", (p) => ({
      application: p.applicationUuid,
      applicationSection: p.applicationSection,
      objects: p.instances,
    })),
  },
  miroir_getInstance: {
    mcpToolDescription: jzodElementToJsonSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "getInstance"
      ).actionParameters.payload,
    ) as McpToolDescription,
    payloadZodSchema: jzodPayloadToZodSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "getInstance"
      ).actionParameters.payload
    ),
    actionEnvelope: {
      actionType: "getInstance",
      actionLabel: "MCP: Get instance",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_getInstance", (p) => ({
      application: p.application,
      applicationSection: p.applicationSection,
      parentUuid: p.parentUuid,
      uuid: p.uuid,
    })),
  },
  miroir_getInstances: {
    mcpToolDescription: jzodElementToJsonSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "getInstances"
      ).actionParameters.payload,
    ) as McpToolDescription,
    payloadZodSchema: jzodPayloadToZodSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "getInstances"
      ).actionParameters.payload
    ),
    actionEnvelope: {
      actionType: "getInstances",
      actionLabel: "MCP: Get instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_getInstances", (p) => ({
      application: p.application,
      applicationSection: p.applicationSection,
      parentUuid: p.parentUuid,
    })),
  },
  miroir_updateInstance: {
    mcpToolDescription: jzodElementToJsonSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "updateInstance"
      ).actionParameters.payload,
    ) as McpToolDescription,
    payloadZodSchema: jzodPayloadToZodSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "updateInstance"
      ).actionParameters.payload
    ),
    actionEnvelope: {
      actionType: "updateInstance",
      actionLabel: "MCP: Update instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_updateInstance", (p) => ({
      application: p.application,
      applicationSection: p.applicationSection,
      objects: p.instances,
    })),
  },
  miroir_deleteInstance: {
    mcpToolDescription: jzodElementToJsonSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "deleteInstance"
      ).actionParameters.payload,
    ) as McpToolDescription,
    payloadZodSchema: jzodPayloadToZodSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "deleteInstance"
      ).actionParameters.payload
    ),
    actionEnvelope: {
      actionType: "deleteInstance",
      actionLabel: "MCP: Delete instance",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_deleteInstance", (p) => ({
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
    })),
  },
  miroir_deleteInstanceWithCascade: {
    mcpToolDescription: jzodElementToJsonSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "deleteInstanceWithCascade"
      ).actionParameters.payload,
    ) as McpToolDescription,
    payloadZodSchema: jzodPayloadToZodSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "deleteInstanceWithCascade"
      ).actionParameters.payload
    ),
    actionEnvelope: {
      actionType: "deleteInstanceWithCascade",
      actionLabel: "MCP: Delete instance with cascade",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_deleteInstanceWithCascade", (p) => ({
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
    })),
  },
  miroir_loadNewInstancesInLocalCache: {
    mcpToolDescription: jzodElementToJsonSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "loadNewInstancesInLocalCache"
      ).actionParameters.payload,
    ) as McpToolDescription,
    payloadZodSchema: jzodPayloadToZodSchema(
      instanceEndpointV1.definition.actions.find(
        (action: any) => action.actionParameters.actionType.definition === "loadNewInstancesInLocalCache"
      ).actionParameters.payload
    ),
    actionEnvelope: {
      actionType: "loadNewInstancesInLocalCache",
      actionLabel: "MCP: Load new instances in local cache",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_loadNewInstancesInLocalCache", (p) => ({
      application: p.applicationUuid,
      applicationSection: p.applicationSection,
      objects: p.instances,
    })),
  },
};

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

export const allInstanceActionTools = Object.values(mcpRequestHandlers).map((t) => t.mcpToolDescription);
