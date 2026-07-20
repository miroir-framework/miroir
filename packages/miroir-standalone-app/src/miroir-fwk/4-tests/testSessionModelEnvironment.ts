import {
  getMiroirFundamentalSchemaForDeployment,
  type MetaModel,
  type MiroirModelEnvironment,
  type Uuid,
} from "miroir-core";

import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
/**
 * Builds a MiroirModelEnvironment for test sessions using getMiroirFundamentalSchemaForDeployment explicitly
 * (Feature 198 Phase 1 — avoids opaque defaultMiroirModelEnvironment import at call sites).
 */
export function buildTestSessionModelEnvironment(
  deploymentUuid: Uuid,
  currentModel: MetaModel,
): MiroirModelEnvironment {
  return {
    miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(deploymentUuid, currentModel),
    miroirMetaModel: defaultMiroirMetaModel,
    endpointsByUuid: Object.fromEntries(currentModel.endpoints.map((endpoint) => [endpoint.uuid, endpoint])),
    deploymentUuid,
    currentModel,
  };
}
