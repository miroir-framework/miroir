import { describe, expect, it } from "vitest";

import { deployment_Library, deployment_Miroir } from "miroir-app-admin";
import { entityTransformerDefinition, selfApplicationMiroir } from "miroir-app-miroir";
import { getReduxDeploymentsStateIndex, type ApplicationSection, type TransformerDefinition, type Uuid } from "miroir-core";

import { selectModelForDeploymentFromReduxState } from "../src/4_services/localCache/LocalCacheSliceModelSelector.js";
import { buildMinimalLocalCacheStateForDeployment } from "./helpers/minimalLocalCacheStateForModel.js";

// #502: the model a deployment gives the UI (useCurrentModel) carries the application's
// TransformerDefinitions, read like themes: the `data` section for Miroir, `model` otherwise.

const bookTitle = {
  uuid: "6b0a2f86-1c8e-4b8e-9d55-2f0c4a1e7b31",
  parentName: "TransformerDefinition",
  parentUuid: entityTransformerDefinition.uuid,
  name: "bookTitle",
  transformerInterface: {
    transformerParameterSchema: {
      transformerType: { type: "literal", definition: "bookTitle" },
      transformerDefinition: { type: "object", definition: {} },
    },
    transformerResultSchema: { type: "string" },
  },
  transformerImplementation: {
    transformerImplementationType: "transformer",
    definition: { transformerType: "getFromContext", interpolation: "runtime", referenceName: "title" },
  },
} as unknown as TransformerDefinition;

function stateWithTransformerDefinition(deploymentUuid: Uuid, section: ApplicationSection) {
  const sliceState = buildMinimalLocalCacheStateForDeployment(deploymentUuid, section as "data" | "model");
  sliceState.current[getReduxDeploymentsStateIndex(deploymentUuid, section, entityTransformerDefinition.uuid)] = {
    entities: { [bookTitle.uuid]: bookTitle },
    ids: [bookTitle.uuid],
  } as any;
  return { presentModelSnapshot: sliceState } as any;
}

function modelOf(application: Uuid, deploymentUuid: Uuid, section: ApplicationSection) {
  const applicationDeploymentMap = { [application]: deploymentUuid };
  return selectModelForDeploymentFromReduxState()(
    stateWithTransformerDefinition(deploymentUuid, section),
    applicationDeploymentMap,
    {
      queryType: "localCacheEntityInstancesExtractor",
      definition: { application, applicationDeploymentMap, deploymentUuid } as any,
    } as any,
  );
}

describe("selectModelForDeploymentFromReduxState: transformerDefinitions (#502)", () => {
  it("an application's model section TransformerDefinitions are in the model", () => {
    const model = modelOf("0f3a5b6c-7d8e-4f90-a1b2-c3d4e5f60718", deployment_Library.uuid, "model");
    expect(model.transformerDefinitions?.map((definition) => definition.name)).toEqual(["bookTitle"]);
  });

  it("Miroir's TransformerDefinitions are read from its data section", () => {
    const model = modelOf(selfApplicationMiroir.uuid, deployment_Miroir.uuid, "data");
    expect(model.transformerDefinitions?.map((definition) => definition.name)).toEqual(["bookTitle"]);
  });
});
