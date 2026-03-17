import React, { useMemo } from "react";

import {
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  type EntityDefinition,
} from "miroir-core";
import { buildEntityDefinitionClickLinks, MermaidClassDiagram } from "miroir-diagram-class";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useRenderTracker } from "../../tools/renderCountTracker.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ModelDiagramReportSectionView"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Props
// ################################################################################################

export interface ModelDiagramReportSectionViewProps {
  /** Resolved array of entity-like objects (either EntityDefinition[] or {name, mlSchema}[]). */
  entityDefinitions: any[];
  /** Optional section label (displayed as a heading above the diagram). */
  label?: string;
  /** Optional diagram title embedded in the Mermaid header. */
  title?: string;
  /** Mermaid direction. Defaults to auto-computed based on entity count. */
  direction?: "TB" | "BT" | "LR" | "RL";
  /** CSS height for the diagram container. Defaults to "calc(100vh - 300px)". */
  height?: string;
  /**
   * Called when a class node is clicked.
   * Receives the entity-definition UUID (or name if no UUID is available).
   */
  onClassClick?: (entityDefUuid: string) => void;
  showPerformanceDisplay?: boolean;
  applicationSection?: ApplicationSection;
  deploymentUuid?: string;
}

// ################################################################################################
// Component
// ################################################################################################

export const ModelDiagramReportSectionView: React.FC<ModelDiagramReportSectionViewProps> = (
  props
) => {
  const currentNavigationKey = `${props.deploymentUuid ?? "none"}-${props.applicationSection ?? "none"}`;
  const { navigationCount, totalCount } = useRenderTracker(
    "ModelDiagramReportSectionView",
    currentNavigationKey
  );

  const entityDefinitions: EntityDefinition[] = useMemo(() => {
    if (!Array.isArray(props.entityDefinitions)) return [];
    return props.entityDefinitions as EntityDefinition[];
  }, [props.entityDefinitions]);

  const direction = props.direction ?? (entityDefinitions.length > 10 ? "TB" : "LR");

  const height = props.height ?? "calc(100vh - 300px)";

  const classClickLinks = useMemo(
    () => (props.onClassClick ? buildEntityDefinitionClickLinks(entityDefinitions) : undefined),
    [entityDefinitions, props.onClassClick]
  );

  return (
    <div>
      {props.showPerformanceDisplay && (
        <div style={{ fontSize: "12px", opacity: 0.6 }}>
          ModelDiagramReportSectionView renders: {navigationCount} (total: {totalCount})
        </div>
      )}
      <MermaidClassDiagram
        entityDefinitions={entityDefinitions}
        options={{
          title: props.title,
          direction,
          classClickLinks,
        }}
        onClassClick={props.onClassClick}
        height={height}
      />
    </div>
  );
};

export default ModelDiagramReportSectionView;
