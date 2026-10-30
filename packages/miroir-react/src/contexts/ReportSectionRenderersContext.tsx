import { createContext, useContext, type ComponentType, type ReactNode } from "react";

import type {
  ApplicationDeploymentMap,
  ApplicationSection,
  Domain2QueryReturnType,
  Entity,
  GraphReportSection,
  Uuid,
} from "miroir-core";

// ################################################################################################
// Report section kinds whose renderer the application provides (#13 Q3-a).
// miroir-react renders every other section kind itself. These four need code that miroir-react
// does not depend on: d3 (graph), miroir-diagram-class (model diagram, which depends on
// miroir-react), miroir-mcp (runners) and the MiroirTest runtime of the application.
// ################################################################################################

export interface GraphReportSectionRendererProps {
  applicationSection: ApplicationSection;
  deploymentUuid: Uuid;
  queryResults: Domain2QueryReturnType<Record<string, any>>;
  reportSection: GraphReportSection;
  showPerformanceDisplay?: boolean;
}

export interface ModelDiagramReportSectionRendererProps {
  entities: Array<Entity | Record<string, any>>;
  mode?: "Entity" | "EntityVersion";
  label?: string;
  title?: string;
  direction?: "TB" | "BT" | "LR" | "RL";
  onClassClick?: (instanceUuid: string) => void;
  showPerformanceDisplay?: boolean;
  applicationSection?: ApplicationSection;
  deploymentUuid?: Uuid;
}

export interface StoredRunnerRendererProps {
  applicationUuid: Uuid;
  applicationDeploymentMap?: ApplicationDeploymentMap;
  runnerUuid: Uuid;
}

export interface MiroirTestReportSectionRendererProps {
  reportName: string;
  reportSectionPath?: (string | number)[];
  showPerformanceDisplay?: boolean;
}

export interface ReportSectionRenderers {
  graphReportSection?: ComponentType<GraphReportSectionRendererProps>;
  modelDiagramReportSection?: ComponentType<ModelDiagramReportSectionRendererProps>;
  /** `runnerReportSection` with `runnerReportSectionType: "storedRunner"` */
  storedRunner?: ComponentType<StoredRunnerRendererProps>;
  miroirTestReportSection?: ComponentType<MiroirTestReportSectionRendererProps>;
}

const ReportSectionRenderersContext = createContext<ReportSectionRenderers>({});

export function ReportSectionRenderersProvider(props: {
  renderers: ReportSectionRenderers;
  children?: ReactNode;
}) {
  return (
    <ReportSectionRenderersContext.Provider value={props.renderers}>
      {props.children}
    </ReportSectionRenderersContext.Provider>
  );
}

export function useReportSectionRenderers(): ReportSectionRenderers {
  return useContext(ReportSectionRenderersContext);
}

/** Shown in place of a section kind that the application registered no renderer for. */
export function UnsupportedReportSection(props: { sectionType: string }) {
  return (
    <div data-testid="unsupported-report-section">
      No renderer for report sections of type {props.sectionType} in this application.
    </div>
  );
}
