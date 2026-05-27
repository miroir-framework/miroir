// ################################################################################################
// aggregate all instance action tools

import { getMcpRequestHandlersFromEndpoint } from "./ToolsForApplication_Miroir.js";
import {
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  instanceEndpointV1,
  miroirFundamentalJzodSchema,
  type ApplicationDeploymentMap,
  type EndpointDefinition,
} from "miroir-core";
import { type McpRequestHandlers, mcpToolEntry } from "./handlersForEndpoint.js";
import {
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
  deployment_Library_DO_NO_USE,
} from "miroir-test-app_deployment-library";

const defaultLibraryAppModel = getDefaultLibraryModelEnvironmentDEFUNCT(
  miroirFundamentalJzodSchema as any,
  defaultMiroirMetaModel,
  instanceEndpointV1 as any as EndpointDefinition,
  {
    ...defaultSelfApplicationDeploymentMap,
    [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  } as ApplicationDeploymentMap,
);

// ################################################################################################
export function getMcpRequestHandlers(): McpRequestHandlers {
  const endpointDefinition: EndpointDefinition[] | undefined =
    defaultLibraryAppModel.currentModel.endpoints.filter((endpoint) => endpoint.uuid === "212f2784-5b68-43b2-8ee0-89b1c6fdd0de") as EndpointDefinition[]; // lendingEndpoint UUID
  
  if (!endpointDefinition || endpointDefinition.length === 0) {
    throw new Error("Lending endpoint definition not found: " + "212f2784-5b68-43b2-8ee0-89b1c6fdd0de");
  }

  const result: McpRequestHandlers = {
    ...getMcpRequestHandlersFromEndpoint(
      instanceEndpointV1 as any as EndpointDefinition,
      [
        "createInstance",
        "getInstance",
        "getInstances",
        "updateInstance",
        "deleteInstance",
        "deleteInstanceWithCascade",
        "loadNewInstancesInLocalCache",
      ],
      "miroir_",
    ), // Pass the existing handlers to allow for composition};
    ...getMcpRequestHandlersFromEndpoint(
      endpointDefinition[0],
      [
        "lendDocument",
      ],
      "miroir_",
    ), // Pass the existing handlers to allow for composition};
    // ...mcpRequestHandlers_Library_lendingEndpoint,
  };
  return result;
}