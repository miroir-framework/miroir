import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import { getMiroirFundamentalSchemaForDeployment, miroirFundamentalJzodSchema } from "miroir-core";

import { buildTestSessionModelEnvironment } from "./testSessionModelEnvironment.js";

import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
describe("buildTestSessionModelEnvironment (Feature 198 D5)", () => {
  it("uses getMiroirFundamentalSchemaForDeployment explicitly for the given deployment and model", () => {
    const env = buildTestSessionModelEnvironment(deployment_Miroir.uuid, defaultMiroirMetaModel);

    expect(env.miroirFundamentalJzodSchema).toBe(
      getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel),
    );
    expect(env.miroirFundamentalJzodSchema).toBe(miroirFundamentalJzodSchema);
    expect(env.deploymentUuid).toBe(deployment_Miroir.uuid);
    expect(env.currentModel).toBe(defaultMiroirMetaModel);
    expect(env.miroirMetaModel).toBe(defaultMiroirMetaModel);
  });
});
