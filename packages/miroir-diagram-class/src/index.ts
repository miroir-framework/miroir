export {
  entityDefinitionsToMermaidClassDiagram,
  metaModelToMermaidClassDiagram,
  extractClassInfo,
  extractRelationships,
  buildEntityUuidToNameMap,
  jzodTypeToUml,
  sanitiseMermaidId,
  type ClassDiagramOptions,
  type ClassInfo,
  type AttributeInfo,
  type RelationshipInfo,
  type JzodAttributeEntry,
} from "./2_domain/entityDefinitionsToMermaidClassDiagram.js";

// React component (requires react, @mui/material, miroir-react as peer dependencies)
export { MermaidClassDiagram, type MermaidClassDiagramProps } from "./4_view/MermaidClassDiagram.js";
