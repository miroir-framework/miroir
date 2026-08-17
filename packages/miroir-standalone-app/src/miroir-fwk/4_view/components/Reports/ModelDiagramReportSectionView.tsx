import React, { useMemo } from "react";

import {
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  type Entity,
} from "miroir-core";
import {
  buildEntityClickLinks,
  buildEntityVersionClickLinks,
  coerceDiagramCarriersToEntities,
  MermaidClassDiagram,
  type DiagramCarrierMode,
} from "miroir-diagram-class";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { RenderInsightHeader } from "../RenderInsightHeader.js";
import { useRenderTracker } from "../../tools/renderCountTracker.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ModelDiagramReportSectionView");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Props
// ################################################################################################

export interface ModelDiagramReportSectionViewProps {
  /**
   * Carriers with `mlSchema` (present-model Entities, or EntityVersion snapshots).
   * Mode controls class identity and click-link UUIDs.
   */
  entities: Array<Entity | Record<string, any>>;
  /**
   * Entity: click → Entity details (carrier.uuid = Entity.uuid).
   * EntityVersion: geometry uses entityUuid; click → EntityVersion details (carrier.uuid).
   * @default "Entity"
   */
  mode?: DiagramCarrierMode;
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
   * Receives Entity.uuid (Entity mode) or EntityVersion.uuid (EntityVersion mode).
   */
  onClassClick?: (instanceUuid: string) => void;
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

  const mode: DiagramCarrierMode = props.mode ?? "Entity";

  const diagramEntities = useMemo(
    () => coerceDiagramCarriersToEntities((props.entities ?? []) as Array<Record<string, any>>, mode),
    [props.entities, mode],
  );

  const direction = props.direction ?? (diagramEntities.length > 10 ? "TB" : "LR");

  const height = props.height ?? "calc(100vh - 300px)";

  const classClickLinks = useMemo(() => {
    if (!props.onClassClick) return undefined;
    if (mode === "EntityVersion") {
      return buildEntityVersionClickLinks(
        ((props.entities ?? []) as Array<Record<string, any>>)
          .filter((c) => !!c?.uuid && !!c?.name)
          .map((c) => ({ uuid: String(c.uuid), name: String(c.name) })),
      );
    }
    return buildEntityClickLinks(diagramEntities);
  }, [props.entities, diagramEntities, mode, props.onClassClick]);

  if (props.label) {
    log.debug("Rendering model diagram section", {
      label: props.label,
      mode,
      carrierCount: (props.entities ?? []).length,
      diagramCount: diagramEntities.length,
    });
  }

  return (
    <div>
      <RenderInsightHeader
        componentName="ModelDiagramReportSectionView"
        navigationCount={navigationCount}
        totalCount={totalCount}
      />
      {props.label ? <h3>{props.label}</h3> : null}
      <MermaidClassDiagram
        entities={diagramEntities}
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
