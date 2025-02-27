import { ZodTypeAny } from "zod";
import { DomainState } from "./0_interfaces/2_domain/DomainControllerInterface.js";
import { DeploymentEntityState } from "./0_interfaces/2_domain/DeploymentStateInterface.js";
import { getDeploymentEntityStateIndex } from "./2_domain/DeploymentEntityState.js";
import { ApplicationSection } from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

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
// export function resolvePathOnObject(valueObject:any, path: (string | number)[]) {
export function resolvePathOnObject(valueObject:any, path: ResultAccessPath) {
  return path.reduce((acc, curr, index) => {
    if (typeof curr === "object") {
      if (typeof acc !== "object" || !Array.isArray(acc)) {
        throw new Error(
          "resolvePathOnObject value object=" +
            valueObject +
            ", path=" +
            path +
            " either attribute " +
            curr +
            " not found in " +
            acc +
            " or not last in path but leading to undefined " +
            (curr as any)[acc]
        );
      } else {
        return acc.map((item: any) => item[curr.key]);
      }
    } else {
      if (!Object.hasOwn(acc, curr)) {
        throw new Error(
          "resolvePathOnObject value object=" +
            valueObject +
            ", path=" +
            path +
            " either attribute " +
            curr +
            " not found in " +
            acc +
            " or not last in path but leading to undefined " +
            (curr as any)[acc]
        );
      } else {
        console.info("resolvePathOnObject called with", valueObject, "path", path, "result", acc[curr])
        return acc[curr];
      }
    }
  }, valueObject);
}
