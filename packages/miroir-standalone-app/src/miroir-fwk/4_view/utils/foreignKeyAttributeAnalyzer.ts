import type { JzodElement } from "miroir-core";

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
 * #217 Phase 8: any carrier with mlSchema — Entity (preferred) or EntityVersion.
 */
export type ForeignKeySchemaCarrier = {
  uuid?: string | undefined;
  entityUuid?: string | undefined;
  mlSchema?: { definition?: Record<string, any> | undefined } | undefined;
};

function carrierEntityUuid(carrier: ForeignKeySchemaCarrier): string | undefined {
  // EntityVersion links via entityUuid; Entity identity is uuid.
  return carrier.entityUuid ?? carrier.uuid;
}

/**
 * Analyzes an entity present model / definition to find all foreign key attributes,
 * including transitive ones.
 *
 * @param mainEntityDefinition - Primary Entity or EntityVersion to analyze
 * @param allEntityDefinitions - Available Entity and/or EntityVersion carriers for lookup
 * @param options - Configuration options for the analysis
 */
export function analyzeForeignKeyAttributes(
  mainEntityDefinition: ForeignKeySchemaCarrier | undefined,
  allEntityDefinitions: ForeignKeySchemaCarrier[],
  options: AnalyzeForeignKeyAttributesOptions = {},
): ForeignKeyAttributeDefinition[] {
  const { includeTransitive = true, maxDepth = 5 } = options;

  if (!mainEntityDefinition?.mlSchema?.definition) {
    return [];
  }

  const result: ForeignKeyAttributeDefinition[] = [];
  const allForeignKeyEntities = new Set<string>();
  const processedEntities = new Set<string>();

  Object.entries(mainEntityDefinition.mlSchema.definition).forEach(([attributeName, schema]: [string, any]) => {
    if (schema.tag?.value?.foreignKeyParams?.targetEntity) {
      result.push({
        attributeName,
        schema,
        isDirect: true,
        targetEntityUuid: schema.tag.value.foreignKeyParams?.targetEntity,
      });
      allForeignKeyEntities.add(schema.tag.value.foreignKeyParams?.targetEntity);
    }
  });

  if (!includeTransitive) {
    return result;
  }

  const findAdditionalForeignKeyEntities = (entityUuid: string, depth: number = 0) => {
    if (processedEntities.has(entityUuid) || depth >= maxDepth) {
      return;
    }
    processedEntities.add(entityUuid);

    const entityDef = allEntityDefinitions.find(
      (carrier) => carrierEntityUuid(carrier) === entityUuid,
    );
    if (entityDef?.mlSchema?.definition) {
      Object.entries(entityDef.mlSchema.definition).forEach(([nestedAttributeName, schema]: [string, any]) => {
        if (
          schema.tag?.value?.foreignKeyParams?.targetEntity &&
          !allForeignKeyEntities.has(schema.tag.value.foreignKeyParams?.targetEntity)
        ) {
          const syntheticKey = `__fk_${schema.tag.value.foreignKeyParams?.targetEntity}`;
          result.push({
            attributeName: syntheticKey,
            schema,
            isDirect: false,
            targetEntityUuid: schema.tag.value.foreignKeyParams?.targetEntity,
          });
          allForeignKeyEntities.add(schema.tag.value.foreignKeyParams?.targetEntity);

          findAdditionalForeignKeyEntities(
            schema.tag.value.foreignKeyParams?.targetEntity,
            depth + 1,
          );
        }
      });
    }
  };

  Array.from(allForeignKeyEntities).forEach((entityUuid) => {
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
  foreignKeyAttributes: ForeignKeyAttributeDefinition[],
): [string, JzodElement][] {
  return foreignKeyAttributes.map((fk) => [fk.attributeName, fk.schema]);
}
