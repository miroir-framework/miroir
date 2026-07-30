/**
 * Domain library for generating Mermaid class diagrams from Miroir Entities
 * (present-model `mlSchema`).
 *
 * Side-effect-free pure functions (layer 2 – domain).
 */

import type { Entity } from "miroir-core";

// ############################################################################
// Types
// ############################################################################

/** Minimal Entity shape required for Mermaid diagram generation. */
export type MermaidDiagramEntity = Pick<Entity, "uuid" | "name" | "description" | "mlSchema">

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

  /**
   * When provided, makes entity classes clickable in the diagram.
   * Maps from sanitised entity name (Mermaid class identifier) to the Entity
   * UUID passed to the `onClassClick` handler.
   *
   * Use `buildEntityClickLinks` to build this map from Entities.
   *
   * Generates Mermaid `click ClassName call miroirDiagramClassClick()` directives.
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
 * Build an entity-UUID → entity-name lookup from Entities.
 */
export function buildEntityUuidToNameMap(
  entities: MermaidDiagramEntity[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const entity of entities) {
    map[entity.uuid] = entity.name;
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
 * Map sanitised entity name → Entity UUID for diagram click navigation
 * to Entity detail reports (present-model authority).
 */
export function buildEntityClickLinks(
  entities: Array<Pick<Entity, "uuid" | "name">>,
): Record<string, string> {
  const links: Record<string, string> = {};
  for (const entity of entities) {
    links[sanitiseMermaidId(entity.name)] = entity.uuid;
  }
  return links;
}

/**
 * Diagram carrier mode:
 * - Entity: class identity / click UUID = Entity.uuid (present model)
 * - EntityVersion: class identity = entityUuid (for FK matching); click UUID =
 *   EntityVersion.uuid (historical snapshot details report)
 */
export type DiagramCarrierMode = "Entity" | "EntityVersion";

/**
 * Coerce Entity / EntityVersion-shaped carriers (must have `mlSchema`) into
 * Mermaid Entity carriers.
 *
 * EntityVersion mode uses `entityUuid` as the class identity so FK
 * `targetEntity` edges resolve; pair with {@link buildEntityVersionClickLinks}
 * so clicks still navigate to the EntityVersion instance.
 */
export function coerceDiagramCarriersToEntities(
  carriers: Array<Record<string, any>>,
  mode: DiagramCarrierMode = "Entity",
): MermaidDiagramEntity[] {
  return carriers
    .filter((carrier) => !!carrier?.mlSchema && !!(carrier.uuid ?? carrier.entityUuid))
    .map((carrier) => {
      const classUuid =
        mode === "EntityVersion"
          ? String(carrier.entityUuid ?? carrier.uuid)
          : String(carrier.uuid ?? carrier.entityUuid);
      return {
        uuid: classUuid,
        name: String(carrier.name ?? ""),
        mlSchema: carrier.mlSchema,
        ...(carrier.description !== undefined
          ? { description: String(carrier.description) }
          : {}),
      };
    });
}

/**
 * Map sanitised class name → EntityVersion instance uuid for
 * EntityVersionDetails navigation.
 */
export function buildEntityVersionClickLinks(
  entityVersions: Array<{ uuid: string; name: string }>,
): Record<string, string> {
  return buildEntityClickLinks(entityVersions);
}

/**
 * Extract structured class information from an Entity (via `mlSchema`).
 */
export function extractClassInfo(
  entity: MermaidDiagramEntity,
  options: ClassDiagramOptions = {},
): ClassInfo {
  const showInfra = options.showInfrastructureAttributes ?? false;
  const definition = entity.mlSchema?.definition ?? {};

  const attributes: AttributeInfo[] = [];

  for (const [attrName, attrSchema] of Object.entries(definition)) {
    const attr = attrSchema as JzodAttributeEntry;

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
    name: entity.name,
    entityUuid: entity.uuid,
    description: entity.description,
    attributes,
  };
}

/**
 * Extract all relationships (foreign keys) across all entities.
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
 * Generate a Mermaid class-diagram string from Entities (`mlSchema`).
 */
export function entitiesToMermaidClassDiagram(
  entities: MermaidDiagramEntity[],
  options: ClassDiagramOptions = {},
): string {
  const direction = options.direction ?? "TB";
  const showLabels = options.showAttributeLabels ?? false;

  const entityUuidToName = buildEntityUuidToNameMap(entities);
  const classes = entities.map((entity) => extractClassInfo(entity, options));
  const relationships = extractRelationships(classes, entityUuidToName);

  const lines: string[] = [];

  if (options.showTitle && options.title) {
    lines.push("---");
    lines.push(`title: ${options.title}`);
    lines.push("---");
  }
  lines.push("classDiagram");
  lines.push(`  direction ${direction}`);
  lines.push("");

  for (const cls of classes) {
    const id = sanitiseMermaidId(cls.name);
    lines.push(`  class ${id} {`);

    for (const attr of cls.attributes) {
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

  for (const rel of relationships) {
    const sourceId = sanitiseMermaidId(rel.sourceClass);
    const targetId = sanitiseMermaidId(rel.targetClass);
    const targetCardinality = rel.optional ? '"0..1"' : '"1"';
    const label = rel.attributeName;
    lines.push(`  ${sourceId} "*" --> ${targetCardinality} ${targetId} : ${label}`);
  }

  if (options.classColors) {
    lines.push("");
    for (const [defName, colors] of Object.entries(options.classColors)) {
      const parts = [`fill:${colors.fill}`];
      if (colors.stroke) parts.push(`stroke:${colors.stroke}`);
      if (colors.color) parts.push(`color:${colors.color}`);
      lines.push(`  classDef ${defName} ${parts.join(",")}`);
    }
  }

  if (options.entityColorAssignment) {
    for (const [entityName, defName] of Object.entries(options.entityColorAssignment)) {
      const id = sanitiseMermaidId(entityName);
      lines.push(`  class ${id} ${defName}`);
    }
  }

  if (options.classClickLinks && Object.keys(options.classClickLinks).length > 0) {
    lines.push("");
    for (const [sanitisedName, uuid] of Object.entries(options.classClickLinks)) {
      lines.push(`  click ${sanitisedName} call miroirDiagramClassClick("${uuid}")`);
    }
  }

  return lines.join("\n");
}

/**
 * Convenience: generate a class diagram from MetaModel `entities`
 * (present-model `mlSchema` only; no EntityVersion fallback).
 */
export function metaModelToMermaidClassDiagram(
  metaModel: { entities: Entity[] },
  options: ClassDiagramOptions = {},
): string {
  const entities = (metaModel.entities ?? []).filter((entity) => !!entity.mlSchema);
  return entitiesToMermaidClassDiagram(entities, options);
}
