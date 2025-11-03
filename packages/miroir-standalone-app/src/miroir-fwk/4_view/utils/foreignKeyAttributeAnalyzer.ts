import { EntityDefinition, JzodElement } from "miroir-core";

/**
 * Result of foreign key attribute analysis, containing both direct and transitive foreign key references
 */
export interface ForeignKeyAttributeDefinition {
  /** The attribute name (real for direct FK, synthetic like "__fk_entityUuid" for transitive) */
  attributeName: string;
  /** The Jzod schema element containing the foreign key definition */
  schema: JzodElement;
  /** Whether this is a direct foreign key attribute of the main entity */
  isDirect: boolean;
  /** The UUID of the target entity being referenced */
  targetEntityUuid: string;
}

/**
 * Options for analyzing foreign key attributes
 */
export interface AnalyzeForeignKeyAttributesOptions {
  /** Whether to include transitive foreign key references (foreign keys of foreign keys) */
  includeTransitive?: boolean;
  /** Maximum depth for transitive analysis to prevent infinite recursion */
  maxDepth?: number;
}

/**
 * Analyzes an entity definition to find all foreign key attributes, including transitive ones.
 * 
 * This function performs a comprehensive analysis of foreign key relationships:
 * 1. Identifies direct foreign key attributes in the main entity
 * 2. Optionally discovers transitive foreign key entities (entities referenced by foreign key entities)
 * 3. Returns a complete list of all entities that need to be fetched to resolve foreign key references
 * 
 * @example
 * ```typescript
 * // Analyze a Book entity that has Author and Publisher foreign keys
 * const bookEntityDef = {
 *   jzodSchema: {
 *     definition: {
 *       title: { type: "string" },
 *       authorUuid: { type: "uuid", tag: { value: { targetEntity: "author-uuid" } } },
 *       publisherUuid: { type: "uuid", tag: { value: { targetEntity: "publisher-uuid" } } }
 *     }
 *   }
 * };
 * 
 * const authorEntityDef = {
 *   jzodSchema: {
 *     definition: {
 *       name: { type: "string" },
 *       countryUuid: { type: "uuid", tag: { value: { targetEntity: "country-uuid" } } }
 *     }
 *   }
 * };
 * 
 * const result = analyzeForeignKeyAttributes(
 *   bookEntityDef,
 *   [bookEntityDef, authorEntityDef, publisherEntityDef, countryEntityDef],
 *   { includeTransitive: true }
 * );
 * 
 * // Result will include:
 * // - Direct: authorUuid -> author-uuid, publisherUuid -> publisher-uuid
 * // - Transitive: __fk_aggregatery-uuid -> country-uuid (from Author's countryUuid)
 * ```
 * 
 * @param mainEntityDefinition - The primary entity definition to analyze
 * @param allEntityDefinitions - Array of all available entity definitions for transitive analysis
 * @param options - Configuration options for the analysis
 * @returns Array of foreign key attribute definitions, both direct and transitive
 */
export function analyzeForeignKeyAttributes(
  mainEntityDefinition: EntityDefinition | undefined,
  allEntityDefinitions: EntityDefinition[],
  options: AnalyzeForeignKeyAttributesOptions = {}
): ForeignKeyAttributeDefinition[] {
  const { includeTransitive = true, maxDepth = 5 } = options;
  
  if (!mainEntityDefinition?.jzodSchema?.definition) {
    return [];
  }

  const result: ForeignKeyAttributeDefinition[] = [];
  const allForeignKeyEntities = new Set<string>();
  const processedEntities = new Set<string>();
  
  // First, add all direct foreign key attributes from the main entity
  Object.entries(mainEntityDefinition.jzodSchema.definition).forEach(([attributeName, schema]: [string, any]) => {
    if (schema.tag?.value?.selectorParams?.targetEntity) {
      result.push({
        attributeName,
        schema,
        isDirect: true,
        targetEntityUuid: schema.tag.value.selectorParams?.targetEntity
      });
      allForeignKeyEntities.add(schema.tag.value.selectorParams?.targetEntity);
    }
  });
  
  if (!includeTransitive) {
    return result;
  }
  
  // Recursive function to find additional foreign key entities that need to be fetched
  const findAdditionalForeignKeyEntities = (entityUuid: string, depth: number = 0) => {
    if (processedEntities.has(entityUuid) || depth >= maxDepth) {
      return;
    }
    processedEntities.add(entityUuid);
    
    const entityDef = allEntityDefinitions.find(e => e.entityUuid === entityUuid);
    if (entityDef) {
      Object.entries(entityDef.jzodSchema.definition).forEach(([nestedAttributeName, schema]: [string, any]) => {
        if (schema.tag?.value?.selectorParams?.targetEntity && !allForeignKeyEntities.has(schema.tag.value.selectorParams?.targetEntity)) {
          // Add a synthetic entry for the foreign key entity that needs to be fetched
          // but is not a direct attribute of the main entity
          const syntheticKey = `__fk_${schema.tag.value.selectorParams?.targetEntity}`;
          result.push({
            attributeName: syntheticKey,
            schema,
            isDirect: false,
            targetEntityUuid: schema.tag.value.selectorParams?.targetEntity
          });
          allForeignKeyEntities.add(schema.tag.value.selectorParams?.targetEntity);
          
          // Recursively find foreign keys of this entity
          findAdditionalForeignKeyEntities(schema.tag.value.selectorParams?.targetEntity, depth + 1);
        }
      });
    }
  };
  
  // Find all nested foreign key entities starting from the direct foreign key entities
  const directForeignKeyEntities = Array.from(allForeignKeyEntities);
  directForeignKeyEntities.forEach(entityUuid => {
    findAdditionalForeignKeyEntities(entityUuid, 1);
  });
  
  return result;
}

/**
 * Converts the result of analyzeForeignKeyAttributes to the legacy tuple format
 * used by existing code for backward compatibility.
 * 
 * @param foreignKeyAttributes - Result from analyzeForeignKeyAttributes
 * @returns Array of tuples in the format [attributeName, schema]
 */
export function convertToLegacyFormat(
  foreignKeyAttributes: ForeignKeyAttributeDefinition[]
): [string, JzodElement][] {
  return foreignKeyAttributes.map(fk => [fk.attributeName, fk.schema]);
}
