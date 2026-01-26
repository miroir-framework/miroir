import { 
  miroirFundamentalJzodSchema, 
  type JzodElement,
  resolveJzodSchemaReferenceInContext,
  type JzodReference,
  type MlSchema,
} from "miroir-core";

/**
 * Recursively converts a JzodElement to a TypeScript type string.
 * 
 * @param jzodElement - The Jzod schema element to convert
 * @param indentLevel - Current indentation level for nested structures
 * @returns A well-formatted TypeScript type string
 */
export function jzodElementToTS(
  jzodElement: JzodElement,
  indentLevel: number = 0
): string {
  const indent = '  '.repeat(indentLevel);
  const nextIndent = '  '.repeat(indentLevel + 1);

  switch (jzodElement.type) {
    case 'uuid':
    case 'string':
      return 'string';

    case 'boolean':
      return 'boolean';

    case 'number':
      return 'number';

    case 'date':
      return 'Date';

    case 'literal': {
      const literalValue = jzodElement.definition;
      if (typeof literalValue === 'number') {
        return String(literalValue);
      }
      return `"${literalValue}"`;
    }

    case 'enum': {
      if (!Array.isArray(jzodElement.definition)) {
        throw new Error('Enum definition must be an array');
      }
      return jzodElement.definition.map(val => `"${val}"`).join(' | ');
    }

    case 'schemaReference': {
      // Resolve the schema reference using the miroir context
      const resolvedSchema = resolveJzodSchemaReferenceInContext(
        jzodElement as JzodReference,
        (jzodElement as JzodReference).context || {},
        { 
          miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
          endpointsByUuid: {}
        }
      );
      
      // Recursively convert the resolved schema
      return jzodElementToTS(resolvedSchema, indentLevel);
    }

    case 'object': {
      if (!jzodElement.definition) {
        return '{}';
      }

      const properties: string[] = [];
      for (const [key, value] of Object.entries(jzodElement.definition)) {
        const valueType = jzodElementToTS(value as any, indentLevel + 1);
        const optional = (value as any).optional ? '?' : '';
        
        // Check if value type is multi-line (contains newline)
        if (valueType.includes('\n')) {
          properties.push(`${nextIndent}${key}${optional}: ${valueType};`);
        } else {
          properties.push(`${nextIndent}${key}${optional}: ${valueType};`);
        }
      }

      return `{\n${properties.join('\n')}\n${indent}}`;
    }

    case 'array': {
      if (!jzodElement.definition) {
        throw new Error('Array definition missing item type');
      }
      
      const itemType = jzodElementToTS(jzodElement.definition, indentLevel);
      
      // Only wrap in parentheses if it contains a union (|) but not an object (which starts with {)
      if (itemType.includes('|') && !itemType.startsWith('{')) {
        return `(${itemType})[]`;
      }
      
      return `${itemType}[]`;
    }

    case 'record': {
      if (!jzodElement.definition) {
        throw new Error('Record definition missing value type');
      }
      
      const valueType = jzodElementToTS(jzodElement.definition, indentLevel);
      return `Record<string, ${valueType}>`;
    }

    case 'tuple': {
      if (!jzodElement.definition || !Array.isArray(jzodElement.definition)) {
        throw new Error('Tuple definition missing or invalid');
      }
      
      const itemTypes = jzodElement.definition.map(item => 
        jzodElementToTS(item as any, indentLevel)
      );
      
      return `[${itemTypes.join(', ')}]`;
    }

    case 'union': {
      if (!jzodElement.definition || !Array.isArray(jzodElement.definition)) {
        throw new Error('Union definition missing or invalid');
      }
      
      const memberTypes = jzodElement.definition.map(member => 
        jzodElementToTS(member as any, indentLevel)
      );
      
      return memberTypes.join(' | ');
    }

    case "bigint":
      return 'bigint';

    case "undefined":
      return 'undefined';

    case "any":
      return 'any';

    case "never":
      return 'never';

    case "unknown":
      return 'unknown';

    case "void":
      return 'void';

    case "function":
    case "lazy":
    case "intersection":
    case "map":
    case "promise":
    case "set": {
      throw new Error(`Unsupported Jzod type for TypeScript conversion: ${jzodElement.type}`);
    }

    default:
      return 'any';
  }
}
