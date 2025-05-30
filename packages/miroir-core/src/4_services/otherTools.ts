import { EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType"
import { TestSuiteContext } from "./TestSuiteContext"

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


