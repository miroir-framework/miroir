import React from 'react';

import {
  ApplicationSection,
  EntityDefinition,
  LoggerInterface,
  MiroirLoggerFactory,
  Report,
  Uuid,
  type JzodObject
} from "miroir-core";

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance.js';
import { useFormikContext } from 'formik';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "InlineReportEditor"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// InlineReportEditor Component
// ################################################################################################
export interface InlineReportEditorProps {
  reportDefinitionDEFUNCT: Report;
  reportEntityDefinitionDEFUNCT: EntityDefinition;
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
  reportDefinitionDEFUNCT: reportDefinition,
  reportEntityDefinitionDEFUNCT: reportEntityDefinition,
  formValueMLSchema,
  deploymentUuid,
  applicationSection,
  formikAlreadyAvailable,
  formikReportDefinitionPathString,
  formikValuePath,
  // sectionPath,
  // hasValidationErrors,
  // reportSectionPathAsString,
  // onDefinitionChange,
  // onValidationChange,
}) => {
  const formik = useFormikContext<any>();
  // const formikReportDefinition: Report = formik.values[reportSectionPath.join("_")];
  const formikReportDefinition: Report = formik.values[formikReportDefinitionPathString];
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
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Runtime Environment (Read-Only)</div>
          </AccordionSummary>
          <AccordionDetails>
            <ReportSectionEntityInstance
              deploymentUuid={deploymentUuid}
              applicationSection="model"
              entityUuidDEFUNCT={formikReportDefinition?.parentUuid} // entityUuid-based display, not formikReportPath-based; type comes for formValueMLSchema
              formValueMLSchema={formValueMLSchema}
              formikValuePath={formikValuePath}
              // formikReportDefinitionPathString={formikReportDefinitionPathString}
              // reportSectionPath={[]}
              // formikAlreadyAvailable={false}
              formikAlreadyAvailable={formikAlreadyAvailable}
              initialInstanceValueDEFUNCT={formikReportDefinition} // DEFUNCT when formikAlreadyAvailable=true
            />
          </AccordionDetails>
        </Accordion>
      {/* )} */}
      {/* <div style={{ marginTop: 12, fontSize: "12px", color: "#666", fontStyle: "italic" }}>
        {hasValidationErrors
          ? "⚠️ Please fix validation errors before saving"
          : "✓ Valid - Click the save icon above to apply changes"}
      </div> */}
    </div>
  );
};
