import React, { useMemo } from "react";

import {
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  type Entity,
} from "miroir-core";
import {
  buildEntityClickLinks,
  MermaidClassDiagram,
} from "miroir-diagram-class";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { RenderInsightHeader } from "../RenderInsightHeader.js";
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
  /**
   * Present-model Entities whose `mlSchema` drives the Mermaid diagram (#217 / #221).
   */
  entities: Entity[];
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
   * Receives the Entity UUID (present-model identity).
   */
  onClassClick?: (entityUuid: string) => void;
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

  const entitiesWithSchema: Entity[] = useMemo(
    () => (props.entities ?? []).filter((entity) => !!entity.mlSchema),
    [props.entities],
  );

  const direction = props.direction ?? (entitiesWithSchema.length > 10 ? "TB" : "LR");

  const height = props.height ?? "calc(100vh - 300px)";

  const classClickLinks = useMemo(() => {
    if (!props.onClassClick) return undefined;
    return buildEntityClickLinks(entitiesWithSchema);
  }, [entitiesWithSchema, props.onClassClick]);

  return (
    <div>
      <RenderInsightHeader
        componentName="ModelDiagramReportSectionView"
        navigationCount={navigationCount}
        totalCount={totalCount}
      />
      <MermaidClassDiagram
        entities={entitiesWithSchema}
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
