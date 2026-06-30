import {
  defaultMiroirMetaModel,
  getSchemaForDeployment,
  type MetaModel,
  type MiroirModelEnvironment,
  type Uuid,
} from "miroir-core";

/**
 * Builds a MiroirModelEnvironment for test sessions using getSchemaForDeployment explicitly
 * (Feature 198 Phase 1 — avoids opaque defaultMiroirModelEnvironment import at call sites).
 */
export function buildTestSessionModelEnvironment(
  deploymentUuid: Uuid,
  currentModel: MetaModel,
): MiroirModelEnvironment {
  return {
    miroirFundamentalJzodSchema: getSchemaForDeployment(deploymentUuid, currentModel),
    miroirMetaModel: defaultMiroirMetaModel,
    endpointsByUuid: Object.fromEntries(currentModel.endpoints.map((endpoint) => [endpoint.uuid, endpoint])),
    deploymentUuid,
    currentModel,
  };
}
