import React from "react";

import {
  ACTION_OK,
  MiroirLoggerFactory,
  TestFramework,
  defaultMetaModelEnvironment,
  runMiroirTests,
  type Action2VoidReturnType,
  type LoggerInterface,
  type MiroirTestDefinition,
  type TestSuiteListFilter,
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
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunMiroirTestSuiteButton"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export type MiroirTestResultData = TransformerTestResultData;

interface RunMiroirTestSuiteButtonProps {
  miroirTestSuite: MiroirTestDefinition | undefined;
  testSuiteKey: string;
  useSnackBar: boolean;
  onTestComplete?: (testSuiteKey: string, structuredResults: MiroirTestResultData[]) => void;
  testFilter?: { testList?: TestSuiteListFilter; match?: RegExp } | undefined;
  label?: string;
  [key: string]: unknown;
}

export const RunMiroirTestSuiteButton: React.FC<RunMiroirTestSuiteButtonProps> = ({
  miroirTestSuite,
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

    if (!miroirTestSuite) {
      throw new Error(`No MiroirTest suite found for ${testSuiteKey}`);
    }

    await runMiroirTests._runMiroirTestSuite(
      TestFramework as any,
      [],
      miroirTestSuite.definition,
      testFilter,
      defaultMetaModelEnvironment,
      miroirContextService.miroirContext.miroirActivityTracker,
      undefined,
      true,
      runMiroirTests,
      { executionMode: "unit" },
    );

    const allResults =
      miroirContextService.miroirContext.miroirActivityTracker.getTestAssertionsResults([]);
    log.info("MiroirTest results:", allResults);

    const structuredResults: MiroirTestResultData[] = generateTestReport(
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
      successMessage={`${testSuiteKey} Miroir tests completed successfully`}
      label={label || `Run ${testSuiteKey} Miroir Tests`}
      handleAsyncAction={useSnackBar ? handleAsyncAction : undefined}
      actionName={`run ${testSuiteKey} miroir tests`}
      {...buttonProps}
    />
  );
};
