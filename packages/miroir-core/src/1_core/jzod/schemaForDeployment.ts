import type { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
import { miroirFundamentalJzodSchema } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import type { MetaModel, MlSchema } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

function hasAppSpecificEndpoints(model: MetaModel): boolean {
  if (model.applicationUuid === selfApplicationMiroir.uuid) {
    return false;
  }
  return model.endpoints.some((endpoint) => endpoint.application === model.applicationUuid);
}

/**
 * Returns the jzod schema for a deployment + model.
 * Phase 2.1+: returns a distinct schema object when the model has app-owned endpoints
 * (non-Miroir application with endpoint.application === model.applicationUuid).
 * Phase 2.2+ will extend domainAction / actionTemplate inside that object.
 */
export function getSchemaForDeployment(
  _deploymentUuid: Uuid,
  model: MetaModel,
): MlSchema {
  if (!hasAppSpecificEndpoints(model)) {
    return miroirFundamentalJzodSchema as MlSchema;
  }

  // Phase 2.1 shell — extended domainAction content arrives in 2.2
  return { ...(miroirFundamentalJzodSchema as MlSchema) };
}
