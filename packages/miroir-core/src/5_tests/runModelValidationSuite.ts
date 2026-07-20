/**
 * Thin vitest adapter for modelValidation suites.
 * Builds a framework-agnostic suite array, then registers it with a tiny vitest loop.
 */

// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import type { VitestNamespace } from "./MiroirTestTools.js";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer.js";
import {
  buildModelValidationInstanceLabel,
  checkModelValidationInstance,
  filterModelValidationGroupInstances,
  formatEntitiesWithZeroInstancesReport,
  formatFailedModelValidationRerunCommands,
  type ModelValidationFailedCase,
  type ModelValidationInstanceCheck,
  type ModelValidationPlan,
} from "./ModelValidationTools.js";

export type ModelValidationVitest = Pick<
  VitestNamespace,
  "describe" | "it" | "expect" | "beforeAll" | "afterAll"
>;

export type ModelValidationRunnableTestCase = {
  name: string;
  /** Performs the check (and failure bookkeeping); vitest asserts status === "ok". */
  run: () => ModelValidationInstanceCheck;
};

export type ModelValidationRunnableSuite = {
  suiteName: string;
  beforeAll?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
  testCases: ModelValidationRunnableTestCase[];
};

export type runModelValidationSuiteParams = {
  vitest: ModelValidationVitest;
  plan: ModelValidationPlan;
  modelEnv: MiroirModelEnvironment;
  /** npm workspace name used in printed re-run commands, e.g. miroir-test-app_deployment-miroir */
  npmWorkspacePackage: string;
  /** vitest file filter segment after `--`, default `model` */
  testFileFilter?: string;
  /** Optional log of entity names when the plan is built from a MetaModel */
  logFoundEntities?: string[];
};

export type buildModelValidationRunnableSuitesParams = Omit<
  runModelValidationSuiteParams,
  "vitest"
>;

/**
 * Build one runnable suite per plan group, plus a final reporting suite (afterAll only).
 * No vitest dependency — callers can run these with any harness.
 */
export function buildModelValidationRunnableSuites(
  params: buildModelValidationRunnableSuitesParams,
): ModelValidationRunnableSuite[] {
  const {
    plan,
    modelEnv,
    npmWorkspacePackage,
    testFileFilter = "model",
    logFoundEntities,
  } = params;

  if (logFoundEntities && logFoundEntities.length > 0) {
    console.log("Found Entities:", logFoundEntities.join(", "));
  }

  const failedModelValidationCases: ModelValidationFailedCase[] = [];

  const groupSuites: ModelValidationRunnableSuite[] = plan.groups.map((group) => {
    const instances = filterModelValidationGroupInstances(
      group.instances,
      group.filterByName,
    );
    const testCases: ModelValidationRunnableTestCase[] = Object.entries(instances).map(
      ([path, module]) => {
        const instance = module.default;
        const label = buildModelValidationInstanceLabel(instance, path);
        return {
          name: label,
          run: () => {
            const check = checkModelValidationInstance(
              group.jzodSchema,
              instance,
              path,
              group.modelEnv ?? modelEnv,
            );
            if (check.status === "error") {
              failedModelValidationCases.push({
                groupName: group.groupName,
                label: check.label,
                filter: check.filter,
              });
              console.error(
                `Validation error for instance ${check.label}:`,
                JSON.stringify(check.innermostError, null, 2),
              );
            }
            return check;
          },
        };
      },
    );
    return {
      suiteName: group.groupName,
      testCases,
    };
  });

  const reportSuite: ModelValidationRunnableSuite = {
    suiteName: "modelValidation reports",
    afterAll: () => {
      const zeroReport = formatEntitiesWithZeroInstancesReport(
        plan.entitiesWithZeroInstances,
      );
      if (zeroReport) {
        console.log(zeroReport);
      }
      const rerunReport = formatFailedModelValidationRerunCommands({
        npmWorkspacePackage,
        failedCases: failedModelValidationCases,
        testFileFilter,
      });
      if (rerunReport) {
        console.log(rerunReport);
      }
    },
    testCases: [],
  };

  return [...groupSuites, reportSuite];
}

/**
 * Register a runnable-suite array with vitest (describe / it / hooks / expect only).
 * Suites with no testCases register beforeAll/afterAll at the file root so hooks still run.
 */
export function runModelValidationSuitesWithVitest(
  vitest: ModelValidationVitest,
  suites: ModelValidationRunnableSuite[],
): void {
  for (const suite of suites) {
    if (suite.testCases.length === 0) {
      if (suite.beforeAll) {
        vitest.beforeAll(suite.beforeAll);
      }
      if (suite.afterAll) {
        vitest.afterAll(suite.afterAll);
      }
      continue;
    }
    vitest.describe(suite.suiteName, () => {
      if (suite.beforeAll) {
        vitest.beforeAll(suite.beforeAll);
      }
      if (suite.afterAll) {
        vitest.afterAll(suite.afterAll);
      }
      for (const testCase of suite.testCases) {
        vitest.it(testCase.name, () => {
          const check = testCase.run();
          vitest.expect(
            check.status,
            `jzodTypeCheck failed for instance ${check.label}`,
          ).toBe("ok");
        });
      }
    });
  }
}

/**
 * Build runnable suites from the plan, then register them with vitest.
 */
export function runModelValidationSuite(
  params: runModelValidationSuiteParams,
): void {
  const { vitest, ...buildParams } = params;
  runModelValidationSuitesWithVitest(
    vitest,
    buildModelValidationRunnableSuites(buildParams),
  );
}
