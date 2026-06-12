
// As a basic setup, import your same slice reducers
import {
  Action2ReturnType,
  DomainControllerInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  type ApplicationDeploymentMap,
  type MiroirActivityTrackerInterface
} from "miroir-core";


import {
  TestCompositeActionParams,
} from "miroir-core";
import { packageName } from '../../constants';
import { cleanLevel } from '../4_view/constants';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "tests-utils")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export async function runTestOrTestSuite(
  domainController: DomainControllerInterface,
  testAction: TestCompositeActionParams,
  applicationDeploymentMap: ApplicationDeploymentMap,
  miroirActivityTracker: MiroirActivityTrackerInterface, // Optional unified tracker for test execution tracking
  testActionParamValues?: {[k:string]: any},
) {
  const fullTestName = testAction.testActionLabel??testAction.testActionType;
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ STARTING test:", fullTestName, );

  try {
    const currentModelEnvironment = domainController.currentModelEnvironment(
      testAction.application,
      applicationDeploymentMap,
    );

    switch (testAction.testActionType) {
      case 'testBuildPlusRuntimeCompositeActionSuite':
      case "testCompositeActionSuite": {
        const newParams = {
          ...(testActionParamValues ?? {}),
          ...(testAction.testActionType == "testBuildPlusRuntimeCompositeActionSuite"
            ? (testAction.testParams ?? {})
            : {}),
        };
        log.info(
          "running test testCompositeActionSuite",
          fullTestName,
          "with params",
          newParams,
          // JSON.stringify(newParams, null, 2)
        );
        const queryResult: Action2ReturnType = await miroirActivityTracker.trackTestSuite(
          fullTestName,
          fullTestName,
          undefined, // parentTrackId
          async () =>
            await domainController.handleTestCompositeActionSuite(
              testAction.application,
              testAction.testCompositeAction as any, // TODO: remove cast
              applicationDeploymentMap,
              currentModelEnvironment,
              newParams
            )
        ); 
        log.info(
          "received results for test testCompositeActionSuite",
          fullTestName,
          ": queryResult=",
          JSON.stringify(queryResult, null, 2),
          "TestContextResults",
          JSON.stringify(miroirActivityTracker.getTestAssertionsResults([]), null, 2)
        );
        // log.info(
        //   "received results for test testCompositeActionSuite",
        //   fullTestName,
        //   ": queryResult=",
        //   JSON.stringify(queryResult, null, 2)
        // );
        return queryResult;
      }
      case 'testBuildPlusRuntimeCompositeAction':
      case "testCompositeAction": {
        const queryResult: Action2ReturnType = await miroirActivityTracker.trackTest(
          fullTestName,
          miroirActivityTracker.getCurrentActivityId(),
          async () =>
            await domainController.handleTestCompositeAction(
              testAction.testCompositeAction as any, // TODO: remove cast
              applicationDeploymentMap,
              currentModelEnvironment,
              {},
            )
        );
        // const queryResult: Action2ReturnType = await domainController.handleTestCompositeAction(
        //   testAction.testCompositeAction as any, // TODO: remove cast
        //   {},
        //   domainController.currentModel(testAction.deploymentUuid)
        // );
        log.info(
          "test testCompositeAction",
          fullTestName,
          ": queryResult=",
          JSON.stringify(queryResult, null, 2)
        );
        return queryResult;
      }
      case "testCompositeActionTemplateSuite": {
        log.info("testCompositeActionTemplateSuite", fullTestName, "running for testActionParamValues", testActionParamValues);
        const queryResult: Action2ReturnType = await miroirActivityTracker.trackTest(
          fullTestName,
          miroirActivityTracker.getCurrentActivityId(),
          async() => await domainController.handleTestCompositeActionTemplateSuite(
            testAction.testCompositeActionSuite,
            applicationDeploymentMap,
            currentModelEnvironment,
            testActionParamValues??{},
          )
        )
        log.info(
          "received results for test testCompositeActionSuite",
          fullTestName,
          ": queryResult=",
          JSON.stringify(queryResult, null, 2),
          "TestContextResults",
          // JSON.stringify(miroirActivityTracker.getTestAssertionsResults([{testSuite: testAction.testActionLabel}]), null, 2)
          JSON.stringify(miroirActivityTracker.getTestAssertionsResults([]), null, 2)
        );
        return queryResult;
      }
      case "testCompositeActionTemplate": {
        throw new Error("testCompositeActionTemplate not implemented yet!");
      }
    }
  } catch (error) {
    log.error(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ERROR test:",
      fullTestName,
      "error",
      error
    );
  } finally {
    log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DONE test:", fullTestName);
    miroirActivityTracker.resetContext();
  }
}
