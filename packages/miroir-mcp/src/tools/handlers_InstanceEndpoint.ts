import { z, type ZodTypeAny } from "zod";
import {
  Action2VoidReturnType,
  ApplicationDeploymentMap,
  DomainControllerInterface,
  InstanceAction,
  LoggerInterface,
  MiroirLoggerFactory,
  UuidSchema,
  instanceEndpointV1
} from "miroir-core";
import { jzodElementToJsonSchema } from "./jzodElementToJsonSchema.js";


const packageName = "miroir-mcp";
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, "info", "toolHandlers")
).then((logger: LoggerInterface) => {
  log = logger;
});

// export const UuidSchema = z.string().uuid();
export const ApplicationSectionSchema = z.enum(["model", "data"]);
export const EntityInstanceSchema = z.object({
  uuid: UuidSchema,
  parentUuid: UuidSchema,
}).passthrough(); // Allow additional properties

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
    payloadZodSchema: z.object({
      application: UuidSchema,
      applicationSection: ApplicationSectionSchema,
      parentUuid: UuidSchema.describe("Entity UUID"),
      uuid: UuidSchema.describe("Instance UUID to retrieve"),
    }),
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
    // mcpToolDescription: {
    //   name: "miroir_getInstance",
    //   description:
    //     "Retrieve a single entity instance by UUID. Returns the complete instance data for the specified entity instance.",
    //   inputSchema: {
    //     type: "object",
    //     properties: {
    //       application: {
    //         type: "string",
    //         description: "UUID of Application to query",
    //       },
    //       applicationSection: {
    //         type: "string",
    //         enum: ["model", "data"],
    //         description: "Section to query (model or data)",
    //       },
    //       parentUuid: {
    //         type: "string",
    //         description: "UUID of Entity (parent entity)",
    //       },
    //       uuid: {
    //         type: "string",
    //         description: "UUID of Instance to retrieve",
    //       },
    //     },
    //     required: ["application", "applicationSection", "parentUuid", "uuid"],
    //   },
    // },
    payloadZodSchema: z.object({
      application: UuidSchema,
      applicationSection: ApplicationSectionSchema,
      parentUuid: UuidSchema.describe("Entity UUID"),
      uuid: UuidSchema.describe("Instance UUID to retrieve"),
    }),
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
    // mcpToolDescription: {
    //   name: "miroir_getInstances",
    //   description:
    //     "Retrieve all instances of a specific entity type. Returns an array of all instances for the given entity.",
    //   inputSchema: {
    //     type: "object",
    //     properties: {
    //       application: {
    //         type: "string",
    //         description: "Application UUID to query",
    //       },
    //       parentUuid: {
    //         type: "string",
    //         description: "Entity UUID to get all instances for",
    //       },
    //       applicationSection: {
    //         type: "string",
    //         enum: ["model", "data"],
    //         description: "Section to query (model or data)",
    //       },
    //     },
    //     required: ["application", "applicationSection", "parentUuid"],
    //   },
    // },
    payloadZodSchema: z.object({
      application: UuidSchema,
      applicationSection: ApplicationSectionSchema,
      parentUuid: UuidSchema.describe("Entity UUID"),
    }),
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
    // mcpToolDescription: {
    //   name: "miroir_updateInstance",
    //   description:
    //     "Update existing entity instances. Updates one or more instances with new data. Instances are identified by their uuid and parentUuid.",
    //   inputSchema: {
    //     type: "object",
    //     properties: {
    //       applicationSection: {
    //         type: "string",
    //         enum: ["model", "data"],
    //         description: "Section where instances will be updated",
    //       },
    //       deploymentUuid: {
    //         type: "string",
    //         description: "Deployment UUID",
    //       },
    //       includeInTransaction: {
    //         type: "string",
    //         description: "Set to true to include update in a transaction",
    //       },
    //       instances: {
    //         type: "array",
    //         description: "Array of entity instances with updated data",
    //         items: {
    //           type: "object",
    //           properties: {
    //             uuid: { type: "string", description: "Instance UUID" },
    //             parentUuid: { type: "string", description: "Parent entity UUID" },
    //           },
    //           required: ["uuid", "parentUuid"],
    //           additionalProperties: true,
    //         },
    //       },
    //     },
    //     required: ["applicationSection", "deploymentUuid", "instances"],
    //   },
    // },
    payloadZodSchema: z.object({
      applicationSection: ApplicationSectionSchema,
      deploymentUuid: UuidSchema,
      instances: z.array(EntityInstanceSchema).describe("Array of entity instances to update"),
    }),
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
    // mcpToolDescription: {
    //   name: "miroir_deleteInstance",
    //   description:
    //     "Delete a single entity instance by UUID. Removes the instance from the specified deployment.",
    //   inputSchema: {
    //     type: "object",
    //     properties: {
    //       applicationSection: {
    //         type: "string",
    //         enum: ["model", "data"],
    //         description: "Section containing the instance",
    //       },
    //       deploymentUuid: {
    //         type: "string",
    //         description: "Deployment UUID",
    //       },
    //       parentUuid: {
    //         type: "string",
    //         description: "Entity UUID (parent entity)",
    //       },
    //       uuid: {
    //         type: "string",
    //         description: "Instance UUID to delete",
    //       },
    //     },
    //     required: ["applicationSection", "deploymentUuid", "parentUuid", "uuid"],
    //   },
    // },
    payloadZodSchema: z.object({
      applicationSection: ApplicationSectionSchema,
      deploymentUuid: UuidSchema,
      parentUuid: UuidSchema.describe("Entity UUID"),
      uuid: UuidSchema.describe("Instance UUID to delete"),
    }),
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
    // mcpToolDescription: {
    //   name: "miroir_deleteInstanceWithCascade",
    //   description:
    //     "Delete an entity instance and all its dependent instances (cascade delete). Removes the instance and any related instances that reference it.",
    //   inputSchema: {
    //     type: "object",
    //     properties: {
    //       applicationSection: {
    //         type: "string",
    //         enum: ["model", "data"],
    //         description: "Section containing the instance",
    //       },
    //       deploymentUuid: {
    //         type: "string",
    //         description: "Deployment UUID",
    //       },
    //       parentUuid: {
    //         type: "string",
    //         description: "Entity UUID (parent entity)",
    //       },
    //       uuid: {
    //         type: "string",
    //         description: "Instance UUID to delete with cascade",
    //       },
    //     },
    //     required: ["applicationSection", "deploymentUuid", "parentUuid", "uuid"],
    //   },
    // },
    payloadZodSchema: z.object({
      applicationSection: ApplicationSectionSchema,
      deploymentUuid: UuidSchema,
      parentUuid: UuidSchema.describe("Entity UUID"),
      uuid: UuidSchema.describe("Instance UUID to delete"),
    }),
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
    // mcpToolDescription: {
    //   name: "miroir_loadNewInstancesInLocalCache",
    //   description:
    //     "Load new instances into the local cache without persisting them. Useful for temporary data or previewing changes before committing.",
    //   inputSchema: {
    //     type: "object",
    //     properties: {
    //       applicationSection: {
    //         type: "string",
    //         enum: ["model", "data"],
    //         description: "Section for cache loading",
    //       },
    //       deploymentUuid: {
    //         type: "string",
    //         description: "Deployment UUID",
    //       },
    //       parentUuid: {
    //         type: "string",
    //         description: "Entity UUID (parent entity)",
    //       },
    //       instances: {
    //         type: "array",
    //         description: "Array of instances to load in local cache",
    //         items: {
    //           type: "object",
    //           properties: {
    //             uuid: { type: "string", description: "Instance UUID" },
    //             parentUuid: { type: "string", description: "Parent entity UUID" },
    //           },
    //           required: ["uuid", "parentUuid"],
    //           additionalProperties: true,
    //         },
    //       },
    //     },
    //     required: ["applicationSection", "deploymentUuid", "parentUuid", "instances"],
    //   },
    // },
    payloadZodSchema: z.object({
      applicationSection: ApplicationSectionSchema,
      deploymentUuid: UuidSchema,
      parentUuid: UuidSchema.describe("Entity UUID"),
      instances: z.array(EntityInstanceSchema).describe("Array of instances to load in cache"),
    }),
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
