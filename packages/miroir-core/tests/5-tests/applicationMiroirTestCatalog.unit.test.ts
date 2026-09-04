import { describe, expect, it } from "vitest";

import type { MiroirTestDefinition, MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  buildApplicationMiroirTestCatalog,
  buildUiIntegrationSuiteRegistriesFromMiroirTests,
  inferUiIntegrationRunnerSuiteKind,
  isUiIntegrationLaunchableSuite,
  listCliRunnerIntegrationSuiteKeys,
  resolveApplicationMiroirTestSuiteKey,
  listCliTransformerIntegrationSuiteKeys,
  listCliUnitSuiteKeys,
  loadMiroirTestSuiteFromCatalog,
  suiteKeyFromMiroirTestInstance,
} from "../../src/5_tests/applicationMiroirTestCatalog";
import { ENTITY_MIROIR_TEST_UUID } from "../../src/5_tests/applicationMiroirTestFolders";

function runnerSuiteInstance(name: string): MiroirTestDefinition {
  return {
    uuid: "00000000-0000-4000-8000-000000000001",
    parentUuid: ENTITY_MIROIR_TEST_UUID,
    name,
    definition: {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: name,
      miroirTests: [
        {
          miroirTestType: "runnerTest",
          miroirTestLabel: "leaf",
        },
      ],
    },
  } as MiroirTestDefinition;
}

function actionSuiteInstance(name: string): MiroirTestDefinition {
  return {
    uuid: "00000000-0000-4000-8000-000000000002",
    parentUuid: ENTITY_MIROIR_TEST_UUID,
    name,
    definition: {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: name,
      miroirTests: [
        {
          miroirTestType: "actionTest",
          miroirTestLabel: "leaf",
        },
      ],
    },
  } as MiroirTestDefinition;
}

function unitTransformerInstance(name: string): MiroirTestDefinition {
  return {
    uuid: "00000000-0000-4000-8000-000000000003",
    parentUuid: ENTITY_MIROIR_TEST_UUID,
    name,
    definition: {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: name,
      miroirTests: [
        {
          miroirTestType: "transformerTest",
          miroirTestLabel: "leaf",
          transformerName: "t",
          transformer: { transformerType: "identity" },
          unitTestExpectedValue: {},
        },
      ],
    },
  } as unknown as MiroirTestDefinition;
}

function mixedTransformerInstance(name: string): MiroirTestDefinition {
  return {
    uuid: "00000000-0000-4000-8000-000000000004",
    parentUuid: ENTITY_MIROIR_TEST_UUID,
    name,
    definition: {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: name,
      miroirTests: [
        {
          miroirTestType: "transformerTest",
          miroirTestLabel: "unit leaf",
          transformerName: "t",
          transformer: { transformerType: "identity" },
          unitTestExpectedValue: {},
        },
        {
          miroirTestType: "transformerTest",
          miroirTestLabel: "integ leaf",
          transformerName: "t",
          transformer: { transformerType: "identity" },
          integrationTestExpectedValue: {},
        },
      ],
    },
  } as unknown as MiroirTestDefinition;
}

describe("applicationMiroirTestCatalog", () => {
  it("uses instance name as the suite key", () => {
    expect(suiteKeyFromMiroirTestInstance(runnerSuiteInstance("runner_return_document"))).toBe(
      "runner_return_document",
    );
  });

  it("infers runner vs domain-controller vs action kinds", () => {
    const runnerSuite = runnerSuiteInstance("runner_return_document").definition as MiroirTestSuite;
    const dcSuite = actionSuiteInstance("domain_controller_data_crud").definition as MiroirTestSuite;
    const actionSuite = actionSuiteInstance("evolutionTraceWP1").definition as MiroirTestSuite;

    expect(inferUiIntegrationRunnerSuiteKind(runnerSuite, "runner_return_document")).toBe(
      "runnerTest",
    );
    expect(inferUiIntegrationRunnerSuiteKind(dcSuite, "domain_controller_data_crud")).toBe(
      "domainControllerTest",
    );
    expect(inferUiIntegrationRunnerSuiteKind(actionSuite, "evolutionTraceWP1")).toBe("actionTest");
  });

  it("treats any integ suite as UI-launchable without a hardcoded registry", () => {
    const unregistered = actionSuiteInstance("brand_new_integ_suite");
    expect(isUiIntegrationLaunchableSuite(unregistered.definition as MiroirTestSuite)).toBe(true);
    expect(
      isUiIntegrationLaunchableSuite(unitTransformerInstance("EntityPrimaryKey").definition as MiroirTestSuite),
    ).toBe(false);
  });

  it("builds CLI key lists from the instance catalog, including suites absent from legacy registries", () => {
    const catalog = buildApplicationMiroirTestCatalog([
      runnerSuiteInstance("runner_return_document"),
      actionSuiteInstance("domain_controller_data_crud"),
      actionSuiteInstance("brand_new_integ_suite"),
      unitTransformerInstance("EntityPrimaryKey"),
      mixedTransformerInstance("miroirCoreTransformers"),
    ]);

    expect(listCliUnitSuiteKeys(catalog)).toEqual(["EntityPrimaryKey", "miroirCoreTransformers"]);
    expect(listCliRunnerIntegrationSuiteKeys(catalog)).toEqual([
      "brand_new_integ_suite",
      "domain_controller_data_crud",
      "runner_return_document",
    ]);
    expect(listCliTransformerIntegrationSuiteKeys(catalog)).toEqual(["miroirCoreTransformers"]);
  });

  it("builds UI registries from the selected application's instances", () => {
    const registries = buildUiIntegrationSuiteRegistriesFromMiroirTests([
      runnerSuiteInstance("runner_return_document"),
      actionSuiteInstance("brand_new_integ_suite"),
      mixedTransformerInstance("miroirCoreTransformers"),
      unitTransformerInstance("EntityPrimaryKey"),
    ]);

    expect(Object.keys(registries.runner).sort()).toEqual([
      "brand_new_integ_suite",
      "runner_return_document",
    ]);
    expect(registries.runner.brand_new_integ_suite.kind).toBe("actionTest");
    expect(Object.keys(registries.transformer)).toEqual(["miroirCoreTransformers"]);
    expect(registries.runner.EntityPrimaryKey).toBeUndefined();
  });

  it("resolves legacy CLI keys that are prefixes of the instance name", () => {
    const catalog = buildApplicationMiroirTestCatalog([
      unitTransformerInstance("menu_build"),
      unitTransformerInstance("jzodTypeCheck_TransformerTestSuite"),
    ]);
    expect(resolveApplicationMiroirTestSuiteKey(catalog, "menu")).toBe("menu_build");
    expect(resolveApplicationMiroirTestSuiteKey(catalog, "jzodTypeCheck")).toBe(
      "jzodTypeCheck_TransformerTestSuite",
    );
    expect(resolveApplicationMiroirTestSuiteKey(catalog, "menu_build")).toBe("menu_build");
  });

  it("loads a suite definition from the catalog by name or legacy prefix", () => {
    const catalog = buildApplicationMiroirTestCatalog([
      unitTransformerInstance("menu_build"),
      runnerSuiteInstance("runner_return_document"),
    ]);
    expect(loadMiroirTestSuiteFromCatalog(catalog, "menu").miroirTestLabel).toBe("menu_build");
    expect(loadMiroirTestSuiteFromCatalog(catalog, "runner_return_document").miroirTestType).toBe(
      "miroirTestSuite",
    );
    expect(() => loadMiroirTestSuiteFromCatalog(catalog, "no_such_suite")).toThrow(
      /Unknown MiroirTest suite key/,
    );
  });
});
