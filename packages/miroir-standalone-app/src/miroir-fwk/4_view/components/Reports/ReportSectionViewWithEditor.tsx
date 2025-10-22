import React, { useMemo, useState } from 'react';

import {
  SelfApplicationDeploymentConfiguration,
  ApplicationSection,
  Entity,
  EntityDefinition,
  LoggerInterface,
  MiroirLoggerFactory,
  RecordOfJzodObject,
  ReportSection,
  Report,
  Uuid,
  Domain2QueryReturnType,
  Domain2ElementFailed,
  interpolateExpression,
  entityReport,
  selfApplicationDeploymentMiroir
} from "miroir-core";

import { deployments, packageName } from '../../../../constants.js';
import { useMiroirContextService } from '../../MiroirContextReactProvider.js';
import { cleanLevel } from '../../constants.js';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance.js';
import { ReportSectionListDisplay } from './ReportSectionListDisplay.js';
import { ReportSectionMarkdown } from './ReportSectionMarkdown.js';
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { ThemedBox, ThemedText, ThemedIconButton } from '../Themes/index.js';
import { TypedValueObjectEditor } from './TypedValueObjectEditor.js';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionViewWithEditor"), "UI",
).then((logger: LoggerInterface) => {log = logger});


export interface ReportSectionViewPropsBase {
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  reportData: Domain2QueryReturnType<{reportData:Record<string,any>, storedQueryData?: any}>,
  fetchedDataJzodSchema: RecordOfJzodObject | undefined,
  paramsAsdomainElements: Domain2QueryReturnType<Record<string,any>>,
  reportSection: ReportSection,
  reportDefinition: Report,
  isOutlineOpen?: boolean,
  onToggleOutline?: () => void,
  showPerformanceDisplay?: boolean;
}

export interface ReportSectionViewWithEditorProps extends ReportSectionViewPropsBase {
  editMode?: boolean,
  sectionPath?: string,
  onSectionEdit?: (path: string, newDefinition: ReportSection) => void,
  onSectionCancel?: (path: string) => void,
  isSectionModified?: boolean,
}

