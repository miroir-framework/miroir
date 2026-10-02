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
import {
  ENTITY_MIROIR_TEST_UUID,
  ENTITY_RUNNER_UUID,
  buildRunnerUuidIndex,
  isRunnerInstance,
  runnerEntityFolderRelativePath,
} from "../../src/5_tests/applicationMiroirTestFolders";

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
    expect(suiteKeyFromMiroirTestInstance(runnerSuiteInstance("runner.returnDocument"))).toBe(
      "runner.returnDocument",
    );
  });

  it("infers runner and action kinds from leaves", () => {
    const runnerSuite = runnerSuiteInstance("runner.returnDocument").definition as MiroirTestSuite;
    const dcSuite = actionSuiteInstance("action.domainController.dataCrud").definition as MiroirTestSuite;
    const actionSuite = actionSuiteInstance("action.scenario.evolutionTrace").definition as MiroirTestSuite;

    expect(inferUiIntegrationRunnerSuiteKind(runnerSuite, "runner.returnDocument")).toBe(
      "runnerTest",
    );
    expect(inferUiIntegrationRunnerSuiteKind(dcSuite, "action.domainController.dataCrud")).toBe(
      "actionTest",
    );
    expect(inferUiIntegrationRunnerSuiteKind(actionSuite, "action.scenario.evolutionTrace")).toBe("actionTest");
  });

  it("gives a definition the same kind whatever its name (#317)", () => {
    const names = [undefined, "action.domainController.x", "action.scenario.x", "runner.x", "anything"];
    for (const [suite, expected] of [
      [runnerSuiteInstance("runner.returnDocument").definition, "runnerTest"],
      [actionSuiteInstance("action.domainController.dataCrud").definition, "actionTest"],
    ] as const) {
      for (const name of names) {
        expect(inferUiIntegrationRunnerSuiteKind(suite as MiroirTestSuite, name), name).toBe(expected);
      }
    }
  });

  it("infers the reportTest kind from reportTest leaves, whatever the suite name (#330)", () => {
    const reportSuite = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "any.name",
      miroirTests: [
        {
          miroirTestType: "reportTestSuite",
          miroirTestLabel: "a Report",
          report: {
            application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
            applicationSection: "data",
            reportUuid: "c3503412-3d8a-43ef-a168-aa36e975e606",
          },
          miroirTests: [{ miroirTestType: "reportTest", miroirTestLabel: "mounts it", steps: [] }],
        },
      ],
    } as unknown as MiroirTestSuite;
    expect(inferUiIntegrationRunnerSuiteKind(reportSuite, "any.name")).toBe("reportTest");
    expect(inferUiIntegrationRunnerSuiteKind(reportSuite, "action.domainController.named")).toBe("reportTest");
  });

  it("treats any integ suite as UI-launchable without a hardcoded registry", () => {
    const unregistered = actionSuiteInstance("brand_new_integ_suite");
    expect(isUiIntegrationLaunchableSuite(unregistered.definition as MiroirTestSuite)).toBe(true);
    expect(
      isUiIntegrationLaunchableSuite(unitTransformerInstance("fn.entityPrimaryKey").definition as MiroirTestSuite),
    ).toBe(false);
  });

  it("builds CLI key lists from the instance catalog, including suites absent from legacy registries", () => {
    const catalog = buildApplicationMiroirTestCatalog([
      runnerSuiteInstance("runner.returnDocument"),
      actionSuiteInstance("action.domainController.dataCrud"),
      actionSuiteInstance("brand_new_integ_suite"),
      unitTransformerInstance("fn.entityPrimaryKey"),
      mixedTransformerInstance("tr.core"),
    ]);

    expect(listCliUnitSuiteKeys(catalog)).toEqual(["fn.entityPrimaryKey", "tr.core"]);
    expect(listCliRunnerIntegrationSuiteKeys(catalog)).toEqual([
      "action.domainController.dataCrud",
      "brand_new_integ_suite",
      "runner.returnDocument",
    ]);
    expect(listCliTransformerIntegrationSuiteKeys(catalog)).toEqual(["tr.core"]);
  });

  it("builds UI registries from the selected application's instances", () => {
    const registries = buildUiIntegrationSuiteRegistriesFromMiroirTests([
      runnerSuiteInstance("runner.returnDocument"),
      actionSuiteInstance("brand_new_integ_suite"),
      mixedTransformerInstance("tr.core"),
      unitTransformerInstance("fn.entityPrimaryKey"),
    ]);

    expect(Object.keys(registries.runner).sort()).toEqual([
      "brand_new_integ_suite",
      "runner.returnDocument",
    ]);
    expect(registries.runner.brand_new_integ_suite.kind).toBe("actionTest");
    expect(Object.keys(registries.transformer)).toEqual(["tr.core"]);
    expect(registries.runner.EntityPrimaryKey).toBeUndefined();
  });

  it("resolves --suites tokens by instance name or uuid only", () => {
    const catalog = buildApplicationMiroirTestCatalog([
      unitTransformerInstance("tr.menuBuild"),
      runnerSuiteInstance("runner.returnDocument"),
    ]);
    expect(resolveApplicationMiroirTestSuiteKey(catalog, "menu")).toBeUndefined();
    expect(resolveApplicationMiroirTestSuiteKey(catalog, "mlsTypeCheck")).toBeUndefined();
    expect(resolveApplicationMiroirTestSuiteKey(catalog, "tr.menuBuild")).toBe("tr.menuBuild");
    expect(
      resolveApplicationMiroirTestSuiteKey(catalog, "00000000-0000-4000-8000-000000000001"),
    ).toBe("runner.returnDocument");
  });

  it("loads a suite definition from the catalog by name only", () => {
    const catalog = buildApplicationMiroirTestCatalog([
      unitTransformerInstance("tr.menuBuild"),
      runnerSuiteInstance("runner.returnDocument"),
    ]);
    expect(loadMiroirTestSuiteFromCatalog(catalog, "tr.menuBuild").miroirTestLabel).toBe("tr.menuBuild");
    expect(loadMiroirTestSuiteFromCatalog(catalog, "runner.returnDocument").miroirTestType).toBe(
      "miroirTestSuite",
    );
    expect(() => loadMiroirTestSuiteFromCatalog(catalog, "menu")).toThrow(
      /Unknown suite key "menu". Use instance name/,
    );
    expect(() => loadMiroirTestSuiteFromCatalog(catalog, "no_such_suite")).toThrow(
      /Unknown suite key "no_such_suite". Use instance name/,
    );
  });

  it("derives the sibling Runner folder from a MiroirTest source folder", () => {
    expect(
      runnerEntityFolderRelativePath(
        `packages/miroir-example-library/assets/library_model/${ENTITY_MIROIR_TEST_UUID}`,
      ),
    ).toBe(
      `packages/miroir-example-library/assets/library_model/${ENTITY_RUNNER_UUID}`,
    );
  });

  it("builds a runner uuid index from Runner instances", () => {
    const runner = {
      uuid: "cc853632-f158-43fa-b9ed-437c9c25f539",
      parentUuid: ENTITY_RUNNER_UUID,
      name: "lendDocument",
      application: "app",
      defaultLabel: "Lend",
      definition: { runnerType: "customRunner" },
    };
    expect(isRunnerInstance(runner)).toBe(true);
    expect(isRunnerInstance({ parentUuid: ENTITY_MIROIR_TEST_UUID, uuid: "x" })).toBe(false);
    expect(buildRunnerUuidIndex([runner as never])[runner.uuid].name).toBe("lendDocument");
  });
});
