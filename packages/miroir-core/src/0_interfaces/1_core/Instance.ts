// export type ApplicationConceptLevel = 'MetaMetaModel' | 'MetaModel' | 'Model' | 'Data';
export type ApplicationConceptLevel = "MetaMetaModel" | "MetaModel" | "Model" | "Data";
export interface Instance {
  "uuid": string,
  "entity"?: string,
  "entityUuid"?: string,
  "conceptLevel"?: ApplicationConceptLevel, // by default, instances do not have a conceptLevel, which implies "Data".
  // "name":string,
  // "defaultLabel": string,
}

export interface InstanceWithName extends Instance {
  // "uuid": number,
  // "entity": string,
  "name":string,
  // "defaultLabel": string,
}

export interface InstanceCollection {
  entity: string;
  entityUuid?:string;
  instances: Instance[];
}

export default {}