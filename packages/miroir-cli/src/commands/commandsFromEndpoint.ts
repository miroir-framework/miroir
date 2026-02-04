import { type ZodTypeAny } from "zod";

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
  defaultLibraryAppModelDEFUNCT,
  defaultLibraryModelEnvironment,
  defaultMiroirMetaModel,
  instanceEndpointV1,
  miroirFundamentalJzodSchema,
  resolveJzodSchemaReferenceInContext,
  type EndpointDefinition,
  type JzodObject
} from "miroir-core";

const packageName = "miroir-cli";
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, "info", "commandsFromEndpoint")
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// CLI Result Types
// ################################################################################################
export interface CliSuccessResult {
  status: "success";
  command: string;
  result?: any;
}

export interface CliErrorResult {
  status: "error";
  command: string;
  error: {
    type: string;
    message: string;
    stack?: string;
    context?: any;
  };
}

export type CliResult = CliSuccessResult | CliErrorResult;

// ################################################################################################
// CLI Command Handler Types
// ################################################################################################
export type CliExecuteFunction = (
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) => Promise<CliResult>;

export interface CliCommandDescription {
  name: string;
  description: string;
  options: CliCommandOption[];
}

export interface CliCommandOption {
  name: string;
  description: string;
  required: boolean;
  type: "string" | "boolean" | "json";
}

export interface CliCommandHandler<T extends CliCommandDescription> {
  commandDescription: T;
  payloadZodSchema: ZodTypeAny;
  actionEnvelope: {
    actionType: string;
    actionLabel: string;
    application: string;
    endpoint: string;
  };
  execute: CliExecuteFunction;
}

export type CliRequestHandlers = Record<string, CliCommandHandler<any>>;

// ################################################################################################
// Schema Helpers (adapted from miroir-mcp)
// ################################################################################################

/**
 * Helper function to convert a Jzod payload schema to a Zod schema
 */
function jzodPayloadToZodSchema(jzodPayload: JzodObject): ZodTypeAny {
  const resolvedJzodSchema = resolveAllReferences(jzodPayload);
  
  const zodTextAndSchema: ZodTextAndZodSchema = jzodToZodTextAndZodSchema(
    resolvedJzodSchema as any,
    () => ({}),
    () => ({}),
    {datesAsString: true}
  );
  return zodTextAndSchema.zodSchema as any;
}

/**
 * Recursively resolves all schema references in a Jzod schema element
 */
function resolveAllReferences(element: JzodElement): JzodElement {
  if (!element || typeof element !== 'object') {
    return element;
  }

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
    return resolveAllReferences(resolvedSchema);
  }

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

  if (element.type === 'array' && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition)
    };
  }

  if (element.type === 'union' && element.definition && Array.isArray(element.definition)) {
    return {
      ...element,
      definition: element.definition.map((member: any) => resolveAllReferences(member))
    };
  }

  if (element.type === 'record' && element.definition) {
    return {
      ...element,
      definition: resolveAllReferences(element.definition)
    };
  }

  return element;
}

/**
 * Extract CLI command options from Jzod schema
 */
function extractCommandOptions(jzodPayload: JzodObject): CliCommandOption[] {
  const options: CliCommandOption[] = [];
  
  if (jzodPayload.type !== 'object' || !jzodPayload.definition) {
    return options;
  }

  for (const [name, schema] of Object.entries(jzodPayload.definition)) {
    const schemaElement = schema as JzodElement;
    const isRequired = !schemaElement.optional;
    const description = (schemaElement as any).tag?.value?.description || 
                       (schemaElement as any).tag?.value?.defaultLabel ||
                       `${name} parameter`;
    
    // Determine option type
    let type: "string" | "boolean" | "json" = "string";
    if (schemaElement.type === 'boolean') {
      type = "boolean";
    } else if (schemaElement.type === 'object' || schemaElement.type === 'array' || schemaElement.type === 'record') {
      type = "json";
    }

    options.push({
      name,
      description,
      required: isRequired,
      type,
    });
  }

  return options;
}

// ################################################################################################
// Core Action Handler
// ################################################################################################

/**
 * Base handler that wraps CLI command invocation with common logic:
 * - Parameter validation
 * - Action construction
 * - DomainController invocation
 * - Response formatting
 */
