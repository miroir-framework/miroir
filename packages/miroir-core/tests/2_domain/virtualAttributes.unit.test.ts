import { describe, expect, it } from "vitest";

import { miroirMlSchemaBootstrap } from "miroir-app-miroir";
import { entityBook } from "miroir-test-app_deployment-library";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "virtualAttributes" ||
  RUN_TEST === "virtualAttributes.unit.test";

type MlTagValueDefinition = Record<string, unknown>;

function mlTagValueDefinition(): MlTagValueDefinition {
  const bootstrap = miroirMlSchemaBootstrap as {
    definition: {
      context: {
        mlBaseObject: {
          definition: {
            tag: { definition: { value: { definition: MlTagValueDefinition } } };
          };
        };
      };
    };
  };
  return bootstrap.definition.context.mlBaseObject.definition.tag.definition.value.definition;
}

describe.skipIf(!shouldRun)("virtual attributes — ML tag and Book citation", () => {
  it("ML attribute tags declare virtualAttribute with the transformer editor pattern", () => {
    const virtualAttribute = mlTagValueDefinition().virtualAttribute as {
      type: string;
      optional?: boolean;
      tag?: { value?: { ifThenElseMMLS?: { mmlsReference?: unknown } } };
    };
    expect(virtualAttribute).toBeDefined();
    expect(virtualAttribute.type).toBe("any");
    expect(virtualAttribute.optional).toBe(true);
    expect(virtualAttribute.tag?.value?.ifThenElseMMLS?.mmlsReference).toEqual({
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      relativePath: "coreTransformerForBuildPlusRuntime",
    });
  });

  it("Library Book citation is a virtual mustache attribute", () => {
    const citation = (entityBook as { mlSchema: { definition: Record<string, any> } }).mlSchema
      .definition.citation;
    expect(citation).toBeDefined();
    expect(citation.optional).toBe(true);
    expect(citation.tag.value.virtualAttribute).toEqual({
      interpolation: "runtime",
      transformerType: "mustacheStringTemplate",
      definition: "{{name}} ({{year}})",
    });
  });
});
