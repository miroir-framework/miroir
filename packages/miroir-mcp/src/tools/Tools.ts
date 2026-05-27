// ################################################################################################
// aggregate all instance action tools

import {
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  instanceEndpointV1,
  miroirFundamentalJzodSchema,
  type ApplicationDeploymentMap,
  type EndpointDefinition,
} from "miroir-core";
import {
  deployment_Library_DO_NO_USE,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { type McpRequestHandlers } from "./handlersForEndpoint.js";
import { getMcpRequestHandlersFromEndpoint, type getMcpRequestHandlersFromEndpointParams } from "./ToolsForApplication_Miroir.js";

const defaultLibraryAppModel = getDefaultLibraryModelEnvironmentDEFUNCT(
  miroirFundamentalJzodSchema as any,
  defaultMiroirMetaModel,
  instanceEndpointV1 as any as EndpointDefinition,
  {
    ...defaultSelfApplicationDeploymentMap,
    [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  } as ApplicationDeploymentMap,
);


const endpointDefinition: EndpointDefinition[] | undefined =
    defaultLibraryAppModel.currentModel.endpoints.filter((endpoint) => endpoint.uuid === "212f2784-5b68-43b2-8ee0-89b1c6fdd0de") as EndpointDefinition[]; // lendingEndpoint UUID
  
if (!endpointDefinition || endpointDefinition.length === 0) {
  throw new Error("Lending endpoint definition not found: " + "212f2784-5b68-43b2-8ee0-89b1c6fdd0de");
}

export const defaultGetMcpRequestHandlersFromEndpointParams: getMcpRequestHandlersFromEndpointParams[] = [
    {
      instanceEndpoint: instanceEndpointV1 as any as EndpointDefinition,
      endpointActions: [
        "createInstance",
        "getInstance",
        "getInstances",
        "updateInstance",
        "deleteInstance",
        "deleteInstanceWithCascade",
        "loadNewInstancesInLocalCache",
      ],
      toolPrefix: "miroir_",
    },
      {
        instanceEndpoint: endpointDefinition[0],
        endpointActions: ["lendDocument"],
        toolPrefix: "library_",
      }, // Pass the existing handlers to allow for composition};
  ]

// ################################################################################################
export function getMcpRequestHandlers(
  getMcpRequestHandlersFromEndpointParams: getMcpRequestHandlersFromEndpointParams[]
): McpRequestHandlers {
  const result: McpRequestHandlers = {
    ...getMcpRequestHandlersFromEndpointParams.reduce((acc, params) => {
      const handlers = getMcpRequestHandlersFromEndpoint(params);
      return {
        ...acc,
        ...handlers,
      };
    }, {} as McpRequestHandlers),
  };
  return result;
}