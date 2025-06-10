import { ZodTypeAny } from "zod";
import { DomainState } from "./0_interfaces/2_domain/DomainControllerInterface";
import { DeploymentEntityState } from "./0_interfaces/2_domain/DeploymentStateInterface";
import { getDeploymentEntityStateIndex } from "./2_domain/DeploymentEntityState";
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
export function domainStateToDeploymentEntityState(
  domainState: DomainState): DeploymentEntityState {
  const result = {} as DeploymentEntityState;
  for (const deploymentUuid in domainState) {
    const deploymentSection = domainState[deploymentUuid];
    for (const section in deploymentSection) {
      const entities = deploymentSection[section];
      for (const entityUuid in entities) {
        const entityInstances = entities[entityUuid];
        result[getDeploymentEntityStateIndex(deploymentUuid,section as ApplicationSection, entityUuid)] = {
          ids: Object.keys(entityInstances),
          entities: entityInstances,
        };
      }
    }
  };
  return result;
}

// ################################################################################################
export type ResultAccessPath = (string | number | {
  type: "map",
  key: string | number
})[];


// ################################################################################################
// TODO: unit tests!
export function safeResolvePathOnObject(valueObject: any, path: ResultAccessPath) {
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
export function resolvePathOnObject(valueObject:any, path: ResultAccessPath) {
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
