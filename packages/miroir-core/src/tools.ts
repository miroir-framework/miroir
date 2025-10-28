import { ZodTypeAny } from "zod";
import { DomainState } from "./0_interfaces/2_domain/DomainControllerInterface";
import { ReduxDeploymentsState } from "./0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { getReduxDeploymentsStateIndex } from "./2_domain/ReduxDeploymentsState";
import { ApplicationSection } from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Domain2QueryReturnType } from "./0_interfaces/2_domain/DomainElement";

export function stringTuple<T extends [string] | string[]>(...data: T): T {
  return data;
}

export const circularReplacer = () => {
  const seen = new WeakSet();
  return (key: any, value: object | null) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

// ################################################################################################
export function domainStateToReduxDeploymentsState(
  domainState: DomainState): ReduxDeploymentsState {
  const result = {} as ReduxDeploymentsState;
  for (const deploymentUuid in domainState) {
    const deploymentSection = domainState[deploymentUuid];
    for (const section in deploymentSection) {
      const entities = deploymentSection[section];
      for (const entityUuid in entities) {
        const entityInstances = entities[entityUuid];
        result[getReduxDeploymentsStateIndex(deploymentUuid,section as ApplicationSection, entityUuid)] = {
          ids: Object.keys(entityInstances),
          entities: entityInstances,
        };
      }
    }
  };
  return result;
}

// ################################################################################################
type NotHashString = Exclude<string, "#">;
export type AbsolutePath = (
  // | (string & { __notHash?: true })
  | NotHashString
  | number
  | {
      type: "map",
      key: string | number
    }
)[];
// Helper type to exclude "#" from string

export type RelativePath = (string | number | "#" | {
  type: "map",
  key: string | number
})[];


// ################################################################################################
// TODO: unit tests!
export function safeResolvePathOnObject(valueObject: any, path: AbsolutePath) {
  if (path.length === 0 || valueObject === undefined) {
    return valueObject;
  }
  return path.reduce((acc, curr) => {
    if (acc === undefined || acc === null) {
      return undefined;
    }
    if (typeof curr === "object") {
      if (typeof acc !== "object" || !Array.isArray(acc)) {
        return undefined;
      } else {
        return acc.map((item: any) => item?.[curr.key]);
      }
    } else {
      if (
        (typeof acc !== "object") ||
        (Array.isArray(acc) && (Number(curr) >= acc.length || Number(curr) < 0)) ||
        (!Array.isArray(acc) && !Object.hasOwn(acc, curr))
      ) {
        return undefined;
      } else {
        return acc[curr];
      }
    }
  }, valueObject);
}

// ################################################################################################
export function resolvePathOnObject(valueObject:any, path: AbsolutePath) {
  // console.log("resolvePathOnObject called with", valueObject, "path", path);
  return path.reduce((acc, curr, index) => {
    if (typeof curr === "object") {
      if (typeof acc !== "object" || !Array.isArray(acc)) {
        throw new Error(
          "resolvePathOnObject value object=" +
            JSON.stringify(valueObject) +
            ", path=" +
            path +
            " either attribute " +
            curr +
            " not found in " +
            JSON.stringify(acc) +
            " or not last in path but leading to undefined " +
            (curr as any)[acc]
        );
      } else {
        return acc.map((item: any) => item[curr.key]);
      }
    } else {
      if (typeof acc !== "object" ||
        (Array.isArray(acc) && acc.length < Number(curr) ) ||
        (!Array.isArray(acc) && !Object.hasOwn(acc, curr )) 
      ) {
        throw new Error(
          "resolvePathOnObject value object=" +
            JSON.stringify(acc) +
            " of type " +
            typeof valueObject +
            ", path=" +
            path +
            " either attribute " +
            curr +
            " of type " +
            typeof curr +
            " not found in " +
            JSON.stringify(acc) +
            " of type " +
            typeof acc +
            " or not last in path but leading to undefined " +
            (curr as any)[acc]
        );
      } else {
        // console.log("resolvePathOnObject called with", valueObject, "path", path, "result", acc[curr])
        return acc[curr];
      }
    }
  }, valueObject);
}

// ################################################################################################
export type ResolveRelativePathError =
  | { error: 'INITIAL_PATH_NON_ARRAY_MAP_SEGMENT', segment: any, current: any }
  | { error: 'INITIAL_PATH_NOT_OBJECT', segment: any, current: any }
  | { error: 'INITIAL_PATH_ARRAY_INDEX_OUT_OF_BOUNDS', segment: any, current: any }
  | { error: 'INITIAL_PATH_SEGMENT_NOT_FOUND', segment: any, current: any }
  | { error: 'NO_PARENT_TO_GO_UP', parentIndex: number, stack: any[] }
  | { error: 'MAP_SEGMENT_ON_NON_ARRAY', segment: any, acc: any }
  | { error: 'PATH_NOT_OBJECT', segment: any, acc: any }
  | { error: 'PATH_ARRAY_INDEX_OUT_OF_BOUNDS', segment: any, acc: any }
  | { error: 'PATH_SEGMENT_NOT_FOUND', segment: any, acc: any };

export type ResolveRelativePathResult = any | ResolveRelativePathError;

export function resolveRelativePath(
  valueObject: any,
  initialPath: AbsolutePath,
  path: RelativePath
): ResolveRelativePathResult {
  // Stack to keep track of parent objects at each step of initialPath
  const stack: any[] = [];
  let current = valueObject;

  // Traverse initialPath to set up stack
  for (const segment of initialPath) {
    stack.push(current);
    if (typeof segment === "object") {
      if (!Array.isArray(current)) {
        return { error: 'INITIAL_PATH_NON_ARRAY_MAP_SEGMENT', segment, current };
      }
      current = current.map((item: any) => item[segment.key]);
    } else {
      if (typeof current !== "object") {
        return { error: 'INITIAL_PATH_NOT_OBJECT', segment, current };
      }
      if (Array.isArray(current) && (Number(segment) >= current.length || Number(segment) < 0)) {
        return { error: 'INITIAL_PATH_ARRAY_INDEX_OUT_OF_BOUNDS', segment, current };
      }
      if (!Array.isArray(current) && !Object.hasOwn(current, segment)) {
        return { error: 'INITIAL_PATH_SEGMENT_NOT_FOUND', segment, current };
      }
      current = current[segment];
    }
  }

  // Now traverse path, interpreting "#" as parent
  let acc = current;
  let parentIndex = stack.length - 1;
  for (const segment of path) {
    // console.log("resolveRelativePath: segment", segment, "acc", acc, "stack", stack);
    if (segment === "#") {
      if (parentIndex < 0) {
        return { error: 'NO_PARENT_TO_GO_UP', parentIndex, stack };
      }
      // console.log("resolveRelativePath: going up to parent", parentIndex, "of stack", stack, "resulting in", stack[parentIndex]);
      acc = stack[parentIndex];
      parentIndex--;
      continue;
    } else {
      if (typeof segment === "object") {
        if (!Array.isArray(acc)) {
          return { error: 'MAP_SEGMENT_ON_NON_ARRAY', segment, acc };
        }
        acc = acc.map((item: any) => item[segment.key]);
      } else {
        if (typeof acc !== "object") {
          return { error: 'PATH_NOT_OBJECT', segment, acc };
        }
        if (Array.isArray(acc) && (Number(segment) >= acc.length || Number(segment) < 0)) {
          return { error: 'PATH_ARRAY_INDEX_OUT_OF_BOUNDS', segment, acc };
        }
        if (!Array.isArray(acc) && !Object.hasOwn(acc, segment)) {
          return { error: 'PATH_SEGMENT_NOT_FOUND', segment, acc };
        }
        acc = acc[segment];
      }
    }
  }

  return acc;
}

// ################################################################################################
// const doStringify: boolean = false;
const doStringify: boolean = true;

export function mStringify(
  value: any,
  replacer?: ((key: string, value: any) => any) | null,
  space?: string | number
): string {
  return doStringify?JSON.stringify(value, replacer??undefined, space??2):value;
}

// ################################################################################################
export function cleanupObject(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanupObject(item));
  }
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = cleanupObject(value);
    }
  }
  return result;
}

