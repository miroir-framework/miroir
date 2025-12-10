import { JzodElement, JzodObject, JzodReference } from "@miroir-framework/jzod-ts";

/**
 * Recursively collects all JzodReference elements found
 * within the provided JzodElement definition. It specifically
 * checks the "extend" clause within JzodObjects.
 *
 * @param element The root JzodElement to search within.
 * @returns Array of discovered JzodReference elements.
 */
export function JzodSchemaReferencesList(
  element: JzodElement,
  includeExtend: boolean = true
): JzodReference[] {
  const refs: JzodReference[] = [];

  // function traverse(node: JzodElement): void {
  //   switch (node.type) {
  //     case "string":
  //     case "number":
  //     case "bigint":
  //     case "boolean":
  //     case "any":
  //     case "date":
  //     case "never":
  //     case "null":
  //     case "uuid":
  //     case "unknown":
  //     case "void":
  //     case "enum":
  //     case "literal":
  //     case "undefined": {
  //       break;
  //     }
  //     case "object": {
  //       if (node.extend && includeExtend) {
  //         // refs.push(node.extend);
  //         if (Array.isArray(node.extend)) {
  //           node.extend.forEach((ref: JzodReference | JzodObject | undefined) => {
  //             if (ref) {
  //               traverse(ref);
  //             }
  //           });
  //         } else {
  //           traverse(node.extend);
  //         }
  //       }
  //       Object.values(node.definition).forEach((value) => traverse(value));
  //       break;
  //     }
  //     case "function": {
  //       node.definition.args.forEach((arg) => traverse(arg));
  //       if (node.definition.returns) {
  //         traverse(node.definition.returns);
  //       }
  //       break;
  //     }
  //     case "array":
  //     case "lazy":
  //     case "promise":
  //     case "record":
  //     case "set": {
  //       traverse(node.definition);
  //       break;
  //     }
  //     case "intersection": {
  //       traverse(node.definition.left);
  //       traverse(node.definition.right);
  //       break;
  //     }
  //     case "map":
  //     case "tuple":
  //     case "union": {
  //       node.definition.forEach((value) => traverse(value));
  //       break;
  //     }
  //     case "schemaReference": {
  //       refs.push(node);
  //       break;
  //     }
  //     // case "tuple": {
  //     //   node.definition.forEach((value) => traverse(value));
  //     // }
  //     // case "union": {
  //     //   node.definition.forEach((value) => traverse(value));
  //     //   break;
  //     // }
  //     default:
  //       break;
  //   }
  // }

  traverseJzodSchema(element, refs, includeExtend);
  return refs;
}

function traverseJzodSchema(
  node: JzodElement,
  refs: JzodReference[] | Set<JzodReference>,
  includeExtend: boolean = true
): void {
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
      if (node.extend && includeExtend) {
        // refs.push(node.extend);
        if (Array.isArray(node.extend)) {
          node.extend.forEach((ref: JzodReference | JzodObject | undefined) => {
            if (ref) {
              traverseJzodSchema(ref, refs, includeExtend);
            }
          });
        } else {
          traverseJzodSchema(node.extend, refs, includeExtend);
        }
      }
      Object.values(node.definition).forEach((value) => traverseJzodSchema(value, refs, includeExtend));
      break;
    }
    case "function": {
      node.definition.args.forEach((arg) => traverseJzodSchema(arg, refs, includeExtend));
      if (node.definition.returns) {
        traverseJzodSchema(node.definition.returns, refs, includeExtend);
      }
      break;
    }
    case "array":
    case "lazy":
    case "promise":
    case "record":
    case "set": {
      traverseJzodSchema(node.definition, refs, includeExtend);
      break;
    }
    case "intersection": {
      traverseJzodSchema(node.definition.left, refs, includeExtend);
      traverseJzodSchema(node.definition.right, refs, includeExtend);
      break;
    }
    case "map":
    case "tuple":
    case "union": {
      node.definition.forEach((value) => traverseJzodSchema(value, refs, includeExtend));
      break;
    }
    case "schemaReference": {
      if (Array.isArray(refs)) {
        refs.push(node);
      } else if (refs instanceof Set) {
        refs.add(node);
      } else {
        throw new Error("refs must be an array or a set");
      }
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

export function JzodSchemaReferencesSet(
  element: JzodElement,
  includeExtend: boolean = true
): Set<JzodReference> {
  const refs: Set<JzodReference> = new Set<JzodReference>();
  traverseJzodSchema(element, refs, includeExtend);
  return refs;
}

export function jzodTransitiveDependencySet(
  miroirFundamentalJzodSchema: JzodReference,
  contextElementName: string,
  includeExtend: boolean = false
): Set<string> {
  const visitedSet = new Set<string>();
  const toVisitSet = new Set<string>();
  toVisitSet.add( contextElementName );

  if (!miroirFundamentalJzodSchema.context) {
    throw new Error("miroirFundamentalJzodSchema.context is not defined");
  }

  function visit(element: string, miroirFundamentalJzodSchema: JzodReference) {
    console.log("jzodTransitiveDependencySet visiting", element);
    if (!miroirFundamentalJzodSchema.context) {
      throw new Error("miroirFundamentalJzodSchema.context is not defined");
    }
    // if (!Object.hasOwn(miroirFundamentalJzodSchema.context, element) || !miroirFundamentalJzodSchema.context[element]) {
    if (!miroirFundamentalJzodSchema.context[element]) {
      throw new Error(
        `Element ${element} not found in context:` +
          JSON.stringify(Object.keys(miroirFundamentalJzodSchema.context), null, 2)
      );
    }
    if (visitedSet.has(element)) {
      return;
    }
    visitedSet.add(element);
    const localRefs: (string | undefined)[] = Array.from(
      JzodSchemaReferencesSet(miroirFundamentalJzodSchema.context[element], includeExtend).values()
    ).map((ref: JzodReference) => ref.definition.relativePath);

    // console.log("jzodTransitiveDependencySet for element",element,"found localRefs", localRefs);
    for (const ref of localRefs) {
      if (!ref) {
        throw new Error("ref is undefined");
      }
      if (visitedSet.has(ref)) {
        continue;
      } else {
        toVisitSet.add(ref);
      }
    }
  }

  while (toVisitSet.size > 0) {
    const element = toVisitSet.values().next().value;
    if (!element) {
      throw new Error("element is undefined");
    }
    // console.log("jzodTransitiveDependencySet visiting element", element, "visitedSet", visitedSet.size);
    toVisitSet.delete(element);
    visit(element, miroirFundamentalJzodSchema);
  }
  return visitedSet;
}