export const ReportSectionViewWithEditor = (props: ReportSectionViewWithEditorProps) => {
  const context = useMiroirContextService();
  const showPerformanceDisplay = context.showPerformanceDisplay;

  const currentNavigationKey = `${props.deploymentUuid}-${props.applicationSection}-${props.sectionPath ?? 'root'}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportSectionViewWithEditor", currentNavigationKey);

  log.info("ReportSectionViewWithEditor render", currentNavigationKey, "props", props);

  const [isEditing, setIsEditing] = useState(false);
  const [localEditedDefinition, setLocalEditedDefinition] = useState<any | undefined>(undefined);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  const displayedDeploymentDefinition: SelfApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    return displayedDeploymentDefinition &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid][
        props.applicationSection
        ]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [displayedDeploymentDefinition, context.deploymentUuidToReportsEntitiesDefinitionsMapping, props.applicationSection]);

  // Get Report entity definition from Miroir model (for TypedValueObjectEditor schema)
  const reportEntityDefinition = useMemo(() => {
    const miroirMapping = context.deploymentUuidToReportsEntitiesDefinitionsMapping?.[selfApplicationDeploymentMiroir.uuid];
    if (!miroirMapping) return undefined;
    return miroirMapping["model"]?.entityDefinitions?.find((ed: any) => ed.name === "Report");
  }, [context.deploymentUuidToReportsEntitiesDefinitionsMapping]);

  const currentListReportTargetEntity: Entity | undefined =
    props.reportSection?.type === "objectListReportSection"
      ? entities?.find((e:Entity) => e?.uuid === (props.reportSection?.definition as any)["parentUuid"]) 
      : undefined;

  const currentListReportTargetEntityDefinition: EntityDefinition | undefined =
    entityDefinitions?.find((e: EntityDefinition) => e?.entityUuid === currentListReportTargetEntity?.uuid);

  if (props.reportData instanceof Domain2ElementFailed) { // never happens in normal flow
    throw new Error(`ReportSectionViewWithEditor: Error in report data: ${props.reportData}`);
  }

  const entityInstance = props.reportData && props.reportSection.type == "objectInstanceReportSection"
    ? props.reportData.reportData[props.reportSection.definition.fetchedDataReference ?? ""]
    : undefined;

  // helper to get active definition (if editing locally)
  const activeDefinition = isEditing && localEditedDefinition !== undefined ? localEditedDefinition : props.reportSection.definition;

  // Render icon bar (edit/save/cancel)
  const IconBar = () => (
    <div style={{ position: "absolute", top: 6, right: 6, zIndex: 10, display: "flex", gap: 6 }}>
      {!isEditing && props.editMode && (
        <ThemedIconButton
          title={props.isSectionModified ? "Section modified" : "Edit section"}
          onClick={() => {
            setLocalEditedDefinition(props.reportSection.definition);
            setIsEditing(true);
          }}
        >
          <EditIcon style={{ color: props.isSectionModified ? "darkred" : "grey" }} />
        </ThemedIconButton>
      )}
      {isEditing && (
        <>
          <ThemedIconButton
            title={hasValidationErrors ? "Cannot save - validation errors present" : "Save section"}
            onClick={() => {
              if (hasValidationErrors) {
                log.info("Save blocked due to validation errors");
                return;
              }
              try {
                const newDef = localEditedDefinition ?? props.reportSection.definition;
                props.onSectionEdit &&
                  props.onSectionEdit(props.sectionPath ?? "", {
                    ...props.reportSection,
                    definition: newDef,
                  });
                setIsEditing(false);
                setLocalEditedDefinition(undefined);
                setHasValidationErrors(false);
              } catch (e) {
                log.info("Save failed", e);
              }
            }}
            disabled={hasValidationErrors}
          >
            <SaveIcon style={{ color: hasValidationErrors ? "grey" : "green" }} />
          </ThemedIconButton>
          <ThemedIconButton
            title="Cancel"
            onClick={() => {
              setIsEditing(false);
              setLocalEditedDefinition(undefined);
              setHasValidationErrors(false);
              props.onSectionCancel && props.onSectionCancel(props.sectionPath ?? "");
            }}
          >
            <CloseIcon />
          </ThemedIconButton>
        </>
      )}
    </div>
  );

  // For grid/list sections, recurse using this wrapper so editor props propagate
  if (props.reportSection?.type === 'grid') {
    return (
      <div style={{ position: 'relative' }}>
        {/* {props.editMode && <IconBar />} */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {props.reportSection?.definition.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '16px', width: '100%' }}>
              {row.map((innerReportSection, colIndex) => (
                <div key={`${rowIndex}-${colIndex}`} style={{ minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <ReportSectionViewWithEditor
                    {...props}
                    reportSection={innerReportSection}
                    sectionPath={(props.sectionPath ?? '') + `/definition[${rowIndex}][${colIndex}]`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (props.reportSection?.type === 'list') {
    return (
      <>
      <span>ReportSectionViewEditor list</span>
        <div style={{ position: 'relative' }}>
          {/* {props.editMode && <IconBar />} */}
          {props.reportSection?.definition.map((innerReportSection, index) => (
            <div key={index} style={{ marginBottom: '2em', position: 'relative' }}>
              <ReportSectionViewWithEditor
                {...props}
                reportSection={innerReportSection}
                sectionPath={(props.sectionPath ?? '') + `/definition[${index}]`}
              />
            </div>
          ))}
        </div>
      </>
    );
  }

  // Leaf section types
  return (
    <>
      <code>
        ReportSectionViewEditor leaf: 
        editMode {JSON.stringify(props.editMode)}, 
        isEditing {JSON.stringify(isEditing)},
        {/* reportEntityDefinition {JSON.stringify(reportEntityDefinition)} */}
        props.reportDefinition {JSON.stringify(props.reportDefinition)}
      </code>
      <div style={{ position: "relative" }}>
        {props.editMode && <IconBar />}
        {showPerformanceDisplay && (
          <ThemedText style={{ fontSize: "12px", opacity: 0.6 }}>
            ReportSectionViewWithEditor renders: {navigationCount} (total: {totalCount})
          </ThemedText>
        )}
        {/* Task 4.1-4.11: Integrate TypedValueObjectEditor for section editing */}
        {isEditing && reportEntityDefinition && (
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

            {props.reportDefinition.definition && (
              <Accordion style={{ marginBottom: 12 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <div style={{ fontWeight: 500 }}>Runtime Environment (Read-Only)</div>
                </AccordionSummary>
                <AccordionDetails>
                  <TypedValueObjectEditor
                    labelElement={<span>Report Parameters</span>}
                    valueObject={props.reportDefinition.definition}
                    valueObjectMMLSchema={reportEntityDefinition?.jzodSchema?.definition?.definition}
                    deploymentUuid={props.deploymentUuid}
                    applicationSection={props.applicationSection}
                    formLabel="reportParameters"
                    onSubmit={async () => {}} // No-op for read-only
                    readonly={true}
                    maxRenderDepth={Infinity}
                  />
                </AccordionDetails>
              </Accordion>
            )}

            {/* Task 4.1-4.7, 4.10-4.11: TypedValueObjectEditor for section definition */}
            <TypedValueObjectEditor
              labelElement={<span>Section Definition</span>}
              valueObject={props.reportDefinition}
              valueObjectMMLSchema={reportEntityDefinition.jzodSchema}
              deploymentUuid={props.deploymentUuid}
              applicationSection={props.applicationSection}
              formLabel="reportSection"
              onSubmit={async (data: any) => {
                log.info("TypedValueObjectEditor onSubmit called", data);
                // Extract the edited section from the full report
                // The zoomInPath points to the section being edited
                const pathParts = (props.sectionPath ?? "").split("/").filter((p) => p);
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
                setLocalEditedDefinition(extractedSection);
                setHasValidationErrors(false);
              }}
              zoomInPath={`definition.section${props.sectionPath ? "/" + props.sectionPath : ""}`}
              maxRenderDepth={Infinity}
              readonly={false}
            />

            <div style={{ marginTop: 12, fontSize: "12px", color: "#666", fontStyle: "italic" }}>
              {hasValidationErrors
                ? "⚠️ Please fix validation errors before saving"
                : "✓ Valid - Click the save icon above to apply changes"}
            </div>
          </div>
        )}
        {props.reportSection.type == "objectListReportSection" && (
          <div>
            {(currentListReportTargetEntity && currentListReportTargetEntityDefinition) ||
            props.reportData ? (
              <ReportSectionListDisplay
                tableComponentReportType="EntityInstance"
                label={"EntityInstance-" + currentListReportTargetEntity?.name}
                defaultlabel={interpolateExpression(
                  props.reportSection.definition?.label,
                  props.reportData.reportData,
                  "report label"
                )}
                deploymentUuid={props.deploymentUuid}
                chosenApplicationSection={props.applicationSection as ApplicationSection}
                displayedDeploymentDefinition={displayedDeploymentDefinition}
                domainElementObject={props.reportData.reportData}
                fetchedDataJzodSchema={props.fetchedDataJzodSchema}
                section={props.reportSection}
                paramsAsdomainElements={props.paramsAsdomainElements}
              />
            ) : (
              <div>error on object list {JSON.stringify(currentListReportTargetEntity)}</div>
            )}
          </div>
        )}
        {props.reportSection.type == "objectInstanceReportSection" && (
          <ReportSectionEntityInstance
            domainElement={props.reportData}
            instance={entityInstance}
            applicationSection={props.applicationSection as ApplicationSection}
            deploymentUuid={props.deploymentUuid}
            entityUuid={props.reportSection.definition.parentUuid}
          />
        )}
        {props.reportSection.type == "graphReportSection" && (
          <div>
            {/* reuse GraphReportSectionView if available via ReportSectionView in original component */}
            <div>Graph rendering not modified by editor wrapper</div>
          </div>
        )}
        {props.reportSection.type == "markdownReportSection" && (
          <ReportSectionMarkdown
            applicationSection={props.applicationSection}
            deploymentUuid={props.deploymentUuid}
            reportSection={{ ...props.reportSection, definition: activeDefinition }}
            label={props.reportSection.definition.label}
            showPerformanceDisplay={props.showPerformanceDisplay}
          />
        )}
      </div>
    </>
  );
};

export default ReportSectionViewWithEditor;
