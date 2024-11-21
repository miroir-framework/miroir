import { ZodTypeAny } from "zod";

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

export function getLoggerName(
  packageName: string,
  cleanLevel: string,
  functionalityName: string,
) {
  return `${cleanLevel}_${packageName}_${functionalityName}`
}


// ################################################################################################
export function resolvePathOnObject(valueObject:any, path: string[]) {
  // console.info("resolvePathOnObject called with", valueObject, "path", path)
  return path.reduce((acc, curr, index) => {
    if (index == path.length && (acc == undefined || acc[curr] == undefined)) {
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
          curr[acc]
      );
    } else {
      // console.info("resolvePathOnObject called with", valueObject, "path", path, "result", acc[curr])
      return acc[curr];
    }
  }, valueObject);
}
