import { EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType"

// ################################################################################################
export function ignorePostgresExtraAttributesOnRecord(instances: Record<string, EntityInstance>, furtherIgnore: string[] = []){
  return Object.fromEntries(Object.entries(instances).map(i => [i[0], ignorePostgresExtraAttributesOnObject(i[1], furtherIgnore)]))
}

// ################################################################################################
export function ignorePostgresExtraAttributesOnList(instances: EntityInstance[], furtherIgnore: string[] = []){
  // return instances.map(i => ignorePostgresExtraAttributesOnObject(i, furtherIgnore))
  return instances.map(i => ignorePostgresExtraAttributes(i, furtherIgnore))
}

// ################################################################################################
export function ignorePostgresExtraAttributesOnObject(instance: EntityInstance, furtherIgnore: string[] = []){
  const ignore = ["createdAt", "updatedAt", ...furtherIgnore]
  return Object.fromEntries(Object.entries(instance).filter(e=>!ignore.includes(e[0])))
}

// ################################################################################################
export function ignorePostgresExtraAttributes(instance: any, furtherIgnore: string[] = []):any{
  const ignore = ["createdAt", "updatedAt", ...furtherIgnore]
  // return Object.fromEntries(Object.entries(instance).filter(e=>!ignore.includes(e[0])))
  return typeof instance == "object" && instance !== null
    ? Array.isArray(instance)
      ? ignorePostgresExtraAttributesOnList(instance, ignore)
      : ignorePostgresExtraAttributesOnObject(instance, ignore)
    : instance;
}


// ################################################################################################
export function isJson(t: any) {
  // return t == "json" || t == "json_array" || t == "tableOf1JsonColumn";
  return typeof t == "object" && t !== null;
}

// ################################################################################################
export function isJsonArray(t: any) {
  // return t == "json" || t == "json_array" || t == "tableOf1JsonColumn";
  return Array.isArray(t);
  // return typeof t == "object" && t !== null && Array.isArray(t);
}

// ################################################################################################
/**
 * Recursively replaces all `null` values with `undefined` in the input.
 * Leaves all other values unchanged.
 */
export function unNullify<T>(value: T): T {
  if (value === null) {
    return undefined as any;
  }
  if (Array.isArray(value)) {
    return value.map(unNullify) as any;
  }
  if (typeof value === "object" && value !== null) {
    const result: any = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = unNullify(v);
    }
    return result;
  }
  return value;
}

/**
 * Recursively removes all properties with `undefined` values to match JSON serialization behavior.
 * This ensures that objects with explicit `undefined` properties match their JSON-serialized counterparts.
 */
export function removeUndefinedProperties<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(removeUndefinedProperties) as any;
  }
  if (typeof value === "object" && value !== null) {
    const result: any = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        result[k] = removeUndefinedProperties(v);
      }
    }
    return result;
  }
  return value;
}
