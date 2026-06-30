import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import {
  defaultMiroirMetaModel,
  getSchemaForDeployment,
  miroirFundamentalJzodSchema,
} from "miroir-core";

describe("getSchemaForDeployment (Phase 1)", () => {
  it("returns the static schema for any deploymentUuid in Phase 1", () => {
    const result = getSchemaForDeployment("any-uuid", defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);
    expect((result as any).definition.context.domainAction).toBeDefined();
  });

  it("resolves the static schema for the Miroir deployment", () => {
    const result = getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);
  });

  it("returns the static schema for the Library deployment in Phase 1", () => {
    const result = getSchemaForDeployment(
      "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      defaultLibraryAppModel,
    );
    expect(result).toBe(miroirFundamentalJzodSchema);
  });
});