// ################################################################################################
export function alterObjectAtPath(
  object: any,
  path: (string | number)[],
  value: any,
):any { // terminal recursion, returns a new object!!
  if (path.length == 0) {
    return value
  }
  const head = path[0]
  if (!object) {
    throw new Error("alterObjectAtPath could not access attribute " + head + " for undefined object");
  }
  // if (object[head]) {
    return {
      ...object,
      [head]: alterObjectAtPath(object[head], path.slice(1),value)
    }
  // } else {
  //   throw new Error("alterObjectAtPath could not access attribute " + head + " for object " + JSON.stringify(object, null, 2));
  // }
}

// ################################################################################################
export function alterObjectAtPathWithCreate(
  object: any,
  path: (string | number)[],
  value: any,
):void { // DOES SIDE EFFECTS, modifies the object in place
  let current = object;
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    if (typeof segment === "string") {
      if (typeof current == "object") {
        if (!Object.hasOwn(current, segment)) {
          current[segment] = i === path.length - 1?value:typeof path[i+1] == "string"?{}:[];
          current = current[segment];
          continue;
        } else {
          current = current[segment];
          continue;
        }
      } else {
        throw new Error("alterObjectAtPathWithCreate could not access attribute " + segment + " for non-object " + JSON.stringify(current, null, 2));
      }
    }
    if (typeof segment === "number") {
      if (Array.isArray(current)) {
        if (current.length > segment) {
          current = current[segment];
          continue;
        }
        if (current.length == segment) {
          current.push(i == path.length?value:typeof path[i+1] == "string"?{}:[]);
          current = current[segment];
          continue;
        }
        // if (current.length < segment) {
        throw new Error("alterObjectAtPathWithCreate could not access index " + segment + " for array " + JSON.stringify(current, null, 2) + " (out of bounds)");
        // }
      } else {
        // if (segment == 0) {
        //   current[segment] = i == path.length?value:typeof path[i+1] == "string"?{}:[];
        //   current = current[segment];
        //   continue;
        // }
        throw new Error("alterObjectAtPathWithCreate could not access item " + segment + " for non-array " + JSON.stringify(current, null, 2));
      }
    }
    // if (current[segment] === undefined) {
    //   // Create an object or array based on the next path segment
    //   if (typeof path[i + 1] === "number") {
    //     current[segment] = [];
    //   } else {
    //     current[segment] = {};
    //   }
    // }
    // current = current[segment];
  }
  // if (Array.isArray(current)) {
  //   current.push(value);
  // }
  // if (typeof current === "object") {

  // if (path.length == 0) {
  //   return value
  // }
  // const head = path[0]

  // return {
  //   ...object,
  //   [head]: alterObjectAtPathWithCreate(object[head], path.slice(1),value)
  // }

  // if (!object) {
  //   throw new Error("alterObjectAtPath could not access attribute " + head + " for undefined object");
  // }
  // if (object[head]) {
  // } else {
  //   throw new Error("alterObjectAtPath could not access attribute " + head + " for object " + JSON.stringify(object, null, 2));
  // }
}

