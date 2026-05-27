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
  // defaultLibraryAppModel,
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
import { mcpToolEntry, type McpRequestHandler, type McpRequestHandlers } from "./handlersForEndpoint.js";

// ################################################################################################
// export const mcpRequestHandlers_EntityEndpoint: McpRequestHandlers = {
//   miroir_createInstance: mcpToolEntry(instanceEndpointV1 as any as EndpointDefinition, "createInstance"),
//   miroir_getInstance: mcpToolEntry(instanceEndpointV1 as any as EndpointDefinition, "getInstance"),
//   miroir_getInstances: mcpToolEntry(instanceEndpointV1 as any as EndpointDefinition, "getInstances"),
//   miroir_updateInstance: mcpToolEntry(instanceEndpointV1 as any as EndpointDefinition, "updateInstance"),
//   miroir_deleteInstance: mcpToolEntry(instanceEndpointV1 as any as EndpointDefinition, "deleteInstance"),
//   miroir_deleteInstanceWithCascade: mcpToolEntry(instanceEndpointV1 as any as EndpointDefinition, "deleteInstanceWithCascade"),
//   miroir_loadNewInstancesInLocalCache: mcpToolEntry(instanceEndpointV1 as any as EndpointDefinition, "loadNewInstancesInLocalCache"),
// };

export function getMcpRequestHandlers_EntityEndpoint(
  // getMcpRequestHandlers: () => McpRequestHandlers
): McpRequestHandlers {
  // const handlers: McpRequestHandlers = getMcpRequestHandlers();

  const endpointActions: string[] = [
    "createInstance",
    "getInstance",
    "getInstances",
    "updateInstance",
    "deleteInstance",
    "deleteInstanceWithCascade",
    "loadNewInstancesInLocalCache",
  ]
  const result: McpRequestHandlers = endpointActions.reduce((acc, actionType) => {
    const toolName = "miroir_" + actionType;
    // const requestHandlerConfig: McpRequestHandler<any> | undefined = handlers[toolName];

    // if (!requestHandlerConfig) {
    //   throw new Error(`Request handler config not found for tool: ${toolName}`);
    // }
    const toolConfig: McpRequestHandler<any> = mcpToolEntry(
      instanceEndpointV1 as any as EndpointDefinition,
      actionType,
      // requestHandlerConfig,
    );
    acc[toolName] = toolConfig;
    return acc;
  }, {} as McpRequestHandlers);

  return result;
}