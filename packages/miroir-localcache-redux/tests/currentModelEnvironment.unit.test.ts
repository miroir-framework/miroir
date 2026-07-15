import { describe, expect, it, vi } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultMiroirMetaModel,
  getMiroirFundamentalSchemaForDeployment,
  miroirFundamentalJzodSchema,
  selfApplicationMiroir,
} from "miroir-core";

import { currentModelEnvironment } from "../src/4_services/localCache/Model.js";
import { buildMinimalLocalCacheStateForDeployment } from "./helpers/minimalLocalCacheStateForModel.js";

describe("currentModelEnvironment (redux, Phase 1)", () => {
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

describe("currentModelEnvironment (redux, Phase 199 — UI deprecation)", () => {
  it("emits console.warn when called with MIROIR_UI_CONTEXT=1", () => {
    const previous = process.env.MIROIR_UI_CONTEXT;
    process.env.MIROIR_UI_CONTEXT = "1";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const application = selfApplicationMiroir.uuid;
      const deploymentUuid = deployment_Miroir.uuid;
      const applicationDeploymentMap = { [application]: deploymentUuid };
      const state = buildMinimalLocalCacheStateForDeployment(deploymentUuid, "data");

      currentModelEnvironment(application, applicationDeploymentMap, state);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("deprecated for UI schema access"),
      );
    } finally {
      warnSpy.mockRestore();
      if (previous === undefined) {
        delete process.env.MIROIR_UI_CONTEXT;
      } else {
        process.env.MIROIR_UI_CONTEXT = previous;
      }
    }
  });
});