// ################################################################################################
/**
 * 
 * TODO: unit tests!
 * TODO: use 
 * - https://www.npmjs.com/package/immutable 
 * - https://www.npmjs.com/package/object-path-immutable
 * - https://www.npmjs.com/package/immer
 * instead?
 * @param object 
 * @param path 
 * @param value 
 * @returns 
 * 
 */
export function deleteObjectAtPath(
  object: any,
  path: (string | number)[],
): any { // terminal recursion, returns a new object/array (non-mutating)
  if (path.length === 0) return object;

  const head = path[0];
  const rest = path.slice(1);

  // Helper to remove a key from an object immutably
  const removeKeyFromObject = (obj: any, key: string | number) => {
    if (obj == null || typeof obj !== "object" || Array.isArray(obj)) return obj;
    if (!Object.hasOwn(obj, String(key))) return obj;
    const { [String(key)]: _, ...restObj } = obj;
    return restObj;
  };

  // Terminal case: delete at this level
  if (rest.length === 0) {
    if (Array.isArray(object)) {
      const idx = Number(head);
      if (!Number.isInteger(idx) || idx < 0 || idx >= object.length) return object;
      return [...object.slice(0, idx), ...object.slice(idx + 1)];
    }
    if (object && typeof object === "object") {
      return removeKeyFromObject(object, head);
    }
    return object;
  }

  // Non-terminal: descend preserving structure (handle arrays and objects)
  if (Array.isArray(object)) {
    const idx = Number(head);
    if (!Number.isInteger(idx) || idx < 0 || idx >= object.length) return object;
    const current = object[idx];
    const mutated = deleteObjectAtPath(current, rest);
    // if no change, return original
    if (mutated === current) return object;
    const newArr = object.slice();
    newArr[idx] = mutated;
    return newArr;
  }

  if (object && typeof object === "object") {
    const key = String(head);
    const hasKey = Object.hasOwn(object, key);
    const current = hasKey ? object[key] : undefined;
    const mutated = deleteObjectAtPath(current, rest);
    // no change
    if (mutated === current) return object;
    // if mutated is undefined and original had the key, remove the key
    if (mutated === undefined && hasKey) {
      return removeKeyFromObject(object, key);
    }
    // otherwise set the new value (may create the key if it didn't exist)
    return { ...object, [key]: mutated };
  }

  // primitive or non-object encountered, cannot descend: return original
  return object;
}


