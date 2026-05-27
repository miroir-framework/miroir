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

// ################################################################################################
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
export const mcpRequestHandlers_Library_lendingEndpoint: McpRequestHandlers =
  defaultLibraryAppModel.currentModel.endpoints
    .filter((endpoint) => endpoint.uuid === "212f2784-5b68-43b2-8ee0-89b1c6fdd0de") // lendingEndpoint UUID
    .reduce((acc, endpoint) => {
      const createInstanceHandler = mcpToolEntry(endpoint as EndpointDefinition, "lendDocument");
      acc["miroir_" + createInstanceHandler.actionEnvelope.actionType] = createInstanceHandler;
      return acc;
    }, {} as McpRequestHandlers);
