/**
 * Domain library for generating Mermaid class diagrams from Miroir EntityDefinitions.
 *
 * This module is a side-effect-free, pure-function library (layer 2 – domain)
 * that converts a list of EntityDefinitions into a Mermaid classDiagram string.
 *
 * Key design decisions:
 * - Standard ("infrastructure") attributes like uuid, parentName, parentUuid,
 *   parentDefinitionVersionUuid, and conceptLevel are hidden by default so the
 *   diagram focuses on domain-specific attributes.
 * - Foreign-key relationships extracted from `tag.value.foreignKeyParams` are
 *   rendered as UML associations.
 * - A configureable options object lets callers tweak visibility, colors, and
 *   direction.
 */

import type { EntityDefinition, Entity } from "miroir-core";

// ############################################################################
// Types
// ############################################################################

/** Jzod schema attribute entry as found inside `mlSchema.definition`. */
export interface JzodAttributeEntry {
  type: string;
  optional?: boolean;
  tag?: {
    value?: {
      id?: number;
      defaultLabel?: string;
      display?: { editable?: boolean; modifiable?: boolean };
      foreignKeyParams?: {
        targetEntity: string; // UUID of the target Entity
        targetEntityOrderInstancesBy?: string;
      };
      initializeTo?: unknown;
    };
  };
  definition?: unknown;
}

/** Data about one class (entity) in the diagram. */
export interface ClassInfo {
  name: string;
  entityUuid: string;
  description?: string;
  attributes: AttributeInfo[];
}

/** Data about one attribute inside a class. */
export interface AttributeInfo {
  name: string;
  type: string;
  optional: boolean;
  label?: string;
  isForeignKey: boolean;
  targetEntityUuid?: string;
}

/** Relationship between two classes (derived from foreign keys). */
export interface RelationshipInfo {
  sourceClass: string;
  targetClass: string;
  attributeName: string;
  label?: string;
  /** Whether the FK attribute is optional (changes cardinality rendering). */
  optional: boolean;
}

/** Options to customise the diagram output. */
export interface ClassDiagramOptions {
  /**
   * Mermaid graph direction.  Valid values: "TB" | "BT" | "LR" | "RL".
   * @default "TB"
   */
  direction?: "TB" | "BT" | "LR" | "RL";

  /**
   * When true, standard infrastructure attributes (uuid, parentName,
   * parentUuid, parentDefinitionVersionUuid, conceptLevel) are shown.
   * @default false
   */
  showInfrastructureAttributes?: boolean;

  /**
   * Optional CSS-class colour mapping applied via `classDef` directives.
   * Keys are Mermaid class-def names, values are `{ fill, stroke?, color? }`.
   */
  classColors?: Record<string, { fill: string; stroke?: string; color?: string }>;

  /**
   * Map entity names to specific Mermaid classDef names (from classColors).
   * This lets callers colour individual entities.
   */
  entityColorAssignment?: Record<string, string>;

  /** When true, attribute labels (defaultLabel) are shown as comments. */
  showAttributeLabels?: boolean;

  /** When true, the diagram title directive is emitted. */
  showTitle?: boolean;

