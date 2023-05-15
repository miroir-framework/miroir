// export type ApplicationConceptLevel = "MetaMetaModel" | "MetaModel" | "Model" | "Data";
export type ApplicationConceptLevel = "MetaModel" | "Model" | "Data";
export interface EntityInstance {
  "uuid": string,
  "parentName"?: string,
  "parentUuid": string,
  "conceptLevel"?: ApplicationConceptLevel, // by default, instances do not have a conceptLevel, which implies "Data".
  // "instanceOfThisInstanceConceptLevel"?: ApplicationConceptLevel, // by default, instances do not have a conceptLevel, which implies "Data".
}

export interface EntityInstanceWithName extends EntityInstance {
  "name":string,
}

export type ApplicationSection = 'model' | 'data';

export function ApplicationSectionOpposite(s:ApplicationSection):ApplicationSection {
  return s == 'model'?'data':'model';
}
export interface EntityInstanceCollection {
  parentName?: string;
  parentUuid:string;
  applicationSection:ApplicationSection;
  instances: EntityInstance[];
}

export default {}