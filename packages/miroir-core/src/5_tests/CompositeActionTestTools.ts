import type { TestCompositeActionParams } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import type { MiroirActivityTrackerInterface } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";

/**
 * Shared executor for composite-action integ tests (Action + Runner MiroirTest leaves,
 * and legacy `runTestOrTestSuite` callers).
 */
export async function runCompositeActionTestParams(
  domainController: DomainControllerInterface,
  testAction: TestCompositeActionParams,
  applicationDeploymentMap: ApplicationDeploymentMap,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  testActionParamValues?: Record<string, unknown>,
): Promise<Action2ReturnType | undefined> {
  const fullTestName = testAction.testActionLabel ?? testAction.testActionType;
  const currentModelEnvironment = domainController.currentModelEnvironment(
    testAction.application,
    applicationDeploymentMap,
  );

  switch (testAction.testActionType) {
    case "testBuildPlusRuntimeCompositeActionSuite":
    case "testCompositeActionSuite": {
      const newParams = {
        ...(testActionParamValues ?? {}),
        ...(testAction.testActionType === "testBuildPlusRuntimeCompositeActionSuite"
          ? (testAction.testParams ?? {})
          : {}),
      };
      return miroirActivityTracker.trackTestSuite(
        fullTestName,
        fullTestName,
        undefined,
        async () =>
          domainController.handleTestCompositeActionSuite(
            testAction.application,
            testAction.testCompositeAction as any,
            applicationDeploymentMap,
            currentModelEnvironment,
            newParams,
          ),
      );
    }
    case "testBuildPlusRuntimeCompositeAction":
    case "testCompositeAction": {
      return miroirActivityTracker.trackTest(
        fullTestName,
        miroirActivityTracker.getCurrentActivityId(),
        async () =>
          domainController.handleTestCompositeAction(
            testAction.testCompositeAction as any,
            applicationDeploymentMap,
            currentModelEnvironment,
            {},
          ),
      );
    }
    case "testCompositeActionTemplateSuite": {
      return miroirActivityTracker.trackTest(
        fullTestName,
        miroirActivityTracker.getCurrentActivityId(),
        async () =>
          domainController.handleTestCompositeActionTemplateSuite(
            testAction.testCompositeActionSuite,
            applicationDeploymentMap,
            currentModelEnvironment,
            testActionParamValues ?? {},
          ),
      );
    }
    case "testCompositeActionTemplate": {
      throw new Error("testCompositeActionTemplate not implemented yet!");
    }
    default: {
      const _exhaustive: never = testAction;
      throw new Error(
        `runCompositeActionTestParams: unsupported testActionType ${
          (_exhaustive as TestCompositeActionParams).testActionType
        }`,
      );
    }
  }
}
