import { describe, expect, it } from "vitest";

import {
  defaultMetaModelEnvironment,
  entityDefinitionMiroirTest,
  entityMiroirTest,
  getInnermostTypeCheckError,
  jzodTypeCheck,
  miroirTest_mustache,
  miroirTest_adminTransformers,
  miroirTest_queries_library,
  miroirTest_pilot_transformer_plus,
  miroirTest_schema_pilot_empty,
  reportMiroirTestDetails,
  reportMiroirTestList,
} from "../../src";
import type {
  EntityDefinition,
  JzodElement,
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const miroirTestJzodSchema = (entityDefinitionMiroirTest as unknown as EntityDefinition)
  .mlSchema as unknown as JzodElement;

describe("MiroirTestDefinition schema (Phase 0)", () => {
  it("registers MiroirTest entity", () => {
    expect(entityMiroirTest.name).toBe("MiroirTest");
    expect(entityMiroirTest.uuid).toBe("a311f363-e238-4203-bdfc-29e8c160c26b");
    expect(entityDefinitionMiroirTest.name).toBe("MiroirTest");
    expect(entityDefinitionMiroirTest.uuid).toBe("51c647fe-07ec-411c-89cc-02689dc66d6a");
  });

  it("validates empty pilot MiroirTest instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      miroirTestJzodSchema,
      miroirTest_schema_pilot_empty,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");

    const suite = (miroirTest_schema_pilot_empty as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.miroirTestType).toBe("miroirTestSuite");
    expect(suite.miroirTestLabel).toBe("schema_pilot_empty");
    expect(suite.miroirTests).toEqual([]);
  });

  it("validates pilot_transformer_plus MiroirTest instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      miroirTestJzodSchema,
      miroirTest_pilot_transformer_plus,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");

    const suite = (miroirTest_pilot_transformer_plus as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.miroirTestLabel).toBe("pilot_resolveConditionalSchema");
    expect(suite.miroirTests).toHaveLength(1);
    expect(suite.miroirTests[0]).toMatchObject({
      miroirTestType: "transformerTest",
      transformerName: "resolveConditionalSchema",
    });
  });

  it("validates mustache MiroirTest instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      miroirTestJzodSchema,
      miroirTest_mustache,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");

    const suite = (miroirTest_mustache as MiroirTestDefinition).definition as MiroirTestSuite;
    expect(suite.miroirTestLabel).toBe("mustache.extractDoubleBracePatterns");
    expect(suite.miroirTests).toHaveLength(6);
    expect(suite.miroirTests[0]).toMatchObject({
      miroirTestType: "functionCallTest",
      functionRef: {
        module: "miroir-core/1_core/mustache",
        export: "extractDoubleBracePatterns",
      },
    });
  });

  it("validates queries_library MiroirTest instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      miroirTestJzodSchema,
      miroirTest_queries_library,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");

    const suite = (miroirTest_queries_library as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.miroirTestLabel).toBe("queries.library");
    expect(suite.miroirTests).toHaveLength(17);
    expect(suite.miroirTests[0]).toMatchObject({
      miroirTestType: "queryRunnerTest",
      runner: "runQueryFromDomainState",
      fixtureRef: "libraryDomainState",
    });
  });

  it("validates adminTransformers nested MiroirTest instance via jzodTypeCheck", () => {
    const result = jzodTypeCheck(
      miroirTestJzodSchema,
      miroirTest_adminTransformers,
      [],
      [],
      defaultMetaModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(getInnermostTypeCheckError(result));
    }
    expect(result.status).toBe("ok");

    const suite = (miroirTest_adminTransformers as MiroirTestDefinition)
      .definition as MiroirTestSuite;
    expect(suite.miroirTestLabel).toBe("adminTransformers");
    expect(suite.miroirTests).toHaveLength(1);
    expect(suite.miroirTests[0]).toMatchObject({
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "duplicateApplicationModel",
    });
    const nestedSuite = suite.miroirTests[0] as MiroirTestSuite;
    expect(nestedSuite.miroirTests).toHaveLength(1);
    expect(nestedSuite.miroirTests[0]).toMatchObject({
      miroirTestType: "transformerTest",
      transformerName: "duplicateApplicationModel_simplifiedLibrary",
    });
  });

  it("validates MiroirTest list and details report assets (Phase 4)", () => {
    expect(reportMiroirTestList.uuid).toBe("58dc6706-0473-468c-90ee-61b54b157140");
    expect(reportMiroirTestDetails.uuid).toBe("0ad63f27-c4df-4fb8-9a79-cb257c7a2958");
    expect(reportMiroirTestList.definition.section.type).toBe("objectListReportSection");
    expect(
      (reportMiroirTestDetails.definition.section as { definition: unknown[] }).definition[0],
    ).toMatchObject({
      type: "miroirTestReportSection",
      definition: { fetchedDataReference: "elementToDisplay" },
    });
  });
});
