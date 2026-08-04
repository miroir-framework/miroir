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
  resolveFundamentalSchemaForDeployment,
  resolveJzodSchemaReferenceInContext,
  type EndpointDefinition,
  type MetaModel,
  type MiroirModelEnvironment,
  type SelfApplication,
} from "miroir-core";
import { defaultMiroirMetaModel,  } from "miroir-test-app_deployment-miroir";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  getDefaultLibraryModelEnvironmentDEFUNCT,
  resolveLibraryDeploymentUuid,
} from "miroir-test-app_deployment-library";
import { jzodElementToJsonSchema } from "./jzodElementToJsonSchema.js";
import {
  isJzodConversionLimitReached,
  normalizeJzodConversionOptions,
  schemaReferenceKey,
  type JzodConversionOptions,
} from "./jzodConversionContext.js";


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
// function jzodPayloadToZodSchema(jzodPayload: JzodObject): ZodTypeAny {
function jzodPayloadToZodSchema(jzodPayload: JzodElement): ZodTypeAny {
  // Resolve references for Zod conversion, but stop on cycles / depth — the meta-model is
  // recursive (jzodElement, compositeAction, coreTransformerForBuildPlusRuntime, …).
  const resolvedJzodSchema = resolveAllReferences(jzodPayload);

  log.debug("jzodPayloadToZodSchema resolved schema for MCP payload conversion");

  const zodTextAndSchema: ZodTextAndZodSchema = jzodToZodTextAndZodSchema(
    resolvedJzodSchema as any,
    () => ({}),
    () => ({}),
    { datesAsString: true },
  );
  return zodTextAndSchema.zodSchema as any;
}

function unresolvedJzodAny(): JzodElement {
  return { type: "any" } as JzodElement;
}

/**
 * Recursively resolves schema references in a Jzod element for Zod validation.
 * Cyclic references degrade to `any` instead of overflowing the stack.
 */
function resolveAllReferences(
  element: JzodElement,
  conversionOptions?: JzodConversionOptions,
): JzodElement {
  if (!element || typeof element !== "object") {
    return element;
  }

  const options = normalizeJzodConversionOptions(conversionOptions);
  if (options.depth >= options.maxDepth) {
    return unresolvedJzodAny();
  }

  const childOptions: JzodConversionOptions = {
    ...options,
    depth: options.depth + 1,
  };

  if (element.type === "schemaReference") {
    const ref = element as JzodReference;
    const refKey = schemaReferenceKey(ref);
    if (isJzodConversionLimitReached(options, refKey)) {
      return unresolvedJzodAny();
    }

    options.resolvingRefs.add(refKey);
    try {
      const resolvedSchema = resolveJzodSchemaReferenceInContext(
        ref,
        ref.context || {},
        {
          miroirFundamentalJzodSchema: resolveFundamentalSchemaForDeployment(
            deployment_Miroir.uuid,
            defaultMiroirMetaModel as any as MetaModel,
            "static",
          ),
          endpointsByUuid: {},
          currentModel: defaultMiroirMetaModel as any as MetaModel,
        },
      );
      return resolveAllReferences(resolvedSchema, childOptions);
    } finally {
      options.resolvingRefs.delete(refKey);
    }
  }

  if (element.type === "object" && element.definition) {
    return {
      ...element,
      definition: Object.fromEntries(
        Object.entries(element.definition).map(([key, value]) => [
          key,
          resolveAllReferences(value as any, childOptions),
        ]),
      ),
    };
  }

  if (element.type === "array" && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition, childOptions),
    };
  }

  if (element.type === "union" && element.definition && Array.isArray(element.definition)) {
    return {
      ...element,
      definition: element.definition.map((member: any) =>
        resolveAllReferences(member, childOptions),
      ),
    };
  }

  if (element.type === "record" && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition, childOptions),
    };
  }

  if (element.type === "tuple" && element.definition && Array.isArray(element.definition)) {
    return {
      ...element,
      definition: element.definition.map((member: any) =>
        resolveAllReferences(member, childOptions),
      ),
    };
  }

  if (element.type === "intersection" && element.definition) {
    const intersection = element.definition as { left?: JzodElement; right?: JzodElement };
    return {
      ...element,
      definition: {
        left: intersection.left
          ? resolveAllReferences(intersection.left, childOptions)
          : unresolvedJzodAny(),
        right: intersection.right
          ? resolveAllReferences(intersection.right, childOptions)
          : unresolvedJzodAny(),
      },
    } as JzodElement;
  }

  if (element.type === "lazy" && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition as JzodElement, childOptions),
    } as JzodElement;
  }

  return element;
}

