import { JzodElement, JzodObject, JzodReference } from "@miroir-framework/jzod-ts";

/**
 * Recursively collects all JzodReference elements found
 * within the provided JzodElement definition. It specifically
 * checks the "extend" clause within JzodObjects.
 *
 * @param element The root JzodElement to search within.
 * @returns Array of discovered JzodReference elements.
 */
export function JzodSchemaReferences(element: JzodElement): JzodReference[] {
  const refs: JzodReference[] = [];

  function traverse(node: JzodElement): void {
    switch (node.type) {
      case "string":
      case "number":
      case "bigint":
      case "boolean":
      case "any":
      case "date":
      case "never":
      case "null":
      case "uuid":
      case "unknown":
      case "void":
      case "enum":
      case "literal": 
      case "undefined": {
        break;
      }
      case "object": {
        if (node.extend) {
          // refs.push(node.extend);
          if (Array.isArray(node.extend)) {
            node.extend.forEach((ref: JzodReference | JzodObject | undefined) => {
              if (ref) {
                traverse(ref);
              }
            });
          } else {
            traverse(node.extend);
          }
        }
        Object.values(node.definition).forEach((value) => traverse(value));
        break;
      }
      case "function": {
        node.definition.args.forEach((arg) => traverse(arg));
        if (node.definition.returns) {
          traverse(node.definition.returns);
        }
        break;
      }
      case "array":
      case "lazy": 
      case "promise":
      case "record":
      case "set": {
          traverse(node.definition);
        break;
      }
      case "intersection": {
        traverse(node.definition.left);
        traverse(node.definition.right);
        break;
      }
      case "map":
      case "tuple":
      case "union": {
          node.definition.forEach((value) => traverse(value));
        break;
      }
      case "schemaReference": {
        refs.push(node);
        break;
      }
      // case "tuple": {
      //   node.definition.forEach((value) => traverse(value));
      // }
      // case "union": {
      //   node.definition.forEach((value) => traverse(value));
      //   break;
      // }
      default:
        break;
    }
  }

  traverse(element);
  return refs;
}