// ###############################################################################################################
// ###############################################################################################################
// For ReportSectionView
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
export const evaluateExpression = (
  expression: string | undefined,
  domainElementObject: Domain2QueryReturnType<Record<string,any>>
  ) => {
  const parts = expression?.split(".");
  const object =
    // Array.isArray(parts) && parts.length > 0 && domainElementObject.elementValue
    Array.isArray(parts) && parts.length > 0 && domainElementObject
      ? (domainElementObject as any)[parts[0]]
      : undefined;
  const result = object && Array.isArray(parts) && parts.length > 1 ? (object as any)[parts[1]] : undefined;
  // log.info("evaluateExpression", expression, parts, props.domainElementObject, "object", object, "result", result);
  return result;
};

export const interpolateExpression = (
  stringToInterpolate: string | undefined, 
  domainElementObject: Domain2QueryReturnType<Record<string,any>>,
  label?: string,
) => {
  const reg = /\$\{([^}]*)\}/g;
  const result = stringToInterpolate
    ? stringToInterpolate.replace(
        reg,
        (expression, ...args) => `${evaluateExpression(args[0], domainElementObject)}`
      )
    : "no " + label;
  // log.info("interpolateExpression", "stringToInterpolate", stringToInterpolate, 
  //   "domainElementObject", domainElementObject, "label", label,
  //   "result", result);
  // log.info("interpolateExpression result",result);
  return result;
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// FOR TypedValueObjectEditor
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Extract value at a given path from an object
export function getValueAtPath(obj: any, path: string): any {
  if (!path || !obj) return obj;
  
  const pathParts = path.split('.');
  let current = obj;
  
  for (const part of pathParts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

// Set value at a given path in an object, creating intermediate objects as needed
export function setValueAtPath(obj: any, path: string, value: any): any {
  if (!path) return value;
  
  const pathParts = path.split('.');
  const result = { ...obj };
  let current = result;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (current[part] === null || current[part] === undefined || typeof current[part] !== 'object') {
      current[part] = {};
    } else {
      current[part] = { ...current[part] };
    }
    current = current[part];
  }
  
  current[pathParts[pathParts.length - 1]] = value;
  return result;
}

// Extract schema for a given path from a jzod schema
export function getSchemaAtPath(schema: any, path: string): any {
  if (!path || !schema) return schema;
  
  const pathParts = path.split('.');
  let current = schema;
  
  for (const part of pathParts) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    
    // Handle jzod schema structure
    if (current.type === 'object' && current.definition) {
      current = current.definition[part];
    } else if (current.definition && current.definition[part]) {
      current = current.definition[part];
    } else if (current[part]) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}
