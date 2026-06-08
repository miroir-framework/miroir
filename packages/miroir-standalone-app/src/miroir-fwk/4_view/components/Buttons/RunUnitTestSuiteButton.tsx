import React from "react";

import {
  ACTION_OK,
  MiroirLoggerFactory,
  TestFramework,
  defaultMetaModelEnvironment,
  runUnitTests,
  type Action2VoidReturnType,
  type LoggerInterface,
  type TestSuiteListFilter,
  type UnitTestDefinition,
} from "miroir-core";

import { useMiroirContextService, useSnackbar } from "miroir-react";
import { packageName } from "../../../../constants.js";
import { ActionButtonWithSnackbar } from "../../components/Page/ActionButtonWithSnackbar.js";
import { cleanLevel } from "../../constants.js";
import {
  generateTestReport,
  type TransformerTestResultData,
} from "./RunTransformerTestSuiteButton.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunUnitTestSuiteButton"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export type UnitTestResultData = TransformerTestResultData;

interface RunUnitTestSuiteButtonProps {
  unitTestSuite: UnitTestDefinition | undefined;
  testSuiteKey: string;
  useSnackBar: boolean;
  onTestComplete?: (testSuiteKey: string, structuredResults: UnitTestResultData[]) => void;
  testFilter?: { testList?: TestSuiteListFilter; match?: RegExp } | undefined;
  label?: string;
  [key: string]: unknown;
}

export const RunUnitTestSuiteButton: React.FC<RunUnitTestSuiteButtonProps> = ({
  unitTestSuite,
  testSuiteKey,
  useSnackBar,
  onTestComplete,
  testFilter,
  label,
  ...buttonProps
}) => {
  const { handleAsyncAction } = useSnackbar();
  const miroirContextService = useMiroirContextService();

  const onAction = async (): Promise<Action2VoidReturnType> => {
    miroirContextService.miroirContext.miroirActivityTracker.resetResults();

    if (!unitTestSuite) {
      throw new Error(`No unit test suite found for ${testSuiteKey}`);
    }

    await runUnitTests._runUnitTestSuite(
      TestFramework as any,
      [],
      unitTestSuite.definition,
      testFilter,
      defaultMetaModelEnvironment,
      miroirContextService.miroirContext.miroirActivityTracker,
      undefined,
      true,
      runUnitTests,
    );

    const allResults = miroirContextService.miroirContext.miroirActivityTracker.getTestAssertionsResults([]);
    log.info("Unit test results:", allResults);

    const structuredResults: UnitTestResultData[] = generateTestReport(
      testSuiteKey,
      allResults,
      () => {},
    );

    if (onTestComplete) {
      onTestComplete(testSuiteKey, structuredResults);
    }
    return ACTION_OK;
  };

  return (
    <ActionButtonWithSnackbar
      onAction={onAction}
      successMessage={`${testSuiteKey} unit tests completed successfully`}
      label={label || `Run ${testSuiteKey} Unit Tests`}
      handleAsyncAction={useSnackBar ? handleAsyncAction : undefined}
      actionName={`run ${testSuiteKey} unit tests`}
      {...buttonProps}
    />
  );
};
