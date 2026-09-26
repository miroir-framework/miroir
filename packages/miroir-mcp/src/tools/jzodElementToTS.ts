import { 
  type MlElement,
  resolveJzodSchemaReferenceInContext,
  type MlReference,
  defaultMiroirModelEnvironment,
} from "miroir-core";

/**
 * Recursively converts a MlElement to a TypeScript type string.
 * 
 * @param mlElement - The Jzod schema element to convert
 * @param indentLevel - Current indentation level for nested structures
 * @returns A well-formatted TypeScript type string
 */
export function jzodElementToTS(
  mlElement: MlElement,
  indentLevel: number = 0
): string {
  const indent = '  '.repeat(indentLevel);
  const nextIndent = '  '.repeat(indentLevel + 1);

  switch (mlElement.type) {
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
      const literalValue = mlElement.definition;
      if (typeof literalValue === 'number') {
        return String(literalValue);
      }
      return `"${literalValue}"`;
    }

    case 'enum': {
      if (!Array.isArray(mlElement.definition)) {
        throw new Error('Enum definition must be an array');
      }
      return mlElement.definition.map((val: string) => `"${val}"`).join(' | ');
    }

    case 'schemaReference': {
      // Resolve the schema reference using the miroir context
      const resolvedSchema = resolveJzodSchemaReferenceInContext(
        mlElement as MlReference,
        (mlElement as MlReference).context || {},
        defaultMiroirModelEnvironment,
      );
      
      // Recursively convert the resolved schema
      return jzodElementToTS(resolvedSchema, indentLevel);
    }

    case 'object': {
      if (!mlElement.definition) {
        return '{}';
      }

      const properties: string[] = [];
      for (const [key, value] of Object.entries(mlElement.definition)) {
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
      if (!mlElement.definition) {
        throw new Error('Array definition missing item type');
      }
      
      const itemType = jzodElementToTS(mlElement.definition, indentLevel);
      
      // Only wrap in parentheses if it contains a union (|) but not an object (which starts with {)
      if (itemType.includes('|') && !itemType.startsWith('{')) {
        return `(${itemType})[]`;
      }
      
      return `${itemType}[]`;
    }

    case 'record': {
      if (!mlElement.definition) {
        throw new Error('Record definition missing value type');
      }
      
      const valueType = jzodElementToTS(mlElement.definition, indentLevel);
      return `Record<string, ${valueType}>`;
    }

    case 'tuple': {
      if (!mlElement.definition || !Array.isArray(mlElement.definition)) {
        throw new Error('Tuple definition missing or invalid');
      }
      
      const itemTypes = mlElement.definition.map((item: MlElement) => 
        jzodElementToTS(item as any, indentLevel)
      );
      
      return `[${itemTypes.join(', ')}]`;
    }

    case 'union': {
      if (!mlElement.definition || !Array.isArray(mlElement.definition)) {
        throw new Error('Union definition missing or invalid');
      }
      
      const memberTypes = mlElement.definition.map((member: MlElement) => 
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
      throw new Error(`Unsupported Jzod type for TypeScript conversion: ${mlElement.type}`);
    }

    default:
      return 'any';
  }
}
