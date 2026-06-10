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
} from "miroir-core";

import { useMiroirContextService, useSnackbar } from "miroir-react";
import { packageName } from "../../../../constants.js";
import { ActionButtonWithSnackbar } from "../../components/Page/ActionButtonWithSnackbar.js";
import { cleanLevel } from "../../constants.js";
import {
  getMiroirTestSuiteKey,
  sortMiroirTestInstances,
} from "../Reports/miroirTestSuiteKey.js";
import { generateTestReport, type TestResultData } from "./testResultReport.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunAllMiroirTestsButton"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export type MiroirTestSuiteResultsMap = Record<string, TestResultData[]>;

interface RunAllMiroirTestsButtonProps {
  miroirTests: MiroirTestDefinition[];
  useSnackBar: boolean;
  onTestComplete?: (resultsBySuiteKey: MiroirTestSuiteResultsMap) => void;
  label?: string;
  [key: string]: unknown;
}

export const RunAllMiroirTestsButton: React.FC<RunAllMiroirTestsButtonProps> = ({
  miroirTests,
  useSnackBar,
  onTestComplete,
  label,
  ...buttonProps
}) => {
  const { handleAsyncAction } = useSnackbar();
  const miroirContextService = useMiroirContextService();

  const onAction = async (): Promise<Action2VoidReturnType> => {
    const tracker = miroirContextService.miroirContext.miroirActivityTracker;
    const sortedInstances = sortMiroirTestInstances(miroirTests);
    const resultsBySuiteKey: MiroirTestSuiteResultsMap = {};

    for (const instance of sortedInstances) {
      const suiteKey = getMiroirTestSuiteKey(instance);
      tracker.resetResults();

      await runMiroirTests._runMiroirTestSuite(
        TestFramework as any,
        [],
        instance.definition,
        undefined,
        defaultMetaModelEnvironment,
        tracker,
        undefined,
        true,
        runMiroirTests,
        { executionMode: "unit" },
      );

      const suiteResults = tracker.getTestAssertionsResults([]);
      resultsBySuiteKey[suiteKey] = generateTestReport(suiteKey, suiteResults, () => {});
      log.info(`MiroirTest results for ${suiteKey}:`, resultsBySuiteKey[suiteKey]);
    }

    if (onTestComplete) {
      onTestComplete(resultsBySuiteKey);
    }
    return ACTION_OK;
  };

  return (
    <ActionButtonWithSnackbar
      onAction={onAction}
      successMessage="All Miroir tests completed"
      label={label || "Run All Miroir Tests"}
      handleAsyncAction={useSnackBar ? handleAsyncAction : undefined}
      actionName="run all miroir tests"
      {...buttonProps}
    />
  );
};