/**
 * Base handler that wraps tool invocation with common logic:
 * - Parameter validation
 * - Action construction
 * - DomainController invocation
 * - Response formatting
 */
export async function handleMcpAction(
  toolName: string,
  params: unknown,
  schema: ZodTypeAny,
  actionBuilder: (validatedParams: any) => InstanceAction,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironmentOverride?: MiroirModelEnvironment,
): Promise<{ content: Array<{ type: string; text: string; parsed: Record<string, any> }> }> {
  try {
    log.info(`${toolName} - received params:`, JSON.stringify(params, null, 2));
    log.info(`${toolName} - received schema:`, JSON.stringify(schema, null, 2));

    // log.info(`${toolName} - received domainController:`, domainController);
    log.info(`${toolName} - received applicationDeploymentMap:`, applicationDeploymentMap);

    // Validate parameters
    const validatedParams = schema.parse(params);
    log.info(`${toolName} - validated params:`, validatedParams);

    // Build the action
    const action = actionBuilder(validatedParams);
    log.info(`${toolName} - constructed action:`, JSON.stringify(action, null, 2));

    const libraryDeploymentUuid = resolveLibraryDeploymentUuid(applicationDeploymentMap);
    const defaultLibraryModelEnvironment = modelEnvironmentOverride ?? getDefaultLibraryModelEnvironmentDEFUNCT(
      defaultMiroirMetaModel,
      undefined as any, // not used
      libraryDeploymentUuid,
    );
    // log.info(`${toolName} - constructed defaultLibraryModelEnvironment:`, JSON.stringify(defaultLibraryModelEnvironment, null, 2));
    log.info(
      `${toolName} - constructed defaultLibraryModelEnvironment.endpointsByUuid:`,
      JSON.stringify(Object.keys(defaultLibraryModelEnvironment.endpointsByUuid), null, 2),
    );
    log.info(
      `${toolName} - constructed defaultLibraryModelEnvironment.currentModel.endpoints:`,
      JSON.stringify(
        defaultLibraryModelEnvironment.currentModel.endpoints.map((e) => e.uuid),
        null,
        2,
      ),
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
  // mcpRequestHandlers: McpRequestHandlers,
  // config: McpRequestHandler<any>,
  payloadZodSchema: ZodTypeAny,
  actionEnvelope: McpRequestHandler<any>["actionEnvelope"],
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
    // const config = mcpRequestHandlers[toolName];
    log.info(`mcpToolHandler - invoking tool: ${toolName}`);
    log.info(
      `mcpToolHandler - invoking tool: ${toolName}`,
      "applicationDeploymentMap",
      applicationDeploymentMap,
      "payload",
      JSON.stringify(payload, null, 2)
    );
    return handleMcpAction(
      toolName,
      payload,
      payloadZodSchema,
      (payload) =>
        ({
          ...actionEnvelope,
          payload,
        }) as InstanceAction,
      domainController,
      applicationDeploymentMap,
    );
  };
}

// ################################################################################################
export function mcpToolEntry(
  endpoint: EndpointDefinition,
  actionType: string,
  toolName: string,
): McpRequestHandler<any> {
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
  const actionDescription = actionDef.actionParameters.actionType.tag?.value?.description 
    || actionDef.actionParameters.actionType.tag?.value?.defaultLabel
    || `Execute ${actionType} action on ${endpoint.name || endpoint.uuid}`;
  
  log.debug(`Creating MCP tool ${toolName} for action ${actionType} on endpoint ${endpoint.name}`);

  let payloadZodSchema: ZodTypeAny | undefined;
  const getPayloadZodSchema = (): ZodTypeAny => {
    if (!payloadZodSchema) {
      payloadZodSchema = jzodPayloadToZodSchema(jzodPayload);
    }
    return payloadZodSchema;
  };

  const actionEnvelope = {
    actionType,
    actionLabel: `MCP: ${actionType.replace(/([A-Z])/g, ' $1').trim()}`,
    endpoint: endpoint.uuid,
  };
  return {
    mcpToolDescription: {
      name: toolName,
      description: actionDescription,
      inputSchema: jzodElementToJsonSchema(jzodPayload) as McpToolDescriptionPropertyObject,
    },
    get payloadZodSchema() {
      return getPayloadZodSchema();
    },
    actionEnvelope,
    actionHandler: (
      payload: unknown,
      domainController: DomainControllerInterface,
      applicationDeploymentMap: ApplicationDeploymentMap,
    ) =>
      mcpToolHandler(toolName, getPayloadZodSchema(), actionEnvelope)(
        payload,
        domainController,
        applicationDeploymentMap,
      ),
  };
}



