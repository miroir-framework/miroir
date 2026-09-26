import type { MlElement, MlObject, MlReference } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Recursively collects all MlReference elements found
 * within the provided MlElement definition. It specifically
 * checks the "extend" clause within ML objects.
 *
 * @param element The root MlElement to search within.
 * @returns Array of discovered MlReference elements.
 */
export function MlSchemaReferencesList(
  element: MlElement,
  includeExtend: boolean = true
): MlReference[] {
  const refs: MlReference[] = [];

  traverseMlSchemaForRefs(element, refs, includeExtend);
  return refs;
}

// ################################################################################################
function traverseMlSchemaForRefs(
  node: MlElement,
  refs: MlReference[] | Set<MlReference>,
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
    // case "null":
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
          node.extend.forEach((ref: MlReference | MlObject | undefined) => {
            if (ref) {
              traverseMlSchemaForRefs(ref, refs, includeExtend);
            }
          });
        } else {
          traverseMlSchemaForRefs(node.extend, refs, includeExtend);
        }
      }
      Object.values(node.definition).forEach((value) => traverseMlSchemaForRefs(value, refs, includeExtend));
      break;
    }
    case "function": {
      node.definition.args.forEach((arg) => traverseMlSchemaForRefs(arg, refs, includeExtend));
      if (node.definition.returns) {
        traverseMlSchemaForRefs(node.definition.returns, refs, includeExtend);
      }
      break;
    }
    case "array":
    case "lazy":
    case "promise":
    case "record":
    case "set": {
      traverseMlSchemaForRefs(node.definition, refs, includeExtend);
      break;
    }
    case "intersection": {
      traverseMlSchemaForRefs(node.definition.left, refs, includeExtend);
      traverseMlSchemaForRefs(node.definition.right, refs, includeExtend);
      break;
    }
    case "map":
    case "tuple":
    case "union": {
      node.definition.forEach((value) => traverseMlSchemaForRefs(value, refs, includeExtend));
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

// ## ################################################################################
export function MlSchemaReferencesSet(
  element: MlElement,
  includeExtend: boolean = true
): Set<MlReference> {
  const refs: Set<MlReference> = new Set<MlReference>();
  traverseMlSchemaForRefs(element, refs, includeExtend);
  return refs;
}

// ################################################################################################
export function mlsTransitiveDependencySet(
  miroirFundamentalMlSchema: MlReference,
  contextElementName: string,
  includeExtend: boolean = false,
  filterPrefix?: string
): Set<string> {
  const visitedSet = new Set<string>();
  const toVisitMap = new Map<string, string[]>();
  toVisitMap.set(contextElementName, [contextElementName]);

  if (!miroirFundamentalMlSchema.context) {
    throw new Error("miroirFundamentalMlSchema.context is not defined");
  }

  function visit(element: string, path: string[], miroirFundamentalMlSchema: MlReference) {
    // console.log(
    //   "############## visting",
    //   element,
    //   element.includes("report") ? "path: " + path.join(".") : "",
    //   "visitedSet size",
    //   visitedSet.size,
    // );
    if (!miroirFundamentalMlSchema.context) {
      throw new Error("miroirFundamentalMlSchema.context is not defined");
    }
    // if (filterPrefix && element.startsWith(filterPrefix)) {
    //   console.log("mlsTransitiveDependencySet skipping dependencies for element", element, "filterPrefix", filterPrefix, "visitedSet", visitedSet.size);
    //   visitedSet.add(element);
    //   return;
    // }
    if (!miroirFundamentalMlSchema.context[element]) {
      throw new Error(
        `mlsTransitiveDependencySet Element ${element} not found in context:` +
          JSON.stringify(Object.keys(miroirFundamentalMlSchema.context), null, 2)
      );
    }
    if (visitedSet.has(element)) {
      return;
    }
    visitedSet.add(element);
    const localRefs: (string | undefined)[] = Array.from(
      MlSchemaReferencesSet(miroirFundamentalMlSchema.context[element], includeExtend).values()
    ).map((ref: MlReference) => ref.definition.relativePath);

    // console.log("mlsTransitiveDependencySet for element",element,"found localRefs", localRefs);
    for (const ref of localRefs) {
      if (!ref) {
        throw new Error("ref is undefined");
      }
      if (visitedSet.has(ref)) {
        continue;
      } else {
        // console.log(`Adding ${ref} (${[...path, ref].join(".")})`);
        toVisitMap.set(ref, [...path, ref]);
      }
    }
  }

  while (toVisitMap.size > 0) {
    const entry = toVisitMap.entries().next().value;
    if (!entry) {
      throw new Error("entry is undefined");
    }
    const [element, path] = entry;
    if (!element) {
      throw new Error("element is undefined");
    }
    // console.log("mlsTransitiveDependencySet visiting element", element, "visitedSet", visitedSet.size);
    toVisitMap.delete(element);
    visit(element, path, miroirFundamentalMlSchema);
  }
  return visitedSet;
}
