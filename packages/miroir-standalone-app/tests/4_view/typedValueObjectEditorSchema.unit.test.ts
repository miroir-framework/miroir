import { describe, expect, it } from "vitest";

import type { MlElement, MetaModel, MiroirModelEnvironment } from "miroir-core";
import { getMiroirFundamentalSchemaForDeployment, mlsTypeCheck } from "miroir-core";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  miroirTest_runner_returnDocument,
} from "miroir-test-app_deployment-library";

import { defaultMiroirMetaModel } from "miroir-app-miroir";
/**
 * TypedValueObjectEditor resolves the ML schema against useCurrentModelEnvironment(application, …).
 * Model-section Library instances (e.g. runner.returnDocument) must use the Library application so
 * getMiroirFundamentalSchemaForDeployment extends actionTemplate with lendDocument.
 */
describe("TypedValueObjectEditor schema resolution (Feature 198)", () => {
  const libraryModelEnvironment: MiroirModelEnvironment = {
    miroirFundamentalMlSchema: getMiroirFundamentalSchemaForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      defaultLibraryAppModel as MetaModel,
    ),
    miroirMetaModel: defaultMiroirMetaModel,
    endpointsByUuid: {},
    deploymentUuid: deployment_Library_DO_NO_USE.uuid,
    currentModel: defaultLibraryAppModel,
  };

  const miroirTestDefinitionSchema: MlElement = {
    type: "schemaReference",
    definition: {
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      relativePath: "miroirTestDefinition",
    },
  };

  it("runner.returnDocument MiroirTest validates when model environment uses Library deployment schema", () => {
    const result = mlsTypeCheck(
      miroirTestDefinitionSchema,
      miroirTest_runner_returnDocument,
      [],
      [],
      libraryModelEnvironment,
      {},
    );
    expect(result.status).toBe("ok");
  });
});
