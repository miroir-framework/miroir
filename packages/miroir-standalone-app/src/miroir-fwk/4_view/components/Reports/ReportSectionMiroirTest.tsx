import { useMemo } from "react";
import { useFormikContext } from "formik";

import {
  LoggerInterface,
  MiroirLoggerFactory,
  resolvePathOnObject,
  type MiroirTestDefinition,
} from "miroir-core";
import type { MiroirTestReportSection } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { useViewParams } from "miroir-react";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { MiroirTestDisplay } from "./MiroirTestDisplay.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionMiroirTest"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface ReportSectionMiroirTestProps {
  reportName: string;
  reportSectionPath?: (string | number)[];
  showPerformanceDisplay?: boolean;
}

export const ReportSectionMiroirTest = (props: ReportSectionMiroirTestProps) => {
  const formikContext = useFormikContext<any>();
  const viewParams = useViewParams();

  const reportDefinitionFromFormik = useMemo(() => {
    return formikContext.values[props.reportName];
  }, [formikContext.values, props.reportName]);

  const reportSectionDefinitionFromFormik = useMemo((): MiroirTestReportSection | undefined => {
    if (reportDefinitionFromFormik && props.reportSectionPath) {
      return resolvePathOnObject(
        reportDefinitionFromFormik,
        props.reportSectionPath,
      ) as MiroirTestReportSection;
    }
    return undefined;
  }, [reportDefinitionFromFormik, props.reportSectionPath]);

  const miroirTestInstance: MiroirTestDefinition | undefined = useMemo(() => {
    const fetchedDataReference =
      reportSectionDefinitionFromFormik?.definition?.fetchedDataReference;
    if (!fetchedDataReference) {
      return undefined;
    }
    return formikContext.values[fetchedDataReference] as MiroirTestDefinition | undefined;
  }, [
    formikContext.values,
    reportSectionDefinitionFromFormik?.definition?.fetchedDataReference,
  ]);

  if (!miroirTestInstance) {
    return null;
  }

  const testLabel =
    miroirTestInstance.definition?.miroirTestLabel ||
    miroirTestInstance.name ||
    "MiroirTest";

  log.info("ReportSectionMiroirTest: rendering", { testLabel, miroirTestInstance });

  return (
    <MiroirTestDisplay
      miroirTest={miroirTestInstance}
      testLabel={testLabel}
      useSnackBar={true}
      onTestComplete={(testSuiteKey, structuredResults) => {
        log.info(`MiroirTest completed for ${testSuiteKey}:`, structuredResults);
      }}
      gridType={viewParams.gridType}
    />
  );
};
