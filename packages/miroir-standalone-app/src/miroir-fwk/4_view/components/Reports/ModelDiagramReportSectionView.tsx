import React, { useMemo } from "react";

import {
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  type Entity,
  type EntityVersion,
} from "miroir-core";
import {
  buildEntityClickLinks,
  MermaidClassDiagram,
  presentEntitiesAsDiagramCarriers,
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
   * Present-model Entities (#217 Phase 9). When provided with mlSchema, preferred over
   * `entityDefinitions` for diagram generation and click navigation.
   */
  entities?: Entity[];
  /**
   * Legacy / report-transformer EntityVersion carriers (or Entity-projected ED shape).
   * Used when `entities` is absent or incomplete.
   */
  entityDefinitions?: any[];
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

  const diagramCarriers: EntityVersion[] = useMemo(() => {
    const fromEntities = presentEntitiesAsDiagramCarriers(props.entities ?? []);
    if (fromEntities.length > 0) {
      return fromEntities;
    }
    if (!Array.isArray(props.entityDefinitions)) return [];
    return props.entityDefinitions as EntityVersion[];
  }, [props.entities, props.entityDefinitions]);

  const direction = props.direction ?? (diagramCarriers.length > 10 ? "TB" : "LR");

  const height = props.height ?? "calc(100vh - 300px)";

  const classClickLinks = useMemo(() => {
    if (!props.onClassClick) return undefined;
    return buildEntityClickLinks(
      diagramCarriers.map((carrier) => ({
        name: carrier.name,
        uuid: carrier.entityUuid ?? carrier.uuid,
      })),
    );
  }, [diagramCarriers, props.onClassClick]);

  return (
    <div>
      <RenderInsightHeader
        componentName="ModelDiagramReportSectionView"
        navigationCount={navigationCount}
        totalCount={totalCount}
      />
      <MermaidClassDiagram
        entityDefinitions={diagramCarriers}
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
