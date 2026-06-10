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
import { MiroirTestListDisplay } from "./MiroirTestListDisplay.js";

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

  const fetchedMiroirTests = useMemo(() => {
    const fetchedDataReference =
      reportSectionDefinitionFromFormik?.definition?.fetchedDataReference;
    if (!fetchedDataReference) {
      return undefined;
    }
    return formikContext.values[fetchedDataReference] as
      | MiroirTestDefinition
      | MiroirTestDefinition[]
      | undefined;
  }, [
    formikContext.values,
    reportSectionDefinitionFromFormik?.definition?.fetchedDataReference,
  ]);

  if (!fetchedMiroirTests) {
    return null;
  }

  if (Array.isArray(fetchedMiroirTests)) {
    if (fetchedMiroirTests.length === 0) {
      return null;
    }

    log.info("ReportSectionMiroirTest: rendering list", {
      count: fetchedMiroirTests.length,
    });

    return (
      <MiroirTestListDisplay
        miroirTests={fetchedMiroirTests}
        useSnackBar={true}
        gridType={viewParams.gridType}
      />
    );
  }

  const miroirTestInstance = fetchedMiroirTests;

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
