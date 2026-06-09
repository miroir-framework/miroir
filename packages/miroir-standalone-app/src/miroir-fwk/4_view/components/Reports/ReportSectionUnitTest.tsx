import { useMemo } from "react";
import { useFormikContext } from "formik";

import {
  LoggerInterface,
  MiroirLoggerFactory,
  resolvePathOnObject,
  type UnitTestDefinition,
} from "miroir-core";
import type { UnitTestReportSection } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { useViewParams } from "miroir-react";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { UnitTestDisplay } from "./UnitTestDisplay.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionUnitTest"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface ReportSectionUnitTestProps {
  reportName: string;
  reportSectionPath?: (string | number)[];
  showPerformanceDisplay?: boolean;
}

export const ReportSectionUnitTest = (props: ReportSectionUnitTestProps) => {
  const formikContext = useFormikContext<any>();
  const viewParams = useViewParams();

  const reportDefinitionFromFormik = useMemo(() => {
    return formikContext.values[props.reportName];
  }, [formikContext.values, props.reportName]);

  const reportSectionDefinitionFromFormik = useMemo((): UnitTestReportSection | undefined => {
    if (reportDefinitionFromFormik && props.reportSectionPath) {
      return resolvePathOnObject(
        reportDefinitionFromFormik,
        props.reportSectionPath,
      ) as UnitTestReportSection;
    }
    return undefined;
  }, [reportDefinitionFromFormik, props.reportSectionPath]);

  const unitTestInstance: UnitTestDefinition | undefined = useMemo(() => {
    const fetchedDataReference =
      reportSectionDefinitionFromFormik?.definition?.fetchedDataReference;
    if (!fetchedDataReference) {
      return undefined;
    }
    return formikContext.values[fetchedDataReference] as UnitTestDefinition | undefined;
  }, [
    formikContext.values,
    reportSectionDefinitionFromFormik?.definition?.fetchedDataReference,
  ]);

  if (!unitTestInstance) {
    return null;
  }

  const testLabel =
    unitTestInstance.definition?.unitTestLabel ||
    unitTestInstance.name ||
    "UnitTest";

  log.info("ReportSectionUnitTest: rendering", { testLabel, unitTestInstance });

  return (
    <UnitTestDisplay
      unitTest={unitTestInstance}
      testLabel={testLabel}
      useSnackBar={true}
      onTestComplete={(testSuiteKey, structuredResults) => {
        log.info(`Unit test completed for ${testSuiteKey}:`, structuredResults);
      }}
      gridType={viewParams.gridType}
    />
  );
};
