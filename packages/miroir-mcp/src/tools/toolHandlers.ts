import {
  DomainControllerInterface,
  InstanceAction,
  Action2VoidReturnType,
  ApplicationDeploymentMap,
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";

import {
  CreateInstanceToolSchema,
  GetInstanceToolSchema,
  GetInstancesToolSchema,
  UpdateInstanceToolSchema,
  DeleteInstanceToolSchema,
  DeleteInstanceWithCascadeToolSchema,
  LoadNewInstancesInLocalCacheToolSchema,
} from "./instanceActions.js";
import type { ZodTypeAny } from "zod";
import { env } from "process";

const packageName = "miroir-mcp";
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, "info", "toolHandlers")
).then((logger: LoggerInterface) => {
  log = logger;
});

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
async function handleInstanceAction(
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

const toolNameToSchemaMap: { [toolName: string]: {
  schema: ZodTypeAny,
  envelope: {
    actionType: string;
    actionLabel: string;
    application: string;
    endpoint: string;
  }
} } = {
  miroir_createInstance: {schema: CreateInstanceToolSchema,
    envelope: {
      actionType: "createInstance",
      actionLabel: "MCP: Create instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    }
  },
  miroir_getInstance: {schema: GetInstanceToolSchema, 
    envelope: {
      actionType: "getInstance",
      actionLabel: "MCP: Get instance",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    }
  },
  miroir_getInstances: {schema: GetInstancesToolSchema, envelope: {
      actionType: "getInstances",
      actionLabel: "MCP: Get instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    }
  },
  miroir_updateInstance: {schema: UpdateInstanceToolSchema,
    envelope: {
      actionType: "updateInstance",
      actionLabel: "MCP: Update instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    }
  },
  miroir_deleteInstance: {schema: DeleteInstanceToolSchema, 
    envelope: {
      actionType: "deleteInstance",
      actionLabel: "MCP: Delete instance",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    }
  },
  miroir_deleteInstanceWithCascade: {schema: DeleteInstanceWithCascadeToolSchema,
    envelope: {
      actionType: "deleteInstanceWithCascade",
      actionLabel: "MCP: Delete instance with cascade",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    }
  },
  miroir_loadNewInstancesInLocalCache: {schema: LoadNewInstancesInLocalCacheToolSchema,
    envelope: {
      actionType: "loadNewInstancesInLocalCache",
      actionLabel: "MCP: Load instances in cache",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    }
  },
};
// ################################################################################################
// Individual tool handlers
// ################################################################################################

export async function handleCreateInstance(
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  if (!toolNameToSchemaMap["miroir_createInstance"]) {
    throw new Error("Schema for miroir_createInstance not found");
  }
  return handleInstanceAction(
    "miroir_createInstance",
    params,
    toolNameToSchemaMap["miroir_createInstance"].schema,
    (p) => ({
      actionType: "createInstance",
      actionLabel: "MCP: Create instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
      payload: {
        application: p.applicationUuid,
        applicationSection: p.applicationSection,
        objects: p.instances,
      },
    }),
    domainController,
    applicationDeploymentMap
  );
}

export async function handleGetInstance(
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  if (!toolNameToSchemaMap["miroir_getInstance"]) {
    throw new Error("Schema for miroir_getInstance not found");
  }
  return handleInstanceAction(
    "miroir_getInstance",
    params,
    toolNameToSchemaMap["miroir_getInstance"],
    (p) => ({
      actionType: "getInstance",
      actionLabel: "MCP: Get instance",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
      payload: {
        application: p.application,
        applicationSection: p.applicationSection,
        parentUuid: p.parentUuid,
        uuid: p.uuid,
      },
    }),
    domainController,
    applicationDeploymentMap
  );
}

export async function handleGetInstances(
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  if (!toolNameToSchemaMap["miroir_getInstances"]) {
    throw new Error("Schema for miroir_getInstances not found");
  }
  return handleInstanceAction(
    "miroir_getInstances",
    params,
    toolNameToSchemaMap["miroir_getInstances"].schema,
    (p) => ({
      actionType: "getInstances",
      actionLabel: "MCP: Get instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
      payload: //p
      {
        application: p.application,
        applicationSection: p.applicationSection,
        parentUuid: p.parentUuid,
      },
    }),
    domainController,
    applicationDeploymentMap
  );
}

export async function handleUpdateInstance(
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  if (!toolNameToSchemaMap["miroir_updateInstance"]) {
    throw new Error("Schema for miroir_updateInstance not found");
  }
  return handleInstanceAction(
    "miroir_updateInstance",
    params,
    toolNameToSchemaMap["miroir_updateInstance"].schema,
    (p) => ({
      actionType: "updateInstance",
      actionLabel: "MCP: Update instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
      payload: {
        application: p.application,
        applicationSection: p.applicationSection,
        objects: p.instances,
      },
    }),
    domainController,
    applicationDeploymentMap
  );
}

export async function handleDeleteInstance(
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  if (!toolNameToSchemaMap["miroir_deleteInstance"]) {
    throw new Error("Schema for miroir_deleteInstance not found");
  }
  return handleInstanceAction(
    "miroir_deleteInstance",
    params,
    toolNameToSchemaMap["miroir_deleteInstance"].schema,
    (p) => ({
      actionType: "deleteInstance",
      actionLabel: "MCP: Delete instance",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
      payload: {
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
      },
    }),
    domainController,
    applicationDeploymentMap
  );
}

export async function handleDeleteInstanceWithCascade(
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  if (!toolNameToSchemaMap["miroir_deleteInstanceWithCascade"]) {
    throw new Error("Schema for miroir_deleteInstanceWithCascade not found");
  }
  return handleInstanceAction(
    "miroir_deleteInstanceWithCascade",
    params,
    toolNameToSchemaMap["miroir_deleteInstanceWithCascade"].schema,
    (p) => ({
      actionType: "deleteInstanceWithCascade",
      actionLabel: "MCP: Delete instance with cascade",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
      payload: {
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
      },
    }),
    domainController,
    applicationDeploymentMap
  );
}

export async function handleLoadNewInstancesInLocalCache(
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  if (!toolNameToSchemaMap["miroir_loadNewInstancesInLocalCache"]) {
    throw new Error("Schema for miroir_loadNewInstancesInLocalCache not found");
  }
  return handleInstanceAction(
    "miroir_loadNewInstancesInLocalCache",
    params,
    toolNameToSchemaMap["miroir_loadNewInstancesInLocalCache"].schema,
    (p) => ({
      actionType: "loadNewInstancesInLocalCache",
      actionLabel: "MCP: Load instances in cache",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
      payload: {
        application: p.applicationUuid,
        applicationSection: p.applicationSection,
        objects: p.instances,
      },
    }),
    domainController,
    applicationDeploymentMap
  );
}
