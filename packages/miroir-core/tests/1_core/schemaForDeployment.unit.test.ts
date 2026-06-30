import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
} from "miroir-test-app_deployment-library";

import {
  defaultMiroirMetaModel,
  getSchemaForDeployment,
  miroirFundamentalJzodSchema,
  type MetaModel,
} from "miroir-core";

describe("getSchemaForDeployment (Phase 1)", () => {
  it("returns the static schema for any deploymentUuid when model has no app-specific endpoints", () => {
    const result = getSchemaForDeployment("any-uuid", defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);
    expect((result as any).definition.context.domainAction).toBeDefined();
  });

  it("resolves the static schema for the Miroir deployment", () => {
    const result = getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);
  });
});

describe("getSchemaForDeployment (Phase 2.1 — app-specific endpoints)", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

  it("returns a different object when model has app-specific endpoints", () => {
    const schema = getSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
    expect(schema).not.toBe(miroirFundamentalJzodSchema);
    expect(schema.uuid).toBe(miroirFundamentalJzodSchema.uuid);
  });

  it("returns the static schema when model has no app-specific endpoints", () => {
    const modelWithoutAppEndpoints = { ...defaultLibraryAppModel, endpoints: [] };
    const schema = getSchemaForDeployment(libraryDeploymentUuid, modelWithoutAppEndpoints as MetaModel);
    expect(schema).toBe(miroirFundamentalJzodSchema);
  });

  it("returns the static schema for the Miroir meta-model even when endpoints exist", () => {
    const schema = getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(schema).toBe(miroirFundamentalJzodSchema);
  });
});
