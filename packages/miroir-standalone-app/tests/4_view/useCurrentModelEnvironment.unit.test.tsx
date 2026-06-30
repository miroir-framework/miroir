import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultMiroirMetaModel,
  getSchemaForDeployment,
  miroirFundamentalJzodSchema,
  type MlSchema,
} from "miroir-core";

describe("useCurrentModelEnvironment (Phase 1)", () => {
  it("getSchemaForDeployment matches static schema for Miroir deployment", () => {
    const schema = getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(schema).toBe(miroirFundamentalJzodSchema);
  });

  it("setSchemaForDeployment contract: same deployment returns same schema reference", () => {
    const schemasPerDeployment: Record<string, MlSchema> = {};
    const setSchemaForDeployment = (deploymentUuid: string, schema: MlSchema) => {
      schemasPerDeployment[deploymentUuid] = schema;
    };
    const schema = getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    setSchemaForDeployment(deployment_Miroir.uuid, schema);
    expect(schemasPerDeployment[deployment_Miroir.uuid]).toBe(miroirFundamentalJzodSchema);
  });
});
