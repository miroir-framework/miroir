import React from 'react';
import { useFormikContext } from 'formik';
import { ExpandMoreIcon } from '../Themes/MaterialSymbolWrappers';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';

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

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance.js';
import { ThemedOnScreenHelper } from '../Themes/BasicComponents.js';

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
  // hasValidationErrors: boolean;
  // onDefinitionChange: (extractedSection: any) => void;
  // onValidationChange: (hasErrors: boolean) => void;
}

export const InlineReportEditor: React.FC<InlineReportEditorProps> = ({
  reportEntityDefinitionDEFUNCT,
  formValueMLSchema,
  application,
  applicationDeploymentMap,
  deploymentUuid,
  applicationSection,
  formikAlreadyAvailable,
  formikReportDefinitionPathString,
  formikValuePath,
}) => {
  const formik = useFormikContext<any>();
  // const formikReportDefinition: Report = formik.values[reportSectionPath.join("_")];
  const formikReportDefinition: Report = formik.values[formikReportDefinitionPathString];
  const applicationSectionComputed = getApplicationSection(deploymentUuid, formikReportDefinition?.parentUuid);
  log.info("InlineReportEditor: formikReportDefinition =", formikReportDefinition);
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
      <div style={{ marginBottom: 12, fontWeight: 600, fontSize: "16px", color: "#1976d2" }}>
        Report Editor
      </div>

      {/* {reportDefinition.definition && ( */}
      {
        formikReportDefinition?.uuid !== defaultReport.uuid && (
          <Accordion style={{ marginBottom: 12 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <div style={{ fontWeight: 500 }}>Runtime Environment (Read-Only)</div>
            </AccordionSummary>
            <AccordionDetails>
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
                applicationSection={getApplicationSection(deploymentUuid, formikReportDefinition?.parentUuid)}
                entityUuidDEFUNCT={formikReportDefinition?.parentUuid} // entityUuid-based display, not formikReportPath-based; type comes for formValueMLSchema
                formValueMLSchema={formValueMLSchema}
                formikValuePath={formikValuePath}
                formikReportDefinitionPathString={formikReportDefinitionPathString}
                reportSectionPath={["definition", "section", "definition", 0]}
                // formikAlreadyAvailable={false}
                formikAlreadyAvailable={formikAlreadyAvailable}
                initialInstanceValueDEFUNCT={formikReportDefinition} // DEFUNCT when formikAlreadyAvailable=true
              />
            </AccordionDetails>
          </Accordion>
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
