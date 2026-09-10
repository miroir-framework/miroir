import { instanceEndpointV1, modelEndpointV1, storeManagementEndpoint as storeManagementEndpointV1 } from "miroir-test-app_deployment-miroir";
import { getEndpointActions } from "../0_interfaces/1_core/endpointDefinition.js";
import type { EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


export const actionsWithDeploymentInPayload = [
  ...(getEndpointActions(instanceEndpointV1) ?? []).map(
  (actionDef:any) => actionDef.actionParameters.actionType.definition
),
  ...(getEndpointActions(storeManagementEndpointV1) ?? []).map(
    (actionDef:any) => actionDef.actionParameters.actionType.definition
),
...(getEndpointActions(modelEndpointV1) ?? []).map(
  (actionDef:any) => actionDef.actionParameters.actionType.definition
)]

export const noValue = {
  uuid: "31f3a03a-f150-416d-9315-d3a752cb4eb4",
  name: "no value",
  parentUuid: "",
} as EntityInstance;
