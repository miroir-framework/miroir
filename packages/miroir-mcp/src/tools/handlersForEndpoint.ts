import { type ZodTypeAny } from "zod";
// import { get } from "http";

import { jzodToZodTextAndZodSchema, type ZodTextAndZodSchema } from "@miroir-framework/jzod";
import {
  Action2VoidReturnType,
  ApplicationDeploymentMap,
  DomainControllerInterface,
  InstanceAction,
  JzodElement,
  JzodReference,
  LoggerInterface,
  MiroirLoggerFactory,
  MlSchema,
  // defaultLibraryAppModelDEFUNCT,
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  // getDefaultLibraryModelEnvironmentDEFUNCT,
  instanceEndpointV1,
  miroirFundamentalJzodSchema,
  resolveJzodSchemaReferenceInContext,
  type EndpointDefinition,
  type JzodObject,
  type MiroirModelEnvironment
} from "miroir-core";
import { jzodElementToJsonSchema } from "./jzodElementToJsonSchema.js";
import {
  deployment_Library_DO_NO_USE,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";


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
) => Promise<{ content: Array<{ type: string; text: string, parsed: Record<string, any> }> }>


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
  const zodTextAndSchema: ZodTextAndZodSchema = jzodToZodTextAndZodSchema(
    resolvedJzodSchema as any,
    () => ({}), // getSchemaEagerReferences
    () => ({}), // getLazyReferences
    {datesAsString: true} // options
  );
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
        endpointsByUuid: {},
        currentModel: defaultMiroirMetaModel,
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
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<{ content: Array<{ type: string; text: string; parsed: Record<string, any> }> }> {
  try {
    log.info(`${toolName} - received params:`, params);

    // log.info(`${toolName} - received domainController:`, domainController);
    log.info(`${toolName} - received applicationDeploymentMap:`, applicationDeploymentMap);

    // Validate parameters
    const validatedParams = schema.parse(params);
    log.info(`${toolName} - validated params:`, validatedParams);

    // Build the action
    const action = actionBuilder(validatedParams);
    log.info(`${toolName} - constructed action:`, JSON.stringify(action, null, 2));

    const defaultLibraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
      miroirFundamentalJzodSchema as any,
      defaultMiroirMetaModel,
      instanceEndpointV1,
      applicationDeploymentMap[selfApplicationLibrary.uuid],
    );
    // Execute via DomainController
    const result: Action2VoidReturnType = await domainController.handleAction(
      action,
      applicationDeploymentMap,
      defaultLibraryModelEnvironment as any as MiroirModelEnvironment, // defaultMiroirModelEnvironment,
    );

    log.info(`${toolName} - result:`, JSON.stringify(result, null, 2));

    // Format response for MCP
    if (result.status === "ok") {
      const subObject = {
        status: "success",
        action: toolName,
        result: "returnedDomainElement" in result ? result.returnedDomainElement : undefined,
      };
      return {
        content: [
          {
            type: "text",
            parsed: subObject,
            text: JSON.stringify(subObject, null, 2),
          },
        ],
      };
    } else {
      // Error response
      const subObject = {
        status: "error",
        action: toolName,
        error: {
          type: "errorType" in result ? result.errorType : "unknown",
          message: "errorMessage" in result ? result.errorMessage : "Action failed",
          stack: "errorStack" in result ? result.errorStack : undefined,
          context: "errorContext" in result ? result.errorContext : undefined,
        },
      };
      return {
        content: [
          {
            type: "text",
            parsed: subObject,
            text: JSON.stringify(subObject, null, 2),
          },
        ],
      };
    }
  } catch (error) {
    log.error(`${toolName} - exception:`, error);
    const subObject = {
      status: "error",
      action: toolName,
      error: {
        type: "validation_error",
        message: error instanceof Error ? error.message : String(error),
      },
    };
    return {
      content: [
        {
          type: "text",
          parsed: subObject,
          text: JSON.stringify(subObject, null, 2),
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
export function mcpToolHandler(
  toolName: string,
): (
  payload: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) => Promise<{ content: Array<{ type: string; text: string, parsed: Record<string, any> }> }> {
  return async (
    payload: unknown,
    domainController: DomainControllerInterface,
    applicationDeploymentMap: ApplicationDeploymentMap
  ) => {
    const config = mcpRequestHandlers[toolName];
    log.info(`mcpToolHandler - invoking tool: ${toolName}`);
    log.info(
      `mcpToolHandler - invoking tool: ${toolName},
      //  domainController:`,
      // domainController,
      "applicationDeploymentMap",
      applicationDeploymentMap,
    );
    return handleInstanceAction(
      toolName,
      payload,
      config.payloadZodSchema,
      (payload) =>
        ({
          ...config.actionEnvelope,
          payload,
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
  const toolName = `miroir_${actionType}`;
  const actionDescription = actionDef.actionParameters.actionType.tag?.value?.description 
    || actionDef.actionParameters.actionType.tag?.value?.defaultLabel
    || `Execute ${actionType} action on ${endpoint.name || endpoint.uuid}`;
  
  return {
    mcpToolDescription: {
      name: toolName,
      description: actionDescription,
      inputSchema: jzodElementToJsonSchema(jzodPayload) as McpToolDescriptionPropertyObject,
    },
    payloadZodSchema: jzodPayloadToZodSchema(
      jzodPayload
    ),
    actionEnvelope: {
      actionType: actionType,
      actionLabel: `MCP: ${actionType.replace(/([A-Z])/g, ' $1').trim()}`,
      application: endpoint.application,
      endpoint: endpoint.uuid,
    },
    actionHandler: mcpToolHandler(toolName),
  };
}
export const mcpRequestHandlers_EntityEndpoint: McpRequestHandlers = {
  miroir_createInstance: mcpToolEntry(instanceEndpointV1, "createInstance"),
  miroir_getInstance: mcpToolEntry(instanceEndpointV1, "getInstance"),
  miroir_getInstances: mcpToolEntry(instanceEndpointV1, "getInstances"),
  miroir_updateInstance: mcpToolEntry(instanceEndpointV1, "updateInstance"),
  miroir_deleteInstance: mcpToolEntry(instanceEndpointV1, "deleteInstance"),
  miroir_deleteInstanceWithCascade: mcpToolEntry(instanceEndpointV1, "deleteInstanceWithCascade"),
  miroir_loadNewInstancesInLocalCache: mcpToolEntry(instanceEndpointV1, "loadNewInstancesInLocalCache"),
};

const defaultLibraryAppModelDEFUNCT = getDefaultLibraryModelEnvironmentDEFUNCT(
  miroirFundamentalJzodSchema as any,
  defaultMiroirMetaModel,
  instanceEndpointV1,
  {
    ...defaultSelfApplicationDeploymentMap,
    [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid
  } as ApplicationDeploymentMap,
)
export const mcpRequestHandlers_Library_lendingEndpoint: McpRequestHandlers = defaultLibraryAppModelDEFUNCT.currentModel.endpoints
  .filter((endpoint) => endpoint.uuid === "212f2784-5b68-43b2-8ee0-89b1c6fdd0de") // lendingEndpoint UUID
  .reduce((acc, endpoint) => {
    const createInstanceHandler = mcpToolEntry(endpoint as EndpointDefinition, "lendDocument");
    acc["miroir_" + createInstanceHandler.actionEnvelope.actionType] = createInstanceHandler;
    return acc;
  }, {} as McpRequestHandlers);

// ################################################################################################
// aggregate all instance action tools
// ################################################################################################
export const mcpRequestHandlers: McpRequestHandlers = {
  ...mcpRequestHandlers_EntityEndpoint,
  // ...mcpRequestHandlers_Library_lendingEndpoint,
};
