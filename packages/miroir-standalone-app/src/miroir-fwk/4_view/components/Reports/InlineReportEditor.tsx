import { useFormikContext } from 'formik';
import React from 'react';

import {
  ApplicationSection,
  defaultReport,
  EntityDefinition,
  getApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  Report,
  Uuid,
  type ApplicationDeploymentMap,
  type JzodObject
} from "miroir-core";

import { ThemedOnScreenHelper } from 'miroir-react';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { ThemedProgressiveAccordion } from '../Themes/BasicComponents.js';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "InlineReportEditor"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// InlineReportEditor Component
// ################################################################################################
export interface InlineReportEditorProps {
  // reportDefinitionDEFUNCT: Report;
  reportEntityDefinitionDEFUNCT: EntityDefinition;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
  applicationSection: ApplicationSection;
  formValueMLSchema: JzodObject;
  formikAlreadyAvailable?: boolean;
  formikValuePath: ( string | number )[],
  formikReportDefinitionPathString: string;
}

export const InlineReportEditor: React.FC<InlineReportEditorProps> = ({
  formValueMLSchema,
  application,
  applicationDeploymentMap,
  deploymentUuid,
  formikAlreadyAvailable,
  formikReportDefinitionPathString,
  formikValuePath,
}) => {
  const formik = useFormikContext<any>();
  const formikReportDefinition: Report = formik.values[formikReportDefinitionPathString];
  return (
    <div
      style={{
        marginTop: 12,
        border: "2px solid #1976d2",
        padding: 12,
        borderRadius: 4,
        backgroundColor: "#f5f5f5",
      }}
    >
      {
        formikReportDefinition?.uuid !== defaultReport.uuid && (
          <ThemedProgressiveAccordion 
            // style={{ marginBottom: 12 }
            summary={`Report Editor`}
          >
            {/* <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <div style={{ fontWeight: 500 }}>Runtime Environment (Read-Only)</div>
            </AccordionSummary>
            <AccordionDetails> */}
              {/* <ThemedOnScreenHelper
                label={"InlineReportEditor: reportDefinitionDEFUNCT"}
                data={reportDefinitionDEFUNCT}
                initiallyUnfolded={false}
              /> */}
              {/* <ThemedOnScreenHelper
                label={"InlineReportEditor: reportEntityDefinitionDEFUNCT"}
                data={reportEntityDefinitionDEFUNCT}
                initiallyUnfolded={false}
              /> */}
              {/* <ThemedOnScreenHelper
                label={"InlineReportEditor: report edition parameters"}
                initiallyUnfolded={false}
                data={{
                  reportEntityDefinitionDEFUNCT: reportEntityDefinitionDEFUNCT?.uuid,
                  deploymentUuid,
                  applicationSection,
                  applicationSectionComputed,
                  formikAlreadyAvailable,
                  formikReportDefinitionPathString,
                  formikValuePath,
                }}
              /> */}
              <ReportSectionEntityInstance
                valueObjectEditMode='create'
                application={application}
                applicationDeploymentMap={applicationDeploymentMap}
                deploymentUuid={deploymentUuid}
                applicationSection={getApplicationSection(application, formikReportDefinition?.parentUuid)}
                entityUuidDEFUNCT={formikReportDefinition?.parentUuid} // entityUuid-based display, not formikReportPath-based; type comes for formValueMLSchema
                formValueMLSchema={formValueMLSchema}
                formikValuePath={formikValuePath}
                formikReportDefinitionPathString={formikReportDefinitionPathString}
                reportSectionPath={["definition", "section", "definition", 0]}
                formikAlreadyAvailable={formikAlreadyAvailable}
                initialInstanceValueDEFUNCT={formikReportDefinition} // DEFUNCT when formikAlreadyAvailable=true
              />
            {/* </AccordionDetails> */}
          </ThemedProgressiveAccordion>
        )
      }
      {formikReportDefinition?.uuid === defaultReport.uuid && (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          Report Editor: no report selected yet. Please select a report to edit.
        </div>
      )}
      {!formikReportDefinition && (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          InlineReportEditor: formikReportDefinition is undefined.
          <ThemedOnScreenHelper
            label={"InlineReportEditor: formikReportDefinitionPathString"}
            data={formikReportDefinitionPathString}
          />
          <ThemedOnScreenHelper
            label={"InlineReportEditor: formik values"}
            data={formik.values}
          />
        </div>
      )}
      {/* )} */}
      {/* <div style={{ marginTop: 12, fontSize: "12px", color: "#666", fontStyle: "italic" }}>
        {hasValidationErrors
          ? "⚠️ Please fix validation errors before saving"
          : "✓ Valid - Click the save icon above to apply changes"}
      </div> */}
    </div>
  );
};
