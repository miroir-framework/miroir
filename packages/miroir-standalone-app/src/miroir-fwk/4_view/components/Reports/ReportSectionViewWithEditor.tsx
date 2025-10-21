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
  RootReport,
  Uuid,
  Domain2QueryReturnType,
  Domain2ElementFailed,
  interpolateExpression
} from "miroir-core";

import { deployments, packageName } from '../../../../constants.js';
import { useMiroirContextService } from '../../MiroirContextReactProvider.js';
import { cleanLevel } from '../../constants.js';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance.js';
import { ReportSectionListDisplay } from './ReportSectionListDisplay.js';
import { ReportSectionMarkdown } from './ReportSectionMarkdown.js';
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { ThemedBox, ThemedText, ThemedIconButton } from '../Themes/index.js';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

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
  rootReport: RootReport,
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
    <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, display: 'flex', gap: 6 }}>
      {!isEditing && props.editMode && (
        <ThemedIconButton title={props.isSectionModified ? 'Section modified' : 'Edit section'} onClick={() => { setLocalEditedDefinition(props.reportSection.definition); setIsEditing(true); }}>
          <EditIcon style={{ color: props.isSectionModified ? 'darkred' : 'grey' }} />
        </ThemedIconButton>
      )}
      {isEditing && (
        <>
          <ThemedIconButton title="Save section" onClick={() => {
            try {
              const newDef = localEditedDefinition ?? props.reportSection.definition;
              props.onSectionEdit && props.onSectionEdit(props.sectionPath ?? '', { ...props.reportSection, definition: newDef });
              setIsEditing(false);
            } catch (e) {
              log.info('Save failed', e);
            }
          }}>
            <SaveIcon style={{ color: 'green' }} />
          </ThemedIconButton>
          <ThemedIconButton title="Cancel" onClick={() => {
            setIsEditing(false);
            setLocalEditedDefinition(undefined);
            props.onSectionCancel && props.onSectionCancel(props.sectionPath ?? '');
          }}>
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
        {props.editMode && <IconBar />}
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
      <div style={{ position: 'relative' }}>
        {props.editMode && <IconBar />}
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
    );
  }

  // Leaf section types
  return (
    <div style={{ position: 'relative' }}>
      {props.editMode && <IconBar />}
      {showPerformanceDisplay && (
        <ThemedText style={{ fontSize: '12px', opacity: 0.6 }}>ReportSectionViewWithEditor renders: {navigationCount} (total: {totalCount})</ThemedText>
      )}
      {props.reportSection.type == 'objectListReportSection' && (
        <div>
          {(currentListReportTargetEntity && currentListReportTargetEntityDefinition) || props.reportData ? (
            <ReportSectionListDisplay
              tableComponentReportType="EntityInstance"
              label={"EntityInstance-" + currentListReportTargetEntity?.name}
              defaultlabel={interpolateExpression(props.reportSection.definition?.label, props.reportData.reportData, "report label")}
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
      {props.reportSection.type == 'objectInstanceReportSection' && (
        <ReportSectionEntityInstance
          domainElement={props.reportData}
          instance={entityInstance}
          applicationSection={props.applicationSection as ApplicationSection}
          deploymentUuid={props.deploymentUuid}
          entityUuid={props.reportSection.definition.parentUuid}
        />
      )}
      {props.reportSection.type == 'graphReportSection' && (
        <div>
          {/* reuse GraphReportSectionView if available via ReportSectionView in original component */}
          <div>Graph rendering not modified by editor wrapper</div>
        </div>
      )}
      {props.reportSection.type == 'markdownReportSection' && (
        <ReportSectionMarkdown
          applicationSection={props.applicationSection}
          deploymentUuid={props.deploymentUuid}
          reportSection={{ ...props.reportSection, definition: activeDefinition }}
          label={props.reportSection.definition.label}
          showPerformanceDisplay={props.showPerformanceDisplay}
        />
      )}

      {/* Inline simple JSON editor for the section when editing: lightweight placeholder until TypedValueObjectEditor integration (task 4.0) */}
      {isEditing && (
        <div style={{ marginTop: 12, border: '1px dashed #ccc', padding: 8, borderRadius: 4 }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Inline section editor (JSON)</div>
          <textarea
            value={JSON.stringify(localEditedDefinition ?? props.reportSection.definition, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setLocalEditedDefinition(parsed);
              } catch (err) {
                // keep raw text until valid JSON
                setLocalEditedDefinition(e.target.value as any);
              }
            }}
            style={{ width: '100%', minHeight: 200, fontFamily: 'monospace' }}
          />
        </div>
      )}
    </div>
  );
};

export default ReportSectionViewWithEditor;
