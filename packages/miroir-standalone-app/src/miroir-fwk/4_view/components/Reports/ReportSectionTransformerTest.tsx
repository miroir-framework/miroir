import { useMemo } from "react";
import { useFormikContext } from "formik";

import {
  LoggerInterface,
  MiroirLoggerFactory,
  resolvePathOnObject,
  type TransformerTestDefinition,
} from "miroir-core";
import type { TransformerTestReportSection } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { useViewParams } from "miroir-react";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { TransformerTestDisplay } from "./TransformerTestDisplay.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionTransformerTest"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface ReportSectionTransformerTestProps {
  reportName: string;
  reportSectionPath?: (string | number)[];
  showPerformanceDisplay?: boolean;
}

export const ReportSectionTransformerTest = (props: ReportSectionTransformerTestProps) => {
  const formikContext = useFormikContext<any>();
  const viewParams = useViewParams();

  const reportDefinitionFromFormik = useMemo(() => {
    return formikContext.values[props.reportName];
  }, [formikContext.values, props.reportName]);

  const reportSectionDefinitionFromFormik = useMemo((): TransformerTestReportSection | undefined => {
    if (reportDefinitionFromFormik && props.reportSectionPath) {
      return resolvePathOnObject(
        reportDefinitionFromFormik,
        props.reportSectionPath,
      ) as TransformerTestReportSection;
    }
    return undefined;
  }, [reportDefinitionFromFormik, props.reportSectionPath]);

  const transformerTestInstance: TransformerTestDefinition | undefined = useMemo(() => {
    const fetchedDataReference =
      reportSectionDefinitionFromFormik?.definition?.fetchedDataReference;
    if (!fetchedDataReference) {
      return undefined;
    }
    return formikContext.values[fetchedDataReference] as TransformerTestDefinition | undefined;
  }, [
    formikContext.values,
    reportSectionDefinitionFromFormik?.definition?.fetchedDataReference,
  ]);

  if (!transformerTestInstance) {
    return null;
  }

  const testLabel =
    transformerTestInstance.definition?.transformerTestLabel ||
    transformerTestInstance.name ||
    "TransformerTest";

  log.info("ReportSectionTransformerTest: rendering", { testLabel, transformerTestInstance });

  return (
    <TransformerTestDisplay
      transformerTest={transformerTestInstance}
      testLabel={testLabel}
      useSnackBar={true}
      onTestComplete={(testSuiteKey, structuredResults) => {
        log.info(`Transformer test completed for ${testSuiteKey}:`, structuredResults);
      }}
      gridType={viewParams.gridType}
    />
  );
};
