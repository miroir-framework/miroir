import { describe, expect, it } from "vitest";

import type { JzodElement, MetaModel, MiroirModelEnvironment } from "miroir-core";
import { getMiroirFundamentalSchemaForDeployment, jzodTypeCheck } from "miroir-core";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  miroirTest_runner_library,
} from "miroir-test-app_deployment-library";

import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
/**
 * TypedValueObjectEditor resolves jzod against useCurrentModelEnvironment(application, …).
 * Model-section Library instances (e.g. runner_library) must use the Library application so
 * getMiroirFundamentalSchemaForDeployment extends actionTemplate with lendDocument.
 */
describe("TypedValueObjectEditor schema resolution (Feature 198)", () => {
  const libraryModelEnvironment: MiroirModelEnvironment = {
    miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      defaultLibraryAppModel as MetaModel,
    ),
    miroirMetaModel: defaultMiroirMetaModel,
    endpointsByUuid: {},
    deploymentUuid: deployment_Library_DO_NO_USE.uuid,
    currentModel: defaultLibraryAppModel,
  };

  const miroirTestDefinitionSchema: JzodElement = {
    type: "schemaReference",
    definition: {
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      relativePath: "miroirTestDefinition",
    },
  };

  it("runner_library MiroirTest validates when model environment uses Library deployment schema", () => {
    const result = jzodTypeCheck(
      miroirTestDefinitionSchema,
      miroirTest_runner_library,
      [],
      [],
      libraryModelEnvironment,
      {},
    );
    expect(result.status).toBe("ok");
  });
});
