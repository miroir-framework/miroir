import { ZodTypeAny } from "zod";
import { DomainState } from "./0_interfaces/2_domain/DomainControllerInterface";
import { ReduxDeploymentsState } from "./0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { getReduxDeploymentsStateIndex } from "./2_domain/ReduxDeploymentsState";
import { ApplicationSection } from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

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