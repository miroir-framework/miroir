import { describe, expect, it } from "vitest";

import {
  defaultMiroirMetaModel,
  getSchemaForDeployment,
  instanceEndpointV1,
  miroirFundamentalJzodSchema,
  type EndpointDefinition,
} from "miroir-core";

import deployment_Library_DO_NO_USE from "../assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";
import {
  defaultLibraryAppModel,
  getDefaultLibraryModelEnvironmentDEFUNCT,
} from "../src/Library";

describe("getDefaultLibraryModelEnvironmentDEFUNCT (Phase 1)", () => {
  it("resolves miroirFundamentalJzodSchema via getSchemaForDeployment, not a caller-supplied schema", () => {
    const env = getDefaultLibraryModelEnvironmentDEFUNCT(
      defaultMiroirMetaModel,
      instanceEndpointV1 as EndpointDefinition,
      deployment_Library_DO_NO_USE.uuid,
    );

    expect(env.miroirFundamentalJzodSchema).toBe(
      getSchemaForDeployment(deployment_Library_DO_NO_USE.uuid, defaultLibraryAppModel),
    );
    expect(env.miroirFundamentalJzodSchema).toBe(miroirFundamentalJzodSchema);
    expect(env.deploymentUuid).toBe(deployment_Library_DO_NO_USE.uuid);
    expect(env.currentModel).toBe(defaultLibraryAppModel);
    expect(env.miroirMetaModel).toBe(defaultMiroirMetaModel);
  });

  it("rejects ApplicationDeploymentMap mistakenly passed as libraryDeploymentUuid", () => {
    const bogusDeploymentUuid = {
      "5af03c98-fe5e-490b-b08f-e1230971c57f": deployment_Library_DO_NO_USE.uuid,
    };

    expect(() =>
      getDefaultLibraryModelEnvironmentDEFUNCT(
        defaultMiroirMetaModel,
        instanceEndpointV1 as EndpointDefinition,
        bogusDeploymentUuid as unknown as string,
      ),
    ).toThrow(/libraryDeploymentUuid must be a deployment uuid string/);
  });
});
