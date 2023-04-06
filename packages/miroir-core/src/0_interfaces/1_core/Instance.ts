export type ApplicationConceptLevel = "MetaMetaModel" | "MetaModel" | "Model" | "Data";
export interface EntityInstance {
  "uuid": string,
  "entityName"?: string,
  "entityDefinitionUuid": string,
  "conceptLevel"?: ApplicationConceptLevel, // by default, instances do not have a conceptLevel, which implies "Data".
  "instanceOfThisInstanceConceptLevel"?: ApplicationConceptLevel, // by default, instances do not have a conceptLevel, which implies "Data".
}

export interface EntityInstanceWithName extends EntityInstance {
  "name":string,
}

export interface EntityInstanceCollection {
  entityName?: string;
  entityDefinitionUuid:string;
  instances: EntityInstance[];
}

export default {}