import type { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
import { miroirFundamentalJzodSchema } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import type { MetaModel, MlSchema } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Returns the jzod schema for a deployment + model.
 * Phase 1: always returns the static Miroir fundamental schema (reference equality).
 * Phase 2: extends domainAction / actionTemplate with app-specific endpoint actions.
 */
export function getSchemaForDeployment(
  _deploymentUuid: Uuid,
  _model: MetaModel,
): MlSchema {
  return miroirFundamentalJzodSchema as MlSchema;
}
