/**
 * Domain library for generating Mermaid Entity-Relation (ER) diagrams from
 * Miroir EntityDefinitions.
 *
 * This module is a side-effect-free, pure-function library (layer 2 – domain)
 * that converts a list of EntityDefinitions into a Mermaid `erDiagram` string.
 *
 * Intentionally kept separate from the class-diagram generator so the two
 * rendering modes can evolve independently.
 */

import type { EntityDefinition } from "miroir-core";
import { sanitiseMermaidId } from "./entityDefinitionsToMermaidClassDiagram.js";

// ############################################################################
// Types
// ############################################################################

/** Options to customise the ER diagram output. */
export interface ErDiagramOptions {
  /**
   * When true, standard infrastructure attributes (uuid, parentName,
   * parentUuid, parentDefinitionVersionUuid, conceptLevel) are shown.
   * @default false
   */
  showInfrastructureAttributes?: boolean;

  /** When true, the diagram title directive is emitted. */
  showTitle?: boolean;

  /** Title text when `showTitle` is true. */
  title?: string;

  /**
   * When provided, makes entity nodes clickable in the diagram.
   * Maps from sanitised entity name to the entity-definition UUID passed to
   * the `onClassClick` handler in the rendering component.
   *
   * Use `buildEntityDefinitionClickLinks` to build this map.
   */
  classClickLinks?: Record<string, string>;
}

// ############################################################################
// Constants
// ############################################################################

/** Standard infrastructure attribute names to hide by default. */
const INFRASTRUCTURE_ATTRIBUTES = new Set([
  "uuid",
  "parentName",
  "parentUuid",
  "parentDefinitionVersionUuid",
  "conceptLevel",
]);

// ############################################################################
// Main entry – ER diagram generation
// ############################################################################

/**
 * Generate a Mermaid erDiagram string from a list of EntityDefinitions.
 *
 * Each entity becomes an ER entity block with its non-FK attributes listed;
 * FK attributes are shown inside the entity block with the `FK` keyword AND
 * produce a relationship line between the two entities.
 *
 * @param entityDefinitions - The entity definitions to render.
 * @param options - Optional formatting / display options.
 * @returns A Mermaid erDiagram string ready for rendering.
 */
export function entityDefinitionsToMermaidErDiagram(
  entityDefinitions: EntityDefinition[],
  options: ErDiagramOptions = {},
): string {
  const showInfra = options.showInfrastructureAttributes ?? false;

  // Build entity UUID → sanitised name map for relationship resolution
  const entityUuidToSanitisedName: Record<string, string> = {};
  for (const ed of entityDefinitions) {
    entityUuidToSanitisedName[ed.entityUuid] = sanitiseMermaidId(ed.name);
  }

  const lines: string[] = [];

  // Optional title front-matter
  if (options.showTitle && options.title) {
    lines.push("---");
    lines.push(`title: ${options.title}`);
    lines.push("---");
  }

  lines.push("erDiagram");

  if (entityDefinitions.length === 0) {
    return lines.join("\n");
  }

  lines.push("");

  const relationships: string[] = [];

  for (const ed of entityDefinitions) {
    const entityId = sanitiseMermaidId(ed.name);
    const definition = (ed.mlSchema as any)?.definition ?? {};

    lines.push(`  ${entityId} {`);

    for (const [attrName, attrSchema] of Object.entries(definition)) {
      const attr = attrSchema as any;
      if (!showInfra && INFRASTRUCTURE_ATTRIBUTES.has(attrName)) continue;

      const attrType = attr.type ?? "string";
      const sanitisedAttrName = sanitiseMermaidId(attrName);
      const isForeignKey = !!attr.tag?.value?.foreignKeyParams?.targetEntity;
      const fkMarker = isForeignKey ? " FK" : "";

      lines.push(`    ${attrType} ${sanitisedAttrName}${fkMarker}`);

      // Collect relationship line for FK attributes
      if (isForeignKey) {
        const targetUuid: string = attr.tag.value.foreignKeyParams.targetEntity;
        const targetId = entityUuidToSanitisedName[targetUuid];
        if (targetId) {
          // Left-side cardinality: many required (}|) or many optional (}o)
          const isOptional: boolean = attr.optional ?? false;
          const leftCard = isOptional ? "}o" : "}|";
          relationships.push(
            `  ${entityId} ${leftCard}--|| ${targetId} : "${sanitisedAttrName}"`,
          );
        }
      }
    }

    lines.push("  }");
    lines.push("");
  }

  // Relationships
  for (const rel of relationships) {
    lines.push(rel);
  }

  // NOTE: Mermaid's erDiagram parser does not support `click … call` directives
  // (those are classDiagram-only).  Clickability for ER mode is handled in the
  // rendering component by attaching DOM event listeners after the SVG is in
  // the real DOM, using classClickLinks for the UUID lookup.

  return lines.join("\n");
}
