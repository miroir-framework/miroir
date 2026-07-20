import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  getMiroirFundamentalSchemaForDeployment,
  miroirFundamentalJzodSchema,
} from "miroir-core";
import { selfApplicationMiroir, defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

import { currentModelEnvironment } from "../src/4_services/localCache/Model.js";
import { buildMinimalLocalCacheStateForDeployment } from "./helpers/minimalLocalCacheStateForModel.js";

describe("currentModelEnvironment (zustand, Phase 1)", () => {
  it("miroirFundamentalJzodSchema comes from getMiroirFundamentalSchemaForDeployment(deploymentUuid, model)", () => {
    const application = selfApplicationMiroir.uuid;
    const deploymentUuid = deployment_Miroir.uuid;
    const applicationDeploymentMap = { [application]: deploymentUuid };
    const state = buildMinimalLocalCacheStateForDeployment(deploymentUuid, "data");

    const env = currentModelEnvironment(application, applicationDeploymentMap, state);
    const model = env.currentModel;

    expect(env.miroirFundamentalJzodSchema).toBe(getMiroirFundamentalSchemaForDeployment(deploymentUuid, model));
    expect(env.miroirFundamentalJzodSchema).toBe(miroirFundamentalJzodSchema);
    expect(env.deploymentUuid).toBe(deploymentUuid);
    expect(env.miroirMetaModel).toBe(defaultMiroirMetaModel);
  });
});
