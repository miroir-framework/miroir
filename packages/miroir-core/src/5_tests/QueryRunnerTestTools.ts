import * as vitest from "vitest";

import type {
  MiroirTestForQuery,
  TestAssertionResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import type { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import type { ReduxDeploymentsState } from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { defaultSelfApplicationDeploymentMap, type ApplicationDeploymentMap } from "../1_core/Deployment";
import { defaultMetaModelEnvironment } from "../1_core/Model";
import {
  getQueryRunnerParamsForDomainState,
  runQueryFromDomainState,
} from "../2_domain/DomainStateQuerySelectors";
import {
  getQueryTemplateRunnerParamsForDomainState,
  runQueryTemplateFromDomainState,
} from "../2_domain/DomainStateQueryTemplateSelector";
import {
  getQueryRunnerParamsForReduxDeploymentsState,
  runQueryFromReduxDeploymentsState,
} from "../2_domain/ReduxDeploymentsStateQuerySelectors";
import {
  getQueryTemplateRunnerParamsForReduxDeploymentsState,
  runQueryTemplateFromReduxDeploymentsState,
} from "../2_domain/ReduxDeploymentsStateQueryTemplateSelectors";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-test-app_deployment-library";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import { ignorePostgresExtraAttributes, removeUndefinedProperties, unNullify } from "../4_services/otherTools";
import { domainStateToReduxDeploymentsState, resolvePathOnObject } from "../tools";
import domainStateImport from "../domainState.json";
import type { TestSuiteListFilter } from "../0_interfaces/5-tests/miroirTestTypes";

export { miroirTestForQuery as queryRunnerTestJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

type VitestNamespace = typeof vitest;

export type QueryRunnerFixture = {
  domainState: DomainState;
  deploymentEntityState: ReduxDeploymentsState;
  applicationDeploymentMap: ApplicationDeploymentMap;
};

const QUERY_RUNNER_IGNORE_FAILURE_ATTRIBUTES = [
  "applicationSection",
  "deploymentUuid",
  "entityUuid",
  "instanceUuid",
  "errorStack",
  "failureMessage",
  "failureOrigin",
  "innerError",
  "queryParameters",
  "queryReference",
  "query",
];

const QUERY_RUNNER_FIXTURES: Record<string, () => QueryRunnerFixture> = {
  libraryDomainState: () => {
    const domainState = domainStateImport as DomainState;
    return {
      domainState,
      deploymentEntityState: domainStateToReduxDeploymentsState(domainState),
      applicationDeploymentMap: {
        ...defaultSelfApplicationDeploymentMap,
        [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
      },
    };
  },
};

export function resolveQueryRunnerFixture(fixtureRef: string | undefined): QueryRunnerFixture {
  if (!fixtureRef) {
    throw new Error("queryTest requires fixtureRef");
  }
  const loader = QUERY_RUNNER_FIXTURES[fixtureRef];
  if (!loader) {
    throw new Error(`Unknown query runner fixtureRef: ${fixtureRef}`);
  }
  return loader();
}

export function listQueryRunnerFixtureRefs(): string[] {
  return Object.keys(QUERY_RUNNER_FIXTURES);
}

function cleanupQueryResult(
  preResult: Domain2QueryReturnType<Record<string, unknown>>,
  resultAccessPath: string[] | undefined,
) {
  const resolvedPreResult = resolvePathOnObject(preResult, resultAccessPath ?? []);
  if (Object.hasOwn(resolvedPreResult, "queryFailure")) {
    return ignorePostgresExtraAttributes(
      resolvedPreResult,
      QUERY_RUNNER_IGNORE_FAILURE_ATTRIBUTES,
    );
  }
  return resolvedPreResult;
}

type QueryRunnerExecution = {
  runnerLabel: string;
  run: () => Domain2QueryReturnType<Record<string, unknown>>;
};

// ################################################################################################
function buildQueryRunnerExecutions(
  miroirTest: MiroirTestForQuery,
  fixture: QueryRunnerFixture,
  modelEnvironment: MiroirModelEnvironment,
): QueryRunnerExecution[] {
  const executions: QueryRunnerExecution[] = [];
  const runners = miroirTest.runner
    ? [miroirTest.runner]
    : [
        ...(miroirTest.query
          ? ["runQueryFromDomainState", "runQueryFromReduxDeploymentsState"]
          : []),
        ...(miroirTest.queryTemplate
          ? ["runQueryTemplateFromDomainState", "runQueryTemplateFromReduxDeploymentsState"]
          : []),
      ];

  for (const runner of runners) {
    switch (runner) {
      case "runQueryFromDomainState":
        if (!miroirTest.query) break;
        executions.push({
          runnerLabel: runner,
          run: () =>
            runQueryFromDomainState(
              fixture.domainState,
              fixture.applicationDeploymentMap,
              getQueryRunnerParamsForDomainState(miroirTest.query!),
              modelEnvironment,
            ),
        });
        break;
      case "runQueryFromReduxDeploymentsState":
        if (!miroirTest.query) break;
        executions.push({
          runnerLabel: runner,
          run: () =>
            runQueryFromReduxDeploymentsState(
              fixture.deploymentEntityState,
              fixture.applicationDeploymentMap,
              getQueryRunnerParamsForReduxDeploymentsState(miroirTest.query!),
              modelEnvironment,
            ),
        });
        break;
      case "runQueryTemplateFromDomainState":
        if (!miroirTest.queryTemplate) break;
        executions.push({
          runnerLabel: runner,
          run: () =>
            runQueryTemplateFromDomainState(
              fixture.domainState,
              fixture.applicationDeploymentMap,
              getQueryTemplateRunnerParamsForDomainState(miroirTest.queryTemplate!),
              modelEnvironment,
            ) as Domain2QueryReturnType<Record<string, unknown>>,
        });
        break;
      case "runQueryTemplateFromReduxDeploymentsState":
        if (!miroirTest.queryTemplate) break;
        executions.push({
          runnerLabel: runner,
          run: () =>
            runQueryTemplateFromReduxDeploymentsState(
              fixture.deploymentEntityState,
              fixture.applicationDeploymentMap,
              getQueryTemplateRunnerParamsForReduxDeploymentsState(
                miroirTest.queryTemplate!,
                fixture.applicationDeploymentMap,
              ),
              modelEnvironment,
            ) as Domain2QueryReturnType<Record<string, unknown>>,
        });
        break;
      default:
        throw new Error(`Unknown query runner: ${runner}`);
    }
  }

  if (executions.length === 0) {
    throw new Error(
      `queryTest "${miroirTest.miroirTestLabel}" has no runnable query or queryTemplate`,
    );
  }
  return executions;
}

// ################################################################################################
export async function runMiroirQueryRunnerTestInMemory(
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: { testList?: TestSuiteListFilter; match?: RegExp } | undefined,
  miroirTest: MiroirTestForQuery,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
  modelEnvironment: MiroirModelEnvironment = defaultMetaModelEnvironment,
): Promise<void> {
  const assertionName = miroirTest.miroirTestLabel;
  const effectiveSkip = !!(parentSkip || miroirTest.skip);

  const currentTestAssertionPath =
    testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
  if (!currentTestAssertionPath) {
    throw new Error(
      "runMiroirQueryRunnerTestInMemory called without testAssertionPath and no currentTestAssertionPath available",
    );
  }

  if (
    effectiveSkip ||
    (filter?.testList && !(filter.testList as string[]).includes(assertionName))
  ) {
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
    });
    return;
  }

  const fixture = resolveQueryRunnerFixture(miroirTest.fixtureRef);
  const executions = buildQueryRunnerExecutions(miroirTest, fixture, modelEnvironment);
  const assertions = miroirTest.assertions ?? [];
  const testSuiteNamePathAsString = MiroirActivityTracker.testPathName(testNamePath);

  let testAssertionResult: TestAssertionResult = { assertionName, assertionResult: "ok" };

  try {
    for (const execution of executions) {
      const preResult = execution.run();
      for (const assertion of assertions) {
        const actual = cleanupQueryResult(preResult, assertion.resultAccessPath);
        const normalizedActual = removeUndefinedProperties(unNullify(actual));
        const normalizedExpected = removeUndefinedProperties(
          unNullify(assertion.expectedValue),
        );
        const subLabel = `${assertionName} [${execution.runnerLabel}/${assertion.label}]`;
        const testResult: any = localVitest
          .expect(normalizedActual, `${testSuiteNamePathAsString} > ${subLabel}`)
          .toEqual(normalizedExpected);

        if (testResult && Object.hasOwn(testResult, "result") && !testResult.result) {
          testAssertionResult = {
            assertionName,
            assertionResult: "error",
            assertionExpectedValue: assertion.expectedValue,
            assertionActualValue: normalizedActual,
          };
          miroirActivityTracker.setTestAssertionResult(
            currentTestAssertionPath,
            testAssertionResult,
          );
          return;
        }
      }
    }
  } catch {
    testAssertionResult = {
      assertionName,
      assertionResult: "error",
    };
  }

  miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);
}
