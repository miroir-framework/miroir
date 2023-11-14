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

