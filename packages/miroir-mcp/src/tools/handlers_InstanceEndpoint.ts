import { z, type ZodTypeAny } from "zod";
import {
  Action2VoidReturnType,
  ApplicationDeploymentMap,
  DomainControllerInterface,
  InstanceAction,
  LoggerInterface,
  MiroirLoggerFactory,
  UuidSchema,
} from "miroir-core";

import {
  ApplicationSectionSchema,
  EntityInstanceSchema
} from "./instanceActions.js";

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
export const mcpRequestHandlers: Record<
  string,
  {
    payloadZodSchema: ZodTypeAny;
    actionEnvelope: {
      actionType: string;
      actionLabel: string;
      application: string;
      endpoint: string;
    };
    actionHandler: ToolHandler;
  }
> = {
  miroir_createInstance: {
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

