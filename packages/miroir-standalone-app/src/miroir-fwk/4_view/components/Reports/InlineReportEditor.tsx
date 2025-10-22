import React from 'react';

import {
  ApplicationSection,
  EntityDefinition,
  LoggerInterface,
  MiroirLoggerFactory,
  Report,
  Uuid
} from "miroir-core";

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { TypedValueObjectEditor } from './TypedValueObjectEditor.js';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionViewWithEditor"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// InlineReportEditor Component
// ################################################################################################
export interface InlineReportEditorProps {
  reportDefinition: Report;
  reportEntityDefinition: EntityDefinition;
  deploymentUuid: Uuid;
  applicationSection: ApplicationSection;
  sectionPath?: string;
  hasValidationErrors: boolean;
  onDefinitionChange: (extractedSection: any) => void;
  onValidationChange: (hasErrors: boolean) => void;
}

export const InlineReportEditor: React.FC<InlineReportEditorProps> = ({
  reportDefinition,
  reportEntityDefinition,
  deploymentUuid,
  applicationSection,
  sectionPath,
  hasValidationErrors,
  onDefinitionChange,
  onValidationChange,
}) => {
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

      {reportDefinition.definition && (
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Runtime Environment (Read-Only)</div>
          </AccordionSummary>
          <AccordionDetails>
            {/* <TypedValueObjectEditor
              labelElement={<span>Report Parameters</span>}
              valueObject={reportDefinition.definition}
              valueObjectMMLSchema={reportEntityDefinition?.jzodSchema?.definition?.definition}
              deploymentUuid={deploymentUuid}
              applicationSection={applicationSection}
              formLabel="reportParameters"
              onSubmit={async () => {}} // No-op for read-only
              readonly={true}
              maxRenderDepth={Infinity}
            /> */}
            <ReportSectionEntityInstance
              deploymentUuid={deploymentUuid}
              applicationSection="model"
              entityUuid={reportDefinition.parentUuid}
              instance={reportDefinition}
              // entityDefinition={reportEntityDefinition}
              // instanceData={reportDefinition.definition}
              // readonly={true}
            />
          </AccordionDetails>
        </Accordion>
      )}

      {/* <TypedValueObjectEditor
        labelElement={<span>Section Definition</span>}
        valueObject={reportDefinition}
        valueObjectMMLSchema={reportEntityDefinition.jzodSchema}
        deploymentUuid={deploymentUuid}
        applicationSection={applicationSection}
        formLabel="reportSection"
        onSubmit={async (data: any) => {
          log.info("TypedValueObjectEditor onSubmit called", data);
          // Extract the edited section from the full report
          // The zoomInPath points to the section being edited
          const pathParts = (sectionPath ?? "").split("/").filter((p) => p);
          let extractedSection = data;
          for (const part of pathParts) {
            const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
            if (arrayMatch) {
              const [, key, index] = arrayMatch;
              extractedSection = extractedSection?.[key]?.[parseInt(index)];
            } else {
              extractedSection = extractedSection?.[part];
            }
          }
          onDefinitionChange(extractedSection);
          onValidationChange(false);
        }}
        zoomInPath={`definition.section${sectionPath ? "/" + sectionPath : ""}`}
        maxRenderDepth={Infinity}
        readonly={false}
      /> */}

      <div style={{ marginTop: 12, fontSize: "12px", color: "#666", fontStyle: "italic" }}>
        {hasValidationErrors
          ? "⚠️ Please fix validation errors before saving"
          : "✓ Valid - Click the save icon above to apply changes"}
      </div>
    </div>
  );
};
