/**
 * Thin vitest adapter for modelValidation suites.
 * Deployment packages supply plan + modelEnv + workspace name; this registers describe/it/afterAll.
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
  type ModelValidationPlan,
} from "./ModelValidationTools.js";

export type ModelValidationVitest = Pick<
  VitestNamespace,
  "describe" | "it" | "expect" | "afterAll"
>;

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

/**
 * Registers one describe/it tree per plan group and an afterAll reporter for
 * zero-instance entities + failed-case re-run commands.
 */
export function runModelValidationSuite(
  params: runModelValidationSuiteParams,
): void {
  const {
    vitest,
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

  for (const group of plan.groups) {
    const instances = filterModelValidationGroupInstances(
      group.instances,
      group.filterByName,
    );
    vitest.describe(group.groupName, () => {
      for (const [path, module] of Object.entries(instances)) {
        const instance = module.default;
        const label = buildModelValidationInstanceLabel(instance, path);
        vitest.it(label, () => {
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
          vitest.expect(
            check.status,
            `jzodTypeCheck failed for instance ${check.label}`,
          ).toBe("ok");
        });
      }
    });
  }

  vitest.afterAll(() => {
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
  });
}
