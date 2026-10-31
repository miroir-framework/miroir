export {
  entitiesToMermaidClassDiagram,
  metaModelToMermaidClassDiagram,
  extractClassInfo,
  extractRelationships,
  buildEntityUuidToNameMap,
  buildEntityClickLinks,
  buildEntityVersionClickLinks,
  coerceDiagramCarriersToEntities,
  mlTypeToUml,
  sanitiseMermaidId,
  type ClassDiagramOptions,
  type ClassInfo,
  type AttributeInfo,
  type RelationshipInfo,
  type MlAttributeEntry,
  type MermaidDiagramEntity,
  type DiagramCarrierMode,
} from "./2_domain/entitiesToMermaidClassDiagram.js";

export {
  entitiesToMermaidErDiagram,
  type ErDiagramOptions,
} from "./2_domain/entitiesToMermaidErDiagram.js";

// React component (requires react, @mui/material, miroir-react as peer dependencies)
export { MermaidClassDiagram, type MermaidClassDiagramProps } from "./4_view/MermaidClassDiagram.js";
// The model diagram report section (#633 D3): registered by the client as `modelDiagramReportSection`.
export {
  ModelDiagramReportSectionView,
  type ModelDiagramReportSectionViewProps,
} from "./4_view/ModelDiagramReportSectionView.js";
