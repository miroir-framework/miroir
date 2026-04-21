import type React from "react";


import type { ReportSection, Uuid, ApplicationDeploymentMap } from "miroir-core";

export const TransformerRunnerReportSectionView: React.FC<{
  reportSectionDefinition: Extract<ReportSection, { type: "transformerRunnerReportSection" }>;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
}> = (props) => {
  const { reportSectionDefinition, application, applicationDeploymentMap, deploymentUuid } = props;
  const transformerRunnerReportSectionType = reportSectionDefinition.definition.transformerRunnerReportSectionType;

  switch (transformerRunnerReportSectionType) {
    case "storedTransformer": {
      return (
        <div>
          Unsupported transformer runner report section type: storedTransformer.
          This section type is reserved for future use to display the output of a stored
          transformer in a report section. In the meantime, you can achieve similar functionality
          by using a transformer to evaluate the stored transformer and then passing the result
           to a supported report section type (e.g. markdownReportSection or jsonReportSection) for display.
        </div>
      );
    }
    default:
      return (
        <div>
          Unsupported runner report section type: {transformerRunnerReportSectionType}
        </div>
      );
  }
}