  /** Title text when `showTitle` is true. */
  title?: string;
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
// Helpers – Pure functions
// ############################################################################

/**
 * Map a Jzod type string to a UML-friendly type string.
 */
export function jzodTypeToUml(jzodType: string): string {
  switch (jzodType) {
    case "uuid":
      return "UUID";
    case "string":
      return "String";
    case "number":
      return "Number";
    case "boolean":
      return "Boolean";
    case "date":
      return "Date";
    case "enum":
      return "Enum";
    case "object":
      return "Object";
    case "array":
      return "Array";
    default:
      return jzodType;
  }
}

/**
 * Build an entity-UUID → entity-name lookup from the entityDefinitions list.
 * Uses the `entityUuid` field on each definition.
 */
export function buildEntityUuidToNameMap(
  entityDefinitions: EntityDefinition[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const ed of entityDefinitions) {
    map[ed.entityUuid] = ed.name;
  }
  return map;
}

/**
 * Sanitise a name so Mermaid accepts it as an identifier.
 * Replaces characters that are not alphanumeric or underscore with `_`.
 */
export function sanitiseMermaidId(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Extract structured class information from an EntityDefinition.
 */
export function extractClassInfo(
  entityDefinition: EntityDefinition,
  options: ClassDiagramOptions = {},
): ClassInfo {
  const showInfra = options.showInfrastructureAttributes ?? false;
  const definition = entityDefinition.mlSchema?.definition ?? {};

  const attributes: AttributeInfo[] = [];

  for (const [attrName, attrSchema] of Object.entries(definition)) {
    const attr = attrSchema as JzodAttributeEntry;

    // Optionally skip infrastructure attributes
    if (!showInfra && INFRASTRUCTURE_ATTRIBUTES.has(attrName)) {
      continue;
    }

    const isForeignKey = !!attr.tag?.value?.foreignKeyParams?.targetEntity;
    const targetEntityUuid = attr.tag?.value?.foreignKeyParams?.targetEntity;

    attributes.push({
      name: attrName,
      type: attr.type,
      optional: attr.optional ?? false,
      label: attr.tag?.value?.defaultLabel,
      isForeignKey,
      targetEntityUuid,
    });
  }

  return {
    name: entityDefinition.name,
    entityUuid: entityDefinition.entityUuid,
    description: entityDefinition.description,
    attributes,
  };
}

/**
 * Extract all relationships (foreign keys) across all entity definitions.
 */
export function extractRelationships(
  classes: ClassInfo[],
  entityUuidToName: Record<string, string>,
): RelationshipInfo[] {
  const relationships: RelationshipInfo[] = [];

  for (const cls of classes) {
    for (const attr of cls.attributes) {
      if (attr.isForeignKey && attr.targetEntityUuid) {
        const targetName = entityUuidToName[attr.targetEntityUuid];
        if (targetName) {
          relationships.push({
            sourceClass: cls.name,
            targetClass: targetName,
            attributeName: attr.name,
            label: attr.label,
            optional: attr.optional,
          });
        }
      }
    }
  }

  return relationships;
}

// ############################################################################
// Main entry – diagram generation
// ############################################################################

/**
 * Generate a Mermaid class-diagram string from a list of EntityDefinitions.
 *
 * @param entityDefinitions - The entity definitions to render.
 * @param options - Optional formatting / display options.
 * @returns A Mermaid classDiagram string ready for rendering.
 */
export function entityDefinitionsToMermaidClassDiagram(
  entityDefinitions: EntityDefinition[],
  options: ClassDiagramOptions = {},
): string {
  const direction = options.direction ?? "TB";
  const showLabels = options.showAttributeLabels ?? false;

  // 1. Build entity UUID → name map
  const entityUuidToName = buildEntityUuidToNameMap(entityDefinitions);

  // 2. Extract class info for each entity
  const classes = entityDefinitions.map((ed) => extractClassInfo(ed, options));

  // 3. Extract relationships
  const relationships = extractRelationships(classes, entityUuidToName);

  // 4. Build the Mermaid string
  const lines: string[] = [];

  // Header
  if (options.showTitle && options.title) {
    lines.push("---");
    lines.push(`title: ${options.title}`);
    lines.push("---");
  }
  lines.push("classDiagram");
  lines.push(`  direction ${direction}`);
  lines.push("");

  // Class definitions
  for (const cls of classes) {
    const id = sanitiseMermaidId(cls.name);
    lines.push(`  class ${id} {`);

    for (const attr of cls.attributes) {
      // Skip FK attributes in the class body – they are shown as associations
      if (attr.isForeignKey) {
        continue;
      }

      const umlType = jzodTypeToUml(attr.type);
      const sanitisedName = sanitiseMermaidId(attr.name);
      const optionalMark = attr.optional ? "?" : "";
      const labelComment = showLabels && attr.label ? `  %% ${attr.label}` : "";
      lines.push(`    +${umlType} ${sanitisedName}${optionalMark}${labelComment}`);
    }

    lines.push("  }");
    lines.push("");
  }

  // Relationships
  for (const rel of relationships) {
    const sourceId = sanitiseMermaidId(rel.sourceClass);
    const targetId = sanitiseMermaidId(rel.targetClass);
    // Many-to-one: many sources can reference one target
    // Optional FK → "0..1", required FK → "1"
    const targetCardinality = rel.optional ? '"0..1"' : '"1"';
    const label = rel.attributeName;
    lines.push(`  ${sourceId} "*" --> ${targetCardinality} ${targetId} : ${label}`);
  }

  // classDef colour directives
  if (options.classColors) {
    lines.push("");
    for (const [defName, colors] of Object.entries(options.classColors)) {
      const parts = [`fill:${colors.fill}`];
      if (colors.stroke) parts.push(`stroke:${colors.stroke}`);
      if (colors.color) parts.push(`color:${colors.color}`);
      lines.push(`  classDef ${defName} ${parts.join(",")}`);
    }
  }

  // Apply colour assignments
  if (options.entityColorAssignment) {
    for (const [entityName, defName] of Object.entries(options.entityColorAssignment)) {
      const id = sanitiseMermaidId(entityName);
      lines.push(`  class ${id} ${defName}`);
    }
  }

  return lines.join("\n");
}

/**
 * Convenience: generate a class diagram from a MetaModel-like structure
 * that contains both `entities` and `entityDefinitions`.
 */
export function metaModelToMermaidClassDiagram(
  metaModel: { entities: Entity[]; entityDefinitions: EntityDefinition[] },
  options: ClassDiagramOptions = {},
): string {
  return entityDefinitionsToMermaidClassDiagram(metaModel.entityDefinitions, options);
}
