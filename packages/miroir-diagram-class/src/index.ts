export {
  entitiesToMermaidClassDiagram,
  metaModelToMermaidClassDiagram,
  extractClassInfo,
  extractRelationships,
  buildEntityUuidToNameMap,
  buildEntityClickLinks,
  coerceDiagramCarriersToEntities,
  jzodTypeToUml,
  sanitiseMermaidId,
  type ClassDiagramOptions,
  type ClassInfo,
  type AttributeInfo,
  type RelationshipInfo,
  type JzodAttributeEntry,
  type MermaidDiagramEntity,
} from "./2_domain/entitiesToMermaidClassDiagram.js";

export {
  entitiesToMermaidErDiagram,
  type ErDiagramOptions,
} from "./2_domain/entitiesToMermaidErDiagram.js";

// React component (requires react, @mui/material, miroir-react as peer dependencies)
export { MermaidClassDiagram, type MermaidClassDiagramProps } from "./4_view/MermaidClassDiagram.js";
