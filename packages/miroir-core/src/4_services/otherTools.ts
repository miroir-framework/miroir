import { EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js"

// ################################################################################################
export function ignorePostgresExtraAttributesOnRecord(instances: Record<string, EntityInstance>, furtherIgnore: string[] = []){
  return Object.fromEntries(Object.entries(instances).map(i => [i[0], ignorePostgresExtraAttributesOnObject(i[1], furtherIgnore)]))
}

// ################################################################################################
export function ignorePostgresExtraAttributesOnList(instances: EntityInstance[], furtherIgnore: string[] = []){
  return instances.map(i => ignorePostgresExtraAttributesOnObject(i, furtherIgnore))
}

// ################################################################################################
export function ignorePostgresExtraAttributesOnObject(instance: EntityInstance, furtherIgnore: string[] = []){
  const ignore = ["createdAt", "updatedAt", "author", ...furtherIgnore]
  return Object.fromEntries(Object.entries(instance).filter(e=>!ignore.includes(e[0])))
}