export async function handleCliAction(
  commandName: string,
  params: unknown,
  schema: any,
  actionBuilder: (validatedParams: any) => InstanceAction,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<CliResult> {
  try {
    log.info(`${commandName} - received params:`, params);
    log.info(`${commandName} - applicationDeploymentMap:`, applicationDeploymentMap);

    // Validate parameters
    const validatedParams = schema.parse(params);
    log.info(`${commandName} - validated params:`, validatedParams);

    // Build the action
    const action = actionBuilder(validatedParams);
    log.info(`${commandName} - constructed action:`, JSON.stringify(action, null, 2));

    // Execute via DomainController
    const result: Action2VoidReturnType = await domainController.handleAction(
      action,
      applicationDeploymentMap,
      defaultLibraryModelEnvironment,
    );

    log.info(`${commandName} - result:`, JSON.stringify(result, null, 2));

    // Format response for CLI
    if (result.status === "ok") {
      return {
        status: "success",
        command: commandName,
        result: "returnedDomainElement" in result ? result.returnedDomainElement : undefined,
      };
    } else {
      return {
        status: "error",
        command: commandName,
        error: {
          type: "errorType" in result ? result.errorType : "unknown",
          message: "errorMessage" in result ? result.errorMessage : "Action failed",
          stack: "errorStack" in result ? result.errorStack : undefined,
          context: "errorContext" in result ? result.errorContext : undefined,
        },
      };
    }
  } catch (error) {
    log.error(`${commandName} - exception:`, error);
    return {
      status: "error",
      command: commandName,
      error: {
        type: "validation_error",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// ################################################################################################
// Command Handler Factory
// ################################################################################################

/**
 * Creates a CLI execute function for a given command name
 */
export function cliCommandExecutor(
  commandName: string,
): CliExecuteFunction {
  return async (
    payload: unknown,
    domainController: DomainControllerInterface,
    applicationDeploymentMap: ApplicationDeploymentMap
  ) => {
    const config = cliRequestHandlers[commandName];
    log.info(`cliCommandExecutor - invoking command: ${commandName}`);
    log.info(
      `cliCommandExecutor - invoking command: ${commandName}, applicationDeploymentMap:`,
      applicationDeploymentMap,
    );
    return handleCliAction(
      commandName,
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
// Command Entry Factory
// ################################################################################################

/**
 * Creates a CLI command handler from an endpoint definition and action type
 */
function cliCommandEntry(endpoint: EndpointDefinition, actionType: string): CliCommandHandler<any> {
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
  const commandName = actionType;
  const actionDescription = actionDef.actionParameters.actionType.tag?.value?.description 
    || actionDef.actionParameters.actionType.tag?.value?.defaultLabel
    || `Execute ${actionType} action on ${endpoint.name || endpoint.uuid}`;
  
  return {
    commandDescription: {
      name: commandName,
      description: actionDescription,
      options: extractCommandOptions(jzodPayload),
    },
    payloadZodSchema: jzodPayloadToZodSchema(jzodPayload),
    actionEnvelope: {
      actionType: actionType,
      actionLabel: `CLI: ${actionType.replace(/([A-Z])/g, ' $1').trim()}`,
      application: endpoint.application,
      endpoint: endpoint.uuid,
    },
    execute: cliCommandExecutor(commandName),
  };
}

// ################################################################################################
// Register Handlers from Core Endpoints
// ################################################################################################

export const cliRequestHandlers_EntityEndpoint: CliRequestHandlers = {
  createInstance: cliCommandEntry(instanceEndpointV1, "createInstance"),
  getInstance: cliCommandEntry(instanceEndpointV1, "getInstance"),
  getInstances: cliCommandEntry(instanceEndpointV1, "getInstances"),
  updateInstance: cliCommandEntry(instanceEndpointV1, "updateInstance"),
  deleteInstance: cliCommandEntry(instanceEndpointV1, "deleteInstance"),
  deleteInstanceWithCascade: cliCommandEntry(instanceEndpointV1, "deleteInstanceWithCascade"),
  loadNewInstancesInLocalCache: cliCommandEntry(instanceEndpointV1, "loadNewInstancesInLocalCache"),
};

// ################################################################################################
// Register Handlers from Library Application Endpoints
// ################################################################################################

export const cliRequestHandlers_Library_lendingEndpoint: CliRequestHandlers = defaultLibraryAppModelDEFUNCT.endpoints
  .filter((endpoint) => endpoint.uuid === "212f2784-5b68-43b2-8ee0-89b1c6fdd0de") // lendingEndpoint UUID
  .reduce((acc, endpoint) => {
    const handler = cliCommandEntry(endpoint, "lendDocument");
    acc[handler.actionEnvelope.actionType] = handler;
    return acc;
  }, {} as CliRequestHandlers);

// ################################################################################################
// Aggregate all CLI command handlers
// ################################################################################################

export const cliRequestHandlers: CliRequestHandlers = {
  ...cliRequestHandlers_EntityEndpoint,
  ...cliRequestHandlers_Library_lendingEndpoint,
};

// ################################################################################################
// Utility: Get all registered commands
// ################################################################################################

export function getAllCommands(): CliCommandHandler<any>[] {
  return Object.values(cliRequestHandlers);
}

export function getCommandByName(name: string): CliCommandHandler<any> | undefined {
  return cliRequestHandlers[name];
}
