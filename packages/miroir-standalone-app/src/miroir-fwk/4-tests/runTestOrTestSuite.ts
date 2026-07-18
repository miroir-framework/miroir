
// As a basic setup, import your same slice reducers
import {
  Action2ReturnType,
  DomainControllerInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  runCompositeActionTestParams,
  type ApplicationDeploymentMap,
  type MiroirActivityTrackerInterface,
  type TestCompositeActionParams,
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
    const queryResult: Action2ReturnType | undefined = await runCompositeActionTestParams(
      domainController,
      testAction,
      applicationDeploymentMap,
      miroirActivityTracker,
      testActionParamValues,
    );
    log.info(
      "received results for test",
      fullTestName,
      ": queryResult=",
      JSON.stringify(queryResult, null, 2),
      "TestContextResults",
      JSON.stringify(miroirActivityTracker.getTestAssertionsResults([]), null, 2)
    );
    return queryResult;
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
