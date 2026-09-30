import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-app-admin";
import {
  getMiroirFundamentalSchemaForDeployment,
  miroirFundamentalMlSchema,
} from "miroir-core";
import { selfApplicationMiroir, defaultMiroirMetaModel } from "miroir-app-miroir";

import { currentModelEnvironment } from "../src/4_services/localCache/Model.js";
import { buildMinimalLocalCacheStateForDeployment } from "./helpers/minimalLocalCacheStateForModel.js";

describe("currentModelEnvironment (zustand, Phase 1)", () => {
  it("miroirFundamentalMlSchema comes from getMiroirFundamentalSchemaForDeployment(deploymentUuid, model)", () => {
    const application = selfApplicationMiroir.uuid;
    const deploymentUuid = deployment_Miroir.uuid;
    const applicationDeploymentMap = { [application]: deploymentUuid };
    const state = buildMinimalLocalCacheStateForDeployment(deploymentUuid, "data");

    const env = currentModelEnvironment(application, applicationDeploymentMap, state);
    const model = env.currentModel;

    expect(env.miroirFundamentalMlSchema).toBe(getMiroirFundamentalSchemaForDeployment(deploymentUuid, model));
    expect(env.miroirFundamentalMlSchema).toBe(miroirFundamentalMlSchema);
    expect(env.deploymentUuid).toBe(deploymentUuid);
    expect(env.miroirMetaModel).toBe(defaultMiroirMetaModel);
  });
});
